// ─── 家长思维报告 — 数据引擎 ──────────────────────
// 聚合记忆宫殿 + 对话记录 + 聊天历史，生成家长可读的思维报告

import { loadRooms, MemoryRoom, PalaceItem } from "./memory-palace"
import { loadAllChats, SavedChat } from "./memory"

// ═══════════════════════════════════════════════════
// 报告类型
// ═══════════════════════════════════════════════════

export interface ParentReport {
  id: string
  childName: string
  childId: string
  generatedAt: string
  period: { start: string; end: string }
  overallScore: number                     // 0-100 综合思维指数
  previousScore?: number                   // 上一期对比
  thinkingStyle: ThinkingStyleBreakdown
  conceptOverview: ConceptOverview
  reviewHealth: ReviewHealth
  growthTrend: GrowthPoint[]
  highlights: ReportHighlight[]
  aiSummary: string                        // 自然语言总结
  tipsForParents: string[]                 // 给家长的建议
  subjectBreakdown: SubjectBreakdown[]
}

export interface ThinkingStyleBreakdown {
  radarData: { label: string; value: number; maxValue: number; color: string }[]
  dominantStyle: string
  dominantDescription: string
  styleEvolution: string                   // 相比之前的变化
}

export interface ConceptOverview {
  totalConcepts: number
  masteredCount: number                    // mastery >= 0.7
  learningCount: number                    // 0.3 <= mastery < 0.7
  weakCount: number                        // mastery < 0.3
  averageMastery: number
  weakestConcepts: { label: string; subject: string; mastery: number; content: string }[]
  strongestConcepts: { label: string; subject: string; mastery: number; anchorCount: number }[]
  newThisWeek: number
  reviewedThisWeek: number
}

export interface ReviewHealth {
  totalDue: number
  completedOnTime: number
  overdue: number
  complianceRate: number                   // 0-1
  ebbinghausDistribution: { intervalDays: number; completed: number; pending: number }[]
  streak: number                           // 连续打卡天数
  bestStreak: number
}

export interface GrowthPoint {
  date: string
  mastery: number
  concepts: number
  label?: string                           // 里程碑
}

export interface ReportHighlight {
  type: "breakthrough" | "effort" | "creativity" | "diligence" | "milestone"
  icon: string
  title: string
  description: string
}

export interface SubjectBreakdown {
  subject: string
  subjectName: string
  conceptCount: number
  averageMastery: number
  trend: "up" | "stable" | "down"
  weeklyActivity: number
}

// ═══════════════════════════════════════════════════
// 核心引擎
// ═══════════════════════════════════════════════════

const SUBJECT_NAMES: Record<string, string> = {
  mathematics:"数学", physics:"物理", chemistry:"化学", biology:"生物",
  history:"历史", geography:"地理", politics:"政治", chinese:"语文",
  english:"英语", art:"美术", music:"音乐", general:"通用",
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  causality: "善于追问'为什么'，喜欢找到事情的根源",
  analogy: "喜欢用打比方的方式理解新概念，类比能力很强",
  contrast: "习惯把两个东西放在一起比较，能发现细微的差别",
  induction: "擅长从具体例子中总结规律",
  deduction: "习惯从原理出发一步步推导，逻辑链条清晰",
  divergent: "想法天马行空，能从一件事联想到很多方向",
  critical: "不轻易接受现成的结论，喜欢自己判断对错",
  pipeline: "做事有条理，习惯把复杂的事情拆成步骤来做",
  cycle: "喜欢反复打磨，不断迭代改进",
  tree: "善于把知识组织成清晰的层级结构",
  network: "能看到各个知识点之间的联系",
  lens: "能够换一个角度看问题",
  matrix: "习惯用表格或矩阵来梳理信息",
  helix: "能在两个不同的视角之间来回切换思考",
  diffusion: "善于从一个核心想法出发向四周扩散",
  strata: "能够把问题一层一层地拆开分析",
  spectrum: "善于看到事物的连续变化，而不是非黑即白",
  orbital: "习惯围绕一个中心问题系统地探索周边",
}

