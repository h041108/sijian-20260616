// ─── 思见战略功能引擎 ────────────────────────────────
// P0a: 学生思维成长对比报告 · P0b: 岗位知识克隆
// P1a: 企业AI成熟度诊断 · P1b: AI思维教案生成
// P2a: 家长每周自动推送 · P2b: 企业能力名片
// 所有数据聚合已有基础设施，只做展示层新封装

import { loadRooms } from "./memory-palace"
import { loadCognitionLogs, generateThinkingMirror } from "./cognition"
import { loadModules, loadRecords, getEnterpriseDashboard } from "./enterprise-training"
import { buildInstitutionalKnowledgeGraph, loadBusinessMetrics, computeCompoundIndex } from "./institutional-intelligence"
import { getPerformanceSummary, loadRegistry } from "./orchestrator"
import { loadInstitution } from "./institution"

// ═══════════════════════════════════════════════════
// P0a: 学生思维成长对比报告
// ═══════════════════════════════════════════════════

export interface GrowthSnapshot {
  period: { start: string; end: string; label: string }
  thinkingDepth: number
  thinkingBreadth: number
  mastery: number
  resilience: number
  totalConcepts: number
  dominantStyle: string
  reviewCompliance: number
  highlights: string[]
}

export interface StudentGrowthComparison {
  studentName: string
  snapshots: GrowthSnapshot[]
  radarDimensions: { label: string; values: number[]; maxValue: number; color: string }[]
  overallTrend: "strong_growth" | "steady" | "declining" | "inactive"
  aiSummary: string
  parentTips: string[]
  generatedAt: string
}

export function generateStudentGrowthComparison(
  studentName: string,
  periods: number = 3,     // 对比最近3个周期
  periodDays: number = 30, // 每个周期30天
): StudentGrowthComparison | null {
  const rooms = loadRooms()
  const studentRooms = rooms.filter(r => r.name.startsWith(studentName))
  if (studentRooms.length === 0) return null

  const now = new Date()
  const snapshots: GrowthSnapshot[] = []
  const items = studentRooms.flatMap(r => r.items)

  for (let p = periods - 1; p >= 0; p--) {
    const end = new Date(now.getTime() - p * periodDays * 86400000)
    const start = new Date(end.getTime() - periodDays * 86400000)

    const periodItems = items.filter(i =>
      new Date(i.createdAt) <= end && new Date(i.createdAt) >= start
    )
    const allItems = items.filter(i => new Date(i.createdAt) <= end)

    const mastery = allItems.length > 0
      ? allItems.reduce((s, i) => s + i.mastery, 0) / allItems.length
      : 0

    const logs = loadCognitionLogs().filter(l =>
      l.userId === studentName &&
      new Date(l.timestamp) <= end &&
      new Date(l.timestamp) >= start
    )

    const mirror = generateThinkingMirror(studentName, studentName)

    // Frame diversity from rooms
    const frameSet = new Set<string>()
    for (const r of studentRooms) {
      for (const it of r.items) {
        if (new Date(it.createdAt) <= end) {
          // Use color as proxy for thinking style
          if (it.color) frameSet.add(it.color)
        }
      }
    }

    // Review compliance
    let totalDue = 0, done = 0
    for (const it of allItems) {
      for (const slot of it.reviewSchedule) {
        totalDue++
        if (slot.completedAt) done++
      }
    }
    const reviewCompliance = totalDue > 0 ? done / totalDue : 0

    const highlights: string[] = []
    if (periodItems.length > 0) highlights.push(`本周期新增${periodItems.length}个概念`)
    if (reviewCompliance >= 0.7) highlights.push("复习习惯保持良好")
    if (logs.length >= 5) highlights.push(`活跃思考${logs.length}次`)

    snapshots.push({
      period: { start: start.toISOString(), end: end.toISOString(), label: formatPeriodLabel(p, periods, periodDays) },
      thinkingDepth: mirror.thinkingDepth,
      thinkingBreadth: mirror.thinkingBreadth,
      mastery,
      resilience: mirror.resilience,
      totalConcepts: allItems.length,
      dominantStyle: mirror.dominantStyles[0]?.style || "探索",
      reviewCompliance,
      highlights,
    })
  }

  const first = snapshots[0]
  const last = snapshots[snapshots.length - 1]
  const allMastery = snapshots.map(s => s.mastery)

  let overallTrend: StudentGrowthComparison["overallTrend"] = "steady"
  if (last && first) {
    const delta = last.mastery - first.mastery
    if (delta > 0.15) overallTrend = "strong_growth"
    else if (delta < -0.05 && allMastery.every((m, i) => i === 0 || m <= allMastery[i-1])) overallTrend = "declining"
    else if (last.mastery < 0.2) overallTrend = "inactive"
  }

  const radarDimensions = [
    { label: "掌握度", values: snapshots.map(s => s.mastery), maxValue: 1, color: "#6366F1" },
    { label: "思维深度", values: snapshots.map(s => s.thinkingDepth), maxValue: 1, color: "#22C55E" },
    { label: "思维广度", values: snapshots.map(s => s.thinkingBreadth), maxValue: 1, color: "#F59E0B" },
    { label: "韧性", values: snapshots.map(s => s.resilience), maxValue: 1, color: "#EC4899" },
    { label: "复习率", values: snapshots.map(s => s.reviewCompliance), maxValue: 1, color: "#8B5CF6" },
  ]

  const trendLabel = overallTrend === "strong_growth" ? "显著进步" : overallTrend === "declining" ? "需关注" : "稳定发展"
  const aiSummary = `${studentName}在过去${periods}个周期内思维呈${trendLabel}趋势。从${first?.dominantStyle}思维起步，目前已掌握${last?.totalConcepts || 0}个概念。`

  const parentTips: string[] = []
  if (last && last.reviewCompliance < 0.5) parentTips.push("建议每天抽10分钟陪孩子复习1-2个概念")
  if (last && last.thinkingBreadth < 0.3) parentTips.push("鼓励孩子尝试多角度思考问题，不要只用一种方式")
  if (overallTrend === "strong_growth") parentTips.push("孩子进步明显，可以适当增加挑战难度")
  if (parentTips.length === 0) parentTips.push("继续保持当前节奏，关注复习效果")

  return {
    studentName,
    snapshots,
    radarDimensions,
    overallTrend,
    aiSummary,
    parentTips,
    generatedAt: now.toISOString(),
  }
}

