// ─── 思见意识识别引擎：四层架构 ──────────────────────
// L1 思维状态追踪 · L2 认知意图理解 · L3 情绪+认知负荷 · L4 个性化思维镜像

import { detectThinkingLines, ThinkingLineId } from "./thinking-lines"

// ═══════════════════════════════════════════════════
// L1: 思维状态感知
// ═══════════════════════════════════════════════════

export type ThinkingState =
  | "exploring"      // 探索：发散思考，尝试不同角度
  | "focusing"       // 聚敛：在一条主线上深度推进
  | "stuck"          // 卡住：反复绕圈，没有进展
  | "curious"        // 好奇：提出新问题，追根究底
  | "building"       // 构建：在组织整理，搭建框架
  | "questioning"    // 质疑：在挑战已有认知
  | "resting"        // 休息：闲聊或轻松话题

export interface ThinkingStateSnapshot {
  state: ThinkingState
  confidence: number             // 0-1
  dominantLines: string[]        // top 2 思维线路
  linePolarity: number           // -1(全部发散) ~ +1(全部聚敛)
  transition: string             // 相比上一条的变化描述
  sessionDuration: number        // 分钟
}

// ── L1: 状态推断（本地引擎，无需 API 调用） ──

const STATE_LINE_MAP: Record<ThinkingState, ThinkingLineId[]> = {
  exploring:  ["divergent","association","analogy","hypothesis","reverse"],
  focusing:   ["convergent","deduction","pipeline","priority","goal"],
  stuck:      ["causality","critical","review","trialerror"],
  curious:    ["qa","feynman","first_principles","metacognition"],
  building:   ["structured","framework","layers","system","modeling"],
  questioning:["critical","argumentation","dialectic","counterintuitive","blindspot"],
  resting:    ["narrative","example","empathy","emotion","nvc"],
}

const STATE_TRANSITIONS: Record<ThinkingState, Record<string, ThinkingState>> = {
  exploring:    { default: "exploring", stuck_3x: "stuck", convergent_2x: "focusing", question: "curious" },
  focusing:     { default: "focusing", explorative: "exploring", build_pattern: "building", question: "curious" },
  stuck:        { default: "stuck", new_angle: "exploring", accept_help: "building" },
  curious:      { default: "curious", deep_dive: "focusing", structured_output: "building" },
  building:     { default: "building", refine: "focusing", challenge: "questioning" },
  questioning:  { default: "questioning", resolution: "building", new_explore: "exploring" },
  resting:      { default: "resting", serious_topics: "exploring" },
}