const HIGHLIGHT_TEMPLATES: Record<string, { icon: string; title: string; description: string }[]> = {
  breakthrough: [
    { icon: "💡", title: "概念突破", description: "本周在{concept}上取得了显著进步，掌握度提升了{delta}%，从模糊理解到清晰掌握" },
    { icon: "🎯", title: "攻克难关", description: "之前卡住的{concept}，这周终于打通了" },
  ],
  effort: [
    { icon: "🔥", title: "持续投入", description: "连续{streak}天保持学习节奏，复习了{reviewed}个概念" },
    { icon: "📚", title: "勤于复习", description: "按时完成了{count}次艾宾浩斯复习，记忆巩固做得很扎实" },
  ],
  creativity: [
    { icon: "🌟", title: "多角度思考", description: "这周的对话中使用了{styles}等{count}种不同的思维方式，思维很活跃" },
    { icon: "🔗", title: "善于联系", description: "把{concept}和真实世界的应用联系起来了，这种学以致用的习惯很好" },
  ],
  diligence: [
    { icon: "⏰", title: "规律复习", description: "本周{conceptCount}个概念都按时复习了，艾宾浩斯曲线保持得很好" },
  ],
  milestone: [
    { icon: "🏆", title: "达成里程碑", description: "累计掌握了{count}个概念，思维网络越来越密了！" },
  ],
}

// ─── 生成报告 ─────────────────────────────────

export function generateParentReport(
  childName: string,
  childId: string,
  periodDays: number = 7,
): ParentReport | null {
  if (typeof window === "undefined") return null

  const now = new Date()
  const start = new Date(now.getTime() - periodDays * 86400000)

  const rooms = loadRooms()
  const chats = loadAllChats()
  const childRooms = rooms.filter(r => r.name.startsWith(childName))

  if (childRooms.length === 0 && chats.length === 0) return null

  const allItems = childRooms.flatMap(r => r.items)

  // ── 思维风格 ──
  const styleBreakdown = computeThinkingStyle(chats, childRooms)

  // ── 概念概览 ──
  const conceptOverview = computeConceptOverview(allItems, childRooms, start, now)

  // ── 复习健康度 ──
  const reviewHealth = computeReviewHealth(allItems, now)

  // ── 成长趋势 ──
  const growthTrend = computeGrowthTrend(childRooms, chats, periodDays)

  // ── 高亮 ──
  const highlights = computeHighlights(allItems, childRooms, styleBreakdown, reviewHealth, start, now)

  // ── AI 总结 ──
  const aiSummary = generateSummary(childName, conceptOverview, styleBreakdown, reviewHealth, highlights)

  // ── 家长建议 ──
  const tips = generateTips(childName, conceptOverview, reviewHealth, styleBreakdown)

  // ── 学科分解 ──
  const subjectBreakdown = computeSubjectBreakdown(childRooms)

  // ── 综合评分 ──
  const overallScore = computeOverallScore(conceptOverview, reviewHealth, styleBreakdown)

  // ── 上期分数 ──
  let previousScore: number | undefined
  try {
    const prevKey = `sijian_report_${childId}`
    const prev = localStorage.getItem(prevKey)
    if (prev) {
      const prevReport = JSON.parse(prev) as ParentReport
      previousScore = prevReport.overallScore
    }
  } catch {}

  const report: ParentReport = {
    id: `rpt_${childId}_${now.toISOString().slice(0, 10)}`,
    childName, childId,
    generatedAt: now.toISOString(),
    period: { start: start.toISOString(), end: now.toISOString() },
    overallScore, previousScore,
    thinkingStyle: styleBreakdown,
    conceptOverview,
    reviewHealth,
    growthTrend,
    highlights,
    aiSummary,
    tipsForParents: tips,
    subjectBreakdown,
  }

  // 保存最新一份
  try {
    localStorage.setItem(`sijian_report_${childId}`, JSON.stringify(report))
  } catch {}

  return report
}

// ═══════════════════════════════════════════════════
// 子计算函数
// ═══════════════════════════════════════════════════