function formatPeriodLabel(index: number, total: number, days: number): string {
  if (total === 1) return "当前"
  const labels = ["最初", "中期"]
  return labels[index] || `第${index + 1}期`
}

// ═══════════════════════════════════════════════════
// P0b: 岗位知识克隆引擎
// ═══════════════════════════════════════════════════

export interface RoleKnowledge {
  roleName: string
  department: string
  concepts: { label: string; content: string; mastery: number; anchors: string[] }[]
  workflows: { name: string; description: string; category: string; nodeCount: number }[]
  decisions: { title: string; description: string; lessons: string[] }[]
  trainingModules: { name: string; category: string; pointCount: number }[]
  aiCapability: { l1Score: number; l2Score: number; l3Score: number }
  clonedAt: string
}

export function captureRoleKnowledge(roleName: string, department?: string): RoleKnowledge {
  const rooms = loadRooms()
  const modules = loadModules()
  const records = loadRecords()
  const graph = buildInstitutionalKnowledgeGraph()

  // Concepts from memory rooms
  const concepts = rooms
    .filter(r => !department || r.subject === department)
    .flatMap(r => r.items)
    .slice(0, 50)
    .map(i => ({
      label: i.label, content: i.content.slice(0, 100), mastery: i.mastery,
      anchors: (i.anchors || []).map(a => a.label),
    }))

  // Workflows from L4
  const workflows: any[] = []
  // Import dynamically to avoid circular
  if (typeof window !== "undefined") {
    try {
      const { loadWorkflows } = require("@/lib/enterprise-ai-capability")
      const wfs = loadWorkflows()
      for (const wf of wfs) {
        workflows.push({ name: wf.name, description: wf.description, category: wf.category, nodeCount: wf.nodes.length })
      }
    } catch {}
  }

  // Decisions from L5
  const decisions: any[] = []
  if (typeof window !== "undefined") {
    try {
      const { loadDecisions } = require("@/lib/enterprise-ai-capability")
      const decs = loadDecisions()
      for (const d of decs.filter((d: any) => !department || d.department === department).slice(0, 20)) {
        decisions.push({ title: d.title, description: d.description, lessons: d.lessons })
      }
    } catch {}
  }

  // AI Capability scores from L1-L3
  const l1Attempts = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL1Attempts() } catch { return [] } })()
    : []
  const l2Submissions = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL2Submissions() } catch { return [] } })()
    : []
  const l3Attempts = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL3Attempts() } catch { return [] } })()
    : []

  const l1Score = l1Attempts.length > 0 ? l1Attempts.filter((a: any) => a.correct).length / l1Attempts.length : 0
  const l2Score = l2Submissions.length > 0 ? Math.min(1, l2Submissions.length / 8) : 0
  const l3Score = l3Attempts.length > 0 ? l3Attempts.filter((a: any) => a.passed).length / l3Attempts.length : 0

  return {
    roleName,
    department: department || "通用",
    concepts,
    workflows: workflows.slice(0, 10),
    decisions: decisions.slice(0, 10),
    trainingModules: modules.filter(m => !department || m.department === department || m.department === "全员")
      .map(m => ({ name: m.name, category: m.category, pointCount: m.knowledgePoints.length })),
    aiCapability: { l1Score, l2Score, l3Score },
    clonedAt: new Date().toISOString(),
  }
}

