// ─── POST /api/account/analyze ────────────────────────
// 根据用户提供的主页 URL + 昵称，真实分析账号
// 1. Tavily 搜索该账号公开内容
// 2. DeepSeek 分析赛道、风格、受众
// 3. 返回结构化分析报告

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
            query: `${platform} ${nickname} ${profileUrl}`,
            search_depth: "basic",
            max_results: 5,
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

    // Step 2: 分析账号 — 即使搜索没结果，也基于用户提供的信息做分析
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
        ? `已分析到 ${searchResults.length} 条相关公开内容`
        : "未搜索到具体内容，已根据你提供的信息进行基础分析",
      // 返回原始搜索内容，供 Agent 13 生成时参考用户风格
      contentSamples: searchResults.map(r => r.title + (r.content ? ": " + r.content.slice(0, 300) : "")),
    }

    if (DEEPSEEK_KEY) {
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
                content: `你是一个社交媒体账号分析师。根据用户提供的信息，分析该账号的：
1. 内容赛道（从以下选择最接近的：美食、美妆、穿搭、数码、教育、生活、健康、母婴、旅行、家居、宠物、汽车、游戏、影视、科技、健身、音乐、摄影、手工、园艺、金融投资、程序开发、自媒体运营、知识付费、商业财经、设计创意、语言学习、情感心理）
2. 置信度（0-1）
3. 内容风格（列出3个关键词，如：教程型、测评型、Vlog型）
4. 目标受众（一句话描述）
5. 内容标签（5个关键词）

只输出JSON格式，不要任何其他文字：
{"niche":"赛道","nicheConfidence":0-1,"contentStyle":["风格1","风格2","风格3"],"audience":"目标受众描述","contentTags":["标签1","标签2","标签3","标签4","标签5"]}`,
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
          // 提取 JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            analysis = { ...analysis, ...parsed, accountExists: searchResults.length > 0, searchResultsCount: searchResults.length, verified: true }
          }
        }
      } catch {}
    }

    return NextResponse.json(analysis)
  } catch (err: any) {
    return NextResponse.json({ verified: false, error: err.message }, { status: 500 })
  }
}