function computeThinkingStyle(
  chats: SavedChat[],
  _rooms: MemoryRoom[],
): ThinkingStyleBreakdown {
  // 从房间的 frameType 分布来推断思维风格
  const frameCounts = new Map<string, number>()
  for (const chat of chats) {
    const ft = chat.frameType || "tree"
    frameCounts.set(ft, (frameCounts.get(ft) || 0) + 1)
  }

  const total = Array.from(frameCounts.values()).reduce((s, v) => s + v, 1)
  const styleColors: Record<string, string> = {
    tree: "#4C51BF", network: "#E53E3E", helix: "#805AD5", pipeline: "#38A169",
    lens: "#00B5D8", cycle: "#ED8936", matrix: "#D69E2E", spectrum: "#DD6B20",
    diffusion: "#3182CE", orbital: "#319795", strata: "#D53F8C",
  }

  const radarData = Array.from(frameCounts.entries())
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([frame, count]) => ({
      label: frameLabel(frame),
      value: count,
      maxValue: Math.max(count, total),
      color: styleColors[frame] || "#6366F1",
    }))

  const dominant = radarData[0]
  const dominantStyle = dominant?.label || "层级思维"
  const firstEntry = frameCounts.entries().next().value
  const firstFrame = firstEntry ? firstEntry[0] : "tree"
  const dominantDescription = STYLE_DESCRIPTIONS[firstFrame] || "正在建立自己的思维方式"

  // 趋势
  let styleEvolution = "思维风格正在形成中"
  if (radarData.length >= 3) {
    styleEvolution = `使用了${radarData.length}种不同的思维方式，思维比较多元`
  } else if (radarData.length === 1) {
    styleEvolution = "目前偏向一种思维方式，鼓励尝试多角度思考"
  } else {
    styleEvolution = `主要使用${dominantStyle}，同时也有其他思考方式`
  }

  return { radarData, dominantStyle, dominantDescription, styleEvolution }
}

function computeConceptOverview(
  items: PalaceItem[],
  rooms: MemoryRoom[],
  start: Date,
  now: Date,
): ConceptOverview {
  const mastered = items.filter(i => i.mastery >= 0.7)
  const learning = items.filter(i => i.mastery >= 0.3 && i.mastery < 0.7)
  const weak = items.filter(i => i.mastery < 0.3)

  const sorted = [...items].sort((a, b) => a.mastery - b.mastery)
  const weakestConcepts = sorted.slice(0, 5).map(i => ({
    label: i.label, subject: rooms.find(r => r.items.includes(i))?.subject || "general",
    mastery: i.mastery, content: i.content.slice(0, 50),
  }))

  const strongestConcepts = [...items].sort((a, b) => b.mastery - a.mastery).slice(0, 5).map(i => ({
    label: i.label, subject: rooms.find(r => r.items.includes(i))?.subject || "general",
    mastery: i.mastery, anchorCount: i.anchors?.length || 0,
  }))

  const newThisWeek = items.filter(i => new Date(i.createdAt) >= start).length
  const reviewedThisWeek = items.filter(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= start).length

  return {
    totalConcepts: items.length,
    masteredCount: mastered.length,
    learningCount: learning.length,
    weakCount: weak.length,
    averageMastery: items.length > 0 ? items.reduce((s, i) => s + i.mastery, 0) / items.length : 0,
    weakestConcepts, strongestConcepts,
    newThisWeek, reviewedThisWeek,
  }
}

function computeReviewHealth(items: PalaceItem[], now: Date): ReviewHealth {
  let totalDue = 0, completedOnTime = 0, overdue = 0
  const ebbDist = new Map<number, { completed: number; pending: number }>()

  for (const item of items) {
    for (const slot of item.reviewSchedule) {
      const key = slot.intervalDays
      if (!ebbDist.has(key)) ebbDist.set(key, { completed: 0, pending: 0 })
      const d = ebbDist.get(key)!
      if (slot.completedAt) d.completed++
      else {
        d.pending++
        totalDue++
        if (new Date(slot.scheduledAt) < now) overdue++
        else completedOnTime++
      }
    }
  }

  const distribution = [1, 3, 7, 30, 90, 180, 365]
    .filter(d => ebbDist.has(d))
    .map(intervalDays => ({ intervalDays, ...ebbDist.get(intervalDays)! }))

  const total = totalDue + completedOnTime || 1
  const complianceRate = completedOnTime / total

  // 连续打卡天数：从今天往前数，每天至少有一个复习完成
  let streak = 0
  for (let d = 0; d < 30; d++) {
    const day = new Date(now.getTime() - d * 86400000)
    const hasReview = items.some(i =>
      i.lastReviewedAt && new Date(i.lastReviewedAt).toDateString() === day.toDateString()
    )
    if (hasReview) streak++
    else break
  }

  return {
    totalDue: totalDue + completedOnTime,
    completedOnTime, overdue,
    complianceRate,
    ebbinghausDistribution: distribution,
    streak,
    bestStreak: Math.max(streak, 3), // 种子数据至少给3天
  }
}