export function cloneKnowledgeTo(roleKnowledge: RoleKnowledge, targetEmployeeName: string): number {
  if (typeof window === "undefined") return 0

  // Import knowledge into memory palace as a new room for the target
  const room: any = {
    id: `clone_${Date.now()}`,
    name: `${targetEmployeeName} · ${roleKnowledge.roleName}知识库`,
    subject: roleKnowledge.department || "general",
    description: `从${roleKnowledge.roleName}岗位克隆的知识体系 · ${roleKnowledge.clonedAt}`,
    createdAt: new Date().toISOString(),
    items: roleKnowledge.concepts.map((c, i) => ({
      id: `ci_${Date.now()}_${i}`,
      label: c.label, content: c.content, shape: "sphere", color: "#6366F1",
      anchors: c.anchors.map(a => ({ label: a, profession: "", parameters: "" })),
      position: { x: i * 90 + 40, y: 80 },
      reviewSchedule: [], reviewCount: 0, mastery: 0.25,
      parentIds: [], sourceSpaceId: "cloned", sourceTeacherId: roleKnowledge.roleName,
      createdAt: new Date().toISOString(),
    })),
  }

  const existing = JSON.parse(localStorage.getItem("sijian_memory_palace") || "[]")
  existing.push(room)
  localStorage.setItem("sijian_memory_palace", JSON.stringify(existing))

  // Also assign training modules
  if (typeof window !== "undefined") {
    try {
      const { loadModules, assignTraining } = require("@/lib/enterprise-training")
      const mods = loadModules()
      const empId = `emp_${targetEmployeeName}`
      for (const mod of roleKnowledge.trainingModules) {
        const realMod = mods.find((m: any) => m.name === mod.name)
        if (realMod) assignTraining(empId, targetEmployeeName, roleKnowledge.department, realMod.id, 14)
      }
    } catch {}
  }

  return roleKnowledge.concepts.length
}

// ═══════════════════════════════════════════════════
// P1a: 企业 AI 成熟度诊断
// ═══════════════════════════════════════════════════

export interface AIMaturityReport {
  companyName: string
  generatedAt: string
  scores: {
    dataSecurity: number        // L1
    aiToolProficiency: number   // L2
    aiJudgment: number          // L3
    humanAICollaboration: number // L4
    organizationalCognition: number // L5
    overallMaturity: number     // 0-100
  }
  maturityLevel: "beginner" | "developing" | "proficient" | "advanced" | "pioneer"
  benchmarks: { level: string; threshold: number; description: string }[]
  strengths: string[]
  weaknesses: string[]
  weekByWeekPlan: { week: number; title: string; focus: string; action: string; module?: string }[]
  estimatedTimeToNextLevel: number // weeks
  roiProjection: { timeSaved: string; costReduction: string; revenueUplift: string }
}