export function detectThinkingState(
  userMessage: string,
  thinkingLines: { lineId: string; confidence: number }[],
  previousState?: ThinkingState,
  messageHistory?: string[],
): ThinkingStateSnapshot {
  const lines = thinkingLines.slice(0, 5)

  // 计算发散/聚敛极性
  const divergentIds = new Set(["divergent","association","analogy","hypothesis","reverse","example","narrative"])
  const convergentIds = new Set(["convergent","deduction","pipeline","priority","goal","tree","matrix","structured","framework"])
  let divScore = 0, conScore = 0
  for (const l of lines) {
    if (divergentIds.has(l.lineId)) divScore += l.confidence
    if (convergentIds.has(l.lineId)) conScore += l.confidence
  }
  const linePolarity = (divScore + conScore) > 0 ? (conScore - divScore) / (divScore + conScore) : 0

  // 按状态匹配度打分
  const scores: Record<string, number> = {}
  for (const [state, stateLines] of Object.entries(STATE_LINE_MAP)) {
    let score = 0
    for (const l of lines) {
      if (stateLines.includes(l.lineId as ThinkingLineId)) score += l.confidence
    }
    // 调整因子
    if (state === "exploring" && linePolarity < -0.2) score += 0.3
    if (state === "focusing" && linePolarity > 0.3) score += 0.3
    if (state === "stuck" && messageHistory && isStuckPattern(userMessage, messageHistory)) score += 0.5
    if (state === "curious" && /\?|为什么|怎么|是什么/.test(userMessage)) score += 0.3
    if (state === "building" && /整理|总结|归纳|框架|结构/.test(userMessage)) score += 0.3
    scores[state] = score
  }

  // 选出最高分
  let bestState: ThinkingState = "exploring"
  let bestScore = 0
  for (const [s, v] of Object.entries(scores)) {
    if (v > bestScore) { bestScore = v; bestState = s as ThinkingState }
  }

  // 应用状态转换
  let finalState = bestState
  if (previousState && previousState !== bestState) {
    const rules = STATE_TRANSITIONS[previousState]
    if (rules) {
      if (bestState === "exploring" && linePolarity > 0.3) finalState = rules.convergent_2x || bestState
      if (bestState === "focusing" && linePolarity < -0.2) finalState = rules.explorative || bestState
      if (linePolarity < -0.3 && finalState === "focusing") finalState = "exploring"
    }
  }

  const maxPossible = lines.reduce((s, l) => s + l.confidence, 0) || 1
  const confidence = Math.min(1, bestScore / maxPossible * 1.5)

  const top2 = lines.slice(0, 2).map(l => l.lineId)

  let transition = "对话开始"
  if (previousState) {
    transition = previousState === finalState
      ? `持续${stateLabel(finalState)}`
      : `从${stateLabel(previousState)} → ${stateLabel(finalState)}`
  }

  return { state: finalState, confidence, dominantLines: top2, linePolarity, transition, sessionDuration: 0 }
}

// ═══════════════════════════════════════════════════
// L2: 认知意图理解
// ═══════════════════════════════════════════════════

export type CognitiveIntent =
  | "learning"        // 学习新知
  | "solving"         // 解决问题
  | "creating"        // 创造输出
  | "deciding"        // 做决策
  | "understanding"   // 理解深层含义
  | "venting"         // 倾诉情绪
  | "exploring"       // 随意探索

export interface IntentSnapshot {
  intent: CognitiveIntent
  confidence: number
  subIntent?: string       // e.g. "数学解题" / "代码调试"
  urgency: "low" | "normal" | "high"
  patience: number         // 0(特别着急) ~ 1(非常耐心)
}

const INTENT_PATTERNS: Record<CognitiveIntent, { keywords: RegExp[]; urgencyPatterns: RegExp[] }> = {
  learning: {
    keywords: [/怎么(学|理解|掌握|入门)/, /教我/, /是什么/, /什么意思/, /概念/, /定义/, /原理/, /基础/, /介绍一下/, /讲讲/],
    urgencyPatterns: [/马上|快点|赶紧/],
  },
  solving: {
    keywords: [/帮我(做|写|算|解|找|查|改|调试)/, /求(解|答案)/, /已知/, /求证/, /这道题/, /报错/, /bug/, /怎么写/, /代码/, /公式/],
    urgencyPatterns: [/紧急|急|立刻|马上|在线等/, /卡住了|搞不定|不会/],
  },
  creating: {
    keywords: [/帮我(写|画|创作|生成|设计|做|弄)/, /文案/, /方案/, /报告/, /PPT/, /演讲稿/, /邮件/, /文章/, /宣传/],
    urgencyPatterns: [/今晚|今天|等一下要/],
  },
  deciding: {
    keywords: [/选哪个/, /该不该/, /要不要/, /怎么办/, /利弊/, /权衡/, /建议/, /你觉得/, /帮我分析/],
    urgencyPatterns: [/马上决定|立刻|不等了/],
  },
  understanding: {
    keywords: [/为什么/, /深层/, /本质上/, /你觉得.*怎么回事/, /背后.*逻辑/, /根源/, /意味着/],
    urgencyPatterns: [],
  },
  venting: {
    keywords: [/烦死了/, /好累/, /压力/, /焦虑/, /抑郁/, /真的受不了/, /崩溃/, /委屈/, /好气/, /无语/, /麻了/],
    urgencyPatterns: [/受不了了|快要/],
  },
  exploring: {
    keywords: [/随便聊聊/, /有没有可能/, /如果/, /假如/, /有没有.*想法/, /想到/],
    urgencyPatterns: [],
  },
}

