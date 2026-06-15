// ─── 记忆宫殿 — 数据模型 + 艾宾浩斯复习调度 ─────────────

export interface MemoryRoom {
  id: string
  name: string           // "数学思维室"
  subject: string        // "mathematics"
  description: string
  createdAt: string
  items: PalaceItem[]
}

export interface PalaceItem {
  id: string
  label: string           // 概念标签，≤6字
  content: string         // 完整概念内容
  shape: string
  color: string
  anchors: { label: string; profession: string; parameters: string }[]  // 应用锚点
  // 固定位置（用户手动拖拽或在2D图上放置）
  position: { x: number; y: number }
  positionLabel?: string  // "门口左边第三个格子"
  // 艾宾浩斯复习调度
  reviewSchedule: ReviewSlot[]
  lastReviewedAt?: string
  nextReviewAt?: string
  reviewCount: number
  mastery: number         // 0-1, 掌握程度
  // 来源追踪
  sourceSpaceId?: string  // 从哪个对话空间来的
  sourceTeacherId?: string
  createdAt: string
}

export interface ReviewSlot {
  intervalDays: number    // 1, 3, 7, 30, 90 ...
  scheduledAt: string
  completedAt?: string
  score?: number          // 1-5 自我评分
}

// 艾宾浩斯遗忘曲线间隔（天）
const EBBINGHAUS_INTERVALS = [1, 3, 7, 30, 90, 180, 365]

