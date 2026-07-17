// GET/POST /api/drama/projects
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

let memoryStore: any[] = []  // 内存存储（后续改为 Supabase）

export async function GET() {
  return NextResponse.json(memoryStore.filter(p => !p._deleted))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const project = {
    id: "proj_" + Date.now(),
    title: body.title || "未命名项目",
    genre: body.genre || "short_drama",
    script: body.script || "",
    status: body.script ? "extracting" : "draft",
    chapterCount: 0, shotCount: 0,
    chapters: [], entities: { characters: [], scenes: [], props: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  // 如果提供了剧本，自动分析
  if (body.script) {
    try {
      const sb = getSupabase()
      // 这里调用 LLM 进行剧本分析（分幕 + 角色提取）
      // 暂用模拟数据
      project.chapters = [
        { id: "ch_1", title: "第一幕", order: 1, content: body.script.slice(0, 500), shotCount: 0, status: "ready" }
      ]
      project.chapterCount = 1
      project.entities = {
        characters: [{ name: "主角", description: "主要角色", traits: ["勇敢", "善良"] }],
        scenes: [{ name: "场景一", description: "主要场景" }],
        props: []
      }
      project.status = "ready"
    } catch {}
  }
  
  memoryStore.push(project)
  return NextResponse.json(project, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const idx = memoryStore.findIndex(p => p.id === body.id)
  if (idx >= 0) { memoryStore[idx] = { ...memoryStore[idx], ...body, updatedAt: new Date().toISOString() }; return NextResponse.json(memoryStore[idx]) }
  return NextResponse.json({ error: "not found" }, { status: 404 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const idx = memoryStore.findIndex(p => p.id === id)
  if (idx >= 0) { memoryStore[idx]._deleted = true; return NextResponse.json({ ok: true }) }
  return NextResponse.json({ error: "not found" }, { status: 404 })
}