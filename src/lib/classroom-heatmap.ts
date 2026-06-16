// ─── 课堂热力图 — 数据引擎 ─────────────────────────
// 教师视角：实时看到全班学生的思维状态分布

import { loadRooms, MemoryRoom, PalaceItem } from "./memory-palace"
import { ClassRoom } from "./sijian-user"

// ═══════════════════════════════════════════════════
export type StudentState = "following" | "straying" | "ahead" | "stuck" | "inactive"

export interface StudentHeatCell {
  studentName: string
  state: StudentState
  mastery: number
  lastActive: Date | null
  currentConcepts: string[]
  thinkingStyles: string[]
  trend: "rising" | "steady" | "declining"
  insights: string
}

export interface ConceptHeatCell {
  label: string
  subject: string
  avgMastery: number
  studentCount: number
  strugglingCount: number       // mastery < 0.4
  masteredCount: number         // mastery >= 0.7
  heatLevel: "cold" | "warm" | "hot"
}

export interface ClassroomHeatmap {
  className: string
  subject: string
  grade: string
  generatedAt: string
  totalStudents: number
  activeStudents: number
  students: StudentHeatCell[]
  conceptHeat: ConceptHeatCell[]
  stateDistribution: Record<StudentState, number>
  thinkingDiversity: { style: string; count: number }[]
  aiAdvice: string
  urgentAlerts: string[]
}

// ═══════════════════════════════════════════════════
// 核心引擎
// ═══════════════════════════════════════════════════

const SUBJECT_NAMES: Record<string, string> = {
  mathematics:"数学", physics:"物理", chemistry:"化学", biology:"生物",
  history:"历史", geography:"地理", politics:"政治", chinese:"语文",
  english:"英语", general:"通用",
}
const STATE_LABELS: Record<StudentState, string> = {
  following:"跟上", straying:"走偏", ahead:"超前", stuck:"卡住", inactive:"未活跃",
}
const STATE_COLORS: Record<StudentState, string> = {
  following:"#22c55e", straying:"#f59e0b", ahead:"#6366f1", stuck:"#ef4444", inactive:"#d4d4d4",
}

