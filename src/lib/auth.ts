// ─── 思见认证系统 ────────────────────────────────────
// Supabase Auth + localStorage 开发回退
// 统一身份认证层

import { supabase } from "./supabase"

export type UserRole = "student" | "parent" | "teacher" | "enterprise_admin" | "enterprise_member"

export interface SijianUser {
  id: string
  openid: string
  nickname: string
  avatar: string
  role: UserRole
  phone?: string
  createdAt: string
  orgId?: string
  orgRole?: string
  email?: string
}

export interface InviteCode {
  code: string
  createdBy: string
  type: "parent_child" | "teacher_student" | "enterprise_member"
  classId?: string
  orgId?: string
  maxUses: number
  usedCount: number
  expiresAt?: string
  createdAt: string
}

export interface ClassRoom {
  id: string
  name: string
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

export interface UserRelation {
  id: string
  fromUserId: string
  toUserId: string
  type: "parent_child" | "teacher_student" | "enterprise_member"
  classId?: string
  orgId?: string
  createdAt: string
}

const IS_SERVER = typeof window === "undefined"
const HAS_SUPABASE = () => {
  if (IS_SERVER) return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL || "").length > 0 &&
    !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 0
}

function lsGet<T>(key: string, fallback: T): T {
  if (IS_SERVER) return fallback
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function lsSet(key: string, val: any) {
  if (IS_SERVER) return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}
function lsRemove(key: string) {
  if (IS_SERVER) return
  try { localStorage.removeItem(key) } catch {}
}

// ─── 当前用户 ─────────────────────────────────

export async function getCurrentUser(): Promise<SijianUser | null> {
  if (IS_SERVER) return null
  // Supabase session
  if (HAS_SUPABASE()) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname,role,avatar_url,phone")
        .eq("id", session.user.id)
        .single()
      if (profile) {
        return {
          id: session.user.id,
          openid: session.user.id,
          nickname: profile.nickname || session.user.email?.split("@")[0] || "用户",
          avatar: profile.avatar_url || "#6366F1",
          role: (profile.role as UserRole) || "student",
          phone: profile.phone || "",
          email: session.user.email || "",
          createdAt: session.user.created_at || new Date().toISOString(),
        }
      }
    }
  }
  // fallback localStorage
  const raw = localStorage.getItem("sijian_session")
  return raw ? JSON.parse(raw) : null
}

export async function loginAs(user: SijianUser): Promise<void> {
  if (IS_SERVER) return
  lsSet("sijian_session", user)
}

export async function logout(): Promise<void> {
  if (IS_SERVER) return
  if (HAS_SUPABASE()) {
    await supabase.auth.signOut()
  }
  lsRemove("sijian_session")
}

