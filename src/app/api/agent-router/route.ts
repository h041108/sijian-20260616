import { NextRequest, NextResponse } from "next/server"
import { routeAgents, runRoutedPipeline } from "@/lib/agent-router"

// GET: 获取某个赛道的Agent路由方案
export async function GET(request: NextRequest) {
  const nicheId = request.nextUrl.searchParams.get("niche") || ""
  if (!nicheId) {
    return NextResponse.json({ error: "需要 niche 参数" }, { status: 400 })
  }

  const route = routeAgents(nicheId)
  return NextResponse.json(route)
}

// POST: 执行路由后的Agent流水线
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nicheId, instruction, platform } = body

    if (!nicheId || !instruction) {
      return NextResponse.json({ error: "需要 nicheId 和 instruction" }, { status: 400 })
    }

    const result = await runRoutedPipeline(nicheId, instruction, platform)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "执行失败" }, { status: 500 })
  }
}
