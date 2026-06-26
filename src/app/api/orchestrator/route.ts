import { NextRequest, NextResponse } from "next/server"
import { runTrackExpert } from "@/lib/agents/orchestrator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput, platform, niche } = body

    if (!userInput?.trim()) {
      return NextResponse.json({ success: false, error: "输入你的想法" }, { status: 400 })
    }

    const output = await runTrackExpert({
      userInput: userInput.trim(),
      platform,
      niche,
    })

    return NextResponse.json(output)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "分析失败" }, { status: 500 })
  }
}
