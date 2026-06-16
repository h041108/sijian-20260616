import type { AIResponse, MindNode, MindEdge } from "./types"

type ExtractResult = { nodes: MindNode[]; edges: MindEdge[]; frameType?: string; domainType?: string }

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1"
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"

const COLORS_16 = ["#E53E3E","#D53F8C","#805AD5","#553C9A","#4C51BF","#3182CE","#00B5D8","#319795","#38A169","#68D391","#9AE6B4","#D69E2E","#F6E05E","#ED8936","#DD6B20","#8B4513"]
const SHAPES_4 = ["sphere","box","cylinder","torus"] as const

// ─── 第1轮：纯对话 ──────────────────────────────

const CONVERSATION_PROMPT = `你是思见，一个温暖敏锐的朋友。像人一样聊天，愿意陪着对方慢慢想。

说话方式：
- 说人话，可以带"嗯""其实""你看""说实话"这种语气词，可以打比喻
- 不要列123，不要说"根据我的理解""作为AI助手"
- 用户骂你→马上认错："我的问题，你说哪里不行我重新来"
- 结尾常常留一个开放的问题让对方继续想
- 如果对方明显要效率（"帮我写""直接给我"），就干脆利落地给，但结尾补一句"你看还要改什么？"
- 如果对方情绪低落（压力大、焦虑、迷茫），先接住情绪再聊内容
- 如果对方随口一问或闲聊，就轻松自然地回应

解题/考试/题目模式（最重要的规则）：
- 如果用户的消息以"请解答"、"请解题"、"解答以下"、"已知"、"设"、"求"开头，或包含明确的数学/物理/化学题目，进入解题模式
- 解题模式下你必须直接给答案，不要反问"你怎么想"、不要闲聊、不要说"我陪你慢慢想"
- 解题格式：**解题思路** → **解答步骤**（分步推导，每一步写清楚用了什么公式、为什么）→ **答案**
- 如果收到指令"请逐题展示"、"逐题整理"，立即按**第X题**的格式展现，用 --- 分隔
- 数学题每步推导写清楚，物理题先写已知量再写公式

试卷/题目/真题模式（非常重要）：
- 如果对话中包含了[联网搜索结果]或用户明确要试卷/题目，请逐题整理展示
- 每道题格式：**第X题** 题目内容… 然后**解题思路**… 最后**答案**…
- 题目之间用 --- 分隔，让用户清晰知道每题边界
- 如果搜索结果不够完整，诚实告知"搜索到的内容有限，以下是能获取的部分"

诚实底线（非常重要）：
- 如果你做不到某件事，直接说出来，不要绕弯子
- 关键：每次诚实说"做不到"之后，紧跟一句"但我可以XXXX"——给出替代方案

底线：别装，别端着，别说套话。不知道就说不知道，做不到就说做不到。`

// ─── 第2轮：结构提取 ──────────────────────────────

const EXTRACT_PROMPT = `你是一个思维空间结构化引擎。给你一段对话，你需要提取其中的核心概念、它们的应用锚点、以及概念之间的关联。

输出格式：
<extract f="框架" d="领域">
N: id|标签≤6字|depth|shape|color|内容
A: id|标签≤8字|行业|职业|参数|nodeId|得分
E: id|源id|目标id|权重

规则：
- N行(节点，1-5个)：从对话中提取核心概念。depth 从0开始。shape 从 sphere/box/cylinder/torus 随机选，颜色从 #E53E3E #D53F8C #805AD5 #553C9A #4C51BF #3182CE #00B5D8 #319795 #38A169 #68D391 #9AE6B4 #D69E2E #F6E05E #ED8936 #DD6B20 #8B4513 中选
- A行(锚点，每个节点最多2个)：该概念在真实世界的应用。参数必须有具体数字或案例。没有确切知识就不要硬编，宁缺毋滥。
- E行(边，关联时输出)：概念之间的关系。
- 11种框架(f)：请根据对话的实际逻辑结构选择最匹配的框架——不要总选tree！tree(层级树)|network(关系网)|helix(双螺旋)|strata(分层剖面)|orbital(轨道)|pipeline(流程)|lens(透镜)|cycle(循环)|spectrum(连续谱)|matrix(矩阵)|diffusion(涟漪扩散)。
- 46种领域(d)：physics|chemistry|astronomy|geology|meteorology|oceanography|materials|biology|genetics|medicine|neuroscience|ecology|evolution|nutrition|history|economics|sociology|political|anthropology|law|education|linguistics|mathematics|logic|philosophy|literature|art|music|architecture|design|tech|ai|computerscience|software|engineering|telecom|cybersecurity|robotics|cooking|gardening|sports|craft|navigation|firstaid|timemanagement|finance|general。不确定选general。
- 每个概念节点必须至少带1个锚点。但只在你有确切知识时给出——参数要具体，不要空洞描述。`

