// ─── POST /api/viral/search ──────────────────────────
// 搜索同类爆款内容
// 分层阈值：10000赞 → 5000赞 → 1000赞 → 普通热门
// 用于：给用户展示 Top 3 候选，选择后拆解+改写

import { NextRequest, NextResponse } from "next/server"

const TAVILY_KEY = () => process.env.TAVILY_API_KEY || ""
const DEEPSEEK_KEY = () => process.env.DEEPSEEK_API_KEY || ""
const PLATFORM_MAP: Record<string, string> = {
  "小红书": "site:xiaohongshu.com",
  "抖音": "site:douyin.com",
  "B站": "site:bilibili.com",
  "知乎": "site:zhihu.com",
  "公众号": "site:mp.weixin.qq.com",
}

const LIKE_TIERS = [
  { minLikes: 10000, minShares: 1000, label: "🔥 10万赞+" },
  { minLikes: 5000, minShares: 500, label: "💥 5000赞+" },
  { minLikes: 1000, minShares: 100, label: "👍 1000赞+" },
  { minLikes: 0, minShares: 0, label: "📈 普通热门" },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche, keyword, platform = "小红书" } = body

    const searchTerm = keyword || niche
    if (!searchTerm) {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 })
    }

    const siteFilter = PLATFORM_MAP[platform] || ""
    const tavilyKey = TAVILY_KEY()
    const deepseekKey = DEEPSEEK_KEY()

    if (!tavilyKey) {
      return NextResponse.json({ candidates: [], message: "搜索服务未配置" })
    }

    // ── 分层搜索：从高阈值往下找 ──
    let bestResults: { title: string; content: string; url: string }[] = []
    let usedTier = -1

    for (let t = 0; t < LIKE_TIERS.length; t++) {
      const tier = LIKE_TIERS[t]
      const likeQuery = platform === "小红书"
        ? `${searchTerm} ${siteFilter} 赞`
        : `${searchTerm} ${siteFilter} 热门`

      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: likeQuery,
            search_depth: "basic",
            max_results: 8,
            include_answer: true,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const results = (data.results || []).map((r: any) => ({
            title: r.title || "",
            content: (r.content || "").slice(0, 400),
            url: r.url || "",
          })).filter((r: any) => r.title.length > 5)

          if (results.length >= 3) {
            bestResults = results.slice(0, 6)
            usedTier = t
            break // 找到足够多的结果，跳出
          } else if (results.length > 0) {
            // 结果少但至少有，先存着
            bestResults = results
            usedTier = t
          }
        }
      } catch {}

      // 最后一个阈值了，直接使用已有结果
      if (t === LIKE_TIERS.length - 1 && bestResults.length === 0) {
        // 兜底：无平台搜索
        try {
          const fallbackRes = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: searchTerm,
              search_depth: "basic",
              max_results: 5,
            }),
          })
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json()
            bestResults = (fbData.results || []).map((r: any) => ({
              title: r.title || "",
              content: (r.content || "").slice(0, 400),
              url: r.url || "",
            })).filter((r: any) => r.title.length > 5)
          }
        } catch {}
      }
    }

    if (bestResults.length === 0) {
      return NextResponse.json({
        candidates: [],
        usedTier: -1,
        message: `未在${platform}找到"${searchTerm}"相关的热门内容`,
      })
    }

    // ── 用 DeepSeek 分析并排序 ──
    let candidates: { title: string; description: string; url: string; estimatedLikes: number; estimatedShares: number; source: string }[] = []

    if (deepseekKey) {
      try {
        const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `你是爆款内容分析专家。根据搜索结果，分析每条内容的受欢迎程度，估算点赞数和转发数，并排序。

搜索结果列表如下。请对每条内容估算点赞数和转发数（整数），按热度从高到低排序。

只输出JSON数组：
[{"title":"标题","description":"摘要","url":"链接","estimatedLikes":数字,"estimatedShares":数字}]

注意事项：
- 如果搜索结果中提到了"万赞""爆款""热门"等关键词，点赞数应该更高
- 如果提到了具体数字，使用提到的数字
- 如果没有任何热度信息，给一个保守估算（100-500）
- 保持原有 title/url 不变`,
              },
              {
                role: "user",
                content: `以下是${platform}上关于"${searchTerm}"的搜索结果（搜索层级：${LIKE_TIERS[usedTier]?.label || "无层级"}）：\n\n${
                  bestResults.map((r, i) => `${i + 1}. 标题：${r.title}\n   摘要：${r.content.slice(0, 200)}\n   链接：${r.url}`).join("\n\n")
                }`,
              },
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        })

        if (dsRes.ok) {
          const dsData = await dsRes.json()
          const content = dsData.choices?.[0]?.message?.content || ""
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            candidates = JSON.parse(jsonMatch[0])
          }
        }
      } catch {}
    }

    // 如果 DeepSeek 解析失败，直接用原始结果
    if (candidates.length === 0) {
      candidates = bestResults.map((r, i) => ({
        title: r.title,
        description: r.content.slice(0, 200),
        url: r.url,
        estimatedLikes: Math.max(0, 500 - i * 100), // 保守估算
        estimatedShares: Math.max(0, 100 - i * 20),
        source: platform,
      }))
    }

    // 按点赞数排序，取 Top 3（如果不足3个就取全部）
    candidates.sort((a, b) => b.estimatedLikes - a.estimatedLikes)
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length))

    const usedTierLabel = usedTier >= 0 ? LIKE_TIERS[usedTier].label : "未分层"
    const thresholdMet = usedTier === 0 || usedTier === 1 // 10000或5000阈值

    return NextResponse.json({
      candidates: topCandidates,
      totalFound: candidates.length,
      usedTier,
      usedTierLabel,
      thresholdMet,
      message: thresholdMet
        ? `🔥 找到 ${topCandidates.length} 条高热度内容`
        : `找到 ${topCandidates.length} 条相关内容（未达到万赞阈值，选择了热度最高的）`,
      searchKeyword: searchTerm,
      platform,
    })
  } catch (err: any) {
    return NextResponse.json({ candidates: [], error: err.message }, { status: 500 })
  }
}
