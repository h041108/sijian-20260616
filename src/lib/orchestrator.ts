// ─── 思见模型编排引擎 ────────────────────────────────
// 四大内核: 智能路由 · 多模型协同 · 持久记忆 · 持续进化
// 架构: App → Orchestrator → Model Registry → N*Provider

// ═══════════════════════════════════════════════════
// 模型注册表
// ═══════════════════════════════════════════════════

export interface ModelProfile {
  id: string
  name: string
  provider: string
  baseURL: string
  model: string
  strengths: TaskCategory[]
  costPer1kTokens: number
  avgLatency: number
  available: boolean
  // 7维评分（参考 OpenMontage 设计）
  scores?: {
    taskFit: number    // 任务匹配度 0-1
    quality: number    // 输出质量 0-1
    control: number    // 控制能力 0-1
    reliability: number // 可靠性 0-1
    costEfficiency: number // 成本效率 0-1
    latency: number    // 延迟 0-1
    continuity: number // 连续性 0-1
  }
}

export type TaskCategory =
  | "reasoning"      // 数学推导、逻辑链
  | "creative"       // 文案、故事、创意
  | "coding"         // 代码生成、调试
  | "analysis"       // 数据分析、报告
  | "compliance"     // 合规审查、安全
  | "conversation"   // 闲聊、情感支持
  | "knowledge"      // 知识问答、事实检索
  | "critique"       // 批判审阅、挑错
  | "planning"       // 任务规划、策略

export interface ModelRegistry {
  primary: ModelProfile
  secondary: ModelProfile[]  // fallback + pipeline models
}

// ── 从环境变量加载模型配置 ──
export function loadRegistry(): ModelRegistry {
  const models: ModelProfile[] = []

  // DeepSeek (always available — primary)
  const dsKey = process.env.DEEPSEEK_API_KEY || ""
  models.push({
    id: "deepseek", name: "DeepSeek-V4", provider: "DeepSeek",
    baseURL: process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1",
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    strengths: ["reasoning","coding","analysis","knowledge"],
    costPer1kTokens: 0.0003, avgLatency: 1200, available: !!dsKey,
    scores: { taskFit: 0.9, quality: 0.8, control: 0.7, reliability: 0.85, costEfficiency: 0.9, latency: 0.7, continuity: 0.5 },
  })

  // Claude (if key configured)
  const claudeKey = process.env.CLAUDE_API_KEY || ""
  if (claudeKey) {
    models.push({
      id: "claude", name: "Claude 4", provider: "Anthropic",
      baseURL: "https://api.anthropic.com/v1",
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      strengths: ["creative","conversation","critique","planning"],
      costPer1kTokens: 0.003, avgLatency: 2000, available: true,
      scores: { taskFit: 0.85, quality: 0.95, control: 0.8, reliability: 0.9, costEfficiency: 0.4, latency: 0.5, continuity: 0.6 },
    })
  } else {
    models.push({
      id: "claude", name: "Claude 4", provider: "Anthropic",
      baseURL: "", model: "", strengths: ["creative","conversation","critique","planning"],
      costPer1kTokens: 0, avgLatency: 0, available: false,
    })
  }

  // GPT (if key configured)
  const gptKey = process.env.OPENAI_API_KEY || ""
  if (gptKey) {
    models.push({
      id: "gpt", name: "GPT-4o", provider: "OpenAI",
      baseURL: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      strengths: ["knowledge","creative","compliance","conversation"],
      costPer1kTokens: 0.005, avgLatency: 1500, available: true,
      scores: { taskFit: 0.85, quality: 0.9, control: 0.85, reliability: 0.85, costEfficiency: 0.3, latency: 0.6, continuity: 0.6 },
    })
  } else {
    models.push({
      id: "gpt", name: "GPT-4o", provider: "OpenAI",
      baseURL: "", model: "", strengths: ["knowledge","creative","compliance","conversation"],
      costPer1kTokens: 0, avgLatency: 0, available: false,
    })
  }

  return {
    primary: models[0],
    secondary: models.slice(1),
  }
}

// ═══════════════════════════════════════════════════
// 智能路由引擎
// ═══════════════════════════════════════════════════