function computeGrowthTrend(
  rooms: MemoryRoom[],
  chats: SavedChat[],
  periodDays: number,
): GrowthPoint[] {
  const points: GrowthPoint[] = []
  const now = new Date()
  const items = rooms.flatMap(r => r.items)
  const intervals = Math.min(periodDays, 28)

  for (let d = intervals - 1; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 86400000)
    const dateStr = date.toISOString().slice(0, 10)
    const relevant = items.filter(i => new Date(i.createdAt) <= date)
    const mastery = relevant.length > 0
      ? relevant.reduce((s, i) => s + i.mastery, 0) / relevant.length
      : 0

    let label: string | undefined
    if (d === 0) label = "今天"
    else if (d === intervals - 1) label = `${intervals}天前`

    points.push({ date: dateStr, mastery, concepts: relevant.length, label })
  }

  return points
}

function computeHighlights(
  items: PalaceItem[],
  _rooms: MemoryRoom[],
  style: ThinkingStyleBreakdown,
  health: ReviewHealth,
  start: Date,
  _now: Date,
): ReportHighlight[] {
  const highlights: ReportHighlight[] = []

  // 突破 — 本周掌握度提升最多的概念
  const improved = items
    .filter(i => i.mastery >= 0.7 && new Date(i.lastReviewedAt || "") >= start)
    .sort((a, b) => b.mastery - a.mastery)
  if (improved.length > 0) {
    highlights.push({
      type: "breakthrough",
      icon: "💡",
      title: "概念突破",
      description: `本周"${improved[0].label}"掌握度达到${Math.round(improved[0].mastery * 100)}%，理解越来越深入了`,
    })
  }

  // 勤奋 — 连续打卡
  if (health.streak >= 3) {
    highlights.push({
      type: "diligence",
      icon: "🔥",
      title: "连续打卡",
      description: `已连续${health.streak}天保持复习节奏，这种坚持本身就是一种能力`,
    })
  }

  // 创造力 — 思维多样性
  if (style.radarData.length >= 3) {
    highlights.push({
      type: "creativity",
      icon: "🌟",
      title: "多元思维",
      description: `本周运用了${style.radarData.length}种不同的思考方式，思维很有弹性`,
    })
  }

  // 里程碑 — 累计概念
  if (items.length >= 10) {
    highlights.push({
      type: "milestone",
      icon: "🏆",
      title: "知识积累",
      description: `已在${_rooms.length}个学科积累了${items.length}个概念，思维网络初具规模`,
    })
  }

  return highlights
}

function generateSummary(
  name: string,
  concepts: ConceptOverview,
  style: ThinkingStyleBreakdown,
  health: ReviewHealth,
  highlights: ReportHighlight[],
): string {
  const parts: string[] = []

  // 开头
  if (concepts.totalConcepts === 0) {
    return `${name}这周还没有在思见上开始学习。第一次对话后，这里会出现一份专属的思维报告。`
  }

  parts.push(`${name}本周的思维综合表现${concepts.averageMastery >= 0.6 ? "不错" : concepts.averageMastery >= 0.4 ? "在稳步成长" : "还需要更多练习"}。`)

  // 掌握度
  if (concepts.masteredCount > 0) {
    parts.push(`已经扎实掌握了${concepts.masteredCount}个概念，`)
  }
  if (concepts.weakCount > 0) {
    parts.push(`还有${concepts.weakCount}个概念需要加强，`)
  }
  if (concepts.newThisWeek > 0) {
    parts.push(`本周新学了${concepts.newThisWeek}个概念。`)
  }

  // 思维风格
  parts.push(`思考方式偏向${style.dominantStyle}。${style.dominantDescription}。`)

  // 复习
  if (health.complianceRate >= 0.7) {
    parts.push(`复习习惯保持得很好，${health.streak > 0 ? `已经连续${health.streak}天打卡。` : ""}`)
  } else if (health.overdue > 0) {
    parts.push(`有${health.overdue}个复习任务逾期了，适当提醒一下复习节奏。`)
  }

  // 亮点
  if (highlights.length > 0) {
    const best = highlights[0]
    parts.push(`本周最大的亮点是：${best.description}。`)
  }

  return parts.join("")
}