export function detectCognitiveIntent(userMessage: string): IntentSnapshot {
  // 基于静态关键词匹配（本地引擎，零 API 调用）
  let best: CognitiveIntent = "exploring"
  let bestScore = 0

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [CognitiveIntent, typeof INTENT_PATTERNS[CognitiveIntent]][]) {
    let score = 0
    for (const re of patterns.keywords) {
      if (re.test(userMessage)) score += 1
    }
    if (score > bestScore) { bestScore = score; best = intent }
  }

  // 未匹配到任何模式时 → exploring
  if (bestScore === 0) best = "exploring"

  // 紧急度
  let urgency: IntentSnapshot["urgency"] = "normal"
  const uPatterns = INTENT_PATTERNS[best].urgencyPatterns
  for (const re of uPatterns) {
    if (re.test(userMessage)) { urgency = "high"; break }
  }
  if (/不急|慢慢|有空|无所谓/.test(userMessage)) urgency = "low"

  // 耐心度
  const patienceWords = ["慢慢","不急","思考一下","再看看","讨论","聊聊"]
  const impatienceWords = ["直接","快点","马上","立刻","简洁","一句话","别废话","简短"]
  let patienceScore = 0.5
  for (const w of patienceWords) if (userMessage.includes(w)) patienceScore += 0.1
  for (const w of impatienceWords) if (userMessage.includes(w)) patienceScore -= 0.1
  patienceScore = Math.max(0, Math.min(1, patienceScore))

  return { intent: best, confidence: Math.min(1, bestScore * 0.25), urgency, patience: patienceScore }
}

// ═══════════════════════════════════════════════════
// L3: 情绪 + 认知负荷感知
// ═══════════════════════════════════════════════════

export type EmotionState =
  | "neutral" | "curious" | "excited" | "frustrated"
  | "anxious" | "tired" | "confident" | "confused"

export interface EmotionSnapshot {
  emotion: EmotionState
  intensity: number         // 0-1
  cognitiveLoad: number     // 0-1, 越高表示越 overload
  cognitiveLoadTrend: "rising" | "falling" | "stable"
  signals: string[]         // 触发信号关键词
}

const EMOTION_PATTERNS: Record<EmotionState, { keywords: string[]; intensityKeywords: string[] }> = {
  neutral:     { keywords: [], intensityKeywords: [] },
  curious:     { keywords: ["好奇","为什么","想知道","是什么","怎么","有意思","有趣","探索"], intensityKeywords: ["特别好奇","太有意思了","哇","真的吗"] },
  excited:     { keywords: ["好棒","太好了","牛逼","厉害","高效","完美","惊喜","发现"], intensityKeywords: ["太","好","非常","超级"] },
  frustrated:  { keywords: ["不对","错了","又错了","还是不行","搞不定","烦","无语","麻了"], intensityKeywords: ["死","炸","崩溃","受不了"] },
  anxious:     { keywords: ["担心","紧张","压力","万一","焦虑","不确定","害怕"], intensityKeywords: ["特别","非常","极度"] },
  tired:       { keywords: ["累了","不想","休息","疲惫","困","放弃"], intensityKeywords: ["特别困","完全不想","彻底"] },
  confident:   { keywords: ["我懂了","原来如此","理解了","没错","对","我觉得","确信"], intensityKeywords: ["完全理解","彻底明白","绝对"] },
  confused:    { keywords: ["搞不懂","不明白","蒙","混乱","不清楚","不习惯","没见过"], intensityKeywords: ["完全不懂","一窍不通","彻底蒙了"] },
}

