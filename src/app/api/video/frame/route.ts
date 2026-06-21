// ─── POST /api/video/frame ───────────────────────────
// 即梦 / 火山引擎图片生成 API
// 接入: 火山引擎 ARK 平台 → 豆包 Seedream 4.5
// Seedream 4.5 要求 width/height（非 size），最小 3686400 像素

import { NextRequest, NextResponse } from "next/server"

const JIMENG_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, width = 1920, height = 1080 } = body

    // Seedream 4.5 最低要求：3686400 像素（≈1920×1920）
    // 如果低于最低要求，自动放大
    const MIN_PIXELS = 3686400
    let w = Number(width) || 1920
    let h = Number(height) || 1080
    if (w * h < MIN_PIXELS) {
      const scale = Math.sqrt(MIN_PIXELS / (w * h))
      w = Math.ceil(w * scale)
      h = Math.ceil(h * scale)
    }

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.JIMENG_API_KEY || process.env.SEEDANCE_API_KEY || null
    const modelId = process.env.JIMENG_MODEL || "doubao-seedream-4-5-251128"
    if (!apiKey) {
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/6366F1/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 30))}`,
        placeholder: true,
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
        width: w,
        height: h,
        response_format: "url",
        ...(body.image ? { image: body.image, image_strength: body.image_strength ?? 0.35 } : {}),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/EF4444/FFFFFF?text=API${res.status}`,
        placeholder: true,
        error: true,
        statusCode: res.status,
        apiResponse: errText.slice(0, 300),
        message: `即梦 API 返回 ${res.status}`,
      }, { status: 502 })
    }

    const data = await res.json()
    const imageUrl = data.data?.[0]?.url || ""

    return NextResponse.json({
      url: imageUrl,
      prompt,
      model: modelId,
      generatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("Frame API error:", err)
    return NextResponse.json({ error: "图片生成失败", detail: err.message }, { status: 500 })
  }
}
