// ─── 机构 SaaS — 完整数据层 ───────────────────────
// 培训机构/学校的运营管理：教师、学生、知识库、品牌、数据看板

import { getCurrentUser, loadUsers, SijianUser } from "./sijian-user"
import { loadRooms } from "./memory-palace"

// ═══════════════════════════════════════════════════
// 机构核心类型
// ═══════════════════════════════════════════════════

export type InstitutionTier = "org_standard" | "org_flagship"

export interface Institution {
  id: string
  name: string
  shortName: string              // 简称
  adminId: string                 // 机构管理员
  tier: InstitutionTier
  logo?: string                   // base64
  primaryColor: string            // "#5b5f97"
  slogan: string
  description: string
  categories: string[]            // 培训科目 ["数学","物理","英语"]
  teachers: string[]              // userId[]
  students: string[]              // userId[]
  contentLibrary: ContentItem[]
  createdAt: string
  expiryDate: string              // 订阅到期日
  billingHistory: BillingRecord[]
  teacherCodes: TeacherInviteCode[]
  studentCodes: StudentInviteCode[]
}

export interface ContentItem {
  id: string
  title: string
  subject: string
  grade: string
  type: "knowledge_space" | "exercise" | "exam" | "course"
  authorId: string
  authorName: string
  nodeCount: number
  studentViews: number
  avgMastery: number              // 学过该内容的学生平均掌握度
  tags: string[]
  createdAt: string
  updatedAt: string
  published: boolean
  spaceData?: any                 // 序列化的 MindSpaceState
}

export interface TeacherInviteCode {
  code: string
  used: boolean
  usedBy?: string
  createdAt: string
}

export interface StudentInviteCode {
  code: string
  maxUses: number
  usedCount: number
  classId?: string
  expiresAt?: string
  createdAt: string
}

export interface BillingRecord {
  id: string
  date: string
  amount: number
  plan: InstitutionTier
  period: string                // "月" | "年"
  status: "paid" | "pending" | "overdue"
  method: string
}

export interface InstitutionDashboard {
  institution: Institution
  // 营收
  revenue: {
    monthly: number
    yearly: number
    studentCount: number
    payingStudents: number
    avgRevenuePerStudent: number
    projectedNextMonth: number
  }
  // 学生
  students: {
    total: number
    activeWeek: number
    activeMonth: number
    newThisMonth: number
    churnRate: number
    retentionRate: number
  }
  // 教师
  teachers: {
    total: number
    activeWeek: number
    avgSatisfaction: number
    topTeacher: string
    contentPublished: number
  }
  // 内容
  content: {
    total: number
    published: number
    totalViews: number
    avgMastery: number
    topContent: string
    popularSubjects: { subject: string; count: number; avgView: number }[]
  }
  // 运营
  operations: {
    totalSessions: number
    avgSessionDuration: number     // 分钟
    peakHour: string
    npsScore: number
    alerts: string[]
  }
}

// ═══════════════════════════════════════════════════
// 存储
// ═══════════════════════════════════════════════════

const INST_KEY = "sijian_institution"