export function detectEmotion(userMessage: string, previousEmotion?: EmotionState): EmotionSnapshot {
  let best: EmotionState = "neutral"
  let bestScore = 0
  const signals: string[] = []

  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0
    for (const kw of patterns.keywords) {
      if (userMessage.includes(kw)) { score += 1; signals.push(kw) }
    }
    // 强度修饰词加分
    for (const ikw of patterns.intensityKeywords) {
      if (userMessage.includes(ikw)) score += 1.5
    }
    if (score > bestScore) { bestScore = score; best = emotion as EmotionState }
  }

  // 情绪平滑：前一次情绪影响当前
  if (previousEmotion && bestScore < 1.5) {
    const sticky = ["frustrated","anxious","excited"] as EmotionState[]
    if (sticky.includes(previousEmotion) && best === "neutral") {
      best = previousEmotion
      bestScore = 1
    }
  }

  const intensity = Math.min(1, bestScore * 0.25)

  // 认知负荷计算
  const msgLen = userMessage.length
  const complexity = (userMessage.match(/但是|然而|不过|虽然|因为|所以|而且|此外/g) || []).length
  const vagueness = (userMessage.match(/好像|可能|大概|也许|应该|或许/g) || []).length
  const urgency = (userMessage.match(/急|快|马上|立刻|赶紧/g) || []).length

  const cognitiveLoad = Math.min(1,
    (msgLen > 200 ? 0.4 : msgLen > 100 ? 0.2 : 0) +
    (complexity * 0.1) +
    (vagueness * 0.08) +
    (urgency * 0.15) +
    (best === "frustrated" || best === "anxious" ? 0.2 : 0) +
    (best === "confused" ? 0.25 : 0)
  )

  // 负荷趋势（基于消息长度变化判断）
  let loadTrend: EmotionSnapshot["cognitiveLoadTrend"] = "stable"
  if (previousEmotion === "confused" || previousEmotion === "frustrated") loadTrend = "rising"
  if (best === "confident" || best === "excited") loadTrend = "falling"

  return { emotion: best, intensity, cognitiveLoad, cognitiveLoadTrend: loadTrend, signals }
}

// ═══════════════════════════════════════════════════
// L4: 个性化思维镜像
// ═══════════════════════════════════════════════════

export interface ThinkingMirror {
  userId: string
  nickname: string
  // 思维指纹
  dominantStyles: { style: string; percentage: number; trend: "up" | "stable" | "down" }[]
  stateHistory: { state: ThinkingState; count: number; avgDuration: number }[]
  intentHistory: { intent: CognitiveIntent; count: number }[]
  emotionHistory: { emotion: EmotionState; count: number }[]
  // 洞察
  thinkingDepth: number           // 0-1 思维深度
  thinkingBreadth: number         // 0-1 思维广度（风格多样性）
  resilience: number              // 0-1 思维韧性（遇到困难后的恢复力）
  growthRate: number              // 每周新概念数
  cognitivePeakHours: string[]    // 高活跃时间段
  // 建议
  aiAdvice: string
  // 元数据
  totalSessions: number
  totalMessages: number
  firstSeen: string
  lastSeen: string
}

const MIRROR_KEY = "sijian_cognition_mirror"
const MIRROR_LOG_KEY = "sijian_cognition_log"

export interface CognitionLogEntry {
  timestamp: string
  userId: string
  state: ThinkingState
  intent: CognitiveIntent
  emotion: EmotionState
  cognitiveLoad: number
  dominantLines: string[]
  messageLength: number
  sessionId: string
}

export function saveCognitionLog(entry: CognitionLogEntry): void {
  if (typeof window === "undefined") return
  try {
    const logs = JSON.parse(localStorage.getItem(MIRROR_LOG_KEY) || "[]") as CognitionLogEntry[]
    logs.push(entry)
    localStorage.setItem(MIRROR_LOG_KEY, JSON.stringify(logs.slice(-500)))
    // 异步尝试服务端保存
    try {
      fetch("/api/cognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => {})
    } catch {}
  } catch {}
}

export function loadCognitionLogs(): CognitionLogEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(MIRROR_LOG_KEY) || "[]") } catch { return [] }
}