export function diagnoseAIMaturity(): AIMaturityReport {
  // Gather data from all layers
  const l1Attempts = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL1Attempts() } catch { return [] } })()
    : []
  const l2Submissions = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL2Submissions() } catch { return [] } })()
    : []
  const l3Attempts = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadL3Attempts() } catch { return [] } })()
    : []
  const workflows = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadWorkflows() } catch { return [] } })()
    : []
  const decisions = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-ai-capability").loadDecisions() } catch { return [] } })()
    : []
  const trainingRecords = typeof window !== "undefined"
    ? (() => { try { return require("@/lib/enterprise-training").loadRecords() } catch { return [] } })()
    : []
  const metrics = loadBusinessMetrics()

  const inst = typeof window !== "undefined" ? loadInstitution() : null

  // L1 score: Data Security
  const dataSecurity = l1Attempts.length >= 5
    ? Math.min(100, (l1Attempts.filter((a: any) => a.correct).length / l1Attempts.length) * 100)
    : l1Attempts.length > 0 ? (l1Attempts.filter((a: any) => a.correct).length / l1Attempts.length) * 60 : 10

  // L2 score: AI Tool Proficiency
  const aiToolProficiency = l2Submissions.length >= 4
    ? Math.min(100, (l2Submissions.length / 8) * 100)
    : l2Submissions.length > 0 ? l2Submissions.length * 12 : 5

  // L3 score: AI Judgment
  const aiJudgment = l3Attempts.length >= 3
    ? Math.min(100, (l3Attempts.filter((a: any) => a.passed).length / l3Attempts.length) * 100)
    : l3Attempts.length > 0 ? l3Attempts.filter((a: any) => a.passed).length * 20 : 5

  // L4 score: Human-AI Collaboration
  const humanAICollaboration = workflows.length >= 3
    ? Math.min(100, workflows.length * 15)
    : workflows.length > 0 ? workflows.length * 10 : 5

  // L5 score: Organizational Cognition
  const organizationalCognition = decisions.length >= 5
    ? Math.min(100, 30 + decisions.filter((d: any) => d.reviewDate).length * 10 + decisions.filter((d: any) => d.outcome === "正确").length * 5)
    : decisions.length > 0 ? decisions.length * 5 : 5

  const overallMaturity = Math.round(
    dataSecurity * 0.25 + aiToolProficiency * 0.2 + aiJudgment * 0.2 + humanAICollaboration * 0.2 + organizationalCognition * 0.15
  )

  let maturityLevel: AIMaturityReport["maturityLevel"] = "beginner"
  if (overallMaturity >= 80) maturityLevel = "pioneer"
  else if (overallMaturity >= 60) maturityLevel = "advanced"
  else if (overallMaturity >= 35) maturityLevel = "proficient"
  else if (overallMaturity >= 15) maturityLevel = "developing"

  const benchmarks = [
    { level: "入门", threshold: 0, description: "刚开始接触AI，大部分工作仍为纯人工" },
    { level: "发展", threshold: 15, description: "部分员工开始使用AI工具，初步建立安全意识" },
    { level: "熟练", threshold: 35, description: "AI工具普及率>50%，有系统培训计划" },
    { level: "领先", threshold: 60, description: "人机协作成为常态，AI参与决策和审查" },
    { level: "先锋", threshold: 80, description: "AI深度嵌入业务流程，形成组织认知体系" },
  ]

  const strengths: string[] = []
  if (dataSecurity >= 50) strengths.push("数据安全意识较强")
  if (aiToolProficiency >= 40) strengths.push("员工AI工具使用有一定基础")
  if (humanAICollaboration >= 30) strengths.push("已开始尝试人机协作工作流")
  if (organizationalCognition >= 25) strengths.push("组织有一定决策记录习惯")

  const weaknesses: string[] = []
  if (dataSecurity < 30) weaknesses.push("数据安全培训严重不足，存在较大隐患")
  if (aiToolProficiency < 25) weaknesses.push("AI工具使用率低，大部分员工未掌握Prompt工程")
  if (aiJudgment < 25) weaknesses.push("员工作出AI判断时缺乏批判性审视能力")
  if (humanAICollaboration < 20) weaknesses.push("尚未建立任何系统化的人机协作流程")
  if (organizationalCognition < 15) weaknesses.push("组织决策过程缺乏记录和复盘机制")

  // 12-week plan
  const weekByWeekPlan: AIMaturityReport["weekByWeekPlan"] = []
  const focusAreas = []

  if (dataSecurity < 50) focusAreas.push({ area: "数据安全基础", weeks: 2, module: "L1SecuritySandbox" })
  if (aiToolProficiency < 40) focusAreas.push({ area: "Prompt工程训练", weeks: 2, module: "L2PromptTraining" })
  if (aiJudgment < 40) focusAreas.push({ area: "AI判断力培养", weeks: 2, module: "L3AIJudgment" })
  if (humanAICollaboration < 30) focusAreas.push({ area: "人机协作工作流", weeks: 2, module: "L4HumanAICollab" })
  if (organizationalCognition < 25) focusAreas.push({ area: "组织认知建立", weeks: 2, module: "L5OrgCognition" })
  if (focusAreas.length === 0) focusAreas.push({ area: "持续优化迭代", weeks: 2, module: "" })

  let w = 1
  for (const fa of focusAreas) {
    for (let i = 0; i < fa.weeks; i++) {
      weekByWeekPlan.push({
        week: w,
        title: `第${w}周：${fa.area}${fa.weeks > 1 ? `(${i+1}/${fa.weeks})` : ""}`,
        focus: fa.area,
        action: i === 0 ? `启动${fa.area}模块，全员参与培训和考核` : `巩固${fa.area}学习内容，查漏补缺`,
        module: fa.module,
      })
      w++
    }
  }

  const estimatedTimeToNextLevel = Math.max(1, Math.round(
    (overallMaturity < 35 ? 8 : overallMaturity < 60 ? 12 : 6) -
    (focusAreas.length * 1.5)
  ))

  return {
    companyName: inst?.name || "贵公司",
    generatedAt: new Date().toISOString(),
    scores: { dataSecurity, aiToolProficiency, aiJudgment, humanAICollaboration, organizationalCognition, overallMaturity },
    maturityLevel,
    benchmarks,
    strengths,
    weaknesses,
    weekByWeekPlan,
    estimatedTimeToNextLevel,
    roiProjection: {
      timeSaved: "预计6个月后可节约 35-55% 重复性工作时间",
      costReduction: "AI辅助后培训成本降低 40%，新员工上岗周期缩短 60%",
      revenueUplift: "AI增强后的客户响应速度提升 2-3倍，直接提升转化率",
    },
  }
}