export function generateClassroomHeatmap(
  cls: ClassRoom,
  topicFilter?: string,
): ClassroomHeatmap {
  const rooms = loadRooms()
  const now = new Date()

  // 找到该班级的学生（通过房间名前缀匹配）
  const classStudents = rooms
    .filter(r => r.subject === cls.subject)
    .map(r => ({
      name: r.name.split(" · ")[0],
      rooms: [r],
    }))
    .reduce((map, cur) => {
      if (!map.has(cur.name)) map.set(cur.name, [])
      map.get(cur.name)!.push(...cur.rooms)
      return map
    }, new Map<string, MemoryRoom[]>())

  const totalStudents = classStudents.size || cls.studentCount || 1
  const students: StudentHeatCell[] = []
  const allItems: { name: string; item: PalaceItem }[] = []

  for (const [name, studentRooms] of classStudents) {
    const items = studentRooms.flatMap(r => r.items)
    for (const item of items) allItems.push({ name, item })

    const mastery = items.length > 0
      ? items.reduce((s, i) => s + i.mastery, 0) / items.length
      : 0

    const lastReviewed = items
      .map(i => i.lastReviewedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || studentRooms[0]?.createdAt || null

    // 推断学生状态
    const state = inferStudentState(items, topicFilter, mastery, lastReviewed, now)

    // 思维风格
    const frameCounts = new Map<string, number>()
    for (const r of studentRooms) {
      for (const it of r.items) {
        // 从颜色推断风格（简化：颜色→类型映射）
        const style = itemToStyle(it)
        frameCounts.set(style, (frameCounts.get(style) || 0) + 1)
      }
    }
    const styles = Array.from(frameCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([s]) => s)

    // 趋势
    const sortedByTime = [...items].sort((a, b) =>
      new Date(a.lastReviewedAt || a.createdAt).getTime() - new Date(b.lastReviewedAt || b.createdAt).getTime()
    )
    const recent = sortedByTime.slice(-Math.ceil(items.length / 2))
    const older = sortedByTime.slice(0, Math.floor(items.length / 2))
    const recentMastery = recent.length > 0 ? recent.reduce((s, i) => s + i.mastery, 0) / recent.length : mastery
    const olderMastery = older.length > 0 ? older.reduce((s, i) => s + i.mastery, 0) / older.length : mastery
    const trend = recentMastery - olderMastery > 0.1 ? "rising" as const
      : recentMastery - olderMastery < -0.05 ? "declining" as const
      : "steady" as const

    // 洞察
    const insights = inferInsight(state, mastery, trend, items, styles)

    students.push({
      studentName: name,
      state,
      mastery,
      lastActive: lastReviewed ? new Date(lastReviewed) : null,
      currentConcepts: items.slice(-3).map(i => i.label),
      thinkingStyles: styles,
      trend,
      insights,
    })
  }

  // 概念热度
  const conceptMap = new Map<string, {
    subject: string; sum: number; count: number; students: Set<string>
    struggling: number; mastered: number
  }>()
  for (const { name, item } of allItems) {
    if (!conceptMap.has(item.label)) {
      conceptMap.set(item.label, {
        subject: "", sum: 0, count: 0, students: new Set(),
        struggling: 0, mastered: 0,
      })
    }
    const c = conceptMap.get(item.label)!
    c.sum += item.mastery
    c.count++
    c.students.add(name)
    if (item.mastery < 0.4) c.struggling++
    if (item.mastery >= 0.7) c.mastered++
  }

  const conceptHeat: ConceptHeatCell[] = Array.from(conceptMap.entries())
    .map(([label, d]) => ({
      label,
      subject: d.subject,
      avgMastery: d.sum / d.count,
      studentCount: d.students.size,
      strugglingCount: d.struggling,
      masteredCount: d.mastered,
      heatLevel: d.students.size >= totalStudents * 0.5
        ? (d.sum / d.count < 0.4 ? "hot" as const : "warm" as const)
        : "cold" as const,
    }))
    .sort((a, b) => a.studentCount - b.studentCount) // 参与最少的问题先暴露

  // 状态分布
  const stateDistribution: Record<StudentState, number> = {
    following: 0, straying: 0, ahead: 0, stuck: 0, inactive: 0,
  }
  for (const s of students) stateDistribution[s.state]++

  // 思维多样性
  const styleCounts = new Map<string, number>()
  for (const s of students) {
    for (const style of s.thinkingStyles) {
      styleCounts.set(style, (styleCounts.get(style) || 0) + 1)
    }
  }
  const thinkingDiversity = Array.from(styleCounts.entries())
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)

  // AI 建议
  const followingPct = stateDistribution.following / totalStudents
  const stuckPct = stateDistribution.stuck / totalStudents
  const strayingPct = stateDistribution.straying / totalStudents

  let aiAdvice = ""
  if (stuckPct > 0.3) {
    aiAdvice = `⚠️ ${Math.round(stuckPct * 100)}% 的学生卡住了。建议停一下，用一个具体的例子重新讲解当前概念，然后让每个学生用自己的话复述一遍。`
  } else if (strayingPct > 0.25) {
    aiAdvice = `🎯 ${Math.round(strayingPct * 100)}% 的学生思路走偏了。建议重申一下当前的学习目标，用引导性问题把他们拉回来。`
  } else if (followingPct >= 0.6) {
    aiAdvice = `✅ 全班节奏不错，${Math.round(followingPct * 100)}% 的学生跟上了。可以考虑抛出一些开放性问题，让学得快的学生有更深的思考空间。`
  } else {
    aiAdvice = `📊 班级思维状态分布比较分散。可以尝试分组教学：让掌握好的学生做拓展思考，同时单独辅导卡住的学生。`
  }

  // 紧急警告
  const urgentAlerts: string[] = []
  if (stuckPct > 0.4) {
    urgentAlerts.push(`🔴 ${Math.round(stuckPct * 100)}% 的学生处于"卡住"状态——需要立即干预`)
  }
  const inactiveCount = stateDistribution.inactive
  if (inactiveCount > totalStudents * 0.5) {
    urgentAlerts.push(`🟡 ${inactiveCount} 名学生超过 24 小时未活跃——可能需要提醒`)
  }
  const hotConcepts = conceptHeat.filter(c => c.heatLevel === "hot")
  if (hotConcepts.length > 0) {
    urgentAlerts.push(`🔴 "${hotConcepts[0].label}" 是全班最薄弱的共性概念，${hotConcepts[0].strugglingCount} 人未掌握`)
  }

  return {
    className: cls.name,
    subject: cls.subject,
    grade: cls.grade,
    generatedAt: now.toISOString(),
    totalStudents,
    activeStudents: students.filter(s => s.state !== "inactive").length,
    students,
    conceptHeat,
    stateDistribution,
    thinkingDiversity,
    aiAdvice,
    urgentAlerts,
  }
}