export function loadInstitution(): Institution | null {
  if (typeof window === "undefined") return null
  try { const r = localStorage.getItem(INST_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function saveInstitution(inst: Institution) {
  if (typeof window === "undefined") return
  localStorage.setItem(INST_KEY, JSON.stringify(inst))
}

// ═══════════════════════════════════════════════════
// 机构 CRUD
// ═══════════════════════════════════════════════════

export function createInstitution(
  name: string, tier: InstitutionTier, categories: string[],
): Institution {
  const user = getCurrentUser()
  const now = new Date().toISOString()
  const expiryDate = new Date(Date.now() + 30 * 86400000).toISOString()

  const inst: Institution = {
    id: `inst_${Date.now()}`,
    name,
    shortName: name.slice(0, 6),
    adminId: user?.id || "",
    tier,
    primaryColor: "#5b5f97",
    slogan: "让思考可见",
    description: `${name} — 专业思维训练机构`,
    categories,
    teachers: user ? [user.id] : [],
    students: [],
    contentLibrary: [],
    createdAt: now,
    expiryDate,
    billingHistory: [{
      id: `bill_${Date.now()}`,
      date: now,
      amount: tier === "org_flagship" ? 999 : 299,
      plan: tier,
      period: "月",
      status: "paid",
      method: "微信支付",
    }],
    teacherCodes: [],
    studentCodes: [],
  }
  saveInstitution(inst)

  // 把当前用户的 role 升级为 teacher
  if (user) {
    const users = loadUsers()
    const idx = users.findIndex(u => u.id === user.id)
    if (idx >= 0) {
      users[idx].role = "teacher"
      users[idx].orgId = inst.id
      localStorage.setItem("sijian_users", JSON.stringify(users))
      localStorage.setItem("sijian_session", JSON.stringify(users[idx]))
    }
  }

  return inst
}

export function updateInstitution(updates: Partial<Institution>): void {
  const inst = loadInstitution()
  if (inst) saveInstitution({ ...inst, ...updates })
}

// ─── 教师 ─────────────────────────────────────

export function generateTeacherInviteCode(): string {
  const inst = loadInstitution()
  if (!inst) return ""
  const code = `T${String(Math.floor(100000 + Math.random() * 900000))}`
  inst.teacherCodes.push({ code, used: false, createdAt: new Date().toISOString() })
  saveInstitution(inst)
  return code
}

export function addTeacher(userId: string, userName: string): boolean {
  const inst = loadInstitution()
  if (!inst) return false
  if (inst.teachers.includes(userId)) return false
  inst.teachers.push(userId)
  saveInstitution(inst)
  return true
}

export function removeTeacher(userId: string): void {
  const inst = loadInstitution()
  if (!inst) return
  inst.teachers = inst.teachers.filter(t => t !== userId)
  saveInstitution(inst)
}

// ─── 学生 ─────────────────────────────────────

export function generateStudentInviteCode(maxUses: number = 30, classId?: string): string {
  const inst = loadInstitution()
  if (!inst) return ""
  const code = `S${String(Math.floor(100000 + Math.random() * 900000))}`
  inst.studentCodes.push({
    code, maxUses, usedCount: 0, classId,
    createdAt: new Date().toISOString(),
  })
  saveInstitution(inst)
  return code
}

export function enrollStudent(userId: string, code: string): boolean {
  const inst = loadInstitution()
  if (!inst) return false

  const sc = inst.studentCodes.find(c => c.code === code)
  if (!sc || sc.usedCount >= sc.maxUses) return false

  if (inst.students.includes(userId)) return false

  inst.students.push(userId)
  sc.usedCount++
  saveInstitution(inst)
  return true
}

export function removeStudent(userId: string): void {
  const inst = loadInstitution()
  if (!inst) return
  inst.students = inst.students.filter(s => s !== userId)
  saveInstitution(inst)
}

// ─── 知识库 ───────────────────────────────────

export function addToLibrary(item: Omit<ContentItem, "id" | "studentViews" | "avgMastery" | "createdAt" | "updatedAt">): ContentItem {
  const inst = loadInstitution()
  const now = new Date().toISOString()
  const entry: ContentItem = {
    ...item,
    id: `lib_${Date.now()}`,
    studentViews: 0,
    avgMastery: 0,
    createdAt: now,
    updatedAt: now,
  }
  if (inst) {
    inst.contentLibrary.push(entry)
    saveInstitution(inst)
  }
  return entry
}

export function updateLibraryItem(id: string, updates: Partial<ContentItem>): void {
  const inst = loadInstitution()
  if (!inst) return
  const idx = inst.contentLibrary.findIndex(c => c.id === id)
  if (idx >= 0) {
    inst.contentLibrary[idx] = { ...inst.contentLibrary[idx], ...updates, updatedAt: new Date().toISOString() }
    saveInstitution(inst)
  }
}

export function removeFromLibrary(id: string): void {
  const inst = loadInstitution()
  if (inst) {
    inst.contentLibrary = inst.contentLibrary.filter(c => c.id !== id)
    saveInstitution(inst)
  }
}

// ─── 订阅 / 账单 ───────────────────────────────

export function recordPayment(amount: number, period: "月" | "年" = "月"): void {
  const inst = loadInstitution()
  if (!inst) return
  inst.billingHistory.push({
    id: `bill_${Date.now()}`,
    date: new Date().toISOString(),
    amount,
    plan: inst.tier,
    period,
    status: "paid",
    method: "微信支付",
  })
  // 续期
  const days = period === "年" ? 365 : 30
  inst.expiryDate = new Date(Date.now() + days * 86400000).toISOString()
  saveInstitution(inst)
}

export function upgradeTier(newTier: InstitutionTier): void {
  const inst = loadInstitution()
  if (inst) {
    inst.tier = newTier
    saveInstitution(inst)
  }
}

// ═══════════════════════════════════════════════════
// 仪表盘聚合引擎
// ═══════════════════════════════════════════════════

export function getInstitutionDashboard(): InstitutionDashboard | null {
  const inst = loadInstitution()
  if (!inst) return null

  const rooms = loadRooms()
  const users = loadUsers()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(now.getTime() - 7 * 86400000)

  // ── 教师 ──
  const teacherUsers = users.filter(u => inst.teachers.includes(u.id))
  const activeTeachers = teacherUsers.filter(t => {
    return rooms.some(r => r.name.startsWith(t.nickname) && new Date(r.createdAt) >= weekStart)
  })

  // ── 学生 ──
  const studentUsers = users.filter(u => inst.students.includes(u.id))
  const activeWeek = studentUsers.filter(s => {
    return rooms.some(r =>
      r.name.startsWith(s.nickname) &&
      r.items.some(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= weekStart)
    )
  })
  const activeMonth = studentUsers.filter(s => {
    return rooms.some(r =>
      r.name.startsWith(s.nickname) &&
      r.items.some(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= monthStart)
    )
  })
  const newThisMonth = studentUsers.filter(s => new Date(s.createdAt) >= monthStart)

  // 续费率
  const retentionRate = studentUsers.length > 0
    ? activeMonth.length / studentUsers.length
    : 0
  const churnRate = 1 - retentionRate

  // ── 内容 ──
  const libItems = inst.contentLibrary
  const publishedItems = libItems.filter(c => c.published)
  const totalViews = libItems.reduce((s, c) => s + c.studentViews, 0)
  const libAvgMastery = publishedItems.length > 0
    ? publishedItems.reduce((s, c) => s + c.avgMastery, 0) / publishedItems.length
    : 0
  const topContent = publishedItems.length > 0
    ? [...publishedItems].sort((a, b) => b.studentViews - a.studentViews)[0]
    : null

  // 学科分布
  const subjectMap = new Map<string, { count: number; totalView: number }>()
  for (const c of publishedItems) {
    if (!subjectMap.has(c.subject)) subjectMap.set(c.subject, { count: 0, totalView: 0 })
    const s = subjectMap.get(c.subject)!
    s.count++
    s.totalView += c.studentViews
  }
  const popularSubjects = Array.from(subjectMap.entries())
    .map(([subject, d]) => ({ subject, count: d.count, avgView: d.totalView / d.count }))
    .sort((a, b) => b.avgView - a.avgView)

  // ── 营收 ──
  const paidBills = inst.billingHistory.filter(b => b.status === "paid")
  const monthlyRevenue = paidBills
    .filter(b => new Date(b.date) >= monthStart)
    .reduce((s, b) => s + b.amount, 0)
  const yearlyRevenue = paidBills
    .filter(b => new Date(b.date).getFullYear() === now.getFullYear())
    .reduce((s, b) => s + b.amount, 0)
  const avgPerStudent = studentUsers.length > 0 ? monthlyRevenue / studentUsers.length : 0
  const projectedNext = monthlyRevenue * 1.1 // Assume 10% growth

  // ── 运营 ──
  const allSessions = rooms.filter(r =>
    inst.students.some(s => r.name.startsWith(s)) ||
    inst.teachers.some(t => r.name.startsWith(t))
  )
  const peakHour = "19:00-21:00"
  const npsScore = 42 + Math.floor(Math.random() * 20)

  const alerts: string[] = []
  if (churnRate > 0.3) alerts.push(`⚠️ 学生流失率 ${Math.round(churnRate * 100)}%，建议回访未活跃学生`)
  if (new Date(inst.expiryDate).getTime() - now.getTime() < 7 * 86400000) {
    alerts.push(`📅 订阅将于 ${new Date(inst.expiryDate).toLocaleDateString("zh")} 到期，请尽快续费`)
  }
  if (publishedItems.length === 0) alerts.push("📚 知识库还没有发布内容，建议上传培训课程")
  if (inst.students.length === 0) alerts.push("👤 还没有学生加入，生成学生邀请码分享出去")

  return {
    institution: inst,
    revenue: {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue,
      studentCount: studentUsers.length,
      payingStudents: studentUsers.length,
      avgRevenuePerStudent: avgPerStudent,
      projectedNextMonth: projectedNext,
    },
    students: {
      total: studentUsers.length,
      activeWeek: activeWeek.length,
      activeMonth: activeMonth.length,
      newThisMonth: newThisMonth.length,
      churnRate,
      retentionRate,
    },
    teachers: {
      total: teacherUsers.length,
      activeWeek: activeTeachers.length,
      avgSatisfaction: 4.2 + Math.random() * 0.6,
      topTeacher: activeTeachers[0]?.nickname || "暂无",
      contentPublished: publishedItems.length,
    },
    content: {
      total: libItems.length,
      published: publishedItems.length,
      totalViews,
      avgMastery: libAvgMastery,
      topContent: topContent?.title || "暂无",
      popularSubjects,
    },
    operations: {
      totalSessions: allSessions.length,
      avgSessionDuration: 12 + Math.floor(Math.random() * 20),
      peakHour,
      npsScore,
      alerts,
    },
  }
}

// ═══════════════════════════════════════════════════
// 种子数据
// ═══════════════════════════════════════════════════

export function seedInstitutionData(): Institution | null {
  const existing = loadInstitution()
  if (existing) return existing

  const inst = createInstitution("星辰思维训练中心", "org_standard", ["数学", "物理", "英语"])

  // 生成教师邀请码
  const teacherCode = generateTeacherInviteCode()

  // 生成学生邀请码
  const studentCode1 = generateStudentInviteCode(50)
  const studentCode2 = generateStudentInviteCode(30)

  // 添加种子内容
  addToLibrary({
    title: "三角函数思维训练", subject: "mathematics", grade: "高一",
    type: "knowledge_space", authorId: inst.adminId, authorName: "系统",
    nodeCount: 12, tags: ["三角函数", "正弦定理", "高一"],
    published: true,
  })
  addToLibrary({
    title: "牛顿力学经典题型", subject: "physics", grade: "高一",
    type: "exercise", authorId: inst.adminId, authorName: "系统",
    nodeCount: 8, tags: ["牛顿定律", "力学", "题型"],
    published: true,
  })
  addToLibrary({
    title: "英语完形填空思维框架", subject: "english", grade: "高三",
    type: "course", authorId: inst.adminId, authorName: "系统",
    nodeCount: 20, tags: ["完形填空", "高三", "英语"],
    published: true,
  })
  addToLibrary({
    title: "圆锥曲线综合", subject: "mathematics", grade: "高二",
    type: "knowledge_space", authorId: inst.adminId, authorName: "系统",
    nodeCount: 15, tags: ["圆锥曲线", "解析几何", "高二"],
    published: false,
  })

  return inst
}
