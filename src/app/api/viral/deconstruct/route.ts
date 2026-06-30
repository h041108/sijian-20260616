// ─── POST /api/viral/deconstruct ────────────────────
// 服务端爆款拆解代理 — 不走浏览器端 API Key

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, platform } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const prompt = `你是一位爆款内容分析师。请分析以下${platform || "社交媒体"}爆款内容的结构：

标题：${title}
描述：${(description || "").slice(0, 300)}

请从以下维度拆解：
1. 钩子策略（前3秒/第一句怎么吸引人）
2. 脚本结构（内容怎么组织的）
3. 节奏控制（信息密度、停顿、转折）
4. 情绪曲线（观众情绪怎么变化的）
5. 转化话术（怎么引导互动/购买）
6. 视觉风格（画面/排版特点）
7. 热门关键词（3-5个）

只输出JSON格式：
{"hookStyle":"...","scriptStructure":"...","pacing":"...","emotionalCurve":"...","conversionTactic":"...","visualStyle":"...","keywords":["...","..."]}`

    const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你只输出JSON，不要任何其他文字。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    if (!dsRes.ok) {
      return NextResponse.json({
        hookStyle: "反常识/悬念开篇",
        scriptStructure: "问题→解决方案→案例→总结",
        pacing: "前3秒钩子，中间递进",
        emotionalCurve: "好奇→信任→行动",
        conversionTactic: "引导评论+收藏",
        visualStyle: "高清实拍/图文结合",
        keywords: [platform || "社交媒体", "爆款", "热门"],
        sourceTitle: title,
        _fallback: true,
      })
    }

    const dsData = await dsRes.json()
    const content = dsData.choices?.[0]?.message?.content || ""
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({ ...parsed, sourceTitle: title })
    }

    return NextResponse.json({ hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子", emotionalCurve: "好奇→信任", conversionTactic: "引导互动", visualStyle: "高清", keywords: [], sourceTitle: title })
  } catch {
    return NextResponse.json({ hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子", emotionalCurve: "好奇→信任", conversionTactic: "引导互动", visualStyle: "高清", keywords: [], sourceTitle: "", _fallback: true })
  }
}
