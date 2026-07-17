// POST /api/drama/analyze
import { NextRequest, NextResponse } from "next/server"
export async function POST(req: NextRequest) {
  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: "缺少projectId" }, { status: 400 })
  const res = await fetch("http://localhost:3000/api/drama/projects")
  const projects = await res.json()
  const project = projects.find(p => p.id === projectId)
  if (!project || !project.script) return NextResponse.json({ error: "项目或剧本不存在" }, { status: 404 })
  try {
      const { callLLM } = await import("@/lib/llm")
  const text = await callLLM("你是一个剧本分析专家，只输出JSON。格式: { title, chapters:[], characters:[], scenes:[] }", "剧本：" + script.slice(0, 8000), { jsonMode: true, temperature: 0.3 })    let analysis = null
    try { analysis = JSON.parse(text.trim()) } catch { const m = text.match(/\`json\s*([\s\S]*?)\`/); if (m) try { analysis = JSON.parse(m[1].trim()) } catch {} }
    if (!analysis) return NextResponse.json({ error: "解析失败", raw: text.slice(0,200) }, { status: 500 })
    const chapters = (analysis.chapters || []).map((ch,i) => ({ id: "ch_"+Date.now()+"_"+i, title: ch.title||"第"+(i+1)+"幕", order: ch.order||(i+1), content: ch.content||"", shotCount:0, status:"ready" }))
    await fetch("http://localhost:3000/api/drama/projects", { method: "PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: projectId, status:"ready", chapterCount: chapters.length, chapters, entities: { characters: analysis.characters||[], scenes: analysis.scenes||[] } }) })
    return NextResponse.json({ status:"ready", chapterCount: chapters.length })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}