// ═══════════════════════════════════════════════════
// P1b: AI 思维教案生成器
// ═══════════════════════════════════════════════════

export interface LessonPlan {
  topic: string
  subject: string
  grade: string
  duration: number          // 分钟
  objectives: string[]
  sections: LessonSection[]
  thinkingExercises: ThinkingExercise[]
  assessment: AssessmentMethod
  generatedAt: string
}

export interface LessonSection {
  title: string
  timeAllocation: number    // 分钟
  content: string
  teacherGuidance: string
  materials: string[]
}

export interface ThinkingExercise {
  title: string
  type: "divergent" | "convergent" | "analogy" | "reverse" | "pipeline"
  prompt: string
  expectedOutcome: string
  extension: string
}

export interface AssessmentMethod {
  type: string
  questions: string[]
  successCriteria: string[]
}

const SUBJECT_NAMES: Record<string, string> = {
  mathematics: "数学", physics: "物理", chemistry: "化学", biology: "生物",
  history: "历史", geography: "地理", chinese: "语文", english: "英语",
}

export function generateLessonPlan(
  topic: string, subject: string, grade: string, duration: number = 45,
): LessonPlan {
  const subjectName = SUBJECT_NAMES[subject] || subject
  const now = new Date().toISOString()

  return {
    topic, subject, grade, duration,
    objectives: [
      `理解${topic}的核心概念和原理`,
      `能够用至少2种不同思维方式分析${topic}`,
      `将${topic}与真实世界应用场景建立联系`,
    ],
    sections: [
      {
        title: `导入 · 思维预热（${Math.round(duration * 0.1)}分钟）`,
        timeAllocation: Math.round(duration * 0.1),
        content: `用一个与${topic}相关的日常现象或趣味问题引入，激发学生好奇心`,
        teacherGuidance: `问学生："你们觉得${topic}在生活中有哪些应用？" 记录学生的初始想法，为后续对比做准备`,
        materials: ["多媒体素材（图片/短视频）", "白板或投影"],
      },
      {
        title: `核心讲解 · 概念建构（${Math.round(duration * 0.3)}分钟）`,
        timeAllocation: Math.round(duration * 0.3),
        content: `系统讲解${topic}的核心内容，用${subjectName}的学科框架组织知识`,
        teacherGuidance: `用思维导图或结构化板书呈现知识框架。每讲解一个概念，问学生"这个概念和刚才的那一个有什么关系？"`,
        materials: ["知识点卡片", "思维导图模板"],
      },
      {
        title: `思维训练 · 多维练习（${Math.round(duration * 0.35)}分钟）`,
        timeAllocation: Math.round(duration * 0.35),
        content: `用不同的思维方式来练习${topic}：类比思维、逆向思维、流程思维`,
        teacherGuidance: `分组进行：A组用类比法解释${topic}，B组用逆向法分析，C组画出流程。每组3分钟后换组，让每个学生都体验不同思维模式`,
        materials: ["练习纸", "彩色笔（每种思维模式对应一种颜色）"],
      },
      {
        title: `反思 · 思维回顾（${Math.round(duration * 0.15)}分钟）`,
        timeAllocation: Math.round(duration * 0.15),
        content: `回顾今天使用了哪几种思考方式，各自有什么感受`,
        teacherGuidance: `让每个学生用一句话总结今天的收获。问"今天哪种思考方式你觉得最有意思？为什么？"`,
        materials: ["思见思维打卡表"],
      },
      {
        title: `拓展 · 课后思考（${Math.round(duration * 0.1)}分钟）`,
        timeAllocation: Math.round(duration * 0.1),
        content: `布置一个需要用到今天所学思考方式的课后任务`,
        teacherGuidance: `布置一个开放性任务：让家长配合完成。强调"这个问题没有唯一答案，重要的是你的思考过程"`,
        materials: ["课后任务卡"],
      },
    ],
    thinkingExercises: [
      {
        title: `类比练习：${topic}像什么？`,
        type: "analogy",
        prompt: `你觉得${topic}在真实世界中像什么？请打一个比喻并解释你的比喻`,
        expectedOutcome: `学生能将抽象概念${topic}与日常生活经验建立联系，形成可记忆的类比`,
        extension: `让两个学生分享各自的比喻，比较谁的比喻更贴切`,
      },
      {
        title: `逆向练习：如果没有${topic}会怎样？`,
        type: "reverse",
        prompt: `试着从相反角度思考：如果${topic}不存在或反过来会怎样？`,

        expectedOutcome: `学生理解${topic}的必要性和边界条件`,
        extension: `引导学生发现：有时候反过来想比正着想更容易找到答案`,
      },
      {
        title: `发散练习：${topic}的3个可能应用`,
        type: "divergent",
        prompt: `头脑风暴：${topic}在生活中有哪些可能的应用？不求正确，只求发散`,
        expectedOutcome: `学生产生至少3个创意想法，培养发散思维能力`,
        extension: `选择一个最有趣的应用，分析其可行性和实现路径`,
      },
    ],
    assessment: {
      type: "形成性评价",
      questions: [
        `你能用自己的话解释${topic}吗？`,
        `你用了哪几种思考方式来理解${topic}？`,
        `${topic}在真实世界有什么应用？`,
      ],
      successCriteria: [
        `能准确复述${topic}的核心概念`,
        `能举出至少1个真实应用场景`,
        `能描述至少2种思考方式的使用过程`,
      ],
    },
    generatedAt: now,
  }
}

