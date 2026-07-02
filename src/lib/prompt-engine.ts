// ─── 即影提示词引擎 ──────────────────────────────
// 根据用户内容样本 + 爆款拆解 + 赛道信息，组装成完整 prompt 喂给 LLM

export interface PromptEngineInput {
  niche: string
  platform: string
  userContentSamples: string[]         // 用户自己的内容（标题+摘要）
  viralTemplate?: ViralTemplate        // 拆解的爆款结构（可选）
  userInstruction?: string              // 用户额外指令（可选）
}

export interface ViralTemplate {
  hookStyle: string
  scriptStructure: string
  pacing: string
  emotionalCurve: string
  conversionTactic: string
  visualStyle: string
  keywords: string[]
  sourceTitle?: string                 // 来源爆款的标题
  sourceLikes?: number                 // 来源爆款的点赞数
}

export interface PromptBuildResult {
  systemPrompt: string
  userPrompt: string
  summary: {
    hasViral: boolean
    hasSamples: boolean
    sampleCount: number
    viralSource: string
  }
}

// ═══════════════════════════════════════════════════
// 主函数：组装提示词
// ═══════════════════════════════════════════════════

export function buildPrompt(input: PromptEngineInput): PromptBuildResult {
  const { niche, platform, userContentSamples, viralTemplate, userInstruction } = input

  // ── System Prompt（角色设定）──
  let systemPrompt = `你是一位专业的${platform}平台内容创作者，专注${niche}领域。`

  if (userContentSamples.length > 0) {
    systemPrompt += `\n\n你擅长创作以下风格的内容（这是你账号已有的内容，新内容必须保持这种风格和专业深度）：`
    userContentSamples.forEach((sample, i) => {
      systemPrompt += `\n${i + 1}. ${sample.slice(0, 300)}`
    })
  }

  // ── User Prompt（具体任务）──
  let userPrompt = `请为我的${platform}账号创作一篇${niche}领域的爆款文案。`

  // 如果有爆款模板，注入结构
  if (viralTemplate) {
    userPrompt += `\n\n请参考以下爆款内容的结构来创作，但内容要原创，不要抄袭：`
    userPrompt += `\n【爆款来源】${viralTemplate.sourceTitle || "同类热门内容"}`
    if (viralTemplate.sourceLikes) {
      userPrompt += `（点赞 ${viralTemplate.sourceLikes}）`
    }
    userPrompt += `\n【钩子策略】${viralTemplate.hookStyle}`
    userPrompt += `\n【脚本结构】${viralTemplate.scriptStructure}`
    userPrompt += `\n【节奏控制】${viralTemplate.pacing}`
    userPrompt += `\n【情绪曲线】${viralTemplate.emotionalCurve}`
    userPrompt += `\n【转化话术】${viralTemplate.conversionTactic}`
    if (viralTemplate.keywords.length > 0) {
      userPrompt += `\n【热门关键词】${viralTemplate.keywords.join("、")}`
    }
  }

  // 如果有用户内容样本，提醒 AI 模仿风格
  if (userContentSamples.length > 0) {
    userPrompt += `\n\n重要要求：新内容必须保持你账号原有的风格和专业深度，不要写泛泛的通用内容。参考你已有的内容风格来创作。`
  }

  // 用户额外指令
  if (userInstruction) {
    userPrompt += `\n\n额外要求：${userInstruction}`
  }

  userPrompt += `\n\n要求：标题要吸引人，正文300-500字，适合${platform}平台阅读习惯，带话题标签。`

  return {
    systemPrompt,
    userPrompt,
    summary: {
      hasViral: !!viralTemplate,
      hasSamples: userContentSamples.length > 0,
      sampleCount: userContentSamples.length,
      viralSource: viralTemplate?.sourceTitle || "无",
    },
  }
}

// ═══════════════════════════════════════════════════
// 爆款排序：按热度从高到低
// ═══════════════════════════════════════════════════

export interface ViralCandidate {
  title: string
  description: string
  url: string
  estimatedLikes: number
  estimatedShares: number
  source: string
}

export const LIKE_THRESHOLDS = [
  { label: "🔥 爆款", minLikes: 10000, minShares: 1000 },
  { label: "💥 热门", minLikes: 5000, minShares: 500 },
  { label: "👍 受欢迎", minLikes: 1000, minShares: 100 },
  { label: "📈 有潜力", minLikes: 0, minShares: 0 },
]

export function getThresholdLabel(likes: number, shares: number): string {
  for (const t of LIKE_THRESHOLDS) {
    if (likes >= t.minLikes && shares >= t.minShares) return t.label
  }
  return LIKE_THRESHOLDS[LIKE_THRESHOLDS.length - 1].label
}