export function generateMockWechatLogin(role: UserRole = "student"): SijianUser {
  const id = `wx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const roleNicknames: Record<UserRole, string[]> = {
    student: ["思远同学","子涵同学","沐辰同学","一诺同学"],
    parent: ["浩然爸爸","雨桐妈妈","小明爸爸","思远妈妈"],
    teacher: ["张老师","李老师","王老师","陈老师"],
    enterprise_admin: ["刘总","王总","李总","陈总"],
    enterprise_member: ["王主管","李经理","张主管","赵经理"],
  }
  const avatarColors = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6","#F97316","#06B6D4"]
  const names = roleNicknames[role] || roleNicknames.student
  return {
    id, openid: id,
    nickname: names[Math.floor(Math.random() * names.length)],
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    role, createdAt: new Date().toISOString(),
  }
}

// ─── 注册/登录 ─────────────────────────────────

export async function registerUser(user: SijianUser): Promise<SijianUser> {
  const users = loadUsers()
  const existing = users.find(u => u.openid === user.openid)
  if (existing) {
    await loginAs(existing)
    return existing
  }
  users.push(user)
  saveUsers(users)
  await loginAs(user)
  return user
}

export async function updateUserRole(role: UserRole): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  user.role = role
  await loginAs(user)
  if (HAS_SUPABASE()) {
    await supabase.from("profiles").update({ role }).eq("id", user.id)
  }
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) { users[idx].role = role; saveUsers(users) }
}

// ─── 用户持久化（localStorage 回退）────────────

function loadUsers(): SijianUser[] {
  return lsGet("sijian_users", [])
}
function saveUsers(users: SijianUser[]) {
  lsSet("sijian_users", users)
}

// ─── 邀请码 ────────────────────────────────────

export function generateInviteCode(type: InviteCode["type"], classId?: string, orgId?: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return code
  const invites = lsGet<InviteCode[]>("sijian_invites", [])
  invites.push({
    code, createdBy: user.id, type, classId, orgId,
    maxUses: type === "enterprise_member" ? 200 : type === "teacher_student" ? 60 : 5,
    usedCount: 0, createdAt: new Date().toISOString(),
  })
  lsSet("sijian_invites", invites)
  return code
}

export function validateInviteCode(code: string): InviteCode | null {
  const invites = lsGet<InviteCode[]>("sijian_invites", [])
  const invite = invites.find(i => i.code === code)
  if (!invite) return null
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return null
  if (invite.usedCount >= invite.maxUses) return null
  return invite
}

export function useInviteCode(code: string, userId: string): InviteCode | null {
  const invites = lsGet<InviteCode[]>("sijian_invites", [])
  const invite = invites.find(i => i.code === code)
  if (!invite || invite.usedCount >= invite.maxUses) return null
  invite.usedCount++
  lsSet("sijian_invites", invites)
  const relations = lsGet<UserRelation[]>("sijian_relations", [])
  relations.push({
    id: `rel_${Date.now()}`,
    fromUserId: invite.createdBy, toUserId: userId, type: invite.type,
    classId: invite.classId, orgId: invite.orgId,
    createdAt: new Date().toISOString(),
  })
  lsSet("sijian_relations", relations)
  return invite
}

// ─── 关系管理 ──────────────────────────────────

export function getMyChildren(): SijianUser[] {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return []
  const relations = lsGet<UserRelation[]>("sijian_relations", []).filter(r => r.fromUserId === user.id && r.type === "parent_child")
  const users = loadUsers()
  return relations.map(r => users.find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyStudents(): SijianUser[] {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return []
  const relations = lsGet<UserRelation[]>("sijian_relations", []).filter(r => r.fromUserId === user.id && r.type === "teacher_student")
  return relations.map(r => loadUsers().find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyOrgMembers(): SijianUser[] {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return []
  const relations = lsGet<UserRelation[]>("sijian_relations", []).filter(r => r.fromUserId === user.id && r.type === "enterprise_member")
  return relations.map(r => loadUsers().find(u => u.id === r.toUserId)).filter(Boolean) as SijianUser[]
}

export function getMyParent(): SijianUser | null {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return null
  const relation = lsGet<UserRelation[]>("sijian_relations", []).find(r => r.toUserId === user.id && r.type === "parent_child")
  if (!relation) return null
  return loadUsers().find(u => u.id === relation.fromUserId) || null
}

export function getMyTeacher(): SijianUser | null {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return null
  const relation = lsGet<UserRelation[]>("sijian_relations", []).find(r => r.toUserId === user.id && r.type === "teacher_student")
  if (!relation) return null
  return loadUsers().find(u => u.id === relation.fromUserId) || null
}

// ─── 班级管理 ──────────────────────────────────

export function createClass(name: string, subject: string, grade: string): ClassRoom {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  const code = generateInviteCode("teacher_student")
  const cls: ClassRoom = {
    id: `class_${Date.now()}`,
    name, teacherId: user?.id || "", subject, grade,
    inviteCode: code, studentCount: 0,
    createdAt: new Date().toISOString(),
  }
  const classes = lsGet<ClassRoom[]>("sijian_classes", [])
  classes.push(cls)
  lsSet("sijian_classes", classes)
  return cls
}

export function getMyClasses(): ClassRoom[] {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return []
  return lsGet<ClassRoom[]>("sijian_classes", []).filter(c => c.teacherId === user.id)
}

// ─── 企业组织 ──────────────────────────────────

export function createOrg(name: string): EnterpriseOrg {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  const code = generateInviteCode("enterprise_member")
  const org: EnterpriseOrg = {
    id: `org_${Date.now()}`,
    name, adminId: user?.id || "", inviteCode: code,
    memberCount: 0, createdAt: new Date().toISOString(),
  }
  const orgs = lsGet<EnterpriseOrg[]>("sijian_orgs", [])
  orgs.push(org)
  lsSet("sijian_orgs", orgs)
  return org
}

export function getMyOrgs(): EnterpriseOrg[] {
  const raw = localStorage.getItem("sijian_session")
  const user = raw ? JSON.parse(raw) as SijianUser : null
  if (!user) return []
  return lsGet<EnterpriseOrg[]>("sijian_orgs", []).filter(o => o.adminId === user.id)
}