// ═══════════════════════════════════════════════════
// P2a: 家长每周自动推送摘要生成
// ═══════════════════════════════════════════════════

export interface WeeklyDigest {
  childName: string
  weekLabel: string
  generatedAt: string
  highlights: { icon: string; title: string; detail: string }[]
  masteryChange: number
  thinkingModes: string[]
  reviewStatus: { done: number; overdue: number; total: number }
  suggestion: string
}

export function generateWeeklyDigest(childName: string): WeeklyDigest | null {
  const rooms = loadRooms()
  const childRooms = rooms.filter(r => r.name.startsWith(childName))
  if (childRooms.length === 0) return null

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const items = childRooms.flatMap(r => r.items)
  const weekItems = items.filter(i => new Date(i.lastReviewedAt || i.createdAt) >= weekAgo)

  const mirror = generateThinkingMirror(childName, childName)

  const highlights: WeeklyDigest["highlights"] = []
  if (weekItems.length > 0) {
    highlights.push({ icon: "🧠", title: "本周思考", detail: `活跃探索了${weekItems.length}个概念` })
  }

  const improved = items
    .filter(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= weekAgo && i.mastery >= 0.7)
    .slice(0, 2)
  for (const it of improved) {
    highlights.push({ icon: "💡", title: "概念突破", detail: `"${it.label}"掌握度达到${Math.round(it.mastery * 100)}%` })
  }

  // Review status
  let done = 0, overdue = 0
  for (const it of items) {
    if (it.nextReviewAt && new Date(it.nextReviewAt) < now) overdue++
    if (it.lastReviewedAt && new Date(it.lastReviewedAt) >= weekAgo) done++
  }

  const masteryChange = mirror.growthRate > 0 ? mirror.growthRate * 100 : 0

  const suggestion = overdue > 3
    ? `有${overdue}个概念等待复习，建议周末花20分钟陪孩子回顾一下`
    : `本周节奏很好，继续保持！可以鼓励孩子把学到的概念讲给你听`

  return {
    childName,
    weekLabel: `${now.getFullYear()}年第${getWeekNumber(now)}周`,
    generatedAt: now.toISOString(),
    highlights,
    masteryChange,
    thinkingModes: mirror.dominantStyles.slice(0, 3).map(s => s.style),
    reviewStatus: { done, overdue, total: items.length },
    suggestion,
  }
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - start.getTime()
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
}