export interface RoutingDecision {
  model: ModelProfile
  reason: string
  confidence: number
  fallback: ModelProfile[]
}

// 任务关键词 → 类别映射
const TASK_CLASSIFIER: { patterns: RegExp[]; category: TaskCategory }[] = [
  { patterns: [/证明|推导|求解|计算|方程|公式|定理|推理|逻辑/], category: "reasoning" },
  { patterns: [/写.*文案|写.*文章|写.*故事|润色|改写|翻译|诗歌|创作|灵感/], category: "creative" },
  { patterns: [/代码|编程|debug|调试|bug|函数|算法|实现|API|接口/], category: "coding" },
  { patterns: [/分析|报告|数据|趋势|比较|评估|总结/], category: "analysis" },
  { patterns: [/合规|审查|审核|风险|法律|政策|安全/], category: "compliance" },
  { patterns: [/聊天|聊聊|心情|烦|累|压力|开心/], category: "conversation" },
  { patterns: [/是什么|为什么|怎么|教程|指南|介绍|定义|概念/], category: "knowledge" },
  { patterns: [/挑错|批判|质疑|反驳|漏洞|不对/], category: "critique" },
  { patterns: [/计划|规划|步骤|方案|策略|路线图/], category: "planning" },
]

export function classifyTask(message: string): { category: TaskCategory; confidence: number } {
  let best: TaskCategory = "knowledge"
  let bestScore = 0

  for (const rule of TASK_CLASSIFIER) {
    let score = 0
    for (const re of rule.patterns) {
      if (re.test(message)) score += 1
    }
    if (score > bestScore) { bestScore = score; best = rule.category }
  }

  return { category: best, confidence: Math.min(1, bestScore * 0.3) }
}

