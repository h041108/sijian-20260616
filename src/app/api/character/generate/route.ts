// ─── POST /api/character/generate ────────────────────
// 文字描述 → Seedream 4.5 生图 → 返回多张候选图
// 复用已验证的 frame API 格式

import { NextRequest, NextResponse } from "next/server"

const JIMENG_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"
const MODEL = "doubao-seedream-4-5-251128"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, style = "写实电影风格", count = 4 } = body

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.JIMENG_API_KEY || process.env.SEEDANCE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured", images: [] }, { status: 402 })
    }

    const totalCount = Math.min(4, Math.max(1, count || 4))
    const fullPrompt = `${style}，${prompt}，半身肖像，正面视角，纯色背景，高清，无文字，cg质感`

    // 即梦 API 同步返回图片
    const res = await fetch(`${JIMENG_API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: fullPrompt,
        width: 720,
        height: 960,
        n: totalCount,
        response_format: "url",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[Character Gen] API error:", errText)
      return NextResponse.json({
        images: [],
        error: `API returned ${res.status}`,
        detail: errText.slice(0, 300),
      }, { status: 502 })
    }

    const data = await res.json()
    let imageUrls: string[] = []

    // ArK / images/generations 标准返回
    if (data.data && Array.isArray(data.data)) {
      imageUrls = data.data.map((d: any) => d.url || d.image_url || "").filter(Boolean)
    }
    if (data.image_url) imageUrls.push(data.image_url)
    if (data.content?.image_url) imageUrls.push(data.content.image_url)

    return NextResponse.json({ images: imageUrls, total: imageUrls.length, prompt, style })
  } catch (err: any) {
    console.error("[Character Gen] Error:", err)
    return NextResponse.json({ images: [], error: err.message }, { status: 500 })
  }
}
