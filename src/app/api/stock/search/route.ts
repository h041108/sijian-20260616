// ─── POST /api/stock/search ──────────────────────────
// 免费图库搜索：Unsplash → Pexels → Seedream（兜底）
// 知识讲解模式自动配图用，不依赖 AI 生成

import { NextRequest, NextResponse } from "next/server"

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || ""
const PEXELS_KEY = process.env.PEXELS_API_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, count = 1 } = body

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    let images: { url: string; thumb: string; source: string; alt: string }[] = []

    // Layer 1: Unsplash
    if (UNSPLASH_KEY) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 5)}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
        )
        if (res.ok) {
          const data = await res.json()
          images = (data.results || []).map((r: any) => ({
            url: r.urls?.regular || "",
            thumb: r.urls?.thumb || "",
            source: "unsplash",
            alt: r.alt_description || query,
          })).filter((i: any) => i.url)
        }
      } catch {}
    }

    // Layer 2: Pexels（Unsplash 没结果时）
    if (images.length === 0 && PEXELS_KEY) {
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 5)}`,
          { headers: { Authorization: PEXELS_KEY } }
        )
        if (res.ok) {
          const data = await res.json()
          images = (data.photos || []).map((r: any) => ({
            url: r.src?.large || "",
            thumb: r.src?.medium || "",
            source: "pexels",
            alt: query,
          })).filter((i: any) => i.url)
        }
      } catch {}
    }

    return NextResponse.json({
      images: images.slice(0, count),
      total: images.length,
      query,
      source: images.length > 0 ? images[0].source : "none",
    })
  } catch (err: any) {
    return NextResponse.json({ images: [], error: err.message }, { status: 500 })
  }
}