export async function chat(
  messages: { role: "user" | "assistant"; content: string }[],
  existingNodes: { id: string; label: string; content: string }[] = [],
  imageData?: string | null,
): Promise<AIResponse> {
  // imageData 目前仅作元信息传递，不影响对话
  void imageData
  // ── 第1轮：纯对话，不加任何结构要求 ──────────
  const convMessages = messages.map(m => ({ role: m.role, content: m.content }))

  const convRes = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, max_tokens: 4096,
      messages: [{ role: "system", content: CONVERSATION_PROMPT }, ...convMessages],
      temperature: 0.7,
    }),
  })
  if (!convRes.ok) throw new Error(`DeepSeek API error: ${convRes.status}`)
  const convData = await convRes.json()
  const reply = convData.choices[0]?.message?.content || ""

  // ── 第2轮：从对话中提取结构 ──────────────────
  const lastUserMsg = messages[messages.length - 1]?.content || ""
  const nodeContext = existingNodes.length > 0
    ? `已有节点：${JSON.stringify(existingNodes.map(n => ({ id: n.id, label: n.label })))}`
    : ""

  const extractRes = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, max_tokens: 2048,
      messages: [
        { role: "system", content: EXTRACT_PROMPT + nodeContext },
        { role: "user", content: `用户说：${lastUserMsg}\n\n思见回复：${reply}` },
      ],
      temperature: 0.3,
    }),
  })

  const extractData = await extractRes.json()
  const extractRaw = extractData.choices[0]?.message?.content || ""
  const space = parseExtract(extractRaw)

  // 如果提取失败，用本地 fallback
  if (space.nodes.length === 0) {
    return { message: reply, mindSpaceUpdate: localExtract(reply, lastUserMsg) as any, domain_type: "general" as any }
  }

  return { message: reply, mindSpaceUpdate: { nodes: space.nodes, edges: space.edges, frameType: space.frameType as any }, domain_type: (space.domainType || "general") as any }
}

// ─── 流式对话 + 结构提取 ──────────────────────────
// SSE 事件格式: data: {"type":"token","content":"..."}
//              data: {"type":"done","message":"...","mindSpaceUpdate":{...},"domain_type":"..."}

