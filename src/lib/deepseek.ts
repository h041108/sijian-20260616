import type { AIResponse, MindNode, MindEdge } from "./types"
import { detectThinkingLines, ThinkingLineId } from "./thinking-lines"

type ExtractResult = { nodes: MindNode[]; edges: MindEdge[]; frameType?: string; domainType?: string }

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1"
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
const DEEPSEEK_VISION_MODEL = "deepseek-chat"   // DeepSeek V3 支持多模态图片识别

const COLORS_16 = ["#E53E3E","#D53F8C","#805AD5","#553C9A","#4C51BF","#3182CE","#00B5D8","#319795","#38A169","#68D391","#9AE6B4","#D69E2E","#F6E05E","#ED8936","#DD6B20","#8B4513"]
const SHAPES_4 = ["sphere","box","cylinder","torus"] as const

// ─── 单轮对话 + 结构提取（避免两轮 API 调用） ─────

const SYSTEM_PROMPT = `你是思见，一个直接高效的思维伙伴。

回答原则：
- 代码和长文必须一次性完整输出，绝对不要分段、不要"分两段给你"、不要说"我继续"。用户没要求分段你就不要分段。
- 代码给出完整、可直接运行的版本，不要省略任何部分
- 简洁直接，能一句话讲清不用三句话
- 不问"你怎么想""你确定吗"——用户问就答

每条回复末尾必须附加思维空间标记：

<extract f="框架" d="领域">
N: id|标签≤6字|depth|shape|color|内容
</extract>

框架选一: tree/network/helix/strata/orbital/pipeline/lens/cycle/spectrum/matrix/diffusion
领域选一: mathematics/physics/chemistry/biology/history/economics/tech/ai/general
N行最多5个节点，标签≤6字，depth从0开始，shape选sphere/box/cylinder/torus，color从#E53E3E #D53F8C #805AD5等自选。
N行的标签和内容不要用markdown格式——不要加**、-、#等符号，直接给纯文字。`

// ═══════════════════════════════════════════════════
// 非流式（B端 / 工作流用）
// ═══════════════════════════════════════════════════

export async function chat(
  messages: { role: "user" | "assistant"; content: string }[],
  existingNodes: { id: string; label: string; content: string }[] = [],
  imageData?: string | null,
): Promise<AIResponse> {
  void existingNodes

  // 有图片 → 切换多模态模型 + 传递 image_url
  const model = imageData ? DEEPSEEK_VISION_MODEL : DEEPSEEK_MODEL
  let apiMessages: any[]
  if (imageData) {
    const lastMsg = messages[messages.length - 1]
    const hasTextContent = lastMsg.role === "user" ? [{ type: "text" as const, text: lastMsg.content + "\n\n请仔细查看这张图片，描述图中所有文字、图表、数据，然后基于图片内容回答。" }] : [{ type: "text" as const, text: "请描述这张图片的全部内容" }]
    const imgContent = { type: "image_url" as const, image_url: { url: imageData } }
    apiMessages = [
      ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: [...hasTextContent, imgContent] },
    ]
  } else {
    apiMessages = messages.map(m => ({ role: m.role, content: m.content }))
  }

  const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model, max_tokens: 8192,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...apiMessages],
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
  void existingNodes

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (d: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`))

      try {
        // 有图片 → 多模态模型 + image_url
        const model = imageData ? DEEPSEEK_VISION_MODEL : DEEPSEEK_MODEL
        let apiMessages: any[]
        if (imageData) {
          const lastMsg = messages[messages.length - 1]
          const hasTextContent = lastMsg.role === "user"
            ? [{ type: "text" as const, text: lastMsg.content + "\n\n请仔细查看这张图片，描述图中所有文字、图表、数据，然后基于图片内容回答。" }]
            : [{ type: "text" as const, text: "请描述这张图片的全部内容" }]
          const imgContent = { type: "image_url" as const, image_url: { url: imageData } }
          apiMessages = [
            ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: [...hasTextContent, imgContent] },
          ]
        } else {
          apiMessages = messages.map(m => ({ role: m.role, content: m.content }))
        }

        const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model, max_tokens: 8192, stream: true,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...apiMessages],
            temperature: 0.7,
          }),
        })

        if (!res.ok) { emit({ type: "error", content: `服务异常 (${res.status})` }); controller.close(); return }

        const reader = res.body?.getReader()
        if (!reader) { emit({ type: "error", content: "流式读取失败" }); controller.close(); return }

        const decoder = new TextDecoder()
        let fullReply = "", dispReply = "", fullReasoning = "", buf = "", inExtract = false

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
              const delta = JSON.parse(js).choices?.[0]?.delta
              if (!delta) continue

              // R1 推理内容 — 独立流，可视化到思维空间
              if (delta.reasoning_content) {
                fullReasoning += delta.reasoning_content
                emit({ type: "reasoning_token", content: delta.reasoning_content })
              }

              const token = delta.content
              if (!token) continue
              fullReply += token
              if (token.includes("<extract")) inExtract = true
              if (inExtract) {
                if (token.includes("</extract>")) { inExtract = false; continue }
                continue
              }
              dispReply += token
              emit({ type: "token", content: token })
            } catch {}
          }
        }

        const cleanReply = fullReply.replace(/<extract[\s\S]*?<\/extract>/g, "").trim() || dispReply.trim()
        const space = parseExtract(fullReply)
        const donePayload: any = {
          type: "done",
          message: cleanReply,
          reasoning: fullReasoning || undefined,
          reasoningNodes: fullReasoning ? reasoningToNodes(fullReasoning) : undefined,
        }
        if (space.nodes.length > 0) {
          donePayload.mindSpaceUpdate = { nodes: space.nodes, edges: space.edges, frameType: space.frameType }
          donePayload.domain_type = space.domainType || "general"
        } else {
          const locals = localExtract(cleanReply, messages[messages.length - 1]?.content || "")
          donePayload.mindSpaceUpdate = { nodes: locals.nodes, edges: locals.edges, frameType: locals.frameType }
          donePayload.domain_type = locals.domainType || "general"
        }
        emit(donePayload)
      } catch {
        emit({ type: "error", content: "AI 服务暂时不可用" })
      } finally { controller.close() }
    },
  })
}

// ─── 解析 ─────────────────────────────────────

function cleanMarkdown(text: string): string {
  return text
    .replace(/^[\s]*[-*#]+\s*/gm, "")           // 去掉行首的 - * # 及后面的空格
    .replace(/\*\*([^*]+)\*\*/g, "$1")           // **粗体** → 粗体
    .replace(/__([^_]+)__/g, "$1")               // __粗体__ → 粗体
    .replace(/\*([^*]+)\*/g, "$1")               // *斜体* → 斜体（避免 ** 冲突，先处理双星）
    .replace(/_([^_]+)_/g, "$1")                 // _斜体_ → 斜体
    .replace(/`([^`]+)`/g, "$1")                 // `代码` → 代码
    .replace(/~~([^~]+)~~/g, "$1")               // ~~删除线~~ → 删除线
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")     // [链接](url) → 链接
    .replace(/^>\s*/gm, "")                       // > 引用标记
    .replace(/\n{3,}/g, "\n\n")                   // 压缩过多空行
    .trim()
}

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
        id: p[0].trim(), label: cleanMarkdown(p[1].trim()).slice(0, 6),
        depth: parseInt(p[2]) || 0, shape: p[3].trim() || "sphere",
        color: p[4].trim() || "#4C51BF", content: cleanMarkdown(p.slice(5).join("|").trim()).slice(0, 80),
        parentIds: [], anchors: [],
        metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 },
      })
    }
  }
  return { nodes, edges: [], frameType, domainType }
}

