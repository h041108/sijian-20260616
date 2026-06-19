// ─── POST /api/video/frame ───────────────────────────
// 即梦 / 火山引擎图片生成 API
// 接入: 火山引擎 ARK 平台 → OpenAI-compatible → 即梦模型

import { NextRequest, NextResponse } from "next/server"

const JIMENG_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, width = 1920, height = 1080 } = body

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.JIMENG_API_KEY || process.env.SEEDANCE_API_KEY || null
    const modelId = process.env.JIMENG_MODEL || "doubao-seedream-4-5-251128"
    console.log("[即影Debug] JIMENG_API_KEY exists:", !!process.env.JIMENG_API_KEY, "SEEDANCE_API_KEY exists:", !!process.env.SEEDANCE_API_KEY)
    if (!apiKey) {
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/6366F1/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 30))}`,
        placeholder: true,
        debug: { hasEnv: false, allKeys: Object.keys(process.env).filter(k => k.includes("JIMENG") || k.includes("SEEDANCE") || k.includes("API")) },
        message: "配置 JIMENG_API_KEY 或 SEEDANCE_API_KEY 环境变量以启用真实图片生成",
      })
    }

    const res = await fetch(`${JIMENG_API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        size: `${width}x${height}`,
        response_format: "url",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/EF4444/FFFFFF?text=API${res.status}`,
        error: true,
        statusCode: res.status,
        apiResponse: errText.slice(0, 300),
        message: `即梦 API 返回 ${res.status}`,
        debug: { apiKeyType: apiKey.slice(0, 10) + "...", apiBase: JIMENG_API_BASE, model: modelId },
      }, { status: 502 })
    }

    const data = await res.json()
    const imageUrl = data.data?.[0]?.url || ""

    return NextResponse.json({
      url: imageUrl,
      prompt,
      model: "doubao-seedream-2-0",
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Frame API error:", err)
    return NextResponse.json({ error: "图片生成失败" }, { status: 500 })
  }
}
