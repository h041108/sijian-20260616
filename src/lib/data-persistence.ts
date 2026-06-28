// ─── 思见统一数据持久化层 ─────────────────────────────
// Supabase 主存储 + localStorage 开发回退
// 所有数据操作统一通过此层，不直接访问 localStorage

import { supabase } from "./supabase"
import type { SijianUser, UserRole, UserRelation, InviteCode, ClassRoom, EnterpriseOrg } from "./sijian-user"
import type { PlanId } from "./subscription"
import type { SavedChat } from "./memory"
import type { CognitionLogEntry } from "./cognition"
import type { VideoProject } from "./video-factory"

// ─── 环境检测 ──────────────────────────────────────

const IS_SERVER = typeof window === "undefined"
const HAS_SUPABASE = typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "").length > 0 &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 0

function db() { return supabase }

// ─── 工具 ──────────────────────────────────────────

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

// ═════════════════════════════════════════════════════
// 认证
// ═════════════════════════════════════════════════════

export async function getServerSession() {
  if (!HAS_SUPABASE) return null
  const { data: { session } } = await db().auth.getSession()
  return session
}

export async function getServerUser() {
  const session = await getServerSession()
  return session?.user ?? null
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await db().auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signUpWithEmail(email: string, password: string, nickname?: string) {
  const { data, error } = await db().auth.signUp({
    email, password,
    options: { data: { nickname } },
  })
  return { data, error }
}

export async function signOut() {
  await db().auth.signOut()
}

// ═════════════════════════════════════════════════════
// 用户画像
// ═════════════════════════════════════════════════════

export async function getProfile(userId: string): Promise<{ nickname: string; role: UserRole; avatar_url: string } | null> {
  if (!HAS_SUPABASE) return null
  const { data } = await db().from("profiles").select("nickname,role,avatar_url").eq("id", userId).single()
  return data
}

export async function updateProfile(userId: string, updates: { nickname?: string; role?: UserRole }) {
  if (!HAS_SUPABASE) return
  await db().from("profiles").update(updates).eq("id", userId)
}

// ═════════════════════════════════════════════════════
// 订阅
// ═════════════════════════════════════════════════════

export async function getSubscription(userId: string): Promise<{ plan_id: PlanId; expiry_date?: string } | null> {
  if (!HAS_SUPABASE) return null
  const { data } = await db().from("subscriptions").select("plan_id,expiry_date").eq("user_id", userId).single()
  return data
}

export async function setSubscriptionPlan(userId: string, planId: PlanId) {
  if (!HAS_SUPABASE) return
  await db().from("subscriptions").update({ plan_id: planId }).eq("user_id", userId)
}

// ═════════════════════════════════════════════════════
// 每日使用量
// ═════════════════════════════════════════════════════

export async function getDailyUsage(userId: string): Promise<{ chat_count: number } | null> {
  if (!HAS_SUPABASE) {
    const ls = lsGet("sijian_usage", { date: "", chatCount: 0 })
    return { chat_count: ls.date === new Date().toISOString().slice(0, 10) ? ls.chatCount : 0 }
  }
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db().from("daily_usage").select("chat_count").eq("user_id", userId).eq("usage_date", today).maybeSingle()
  return data
}

export async function incrementChatUsage(userId: string) {
  if (!HAS_SUPABASE) {
    const ls = lsGet("sijian_usage", { date: "", chatCount: 0 })
    const today = new Date().toISOString().slice(0, 10)
    if (ls.date !== today) { ls.date = today; ls.chatCount = 0 }
    ls.chatCount++
    lsSet("sijian_usage", ls)
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db().from("daily_usage").upsert({
    user_id: userId, usage_date: today, chat_count: 1,
  }, { onConflict: "user_id,usage_date" }).select().single()
  if (data) {
    await db().from("daily_usage").update({ chat_count: data.chat_count + 1 })
      .eq("user_id", userId).eq("usage_date", today)
  }
}

// ═════════════════════════════════════════════════════
// 思维空间
// ═════════════════════════════════════════════════════

export async function saveMindSpace(userId: string, data: {
  title?: string; input_text?: string; mind_space_json: any
  domain_type?: string; frame_type?: string
}) {
  if (!HAS_SUPABASE) return
  await db().from("mind_spaces").insert({ user_id: userId, ...data })
}

export async function loadMindSpaces(userId: string, limit = 50) {
  if (!HAS_SUPABASE) return []
  const { data } = await db().from("mind_spaces")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit)
  return data || []
}

// ═════════════════════════════════════════════════════
// 对话历史
// ═════════════════════════════════════════════════════

export async function saveChatSession(userId: string, chat: SavedChat) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_chats", []) as SavedChat[]
    const idx = all.findIndex(c => c.createdAt === chat.createdAt)
    if (idx >= 0) all[idx] = chat; else all.unshift(chat)
    lsSet("sijian_chats", all.slice(0, 50))
    return
  }
  await db().from("chat_sessions").upsert({
    id: chat.createdAt, user_id: userId, title: chat.title,
    messages: chat.messages || [], nodes: chat.nodes || [], edges: chat.edges || [],
    domain_type: chat.domainType, frame_type: chat.frameType,
  }, { onConflict: "id,user_id" })
}

