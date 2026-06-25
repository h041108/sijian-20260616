import { NextRequest, NextResponse } from "next/server"
import { runOrchestrator, getPipelinePreview } from "@/lib/agents/orchestrator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput, platform, niche, brand, referenceImages, referenceText, mode, agents } = body

    if (!userInput?.trim()) {
      return NextResponse.json({ success: false, error: "缺少必填字段: userInput" }, { status: 400 })
    }

    ;(globalThis as any).__AGENT_API_BASE = request.nextUrl.origin
    const output = await runOrchestrator({
      userInput: userInput.trim(),
      platform,
      niche,
      brand,
      referenceImages,
      referenceText,
      mode: mode || "auto",
      agents,
    })

    return NextResponse.json(output)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "服务器错误" }, { status: 500 })
  }
}

// GET: 预览意图分析结果（不做实际调用）
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input") || ""
  if (!input.trim()) {
    return NextResponse.json({ error: "需要 input 参数" }, { status: 400 })
  }
  return NextResponse.json(getPipelinePreview(input))
}
