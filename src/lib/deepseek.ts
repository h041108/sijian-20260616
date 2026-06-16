import type { AIResponse, MindNode, MindEdge } from "./types"

type ExtractResult = { nodes: MindNode[]; edges: MindEdge[]; frameType?: string; domainType?: string }

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1"
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"

const COLORS_16 = ["#E53E3E","#D53F8C","#805AD5","#553C9A","#4C51BF","#3182CE","#00B5D8","#319795","#38A169","#68D391","#9AE6B4","#D69E2E","#F6E05E","#ED8936","#DD6B20","#8B4513"]
const SHAPES_4 = ["sphere","box","cylinder","torus"] as const

// ─── 单轮对话 + 结构提取（避免两轮 API 调用） ─────

const SYSTEM_PROMPT = `你是思见，一个直接高效的思维伙伴。

回答原则：
- 简洁直接，不啰嗦。能一句话讲清不用三句话
- 代码给完整可运行的版本
- 不问"你怎么想""你确定吗"——用户问就答
- 用标题和分段让答案清晰即可

每条回复末尾必须附加思维空间标记：

<extract f="框架" d="领域">
N: id|标签≤6字|depth|shape|color|内容
</extract>

框架选一: tree/network/helix/strata/orbital/pipeline/lens/cycle/spectrum/matrix/diffusion
领域选一: mathematics/physics/chemistry/biology/history/economics/tech/ai/general
N行最多5个节点，标签≤6字，depth从0开始，shape选sphere/box/cylinder/torus，color从#E53E3E #D53F8C #805AD5等自选。`

// ═══════════════════════════════════════════════════
// 非流式（B端 / 工作流用）
// ═══════════════════════════════════════════════════

export async function chat(
  messages: { role: "user" | "assistant"; content: string }[],
  existingNodes: { id: string; label: string; content: string }[] = [],
  imageData?: string | null,
): Promise<AIResponse> {
  void imageData

  const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, max_tokens: 2048,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))],
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)
  const data = await res.json()
  const fullText = data.choices[0]?.message?.content || ""

  const space = parseExtract(fullText)
  const reply = fullText.replace(/<extract[\s\S]*?<\/extract>/g, "").trim()

  if (space.nodes.length === 0) {
    const locals = localExtract(reply, messages[messages.length - 1]?.content || "")
    return { message: reply, mindSpaceUpdate: locals as any, domain_type: (locals.domainType || "general") as any }
  }

  return { message: reply, mindSpaceUpdate: space as any, domain_type: (space.domainType || "general") as any }
}

// ═══════════════════════════════════════════════════
// 流式（C端用）
// ═══════════════════════════════════════════════════

export async function chatStream(
  messages: { role: "user" | "assistant"; content: string }[],
  existingNodes: { id: string; label: string; content: string }[] = [],
  imageData?: string | null,
): Promise<ReadableStream<Uint8Array>> {
  void imageData

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (d: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`))

      try {
        const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL, max_tokens: 2048, stream: true,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))],
            temperature: 0.7,
          }),
        })

        if (!res.ok) { emit({ type: "error", content: `服务异常 (${res.status})` }); controller.close(); return }

        const reader = res.body?.getReader()
        if (!reader) { emit({ type: "error", content: "流式读取失败" }); controller.close(); return }

        const decoder = new TextDecoder()
        let fullReply = "", dispReply = "", buf = "", inExtract = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split("\n"); buf = lines.pop() || ""
          for (const line of lines) {
            const t = line.trim()
            if (!t || !t.startsWith("data: ")) continue
            const js = t.slice(6); if (js === "[DONE]") continue
            try {
              const token = JSON.parse(js).choices?.[0]?.delta?.content
              if (!token) continue
              fullReply += token
              // 检测是否进入/退出 extract 块
              if (token.includes("<extract")) inExtract = true
              if (inExtract) {
                if (token.includes("</extract>")) { inExtract = false; continue }
                continue // suppress extract tokens
              }
              dispReply += token
              emit({ type: "token", content: token })
            } catch {}
          }
        }

        const cleanReply = fullReply.replace(/<extract[\s\S]*?<\/extract>/g, "").trim() || dispReply.trim()
        const space = parseExtract(fullReply)
        if (space.nodes.length > 0) {
          emit({ type: "done", message: fullReply.replace(/<extract[\s\S]*?<\/extract>/g, "").trim(), mindSpaceUpdate: { nodes: space.nodes, edges: space.edges, frameType: space.frameType }, domain_type: space.domainType || "general" })
        } else {
          const locals = localExtract(fullReply.replace(/<extract[\s\S]*?<\/extract>/g, "").trim(), messages[messages.length - 1]?.content || "")
          emit({ type: "done", message: fullReply.replace(/<extract[\s\S]*?<\/extract>/g, "").trim(), mindSpaceUpdate: { nodes: locals.nodes, edges: locals.edges, frameType: locals.frameType }, domain_type: locals.domainType || "general" })
        }
      } catch {
        emit({ type: "error", content: "AI 服务暂时不可用" })
      } finally { controller.close() }
    },
  })
}

// ─── 解析 ─────────────────────────────────────

function parseExtract(raw: string): ExtractResult {
  const m = raw.match(/<extract f="(\w+)" d="(\w+)"[^>]*>([\s\S]*?)<\/extract>/)
  if (!m) return { nodes: [], edges: [] }

  const frameType = m[1] || "tree"
  const domainType = m[2] || "general"
  const block = m[3]

  const nodes: any[] = []
  for (const line of block.split(/\n/)) {
    const t = line.trim()
    if (!t.startsWith("N: ")) continue
    const p = t.slice(3).split("|")
    if (p.length >= 6) {
      nodes.push({
        id: p[0].trim(), label: p[1].trim().slice(0, 6),
        depth: parseInt(p[2]) || 0, shape: p[3].trim() || "sphere",
        color: p[4].trim() || "#4C51BF", content: p.slice(5).join("|").trim(),
        parentIds: [], anchors: [],
        metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 },
      })
    }
  }
  return { nodes, edges: [], frameType, domainType }
}

function localExtract(reply: string, userMsg: string): ExtractResult {
  const text = (userMsg + " " + reply).slice(0, 300)
  const sents = text.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length >= 4 && s.length <= 30).slice(0, 5)
  if (sents.length === 0) {
    return { frameType: "tree", nodes: [{ id: "fb1", label: reply.slice(0, 6), depth: 0, shape: "sphere", color: COLORS_16[0], content: reply.slice(0, 50), parentIds: [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }], edges: [] }
  }
  const nodes: any[] = sents.map((s, i) => ({ id: `fb${i + 1}`, label: s.slice(0, 6), depth: i === 0 ? 0 : 1, shape: SHAPES_4[i % 4], color: COLORS_16[i % 16], content: s, parentIds: i > 0 ? ["fb1"] : [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }))
  const edges = sents.length > 1 ? [{ id: "fbe1", source: "fb1", target: "fb2", edgeType: "abstract" as const, weight: 0.7 }] : []
  return { frameType: "tree", nodes, edges }
}
