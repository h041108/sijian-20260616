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
    const llmRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (process.env.DEEPSEEK_API_KEY || "") },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你是剧本分析专家。分析剧本，只输出JSON，不要markdown。格式: { chapters: [{title, order, content, summary}], characters: [{name, description, traits}], scenes: [{name, description, mood}] }" },
          { role: "user", content: "剧本：" + project.script.slice(0, 4000) },
        ],
        temperature: 0.3, max_tokens: 4000,
      }),
    })
    if (!llmRes.ok) throw new Error("LLM API失败")
    const llmData = await llmRes.json()
    const text = llmData.choices?.[0]?.message?.content || ""
    let analysis = null
    try { analysis = JSON.parse(text.trim()) } catch { const m = text.match(/\`json\s*([\s\S]*?)\`/); if (m) try { analysis = JSON.parse(m[1].trim()) } catch {} }
    if (!analysis) return NextResponse.json({ error: "解析失败", raw: text.slice(0,200) }, { status: 500 })
    const chapters = (analysis.chapters || []).map((ch,i) => ({ id: "ch_"+Date.now()+"_"+i, title: ch.title||"第"+(i+1)+"幕", order: ch.order||(i+1), content: ch.content||"", shotCount:0, status:"ready" }))
    await fetch("http://localhost:3000/api/drama/projects", { method: "PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: projectId, status:"ready", chapterCount: chapters.length, chapters, entities: { characters: analysis.characters||[], scenes: analysis.scenes||[] } }) })
    return NextResponse.json({ status:"ready", chapterCount: chapters.length })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}