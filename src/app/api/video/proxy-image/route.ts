// ─── GET /api/video/proxy-image ──────────────────────
// 代理火山引擎 OSS 图片，解决 Canvas 合成时的 CORS 问题
// 用法: /api/video/proxy-image?url=<encoded_image_url>

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 })
  }

  // 安全：只允许白名单域名
  try {
    const parsed = new URL(url)
    const allowedHosts = [
      "ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com",
      "ark-content-generation-cn-beijing.tos-cn-beijing.volces.com",
      "tos-cn-beijing.volces.com",
    ]
    if (!allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
      return NextResponse.json({ error: "unsupported image host" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  try {
    const imageRes = await fetch(url, {
      headers: {
        "User-Agent": "Sijian-ImageProxy/1.0",
      },
    })

    if (!imageRes.ok) {
      return NextResponse.json({ error: `upstream ${imageRes.status}` }, { status: 502 })
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg"
    const buffer = await imageRes.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: `proxy error: ${err.message}` }, { status: 502 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  })
}
