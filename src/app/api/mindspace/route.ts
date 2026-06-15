import { NextRequest, NextResponse } from "next/server"

// 当前阶段使用内存存储（后续迁移到 Supabase）
// 数据结构按 Supabase 表结构设计，切换时只需替换存储层
const store = new Map<string, { nodes: unknown[]; edges: unknown[] }>()

// GET /api/mindspace?sessionId=xxx
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    )
  }

  const data = store.get(sessionId)
  if (!data) {
    return NextResponse.json({ nodes: [], edges: [] })
  }

  return NextResponse.json(data)
}

// POST /api/mindspace — save mind space state
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, nodes, edges } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      )
    }

    store.set(sessionId, {
      nodes: nodes || [],
      edges: edges || [],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("MindSpace API error:", error)
    return NextResponse.json(
      { error: "保存思维空间失败" },
      { status: 500 },
    )
  }
}

// DELETE /api/mindspace?sessionId=xxx
export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    )
  }

  store.delete(sessionId)
  return NextResponse.json({ success: true })
}