function localExtract(reply: string, userMsg: string): ExtractResult {
  const cleanReply = cleanMarkdown(reply)
  const cleanUser = cleanMarkdown(userMsg)
  const text = (cleanUser + " " + cleanReply).slice(0, 300)
  const sents = text.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length >= 4 && s.length <= 30).slice(0, 5)
  if (sents.length === 0) {
    return { frameType: "tree", nodes: [{ id: "fb1", label: reply.slice(0, 6), depth: 0, shape: "sphere", color: COLORS_16[0], content: reply.slice(0, 50), parentIds: [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }], edges: [] }
  }
  const nodes: any[] = sents.map((s, i) => ({ id: `fb${i + 1}`, label: s.slice(0, 6), depth: i === 0 ? 0 : 1, shape: SHAPES_4[i % 4], color: COLORS_16[i % 16], content: s, parentIds: i > 0 ? ["fb1"] : [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }))
  const edges = sents.length > 1 ? [{ id: "fbe1", source: "fb1", target: "fb2", edgeType: "abstract" as const, weight: 0.7 }] : []
  return { frameType: "tree", nodes, edges }
}

// ─── R1 推理过程 → 思维节点可视化 ─────────────────

function reasoningToNodes(reasoning: string): any[] {
  if (!reasoning || reasoning.length < 20) return []

  // 从推理内容中提取关键短语作为思维节点
  const lines = detectThinkingLines(reasoning)
  const palette = ["#6366F1","#EC4899","#F59E0B","#22C55E","#3B82F6","#8B5CF6"]
  const shapes = ["sphere","box","cylinder","torus"] as const

  // 按句号/换行/分号拆成句子
  const sentences = reasoning
    .split(/[。；\n]/)
    .map(s => s.trim())
    .filter(s => s.length >= 8 && s.length <= 60)
    .slice(0, 6)

  if (sentences.length === 0) {
    // 只取关键线路作为节点
    return lines.slice(0, 3).map((l, i) => ({
      id: `reason_${i}`,
      label: l.lineId.slice(0, 6),
      depth: 0,
      shape: "sphere" as const,
      color: palette[i % palette.length],
      content: `AI思考线路: ${l.lineId}`,
      parentIds: [],
      anchors: [],
    }))
  }

  return sentences.map((s, i) => ({
    id: `reason_${i}`,
    label: cleanMarkdown(s).slice(0, 6),
    depth: 0,
    shape: shapes[i % 4],
    color: lines[i] ? (lines[i].lineId === "causality" ? "#F59E0B" : lines[i].lineId === "deduction" ? "#4C51BF" : palette[i % palette.length]) : palette[i % palette.length],
    content: cleanMarkdown(s).slice(0, 80),
    parentIds: [],
    anchors: [],
  }))
}
