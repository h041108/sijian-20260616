import { NextRequest, NextResponse } from "next/server"
import { generateDailyContent } from "@/lib/daily-content"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, platform, niche } = body

    if (!userId || !platform || !niche) {
      return NextResponse.json({ error: "缺少必填参数" }, { status: 400 })
    }

    const result = await generateDailyContent(userId, platform, niche, request.nextUrl.origin)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "生成失败" }, { status: 500 })
  }
}
