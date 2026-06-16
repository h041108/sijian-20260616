// ─── 思见用户系统 ────────────────────────────────────
// 微信扫码登录 + 邀请码绑定 + 角色管理
// 开发环境使用 localStorage 模拟

export type UserRole = "student" | "parent" | "teacher" | "enterprise_admin" | "enterprise_member"

export interface SijianUser {
  id: string
  openid: string          // 微信 openid（开发环境用随机ID模拟）
  nickname: string
  avatar: string
  role: UserRole
  phone?: string
  createdAt: string
  // 组织归属
  orgId?: string          // 班级ID / 企业ID
  orgRole?: string        // "班主任" / "部门经理" / "成员"
}

export type RelationType = "parent_child" | "teacher_student" | "enterprise_member"

export interface UserRelation {
  id: string
  fromUserId: string      // 授权方（家长/教师/企业主）
  toUserId: string         // 被授权方（孩子/学生/员工）
  type: RelationType
  classId?: string         // 教师-学生关系中的班级ID
  orgId?: string           // 企业关系中的组织ID
  createdAt: string
}

export interface InviteCode {
  code: string             // 6位数字
  createdBy: string        // 创建者 userId
  type: RelationType
  classId?: string         // 班级邀请码
  orgId?: string           // 企业邀请码
  maxUses: number
  usedCount: number
  expiresAt?: string
  createdAt: string
}

export interface ClassRoom {
  id: string
  name: string             // "高三(3)班"
  teacherId: string
  subject: string
  grade: string
  inviteCode: string
  studentCount: number
  createdAt: string
}

export interface EnterpriseOrg {
  id: string
  name: string
  adminId: string
  inviteCode: string
  memberCount: number
  createdAt: string
}

// ─── localStorage 键名 ────────────────────────────

const USERS_KEY = "sijian_users"
const RELATIONS_KEY = "sijian_relations"
const INVITES_KEY = "sijian_invites"
const CLASSES_KEY = "sijian_classes"
const ORGS_KEY = "sijian_orgs"
const SESSION_KEY = "sijian_session"

// ─── 当前登录用户 ─────────────────────────────────

