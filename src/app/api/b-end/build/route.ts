import { NextRequest, NextResponse } from "next/server"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1"
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"

const BUILD_PROMPT = `你是知识结构化引擎。用户输入一个教学知识点，你需要将它转化为层次化的概念节点和应用锚点。

输出格式（纯结构，不要对话）：
<extract f="框架" d="领域">
N: id|标签≤6字|级别0-3|shape|color|内容描述
A: id|应用场景标签≤8字|所属行业|相关职业|具体参数|关联节点id|相关度0-1
E: id|源节点id|目标节点id|权重0-1

要求：
- N行(3-8个节点)：深度从0到3，形成知识层级。标签精准≤6字。shape从sphere/box/cylinder/torus随机选，颜色从16色随机选。
- A行(每个节点1-3个)：必须包含真实世界的具体参数和数字。要精确，不要空洞描述。
- E行：连接有概念关联的节点。
- 框架(f)：tree(层级树)|network(关系网)|pipeline(流程)|helix(双螺旋)|strata(分层)|orbital(轨道)|lens(透镜)|cycle(循环)|spectrum(连续谱)|matrix(矩阵)|diffusion(扩散)。根据知识特性选。
- 领域(d)：physics|chemistry|astronomy|geology|meteorology|oceanography|materials|biology|genetics|medicine|neuroscience|ecology|evolution|nutrition|history|economics|sociology|political|anthropology|law|education|linguistics|mathematics|logic|philosophy|literature|art|music|architecture|design|tech|ai|computerscience|software|engineering|telecom|cybersecurity|robotics|cooking|gardening|sports|craft|navigation|firstaid|timemanagement|finance|general

颜色16选：#E53E3E #D53F8C #805AD5 #553C9A #4C51BF #3182CE #00B5D8 #319795 #38A169 #68D391 #9AE6B4 #D69E2E #F6E05E #ED8936 #DD6B20 #8B4513`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, subject, grade } = body

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 })
    }

    const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL, max_tokens: 4096, temperature: 0.4,
        messages: [
          { role: "system", content: BUILD_PROMPT },
          { role: "user", content: `学科: ${subject || "通用"}\n年级: ${grade || "通用"}\n知识点: ${topic}\n\n请为这个知识点构建完整的知识空间结构，确保每个概念节点都有至少一个真实世界的应用锚点。` },
        ],
      }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    const raw = data.choices[0]?.message?.content || ""

    // 解析
    const mStart = raw.indexOf("<extract ")
    if (mStart === -1) return NextResponse.json({ error: "构建失败，请重试" }, { status: 500 })

    const block = raw.slice(mStart)
    const fMatch = block.match(/f="(\w+)"/)
    const dMatch = block.match(/d="(\w+)"/)

    const rawNodes: any[] = [], rawEdges: any[] = [], rawAnchors: any[] = []
    for (const line of block.split(/\n/)) {
      const t = line.trim()
      if (t.startsWith("N: ")) {
        const p = t.slice(3).split("|")
        if (p.length >= 6) rawNodes.push({ id: p[0].trim(), label: p[1].trim().slice(0, 6), depth: parseInt(p[2]) || 0, shape: p[3].trim() || "sphere", color: p[4].trim() || "#4C51BF", content: p.slice(5).join("|").trim() })
      } else if (t.startsWith("A: ")) {
        const p = t.slice(3).split("|")
        if (p.length >= 7) rawAnchors.push({ id: p[0].trim(), label: p[1].trim().slice(0, 8), domain: p[2].trim(), profession: p[3].trim(), parameters: p[4].trim(), nodeId: p[5].trim(), relevanceScore: parseFloat(p[6]) || 0.85 })
      } else if (t.startsWith("E: ")) {
        const p = t.slice(3).split("|")
        if (p.length >= 4) rawEdges.push({ id: p[0].trim(), source: p[1].trim(), target: p[2].trim(), weight: parseFloat(p[3]) || 0.8 })
      }
    }

    const nodes = rawNodes.map(n => ({ ...n, parentIds: [], anchors: [], metadata: { createdBy: "teacher", createdAt: new Date().toISOString(), version: 1 } }))
    for (const a of rawAnchors) { const nd = nodes.find((n: any) => n.id === a.nodeId); if (nd) nd.anchors.push(a) }

    return NextResponse.json({
      nodes, edges: rawEdges,
      frameType: fMatch?.[1] || "tree",
      domainType: dMatch?.[1] || "general",
      topic, subject, grade,
    })
  } catch (error) {
    console.error("B-end build error:", error)
    return NextResponse.json({ error: "构建失败" }, { status: 500 })
  }
}