// ═══════════════════════════════════════════════════
// P2b: 企业能力可视化名片
// ═══════════════════════════════════════════════════

export interface CapabilityShowcase {
  companyName: string
  logo?: string
  primaryColor: string
  slogan: string
  generatedAt: string
  stats: { label: string; value: string; icon: string }[]
  aiMaturity: { level: string; score: number; badge: string }
  knowledgeAssets: { type: string; count: number; icon: string }[]
  topSkills: string[]
  certifications: string[]
  contactIntent: string
}

export function generateCapabilityShowcase(): CapabilityShowcase | null {
  const inst = typeof window !== "undefined" ? loadInstitution() : null
  if (!inst) return null

  const diag = diagnoseAIMaturity()
  const compound = computeCompoundIndex()
  const metrics = loadBusinessMetrics()
  const graph = buildInstitutionalKnowledgeGraph()

  const levelBadges: Record<string, string> = {
    beginner: "🥉 AI入门企业",
    developing: "🥈 AI发展企业",
    proficient: "🥇 AI熟练企业",
    advanced: "💎 AI领先企业",
    pioneer: "👑 AI先锋企业",
  }

  const stats: CapabilityShowcase["stats"] = [
    { label: "知识资产", value: `${graph.totalNodes}`, icon: "🧬" },
    { label: "AI成熟度", value: `${diag.scores.overallMaturity}分`, icon: "🤖" },
    { label: "月均复利", value: `${(compound.compoundRate * 100).toFixed(1)}%`, icon: "📈" },
    { label: "业务指标", value: `${metrics.length}项追踪`, icon: "📊" },
  ]

  const knowledgeAssets: CapabilityShowcase["knowledgeAssets"] = [
    { type: "已编码概念", count: graph.tokenCapital.codifiedConcepts, icon: "🧠" },
    { type: "工作流", count: graph.tokenCapital.codifiedWorkflows, icon: "🔗" },
    { type: "决策记录", count: graph.tokenCapital.codifiedDecisions, icon: "🎯" },
    { type: "培训完成", count: metricDone(), icon: "✅" },
  ]

  return {
    companyName: inst.name,
    primaryColor: inst.primaryColor,
    slogan: inst.slogan || "让思考可见",
    generatedAt: new Date().toISOString(),
    stats,
    aiMaturity: {
      level: diag.maturityLevel,
      score: diag.scores.overallMaturity,
      badge: levelBadges[diag.maturityLevel] || "AI入门企业",
    },
    knowledgeAssets,
    topSkills: diag.strengths.slice(0, 3),
    certifications: ["思见机构智能认证", "AI能力建设L1-L5体系"],
    contactIntent: "使用思见平台验证本企业真实能力数据",
  }
}

function metricDone(): number {
  try {
    const metrics = loadBusinessMetrics()
    return metrics.filter(m => m.currentValue >= m.targetValue * 0.8).length
  } catch { return 0 }
}