// ─── 内部函数 ──────────────────────────────────

function inferStudentState(
  items: PalaceItem[],
  topicFilter: string | undefined,
  mastery: number,
  lastActive: string | null,
  now: Date,
): StudentState {
  if (items.length === 0) return "inactive"

  const hoursSinceActive = lastActive
    ? (now.getTime() - new Date(lastActive).getTime()) / 3600000
    : 999

  if (hoursSinceActive > 48) return "inactive"
  if (hoursSinceActive > 24) return "stuck"

  // Topic relevance check
  if (topicFilter) {
    const relevant = items.filter(i =>
      i.label.includes(topicFilter) || i.content.includes(topicFilter)
    )
    const irrelevant = items.filter(i =>
      !i.label.includes(topicFilter) && !i.content.includes(topicFilter)
    )
    if (irrelevant.length > relevant.length * 2) return "straying"
  }

  if (mastery >= 0.75) return "ahead"
  if (mastery < 0.3 && items.length >= 3) return "stuck"
  if (mastery >= 0.3 && mastery < 0.7) return "following"

  return "following"
}

function itemToStyle(item: PalaceItem): string {
  const color = item.color
  // Simplified color→style mapping
  if (color === "#E53E3E") return "批判"
  if (color === "#4C51BF") return "层级"
  if (color === "#38A169") return "流程"
  if (color === "#00B5D8") return "聚焦"
  if (color === "#805AD5") return "螺旋"
  if (color === "#D69E2E") return "矩阵"
  if (color === "#ED8936") return "循环"
  if (color === "#DD6B20") return "发散"
  if (color === "#3182CE") return "关联"
  if (color === "#319795") return "轨道"
  if (color === "#D53F8C") return "分层"
  if (color === "#8B4513") return "实践"
  return "探索"
}

function inferInsight(
  state: StudentState,
  mastery: number,
  trend: string,
  items: PalaceItem[],
  styles: string[],
): string {
  const styleText = styles.length > 0 ? styles.join("+") : "探索"
  switch (state) {
    case "ahead": return `掌握度 ${Math.round(mastery * 100)}%，思维模式: ${styleText}，可以布置拓展任务`
    case "following": return `节奏正常，${styleText}思维为主，继续当前进度`
    case "straying": return `概念偏离，最近3个概念可能不在主题范围内`
    case "stuck": return `掌握度仅 ${Math.round(mastery * 100)}%，需要单独辅导或换个角度讲解`
    case "inactive": return `超过 24 小时未活动`
  }
}

export { STATE_LABELS, STATE_COLORS, SUBJECT_NAMES }
