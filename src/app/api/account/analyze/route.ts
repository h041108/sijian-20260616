// ─── POST /api/account/analyze ────────────────────────
// 根据用户提供的主页 URL + 昵称，搜索账号公开内容并分析风格
// 注意：不强制判断赛道，只提供建议。赛道由用户手动选择

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
      niche: "待确认",
      nicheConfidence: 0,
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

    // Step 3: DeepSeek 分析内容风格和受众（不强制判断赛道）
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
                content: "你是一个社交媒体内容分析师。根据用户账号的公开内容，分析：\n1. 内容风格（3个关键词）\n2. 目标受众（一句话）\n3. 内容标签（5个）\n4. 建议赛道（仅做参考，标注置信度）\n\n只输出JSON：\n{\"suggestedNiche\":\"赛道名\",\"nicheConfidence\":0-1,\"contentStyle\":[\"a\",\"b\",\"c\"],\"audience\":\"描述\",\"contentTags\":[\"t1\",\"t2\",\"t3\",\"t4\",\"t5\"]}",
              },
              { role: "user", content: analysisInput },
            ],
            temperature: 0.3,
            max_tokens: 500,
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
              suggestedNiche: parsed.suggestedNiche || "待确认",
              nicheConfidence: parsed.nicheConfidence || 0,
              contentStyle: parsed.contentStyle || ["待分析"],
              audience: parsed.audience || "待分析",
              contentTags: parsed.contentTags || [],
              niche: parsed.suggestedNiche || "待确认", // 保留兼容
              accountExists: searchResults.length > 0,
              searchResultsCount: searchResults.length,
              verified: true,
            }
          }
        }
      } catch {}
    }

    return NextResponse.json(analysis)
  } catch (err: any) {
    return NextResponse.json({ verified: false, error: err.message }, { status: 500 })
  }
}