export async function chatStream(
  messages: { role: "user" | "assistant"; content: string }[],
  existingNodes: { id: string; label: string; content: string }[] = [],
  imageData?: string | null,
): Promise<ReadableStream<Uint8Array>> {
  void imageData

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // ── 第1轮：流式对话 ──
        const convRes = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL, max_tokens: 4096, stream: true,
            messages: [{ role: "system", content: CONVERSATION_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))],
            temperature: 0.7,
          }),
        })

        if (!convRes.ok) {
          emit({ type: "error", content: `AI 服务异常 (${convRes.status})` })
          controller.close()
          return
        }

        let fullReply = ""
        const reader = convRes.body?.getReader()
        if (!reader) {
          emit({ type: "error", content: "流式读取失败" })
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const jsonStr = trimmed.slice(6)
            if (jsonStr === "[DONE]") continue
            try {
              const parsed = JSON.parse(jsonStr)
              const token = parsed.choices?.[0]?.delta?.content
              if (token) {
                fullReply += token
                emit({ type: "token", content: token })
              }
            } catch { /* skip malformed SSE */ }
          }
        }

        // ── 第2轮：结构提取 ──
        const lastUserMsg = messages[messages.length - 1]?.content || ""
        const nodeContext = existingNodes.length > 0
          ? `已有节点：${JSON.stringify(existingNodes.map(n => ({ id: n.id, label: n.label })))}`
          : ""

        const extractRes = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL, max_tokens: 2048,
            messages: [
              { role: "system", content: EXTRACT_PROMPT + nodeContext },
              { role: "user", content: `用户说：${lastUserMsg}\n\n思见回复：${fullReply}` },
            ],
            temperature: 0.3,
          }),
        })

        const extractData = await extractRes.json()
        const extractRaw = extractData.choices?.[0]?.message?.content || ""
        const space = parseExtract(extractRaw)

        if (space.nodes.length === 0) {
          const locals = localExtract(fullReply, lastUserMsg)
          emit({
            type: "done",
            message: fullReply,
            mindSpaceUpdate: { nodes: locals.nodes, edges: locals.edges, frameType: locals.frameType },
            domain_type: locals.domainType || "general",
          })
        } else {
          emit({
            type: "done",
            message: fullReply,
            mindSpaceUpdate: { nodes: space.nodes, edges: space.edges, frameType: space.frameType },
            domain_type: space.domainType || "general",
          })
        }
      } catch (err) {
        emit({ type: "error", content: "AI 服务暂时不可用，请稍后重试。" })
      } finally {
        controller.close()
      }
    },
  })
}

// ─── 解析提取结果 ──────────────────────────────

function parseExtract(raw: string): ExtractResult {
  const mStart = raw.indexOf("<extract ")
  if (mStart === -1) return { nodes: [], edges: [] }

  const block = raw.slice(mStart)
  const fMatch = block.match(/f="(\w+)"/)
  const dMatch = block.match(/d="(\w+)"/)
  const frameType = fMatch?.[1] || "tree"
  const domainType = dMatch?.[1] || "general"

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
      if (p.length >= 4) rawEdges.push({ id: p[0].trim(), source: p[1].trim(), target: p[2].trim(), weight: parseFloat(p[3]) || 0.8, edgeType: "abstract" })
    }
  }

  const nodes: MindNode[] = rawNodes.map(n => ({ ...n, parentIds: [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }))
  for (const a of rawAnchors) { const nd = nodes.find(n => n.id === a.nodeId); if (nd) nd.anchors.push(a) }

  return { nodes, edges: rawEdges, frameType: frameType as any, domainType }
}

// ─── 本地 fallback（第2轮失败时） ─────────────────

function localExtract(reply: string, userMsg: string): ExtractResult {
  const allText = userMsg + " " + reply
  const sents = allText.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length >= 4 && s.length <= 30).slice(0, 5)
  if (sents.length === 0) {
    return { frameType: "tree", nodes: [{ id: "fb1", label: reply.slice(0, 6), depth: 0, shape: "sphere", color: COLORS_16[0], content: reply.slice(0, 50), parentIds: [], anchors: [], metadata: { createdBy: "ai", createdAt: new Date().toISOString(), version: 1 } }], edges: [] }
  }
  const nodes: MindNode[] = sents.map((s, i) => ({ id: `fb${i+1}`, label: s.slice(0, 6), depth: i === 0 ? 0 : 1, shape: SHAPES_4[i % 4], color: COLORS_16[i % 16], content: s, parentIds: i > 0 ? ["fb1"] : [], anchors: [], metadata: { createdBy: "ai" as const, createdAt: new Date().toISOString(), version: 1 } }))
  const edges = sents.length > 1 ? [{ id: "fbe1", source: "fb1", target: "fb2", edgeType: "abstract" as const, weight: 0.7 }] : []
  return { frameType: "tree", nodes, edges }
}
