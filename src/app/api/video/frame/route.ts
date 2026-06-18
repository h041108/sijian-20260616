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

    const apiKey = process.env.JIMENG_API_KEY
    console.log("[即影Debug] JIMENG_API_KEY exists:", !!apiKey, "length:", apiKey?.length || 0)
    if (!apiKey) {
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/6366F1/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 30))}`,
        placeholder: true,
        debug: { hasEnv: false, allKeys: Object.keys(process.env).filter(k => k.includes("JIMENG") || k.includes("API")) },
        message: "配置 JIMENG_API_KEY 环境变量以启用真实图片生成",
      })
    }

    const res = await fetch(`${JIMENG_API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "doubao-seedream-2-0-t2i-250628",
        prompt,
        n: 1,
        size: `${width}x${height}`,
        response_format: "url",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("即梦 API error:", err)
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/EF4444/FFFFFF?text=生成失败`,
        error: true,
        message: `即梦 API 返回 ${res.status}`,
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