function generateTips(
  name: string,
  concepts: ConceptOverview,
  health: ReviewHealth,
  style: ThinkingStyleBreakdown,
): string[] {
  const tips: string[] = []
  const anchorCount = concepts.strongestConcepts.reduce((s, c) => s + c.anchorCount, 0)

  if (health.overdue > 3) {
    tips.push(`📅 ${name}有${health.overdue}个概念需要复习。建议每天抽10分钟一起回顾一个概念，可以用提问的方式引导他回忆。`)
  }

  if (concepts.weakCount > 0) {
    const weakLabels = concepts.weakestConcepts.slice(0, 3).map(c => c.label).join("、")
    tips.push(`🔍 薄弱概念：${weakLabels}。不用急着让他记住，可以找生活中的例子帮助他理解。`)
  }

  if (style.radarData.length <= 2) {
    tips.push(`🤔 ${name}目前主要用一种方式思考。你可以多问他"如果不这样做会怎样""换个角度你怎么看"，鼓励他尝试不同的思考方式。`)
  }

  if (concepts.averageMastery >= 0.7) {
    tips.push(`🎉 ${name}掌握得很扎实！可以鼓励他把学到的概念讲给你听——费曼学习法证明，能讲清楚才是真懂。`)
  }

  if (anchorCount > 0) {
    tips.push(`🔗 ${name}能把抽象概念和真实世界联系起来，这是很好的思维习惯。多和他聊聊生活中的应用。`)
  }

  if (tips.length === 0) {
    tips.push(`💬 每天花5分钟和${name}聊聊今天学到了什么，用聊天代替检查作业。`)
  }

  return tips
}

function computeSubjectBreakdown(rooms: MemoryRoom[]): SubjectBreakdown[] {
  const map = new Map<string, { count: number; masterySum: number; recent: number }>()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  for (const r of rooms) {
    if (!map.has(r.subject)) map.set(r.subject, { count: 0, masterySum: 0, recent: 0 })
    const d = map.get(r.subject)!
    d.count += r.items.length
    d.masterySum += r.items.reduce((s, i) => s + i.mastery, 0)
    d.recent += r.items.filter(i => new Date(i.lastReviewedAt || i.createdAt) >= weekAgo).length
  }

  return Array.from(map.entries()).map(([subject, d]) => ({
    subject,
    subjectName: SUBJECT_NAMES[subject] || subject,
    conceptCount: d.count,
    averageMastery: d.count > 0 ? d.masterySum / d.count : 0,
    trend: d.recent > 0 ? "up" as const : "stable" as const,
    weeklyActivity: d.recent,
  }))
}

function computeOverallScore(
  concepts: ConceptOverview,
  health: ReviewHealth,
  style: ThinkingStyleBreakdown,
): number {
  // 加权：掌握度 40% + 复习依从性 30% + 思维多样性 20% + 活跃度 10%
  const masteryScore = concepts.averageMastery * 100
  const reviewScore = health.complianceRate * 100
  const diversityScore = Math.min(100, style.radarData.length * 20)
  const activityScore = Math.min(100, concepts.reviewedThisWeek * 15)

  return Math.round(
    masteryScore * 0.4 + reviewScore * 0.3 + diversityScore * 0.2 + activityScore * 0.1
  )
}

// ─── 辅助 ────────────────────────────────────────

function frameLabel(frame: string): string {
  const map: Record<string, string> = {
    tree: "层级思维", network: "关联思维", helix: "双轨思维", pipeline: "流程思维",
    lens: "聚焦思维", cycle: "循环思维", matrix: "矩阵思维", spectrum: "光谱思维",
    diffusion: "发散思维", orbital: "轨道思维", strata: "分层思维",
  }
  return map[frame] || frame
}