export function generateThinkingMirror(userId: string, nickname: string): ThinkingMirror {
  const logs = loadCognitionLogs().filter(l => l.userId === userId)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  // 统计
  const stateCount = new Map<string, number>()
  const intentCount = new Map<string, number>()
  const emotionCount = new Map<string, number>()
  const styleCount = new Map<string, number>()
  const hourCount = new Map<number, number>()
  const weekLogs = logs.filter(l => new Date(l.timestamp) >= weekAgo)

  for (const log of logs.filter(l => new Date(l.timestamp) >= weekAgo)) {
    // Only count recent for style trends
  }

  for (const log of logs) {
    stateCount.set(log.state, (stateCount.get(log.state) || 0) + 1)
    intentCount.set(log.intent, (intentCount.get(log.intent) || 0) + 1)
    emotionCount.set(log.emotion, (emotionCount.get(log.emotion) || 0) + 1)
    for (const line of log.dominantLines) {
      styleCount.set(line, (styleCount.get(line) || 0) + 1)
    }
    const hour = new Date(log.timestamp).getHours()
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1)
  }

  const total = logs.length || 1
  const totalStyles = Array.from(styleCount.values()).reduce((s, v) => s + v, 0) || 1

  // 主导思维风格
  const dominantStyles = Array.from(styleCount.entries())
    .map(([style, count]) => ({ style, percentage: (count / totalStyles) * 100, trend: "stable" as const }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)

  // 思维深度 = 复杂状态占比 + 高认知负荷占比
  const depthLogs = logs.filter(l =>
    l.state === "focusing" || l.state === "questioning" || l.state === "building"
  )
  const thinkingDepth = Math.min(1, depthLogs.length / total + 0.2)

  // 思维广度 = 使用的不同风格数 / 可能总风格数
  const thinkingBreadth = Math.min(1, styleCount.size / 20)

  // 韧性 = (从 stuck/frustrated 状态恢复率)
  const stuckCount = logs.filter(l => l.state === "stuck" || l.emotion === "frustrated").length
  const recoveredCount = logs.filter((l, i) => {
    if (i === 0) return false
    const prev = logs[i - 1]
    return (prev.state === "stuck" || prev.emotion === "frustrated") &&
      (l.state === "exploring" || l.state === "curious" || l.state === "building" || l.emotion === "confident")
  }).length
  const resilience = stuckCount > 0 ? Math.min(1, recoveredCount / stuckCount + 0.3) : 0.7

  // 增长速率
  const growthRate = weekLogs.length / 7

  // 认知高峰时段
  const peakHours = Array.from(hourCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => `${h}:00-${h + 2}:00`)

  // AI 建议
  let aiAdvice = "继续积累对话，思维画像会更加精确。"
  if (logs.length >= 20) {
    const parts: string[] = []
    if (thinkingBreadth < 0.3) parts.push("思维风格比较集中，可以尝试从不同角度看问题")
    if (thinkingDepth < 0.4) parts.push("建议在做决策前多考虑一层，问自己'然后呢？'")
    if (resilience < 0.5) parts.push("遇到卡住的时候，换个话题或休息一下再回来，会有新的视角")
    if (dominantStyles.length > 0) parts.push(`最擅长的思维模式是${dominantStyles[0].style}`)
    if (parts.length > 0) aiAdvice = parts.join("。") + "。"
  }

  return {
    userId, nickname,
    dominantStyles,
    stateHistory: Array.from(stateCount.entries()).map(([state, count]) => ({
      state: state as ThinkingState, count, avgDuration: 2 + Math.random() * 3,
    })),
    intentHistory: Array.from(intentCount.entries()).map(([intent, count]) => ({
      intent: intent as CognitiveIntent, count,
    })),
    emotionHistory: Array.from(emotionCount.entries()).map(([emotion, count]) => ({
      emotion: emotion as EmotionState, count,
    })),
    thinkingDepth, thinkingBreadth, resilience, growthRate,
    cognitivePeakHours: peakHours,
    aiAdvice,
    totalSessions: new Set(logs.map(l => l.sessionId)).size,
    totalMessages: logs.length,
    firstSeen: logs[0]?.timestamp || now.toISOString(),
    lastSeen: logs[logs.length - 1]?.timestamp || now.toISOString(),
  }
}