export function rankCandidates(candidates: ViralCandidate[]): ViralCandidate[] {
  return candidates.sort((a, b) => {
    // 按点赞数降序排列
    if (b.estimatedLikes !== a.estimatedLikes) return b.estimatedLikes - a.estimatedLikes
    // 同赞按转发数降序
    return b.estimatedShares - a.estimatedShares
  })
}

// ═══════════════════════════════════════════════════
// 根据视频标题和描述生成拆解模板
// ═══════════════════════════════════════════════════

export function buildDeconstructPromptForSelection(selected: ViralCandidate): string {
  return `你是一位爆款内容分析师。请分析以下${selected.source}爆款内容的结构：

标题：${selected.title}
描述：${selected.description.slice(0, 300)}

请从以下维度拆解：
1. 钩子策略（前3秒/第一句怎么吸引人）
2. 脚本结构（内容怎么组织的）
3. 节奏控制（信息密度、停顿、转折）
4. 情绪曲线（观众情绪怎么变化的）
5. 转化话术（怎么引导互动/购买）
6. 视觉风格（画面/排版特点）
7. 热门关键词（3-5个）

只输出JSON格式：
{"hookStyle":"...","scriptStructure":"...","pacing":"...","emotionalCurve":"...","conversionTactic":"...","visualStyle":"...","keywords":["...","..."]}`
}

// ═══════════════════════════════════════════════════
// 改写 prompt（含人设注入 + 赛道适配 + 敏感词规避提示）
// ═══════════════════════════════════════════════════

export interface PersonaProfile {
  tags: string[]
  description: string
  tone: string
  contentStyle: string
  visualStyle: string
  catchphrases: string[]
  targetAudience: string
}

/** 从 agent_02 原始输出中解析人设信息 */
export function parsePersonaFromAgent02(rawOutput: string): PersonaProfile {
  const extract = (label: string): string => {
    const re = new RegExp(`${label}[：:]\\s*(.+?)(?:\\n|$)`, "i")
    const m = rawOutput.match(re)
    return m ? m[1].trim() : ""
  }
  const extractList = (label: string): string[] => {
    const val = extract(label)
    return val ? val.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
  }
  return {
    tags: extractList("人设标签"),
    description: extract("人设方案") || rawOutput.slice(0, 200),
    tone: extract("语气风格"),
    contentStyle: extract("内容调性"),
    visualStyle: extract("视觉风格"),
    catchphrases: extractList("招牌语言"),
    targetAudience: extract("目标粉丝"),
  }
}

export function buildRewritePrompt(
  userSamples: string[],
  viralDeconstruction: ViralTemplate,
  niche: string,
  platform: string,
  persona?: PersonaProfile,
): string {
  let p = `你是${platform}平台的${niche}领域创作者。`

  if (persona) {
    p += `\n\n你的创作者人设：`
    if (persona.tags.length > 0) p += `\n- 人设标签：${persona.tags.join("、")}`
    if (persona.tone) p += `\n- 语气风格：${persona.tone}`
    if (persona.contentStyle) p += `\n- 内容调性：${persona.contentStyle}`
    if (persona.catchphrases.length > 0) p += `\n- 招牌语言：${persona.catchphrases.join("、")}`
    if (persona.targetAudience) p += `\n- 你的粉丝画像：${persona.targetAudience}`
    p += `\n\n创作时保持这个人设，让你的粉丝感到亲切和一致。`
  }

  if (userSamples.length > 0) {
    p += `\n\n你已有的内容风格（新内容必须保持这个风格）：`
    userSamples.forEach((s, i) => { p += `\n${i + 1}. ${s.slice(0, 300)}` })
  }

  p += `\n\n请参考这个爆款结构，用你自己的风格创作一篇全新内容，不要抄袭原文：`
  p += `\n钩子策略：${viralDeconstruction.hookStyle}`
  p += `\n脚本结构：${viralDeconstruction.scriptStructure}`
  p += `\n节奏控制：${viralDeconstruction.pacing}`
  p += `\n情绪曲线：${viralDeconstruction.emotionalCurve}`
  p += `\n转化话术：${viralDeconstruction.conversionTactic}`

  p += `\n\n合规提醒（避免以下内容以通过${platform}平台审核）：`
  p += `\n- 不要出现微信号、QQ号、手机号等直接联系方式`
  p += `\n- 不要使用「免费领取」「点击下载」等诱导性表述`
  p += `\n- 不要使用「治愈」「根治」等绝对化医疗用语`
  p += `\n- 不要使用「稳赚」「零风险」等金融违规词`
  p += `\n- 引导互动时用「评论区见」「私信我」等自然表达`

  p += `\n\n写出标题+正文（300-500字）+话题标签，适合${platform}平台。`

  return p
}