export function getCurrentUser(): SijianUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function loginAs(user: SijianUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

// ─── 微信扫码登录（开发环境模拟） ────────────────────

export function generateMockWechatLogin(): SijianUser {
  const id = `wx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const nicknames = ["思远同学","浩然爸爸","雨桐妈妈","张老师","子涵同学","刘总","王主管","李经理"]
  const avatarColors = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6","#F97316","#06B6D4"]
  return {
    id,
    openid: id,
    nickname: nicknames[Math.floor(Math.random() * nicknames.length)],
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    role: "student",  // 默认学生角色，登录后可切换
    createdAt: new Date().toISOString(),
  }
}

// ─── 用户管理 ──────────────────────────────────────

export function loadUsers(): SijianUser[] {
  try { const r = localStorage.getItem(USERS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveUsers(users: SijianUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }

export function registerUser(user: SijianUser): SijianUser {
  const users = loadUsers()
  const existing = users.find(u => u.openid === user.openid)
  if (existing) {
    loginAs(existing)
    return existing
  }
  users.push(user)
  saveUsers(users)
  loginAs(user)
  return user
}

export function updateUserRole(role: UserRole): void {
  const user = getCurrentUser()
  if (!user) return
  user.role = role
  loginAs(user)
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) { users[idx].role = role; saveUsers(users) }
}

// ─── 邀请码 ────────────────────────────────────────

function loadInvites(): InviteCode[] {
  try { const r = localStorage.getItem(INVITES_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveInvites(invites: InviteCode[]) { localStorage.setItem(INVITES_KEY, JSON.stringify(invites)) }

export function generateInviteCode(type: RelationType, classId?: string, orgId?: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const user = getCurrentUser()
  if (!user) return code

  const invites = loadInvites()
  invites.push({
    code,
    createdBy: user.id,
    type,
    classId,
    orgId,
    maxUses: type === "enterprise_member" ? 200 : type === "teacher_student" ? 60 : 5,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  })
  saveInvites(invites)
  return code
}

export function validateInviteCode(code: string): InviteCode | null {
  const invites = loadInvites()
  const invite = invites.find(i => i.code === code)
  if (!invite) return null
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return null
  if (invite.usedCount >= invite.maxUses) return null
  return invite
}

export function useInviteCode(code: string, userId: string): InviteCode | null {
  const invites = loadInvites()
  const invite = invites.find(i => i.code === code)
  if (!invite || invite.usedCount >= invite.maxUses) return null
  invite.usedCount++
  saveInvites(invites)

  // 创建关系
  const relations = loadRelations()
  relations.push({
    id: `rel_${Date.now()}`,
    fromUserId: invite.createdBy,
    toUserId: userId,
    type: invite.type,
    classId: invite.classId,
    orgId: invite.orgId,
    createdAt: new Date().toISOString(),
  })
  saveRelations(relations)

  return invite
}

// ─── 关系管理 ──────────────────────────────────────

function loadRelations(): UserRelation[] {
  try { const r = localStorage.getItem(RELATIONS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveRelations(relations: UserRelation[]) { localStorage.setItem(RELATIONS_KEY, JSON.stringify(relations)) }

export function getMyChildren(): SijianUser[] {
  const user = getCurrentUser(); if (!user) return []
  const relations = loadRelations().filter(r => r.fromUserId === user.id && r.type === "parent_child")
  const users = loadUsers()
  return relations.map(r => users.find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyStudents(): SijianUser[] {
  const user = getCurrentUser(); if (!user) return []
  const relations = loadRelations().filter(r => r.fromUserId === user.id && r.type === "teacher_student")
  const users = loadUsers()
  return relations.map(r => users.find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyOrgMembers(): SijianUser[] {
  const user = getCurrentUser(); if (!user) return []
  const relations = loadRelations().filter(r => r.fromUserId === user.id && r.type === "enterprise_member")
  const users = loadUsers()
  return relations.map(r => users.find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyParent(): SijianUser | null {
  const user = getCurrentUser(); if (!user) return null
  const relation = loadRelations().find(r => r.toUserId === user.id && r.type === "parent_child")
  if (!relation) return null
  return loadUsers().find(u => u.id === relation.fromUserId) || null
}

export function getMyTeacher(): SijianUser | null {
  const user = getCurrentUser(); if (!user) return null
  const relation = loadRelations().find(r => r.toUserId === user.id && r.type === "teacher_student")
  if (!relation) return null
  return loadUsers().find(u => u.id === relation.fromUserId) || null
}

// ─── 班级管理 ──────────────────────────────────────

function loadClasses(): ClassRoom[] {
  try { const r = localStorage.getItem(CLASSES_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveClasses(classes: ClassRoom[]) { localStorage.setItem(CLASSES_KEY, JSON.stringify(classes)) }

export function createClass(name: string, subject: string, grade: string): ClassRoom {
  const user = getCurrentUser()
  const code = generateInviteCode("teacher_student")
  const cls: ClassRoom = {
    id: `class_${Date.now()}`,
    name, teacherId: user?.id || "", subject, grade,
    inviteCode: code,
    studentCount: 0,
    createdAt: new Date().toISOString(),
  }
  const classes = loadClasses()
  classes.push(cls)
  saveClasses(classes)
  // 关联邀请码到班级
  const invites = loadInvites()
  const inv = invites.find(i => i.code === code)
  if (inv) inv.classId = cls.id
  saveInvites(invites)
  return cls
}

export function getMyClasses(): ClassRoom[] {
  const user = getCurrentUser(); if (!user) return []
  return loadClasses().filter(c => c.teacherId === user.id)
}

// ─── 企业组织管理 ──────────────────────────────────

function loadOrgs(): EnterpriseOrg[] {
  try { const r = localStorage.getItem(ORGS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveOrgs(orgs: EnterpriseOrg[]) { localStorage.setItem(ORGS_KEY, JSON.stringify(orgs)) }

export function createOrg(name: string): EnterpriseOrg {
  const user = getCurrentUser()
  const code = generateInviteCode("enterprise_member")
  const org: EnterpriseOrg = {
    id: `org_${Date.now()}`,
    name, adminId: user?.id || "", inviteCode: code,
    memberCount: 0, createdAt: new Date().toISOString(),
  }
  const orgs = loadOrgs()
  orgs.push(org)
  saveOrgs(orgs)
  return org
}

export function getMyOrgs(): EnterpriseOrg[] {
  const user = getCurrentUser(); if (!user) return []
  return loadOrgs().filter(o => o.adminId === user.id)
}