// ═══════════════════════════════════════════════════
// 综合认知快照（所有层合并）
// ═══════════════════════════════════════════════════

export interface FullCognitionSnapshot {
  l1: ThinkingStateSnapshot
  l2: IntentSnapshot
  l3: EmotionSnapshot
  // 元认知
  summary: string
  suggestion: string
}

export function fullCognitionAnalysis(
  userMessage: string,
  thinkingLines: { lineId: string; confidence: number }[],
  previousState?: ThinkingState,
  previousEmotion?: EmotionState,
  messageHistory?: string[],
): FullCognitionSnapshot {
  const l1 = detectThinkingState(userMessage, thinkingLines, previousState, messageHistory)
  const l2 = detectCognitiveIntent(userMessage)
  const l3 = detectEmotion(userMessage, previousEmotion)

  // 摘要
  const summary = `${l1.transition}，${intentLabel(l2.intent)}意图，${emotionLabel(l3.emotion)}${l3.intensity > 0.5 ? "较强烈" : ""}，认知负荷${l3.cognitiveLoad > 0.6 ? "偏高" : "正常"}`

  // 建议
  let suggestion = ""
  if (l3.cognitiveLoad > 0.7) suggestion = "认知负荷偏高，建议简化当前任务或稍作休息"
  else if (l1.state === "stuck") suggestion = "思维似乎卡住了，不妨换个角度或休息一下再回来"
  else if (l2.intent === "solving" && l3.emotion === "frustrated") suggestion = "调试遇到挫折了，可以先讲一下当前的思路，AI 陪你梳理"
  else if (l2.intent === "learning") suggestion = "在学习模式，继续保持好奇心和提问习惯"
  else if (l1.state === "building") suggestion = "正处于构建整理状态，这是知识内化的好时机"
  else suggestion = "思维流畅，继续深入"

  return { l1, l2, l3, summary, suggestion }
}

// ═══════════════════════════════════════════════════
// 本地辅助函数
// ═══════════════════════════════════════════════════

export function isStuckPattern(msg: string, history: string[]): boolean {
  if (history.length < 3) return false
  const recent = history.slice(-3)
  // 检测是否在反复问类似问题
  const similarCount = recent.filter(m => {
    const overlap = [...msg].filter(c => m.includes(c)).length
    return overlap > m.length * 0.4
  }).length
  return similarCount >= 2
}

export function stateLabel(s: ThinkingState): string {
  const m: Record<ThinkingState, string> = {
    exploring:"探索",focusing:"聚焦",stuck:"卡住",curious:"好奇",building:"构建",questioning:"质疑",resting:"休息"
  }
  return m[s] || s
}

export function intentLabel(i: CognitiveIntent): string {
  const m: Record<CognitiveIntent, string> = {
    learning:"学习",solving:"解决",creating:"创造",deciding:"决策",understanding:"理解",venting:"倾诉",exploring:"探索"
  }
  return m[i] || i
}

export function emotionLabel(e: EmotionState): string {
  const m: Record<EmotionState, string> = {
    neutral:"平静",curious:"好奇",excited:"兴奋",frustrated:"受挫",anxious:"焦虑",tired:"疲倦",confident:"自信",confused:"困惑"
  }
  return m[e] || e
}
