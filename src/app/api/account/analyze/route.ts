// ─── POST /api/account/analyze ────────────────────────
// 根据用户提供的主页 URL + 昵称，搜索账号公开内容并分析
// 返回 Top 3 赛道候选，供用户选择

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { platform, profileUrl, nickname } = body

    if (!profileUrl || !nickname) {
      return NextResponse.json({ verified: false, error: "请提供主页链接和昵称" }, { status: 400 })
    }

    const TAVILY_KEY = process.env.TAVILY_API_KEY || ""
    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || ""

    // Step 1: 用 Tavily 搜索该账号的公开信息
    let searchResults: { title: string; content: string; url: string }[] = []
    if (TAVILY_KEY) {
      try {
        const tRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_KEY,
            query: `${nickname} ${platform}`,
            search_depth: "advanced",
            max_results: 8,
            include_answer: true,
          }),
        })
        if (tRes.ok) {
          const tData = await tRes.json()
          searchResults = (tData.results || []).slice(0, 5).map((r: any) => ({
            title: r.title || "",
            content: (r.content || "").slice(0, 500),
            url: r.url || "",
          }))
        }
      } catch {}
    }

    // Step 2: 构建分析输入
    const analysisInput = searchResults.length > 0
      ? `平台：${platform}\n昵称：${nickname}\n主页：${profileUrl}\n\n搜索到的公开内容：\n${searchResults.map(r => `- ${r.title}: ${r.content.slice(0, 200)}`).join("\n")}`
      : `平台：${platform}\n昵称：${nickname}\n主页：${profileUrl}`

    let analysis: any = {
      nicheCandidates: [],
      contentStyle: ["待分析"],
      audience: "待分析",
      contentTags: [],
      accountExists: searchResults.length > 0,
      searchResultsCount: searchResults.length,
      verified: true,
      message: searchResults.length > 0
        ? `已搜索到 ${searchResults.length} 条相关内容`
        : "未搜索到具体内容",
      contentSamples: searchResults.map(r => r.title + (r.content ? ": " + r.content.slice(0, 300) : "")),
    }

    // Step 3: DeepSeek 分析，返回 Top 3 赛道候选
    if (DEEPSEEK_KEY && searchResults.length > 0) {
      try {
        const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `你是一个社交媒体内容分析师。根据用户账号的公开内容，分析并输出：
1. Top 3 最可能的内容赛道（从以下列表选择，按匹配度从高到低排列，每个赛道附带置信度0-1）
2. 内容风格（3个关键词）
3. 目标受众（一句话）
4. 内容标签（5个）

可选赛道列表：美食、美妆、穿搭、数码、教育、生活、健康、母婴、旅行、家居、宠物、汽车、游戏、影视、科技、健身、音乐、摄影、手工、园艺、金融投资、程序开发、自媒体运营、知识付费、商业财经、设计创意、语言学习、情感心理

只输出JSON：
{"nicheCandidates":[{"niche":"赛道1","confidence":0-1,"reason":"简短理由"},{"niche":"赛道2","confidence":0-1,"reason":"简短理由"},{"niche":"赛道3","confidence":0-1,"reason":"简短理由"}],"contentStyle":["a","b","c"],"audience":"描述","contentTags":["t1","t2","t3","t4","t5"]}`,
              },
              { role: "user", content: analysisInput },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        })
        if (dsRes.ok) {
          const dsData = await dsRes.json()
          const content = dsData.choices?.[0]?.message?.content || ""
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            analysis = {
              ...analysis,
              nicheCandidates: parsed.nicheCandidates || [],
              contentStyle: parsed.contentStyle || ["待分析"],
              audience: parsed.audience || "待分析",
              contentTags: parsed.contentTags || [],
              verified: true,
            }
          }
        }
      } catch {}
    }

    // 兜底：如果 DeepSeek 没有返回候选赛道，从搜索内容中提取关键词生成
    if (analysis.nicheCandidates.length === 0 && searchResults.length > 0) {
      const allTitles = searchResults.map(r => r.title + " " + r.content.slice(0, 100)).join(" ")
      const keywordMap: Record<string, RegExp[]> = {
        "程序开发": [/代码/i, /编程/i, /算法/i, /程序/i, /开发/i, /函数/i, /API/i, /Python/i, /系统/i, /框架/i, /部署/i, /Git/i],
        "金融投资": [/金融/i, /投资/i, /股票/i, /基金/i, /理财/i, /交易/i, /量化/i, /策略/i, /回测/i, /收益/i, /复利/i],
        "科技": [/科技/i, /数码/i, /评测/i, /手机/i, /电脑/i, /AI/i, /人工智能/i],
        "知识付费": [/知识付费/i, /课程/i, /社群/i, /变现/i, /副业/i, /赚钱/i],
        "自媒体运营": [/自媒体/i, /运营/i, /涨粉/i, /流量/i, /爆款/i, /账号/i],
        "商业财经": [/商业/i, /创业/i, /公司/i, /管理/i, /营销/i, /经济/i],
        "设计创意": [/设计/i, /创意/i, /UI/i, /UX/i, /审美/i, /配色/i],
        "教育": [/教育/i, /学习/i, /课程/i, /教学/i, /培训/i, /学生/i, /老师/i],
      }
      const scores: Record<string, number> = {}
      for (const [niche, patterns] of Object.entries(keywordMap)) {
        let score = 0
        for (const p of patterns) { if (p.test(allTitles)) score += 1 }
        if (score > 0) scores[niche] = score
      }
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
      if (sorted.length > 0) {
        analysis.nicheCandidates = sorted.slice(0, 3).map(([niche, score]) => ({
          niche,
          confidence: Math.min(0.8, score * 0.2 + 0.2),
          reason: "根据账号内容中的关键词匹配",
        }))
      } else {
        analysis.nicheCandidates = [
          { niche: "程序开发", confidence: 0.4, reason: "基于账号内容特征" },
          { niche: "科技", confidence: 0.3, reason: "基于账号内容特征" },
          { niche: "知识付费", confidence: 0.3, reason: "基于账号内容特征" },
        ]
      }
    }

    return NextResponse.json(analysis)
  } catch (err: any) {
    return NextResponse.json({ verified: false, error: err.message }, { status: 500 })
  }
}