// 计算下一次复习时间
function calcNextReview(reviewCount: number): string {
  const idx = Math.min(reviewCount, EBBINGHAUS_INTERVALS.length - 1)
  const days = EBBINGHAUS_INTERVALS[idx]
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// 创建复习计划（一组复习槽）
function createReviewSlots(): ReviewSlot[] {
  return EBBINGHAUS_INTERVALS.map((days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return { intervalDays: days, scheduledAt: d.toISOString() }
  })
}

// ─── 存储层（localStorage） ────────────────────────

const ROOMS_KEY = "sijian_memory_palace"

export function loadRooms(): MemoryRoom[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(ROOMS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}

function saveRooms(rooms: MemoryRoom[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
}

// ─── 房间操作 ───────────────────────────────────

export function createRoom(name: string, subject: string): MemoryRoom {
  return {
    id: genId(),
    name,
    subject,
    description: `${name} — 存放${subject}相关的思维概念`,
    createdAt: new Date().toISOString(),
    items: [],
  }
}

export function addRoom(room: MemoryRoom): void {
  const rooms = loadRooms()
  rooms.push(room)
  saveRooms(rooms)
}

export function deleteRoom(id: string): void {
  saveRooms(loadRooms().filter(r => r.id !== id))
}

// ─── 物品操作 ───────────────────────────────────

export function addItemToRoom(
  roomId: string,
  item: {
    label: string; content: string; shape: string; color: string
    anchors: { label: string; profession: string; parameters: string }[]
    sourceSpaceId?: string; sourceTeacherId?: string
  },
): void {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (!room) return

  const newItem: PalaceItem = {
    id: genId(),
    label: item.label.slice(0, 6),
    content: item.content,
    shape: item.shape,
    color: item.color,
    anchors: item.anchors || [],
    position: { x: room.items.length * 80 + 40, y: 60 },  // 默认从左到右排列
    reviewSchedule: createReviewSlots(),
    reviewCount: 0,
    mastery: 0.3,
    sourceSpaceId: item.sourceSpaceId,
    sourceTeacherId: item.sourceTeacherId,
    createdAt: new Date().toISOString(),
  }
  newItem.nextReviewAt = calcNextReview(0)

  room.items.push(newItem)
  saveRooms(rooms)
}

export function removeItemFromRoom(roomId: string, itemId: string): void {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (room) {
    room.items = room.items.filter(i => i.id !== itemId)
    saveRooms(rooms)
  }
}

export function updateItemPosition(roomId: string, itemId: string, pos: { x: number; y: number }): void {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (room) {
    const item = room.items.find(i => i.id === itemId)
    if (item) { item.position = pos; item.positionLabel = undefined }
    saveRooms(rooms)
  }
}

// ─── 复习操作 ───────────────────────────────────

export function completeReview(roomId: string, itemId: string, score: number): PalaceItem | null {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (!room) return null

  const item = room.items.find(i => i.id === itemId)
  if (!item) return null

  // 标记最近的未完成复习槽为已完成
  const slot = item.reviewSchedule.find(s => !s.completedAt)
  if (slot) {
    slot.completedAt = new Date().toISOString()
    slot.score = score
  }

  item.reviewCount++
  item.lastReviewedAt = new Date().toISOString()
  item.nextReviewAt = calcNextReview(item.reviewCount)
  item.mastery = Math.min(1, item.mastery + score * 0.05)

  saveRooms(rooms)
  return item
}

// ─── 管理数据 ─────────────────────────────────

export interface TeacherDashboard {
  totalStudents: number
  students: StudentMemoryReport[]
  weakConcepts: { label: string; averageMastery: number; studentCount: number }[]
  topConcepts: { label: string; averageMastery: number }[]
  overallMastery: number
}

export interface StudentMemoryReport {
  studentId: string
  studentName: string
  rooms: number
  items: number
  reviewedToday: number
  overdue: number
  averageMastery: number
  lastActivity?: string
}

export function getTeacherDashboard(studentIds?: string[]): TeacherDashboard {
  const rooms = loadRooms()
  // 按来源教师分组
  const now = new Date()

  // 概念掌握度聚合
  const conceptMap = new Map<string, { total: number; count: number; students: Set<string> }>()
  const studentMap = new Map<string, { rooms: Set<string>; items: number; reviewed: number; overdue: number; masterySum: number; masteryCount: number; lastActivity: string }>()

  for (const room of rooms) {
    // 从房间名提取学生名（格式："赵思远 · 数学"）
    const studentName = room.name?.split(" · ")[0] || room.id
    const studentId = studentName

    for (const item of room.items) {
      // 按学生聚合
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, { rooms: new Set(), items: 0, reviewed: 0, overdue: 0, masterySum: 0, masteryCount: 0, lastActivity: room.createdAt })
      }
      const s = studentMap.get(studentId)!
      s.rooms.add(room.id)
      s.items++
      s.masterySum += item.mastery
      s.masteryCount++
      if (item.lastReviewedAt && new Date(item.lastReviewedAt) > new Date(now.getTime() - 86400000)) s.reviewed++
      if (item.nextReviewAt && new Date(item.nextReviewAt) < now) s.overdue++
      if (item.lastReviewedAt && item.lastReviewedAt > s.lastActivity) s.lastActivity = item.lastReviewedAt

      // 按概念聚合
      if (!conceptMap.has(item.label)) {
        conceptMap.set(item.label, { total: 0, count: 0, students: new Set() })
      }
      const c = conceptMap.get(item.label)!
      c.total += item.mastery
      c.count++
      c.students.add(studentId)
    }
  }

  const students: StudentMemoryReport[] = Array.from(studentMap.entries()).map(([id, data], i) => ({
    studentId: id,
    studentName: id,
    rooms: data.rooms.size,
    items: data.items,
    reviewedToday: data.reviewed,
    overdue: data.overdue,
    averageMastery: data.masteryCount > 0 ? data.masterySum / data.masteryCount : 0,
    lastActivity: data.lastActivity,
  }))

  const concepts = Array.from(conceptMap.entries())
    .map(([label, data]) => ({ label, averageMastery: data.total / data.count, studentCount: data.students.size }))
    .sort((a, b) => a.averageMastery - b.averageMastery)  // 差的在前

  const overallMastery = concepts.length > 0 ? concepts.reduce((s, c) => s + c.averageMastery, 0) / concepts.length : 0

  return {
    totalStudents: students.length || 1,
    students,
    weakConcepts: concepts.filter(c => c.averageMastery < 0.6).slice(0, 10),
    topConcepts: concepts.filter(c => c.averageMastery >= 0.8).slice(0, 10),
    overallMastery,
  }
}

// ─── 简易 ID 生成 ────────────────────────────────

function genId(): string {
  return `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