export function route(
  message: string,
  registry: ModelRegistry,
): RoutingDecision {
  const { category, confidence } = classifyTask(message)
  const allModels = [registry.primary, ...registry.secondary].filter(m => m.available)

  // 7维评分系统（参考 OpenMontage design）
  const WEIGHTS = { taskFit: 0.30, quality: 0.20, control: 0.15, reliability: 0.15, costEfficiency: 0.10, latency: 0.05, continuity: 0.05 }

  const scored = allModels.map(m => {
    // 自动计算各维度得分
    const taskFit = m.strengths.includes(category) ? 0.9 : 0.3
    const quality = m.scores?.quality ?? (m.provider === "DeepSeek" ? 0.8 : m.provider === "Anthropic" ? 0.9 : 0.7)
    const control = m.scores?.control ?? 0.7
    const reliability = m.scores?.reliability ?? 0.8
    const costEfficiency = m.scores?.costEfficiency ?? Math.min(1, 0.001 / (m.costPer1kTokens || 0.001))
    const latency = m.scores?.latency ?? Math.min(1, 1500 / (m.avgLatency || 1500))
    const continuity = m.scores?.continuity ?? 0.5

    const totalScore =
      taskFit * WEIGHTS.taskFit +
      quality * WEIGHTS.quality +
      control * WEIGHTS.control +
      reliability * WEIGHTS.reliability +
      costEfficiency * WEIGHTS.costEfficiency +
      latency * WEIGHTS.latency +
      continuity * WEIGHTS.continuity

    return { model: m, score: totalScore, details: { taskFit, quality, control, reliability, costEfficiency, latency, continuity } }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]

  return {
    model: best.model,
    reason: `任务分类:${category} | 7维评分:${best.score.toFixed(2)} | 模型:${best.model.name} | ${Object.entries(best.details).map(([k, v]) => `${k}:${(v as number).toFixed(2)}`).join("/")}`,
    confidence,
    fallback: scored.slice(1).map(s => s.model),
  }
}

// ═══════════════════════════════════════════════════
// 多模型调用引擎 (OpenAI-compatible)
// ═══════════════════════════════════════════════════

interface ChatMessage { role: "user" | "assistant" | "system"; content: string }

async function callModel(
  model: ModelProfile,
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number; stream?: boolean },
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (model.provider === "Anthropic") {
    // Anthropic native API
    headers["x-api-key"] = process.env.CLAUDE_API_KEY || ""
    headers["anthropic-version"] = "2023-06-01"

    const sysMsg = messages.find(m => m.role === "system")?.content
    const chatMsgs = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }))

    const res = await fetch(`${model.baseURL}/messages`, {
      method: "POST", headers,
      body: JSON.stringify({
        model: model.model || "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens || 2048,
        system: sysMsg,
        messages: chatMsgs,
      }),
    })
    if (!res.ok) throw new Error(`${model.name}: ${res.status}`)
    const data = await res.json()
    return data.content?.[0]?.text || ""
  }

  // OpenAI-compatible API (DeepSeek, GPT, local)
  headers["Authorization"] = `Bearer ${
    model.provider === "OpenAI" ? process.env.OPENAI_API_KEY :
    model.provider === "DeepSeek" ? process.env.DEEPSEEK_API_KEY : ""
  }`

  const res = await fetch(`${model.baseURL}/chat/completions`, {
    method: "POST", headers,
    body: JSON.stringify({
      model: model.model || "gpt-4o",
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature ?? 0.7,
      stream: options?.stream || false,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) throw new Error(`${model.name}: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

// ═══════════════════════════════════════════════════
// 多模型协作流水线
// ═══════════════════════════════════════════════════

export type PipelineStage = "generate" | "critique" | "polish" | "verify" | "summarize"

export interface PipelineStep {
  stage: PipelineStage
  modelId: string           // which model to use
  prompt: string            // system prompt for this stage
  inputTransform: (prevOutput: string, originalQuery: string) => string
}

export interface PipelineResult {
  stages: { stage: PipelineStage; model: string; output: string; latency: number }[]
  finalOutput: string
  totalLatency: number
  modelsUsed: string[]
}

export async function runPipeline(
  steps: PipelineStep[],
  userMessage: string,
  registry: ModelRegistry,
): Promise<PipelineResult> {
  const allModels = [registry.primary, ...registry.secondary]
  const stages: PipelineResult["stages"] = []
  let prevOutput = userMessage
  const modelsUsed: string[] = []
  const startTime = Date.now()

  for (const step of steps) {
    const model = allModels.find(m => m.id === step.modelId && m.available)
    if (!model) continue // skip unavailable models

    const prompt = step.inputTransform(prevOutput, userMessage)
    const t0 = Date.now()

    try {
      const output = await callModel(model, [
        { role: "system", content: step.prompt },
        { role: "user", content: prompt },
      ])
      const latency = Date.now() - t0
      stages.push({ stage: step.stage, model: model.name, output, latency })
      prevOutput = output
      if (!modelsUsed.includes(model.name)) modelsUsed.push(model.name)
    } catch {
      // fall through — this stage failed, continue with previous output
    }
  }

  return {
    stages,
    finalOutput: prevOutput,
    totalLatency: Date.now() - startTime,
    modelsUsed,
  }
}

// ═══════════════════════════════════════════════════
// 预置流水线模板
// ═══════════════════════════════════════════════════

export const PIPELINE_TEMPLATES: Record<string, PipelineStep[]> = {
  // 生成→批判→润色：适用于重要文案
  "create_critique_polish": [
    {
      stage: "generate", modelId: "claude",
      prompt: "你是资深文案。根据用户需求创作初稿。简洁有力。",
      inputTransform: (_, q) => q,
    },
    {
      stage: "critique", modelId: "deepseek",
      prompt: "你是挑剔的编辑。指出初稿的问题：逻辑漏洞、表述不清晰、可改进之处。给出具体建议。",
      inputTransform: (prev) => `请批判审阅以下文案：\n${prev}`,
    },
    {
      stage: "polish", modelId: "claude",
      prompt: "根据编辑意见修改文案，保留优点，改进不足。输出最终版本。",
      inputTransform: (prev, q) => `原始需求：${q}\n\n初稿+编辑意见：${prev}\n\n请输出润色后的最终文案。`,
    },
  ],

  // 生成→检验→总结：适用于复杂分析
  "analyze_verify_summarize": [
    {
      stage: "generate", modelId: "deepseek",
      prompt: "深入分析用户的问题，给出完整的分析框架和结论。",
      inputTransform: (_, q) => q,
    },
    {
      stage: "verify", modelId: "gpt",
      prompt: "检验以上分析的准确性：检查数据来源、逻辑一致性、是否有遗漏的关键因素。",
      inputTransform: (prev) => `请检验以下分析的准确性：\n${prev}`,
    },
    {
      stage: "summarize", modelId: "deepseek",
      prompt: "综合分析和检验意见，输出最终结论。标注置信度和不确定因素。",
      inputTransform: (prev) => `分析和检验结果：${prev}\n\n请综合输出最终结论。`,
    },
  ],

  // 单模型快速模式 → 直接用 primary
  "direct": [],
}

// ═══════════════════════════════════════════════════
// 决策引擎：根据任务选择流水线 vs 单模型
// ═══════════════════════════════════════════════════

export interface OrchestrationDecision {
  mode: "direct" | "pipeline"
  pipeline?: PipelineStep[]
  primaryModel: ModelProfile
  reason: string
}

export function decideOrchestration(
  message: string,
  registry: ModelRegistry,
): OrchestrationDecision {
  const { category } = classifyTask(message)
  const routing = route(message, registry)
  const availableCount = [registry.primary, ...registry.secondary].filter(m => m.available).length

  // 场景1: 只有一个模型 → direct
  if (availableCount < 2) {
    return { mode: "direct", primaryModel: routing.model, reason: "单模型模式" }
  }

  // 场景2: 创意/重要内容 → 生成+批判+润色流水线
  if (category === "creative" || category === "planning") {
    return {
      mode: "pipeline",
      pipeline: PIPELINE_TEMPLATES.create_critique_polish,
      primaryModel: routing.model,
      reason: "创意/规划类任务启用多模型协同",
    }
  }

  // 场景3: 分析/知识 → 分析+检验+总结流水线
  if (category === "analysis" || category === "knowledge" || category === "reasoning") {
    if (availableCount >= 3) {
      return {
        mode: "pipeline",
        pipeline: PIPELINE_TEMPLATES.analyze_verify_summarize,
        primaryModel: routing.model,
        reason: "分析类任务启用多模型交叉验证",
      }
    }
  }

  // 默认: 直接路由到最佳单模型
  return { mode: "direct", primaryModel: routing.model, reason: routing.reason }
}

// ═══════════════════════════════════════════════════
// 性能追踪 + 持续进化
// ═══════════════════════════════════════════════════

interface ModelMetrics {
  modelId: string
  totalCalls: number
  totalLatency: number
  successCount: number
  failCount: number
  avgTokensPerCall: number
  lastUpdated: string
}

const METRICS_KEY = "sijian_orchestrator_metrics"

export function loadMetrics(): Record<string, ModelMetrics> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(METRICS_KEY) || "{}") } catch { return {} }
}

export function recordMetrics(modelId: string, latency: number, success: boolean, tokens: number): void {
  if (typeof window === "undefined") return
  const m = loadMetrics()
  if (!m[modelId]) {
    m[modelId] = { modelId, totalCalls: 0, totalLatency: 0, successCount: 0, failCount: 0, avgTokensPerCall: 0, lastUpdated: "" }
  }
  const rec = m[modelId]
  rec.totalCalls++
  rec.totalLatency += latency
  rec.successCount += success ? 1 : 0
  rec.failCount += success ? 0 : 1
  rec.avgTokensPerCall = (rec.avgTokensPerCall * (rec.totalCalls - 1) + tokens) / rec.totalCalls
  rec.lastUpdated = new Date().toISOString()
  localStorage.setItem(METRICS_KEY, JSON.stringify(m))
}

export function getPerformanceSummary() {
  const metrics = loadMetrics()
  return Object.values(metrics).map(m => ({
    model: m.modelId,
    calls: m.totalCalls,
    successRate: m.totalCalls > 0 ? ((m.successCount / m.totalCalls) * 100).toFixed(1) + "%" : "N/A",
    avgLatency: m.totalCalls > 0 ? Math.round(m.totalLatency / m.totalCalls) + "ms" : "N/A",
    reliability: m.failCount === 0 ? "🟢" : m.failCount < 3 ? "🟡" : "🔴",
    lastUsed: m.lastUpdated ? new Date(m.lastUpdated).toLocaleString("zh") : "从未",
  }))
}