export async function loadAllChatSessions(userId: string): Promise<SavedChat[]> {
  if (!HAS_SUPABASE) return lsGet("sijian_chats", [])
  const { data } = await db().from("chat_sessions")
    .select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50)
  return (data || []).map((r: any) => ({
    messages: r.messages || [], nodes: r.nodes || [], edges: r.edges || [],
    domainType: r.domain_type, frameType: r.frame_type,
    title: r.title, createdAt: r.id, updatedAt: r.updated_at,
  }))
}

export async function deleteChatSession(userId: string, sessionId: string) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_chats", []) as SavedChat[]
    lsSet("sijian_chats", all.filter(c => c.createdAt !== sessionId))
    return
  }
  await db().from("chat_sessions").delete().eq("id", sessionId).eq("user_id", userId)
}

// ═════════════════════════════════════════════════════
// 认知日志
// ═════════════════════════════════════════════════════

export async function saveCognitionLogEntry(userId: string, log: CognitionLogEntry) {
  if (!HAS_SUPABASE) {
    const logs = lsGet("sijian_cognition_logs", []) as CognitionLogEntry[]
    logs.push(log)
    lsSet("sijian_cognition_logs", logs.slice(-500))
    return
  }
  await db().from("cognition_logs").insert({
    user_id: userId, session_id: log.sessionId,
    state: log.state, intent: log.intent, emotion: log.emotion,
    cognitive_load: log.cognitiveLoad, dominant_lines: log.dominantLines,
    message_length: log.messageLength,
  })
}

export async function loadCognitionLogs(userId: string, limit = 100): Promise<CognitionLogEntry[]> {
  if (!HAS_SUPABASE) return lsGet("sijian_cognition_logs", [])
  const { data } = await db().from("cognition_logs")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit)
  return (data || []).map((r: any) => ({
    timestamp: r.created_at, userId: r.user_id, state: r.state,
    intent: r.intent, emotion: r.emotion, cognitiveLoad: r.cognitive_load,
    dominantLines: r.dominant_lines, messageLength: r.message_length,
    sessionId: r.session_id,
  }))
}

// ═════════════════════════════════════════════════════
// 视频项目
// ═════════════════════════════════════════════════════

export async function saveVideoProject(userId: string, project: VideoProject) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_video_projects", []) as VideoProject[]
    const idx = all.findIndex(p => p.id === project.id)
    if (idx >= 0) all[idx] = project; else all.unshift(project)
    lsSet("sijian_video_projects", all)
    return
  }
  await db().from("video_projects").upsert({
    id: project.id, user_id: userId, one_liner: project.oneLiner,
    genre: project.genre, style: project.style, duration: project.duration,
    aspect_ratio: project.aspectRatio, status: project.status,
    stages: project.stages, viral_template: project.viralTemplate,
  }, { onConflict: "id" })
}

