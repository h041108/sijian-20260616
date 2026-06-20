// ─── POST /api/trends/deconstruct ────────────────────
// 爆款趋势搜索 → DeepSeek拆解 → 返回可复用模板
// 对标 Coze 工作流的自动搜索+分析能力

import { NextRequest, NextResponse } from "next/server"
import { searchViralTrends, buildDeconstructPrompt } from "@/lib/viral-trends"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, platform = "抖音" } = body

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    if (!process.env.TAVILY_API_KEY || !process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({
        error: true,
        message: "需要配置 TAVILY_API_KEY 和 DEEPSEEK_API_KEY 环境变量",
        placeholder: true,
      }, { status: 402 })
    }

    // Step 1: 搜索爆款内容
    const rawResults = await searchViralTrends(query, platform)

    if (rawResults.length === 0) {
      return NextResponse.json({
        query,
        searchedAt: new Date().toISOString(),
        rawResults: [],
        viralTemplates: [],
        recommendedApproach: "",
        message: "未找到相关爆款内容",
        placeholder: true,
      })
    }

    // Step 2: DeepSeek拆解
    const deconstructPrompt = buildDeconstructPrompt(rawResults, query)

    const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位专业的短视频爆款分析专家。你只返回JSON，不返回任何其他内容。" },
          { role: "user", content: deconstructPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!dsRes.ok) {
      return NextResponse.json({
        query,
        searchedAt: new Date().toISOString(),
        rawResults,
        viralTemplates: [],
        recommendedApproach: "",
        message: `DeepSeek分析失败: ${dsRes.status}`,
      }, { status: 502 })
    }

    const dsData = await dsRes.json()
    const content = dsData.choices?.[0]?.message?.content || ""

    // 清理 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        query,
        searchedAt: new Date().toISOString(),
        rawResults,
        viralTemplates: [],
        recommendedApproach: "",
        message: "AI分析结果格式异常",
      }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      query,
      searchedAt: new Date().toISOString(),
      rawResults: rawResults.map(r => ({ title: r.title, url: r.url })),
      viralTemplates: parsed.viralTemplates || [],
      recommendedApproach: parsed.recommendedApproach || "",
    })
  } catch (err: any) {
    return NextResponse.json({ error: "趋势分析失败", detail: err.message }, { status: 500 })
  }
}