export async function loadVideoProjects(userId: string): Promise<VideoProject[]> {
  if (!HAS_SUPABASE) return lsGet("sijian_video_projects", [])
  const { data } = await db().from("video_projects")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id, oneLiner: r.one_liner, genre: r.genre, style: r.style,
    duration: r.duration, aspectRatio: r.aspect_ratio, status: r.status,
    stages: r.stages || [], viralTemplate: r.viral_template,
    createdAt: r.created_at,
  }))
}

// ═════════════════════════════════════════════════════
// 班级、关系、组织、邀请码（异步版，开发环境回退到localStorage）
// ═════════════════════════════════════════════════════

export async function saveClass(cls: ClassRoom) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_classes", []) as ClassRoom[]
    const idx = all.findIndex(c => c.id === cls.id)
    if (idx >= 0) all[idx] = cls; else all.push(cls)
    lsSet("sijian_classes", all)
    return
  }
  await db().from("classes").upsert(cls, { onConflict: "id" })
}

export async function loadClasses(teacherId: string): Promise<ClassRoom[]> {
  if (!HAS_SUPABASE) return (lsGet("sijian_classes", []) as ClassRoom[]).filter(c => c.teacherId === teacherId)
  const { data } = await db().from("classes").select("*").eq("teacher_id", teacherId)
  return data || []
}

export async function saveRelation(rel: UserRelation) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_relations", []) as UserRelation[]
    all.push(rel); lsSet("sijian_relations", all); return
  }
  await db().from("user_relations").insert(rel)
}

export async function loadRelations(userId: string, type?: string): Promise<UserRelation[]> {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_relations", []) as UserRelation[]
    return all.filter(r => r.fromUserId === userId || r.toUserId === userId)
  }
  let q = db().from("user_relations").select("*").or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
  if (type) q = q.eq("type", type)
  const { data } = await q
  return data || []
}

export async function saveOrg(org: EnterpriseOrg) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_orgs", []) as EnterpriseOrg[]
    const idx = all.findIndex(o => o.id === org.id)
    if (idx >= 0) all[idx] = org; else all.push(org)
    lsSet("sijian_orgs", all)
    return
  }
  await db().from("enterprise_orgs").upsert(org, { onConflict: "id" })
}

export async function loadOrgs(adminId: string): Promise<EnterpriseOrg[]> {
  if (!HAS_SUPABASE) return (lsGet("sijian_orgs", []) as EnterpriseOrg[]).filter(o => o.adminId === adminId)
  const { data } = await db().from("enterprise_orgs").select("*").eq("admin_id", adminId)
  return data || []
}

export async function saveInviteCode(invite: InviteCode) {
  if (!HAS_SUPABASE) {
    const all = lsGet("sijian_invites", []) as InviteCode[]
    const idx = all.findIndex(i => i.code === invite.code)
    if (idx >= 0) all[idx] = invite; else all.push(invite)
    lsSet("sijian_invites", all)
    return
  }
  await db().from("invite_codes").upsert({
    code: invite.code, created_by: invite.createdBy, type: invite.type,
    class_id: invite.classId, org_id: invite.orgId,
    max_uses: invite.maxUses, used_count: invite.usedCount,
    expires_at: invite.expiresAt,
  }, { onConflict: "code" })
}

export async function loadInviteCodes(createdBy: string): Promise<InviteCode[]> {
  if (!HAS_SUPABASE) return (lsGet("sijian_invites", []) as InviteCode[]).filter(i => i.createdBy === createdBy)
  const { data } = await db().from("invite_codes").select("*").eq("created_by", createdBy)
  return data?.map((r: any) => ({
    code: r.code, createdBy: r.created_by, type: r.type,
    classId: r.class_id, orgId: r.org_id,
    maxUses: r.max_uses, usedCount: r.used_count,
    expiresAt: r.expires_at, createdAt: r.created_at,
  })) || []
}
