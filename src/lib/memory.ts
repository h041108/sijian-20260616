// ─── 对话记忆持久化（localStorage）───

import { supabase } from "./supabase"
export interface SavedChat {
  messages: ChatMessage[]
  nodes: MindNode[]
  edges: MindEdge[]
  domainType: string
  frameType: string
  title: string
  createdAt: string
  updatedAt: string
}

import type { ChatMessage, MindNode, MindEdge } from "./types"

const STORAGE_KEY = "sijian_chats"

// ─── 获取当前用户 ID ───
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.id || null
  } catch {
    return null
  }
}

// ─── 保存到 localStorage（同步，保持现有行为）───
function saveChatLocal(chat: SavedChat): void {
  if (typeof window === "undefined") return
  try {
    const all = loadAllChatsLocal()
    const idx = all.findIndex((c) => c.createdAt === chat.createdAt)
    if (idx >= 0) all[idx] = chat; else all.unshift(chat)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)))
  } catch {}
}

// ─── 保存 ───────────────

export function saveChat(chat: SavedChat): void {
  saveChatLocal(chat)
}

export function loadAllChatsLocal(): SavedChat[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function loadAllChats(): SavedChat[] {
  return loadAllChatsLocal()
}

export function loadLatestChatLocal(): SavedChat | null {
  const all = loadAllChatsLocal()
  return all.length > 0 ? all[0] : null
}

export function loadLatestChat(): SavedChat | null {
  return loadLatestChatLocal()
}

export function deleteChatLocal(createdAt: string): void {
  const all = loadAllChatsLocal().filter((c) => c.createdAt !== createdAt)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deleteChat(createdAt: string): void {
  deleteChatLocal(createdAt)
}

// ─── Async 持久化（localStorage 即时 + Supabase 后台同步）───

export async function saveChatAsync(chat: SavedChat): Promise<void> {
  saveChatLocal(chat)
  // 异步写入 Supabase（不等待完成）
  getCurrentUserId().then(userId => {
    if (!userId) return
    import("./data-persistence").then(m => m.saveChatSession(userId, chat))
  }).catch(() => {})
}

export async function deleteChatAsync(createdAt: string): Promise<void> {
  deleteChatLocal(createdAt)
  getCurrentUserId().then(userId => {
    if (!userId) return
    import("./data-persistence").then(m => m.deleteChatSession(userId, createdAt))
  }).catch(() => {})
}

export async function loadAllChatsAsync(): Promise<SavedChat[]> {
  const userId = await getCurrentUserId()
  if (!userId) return loadAllChatsLocal()
  try {
    const { loadAllChatSessions } = await import("./data-persistence")
    const remote = await loadAllChatSessions(userId)
    if (remote.length > 0) {
      // 合并本地 + 远程，远程优先
      const local = loadAllChatsLocal()
      const merged = new Map<string, SavedChat>()
      for (const c of remote) merged.set(c.createdAt, c)
      for (const c of local) if (!merged.has(c.createdAt)) merged.set(c.createdAt, c)
      const result = Array.from(merged.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 50)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)) } catch {}
      return result
    }
  } catch {}
  return loadAllChatsLocal()
}

export async function loadLatestChatAsync(): Promise<SavedChat | null> {
  const all = await loadAllChatsAsync()
  return all.length > 0 ? all[0] : null
}

// ─── 生成对话标题 ─────────────

export function generateTitle(content: string): string {
  return content.slice(0, 30).replace(/\n/g, " ").trim() || "新对话"
}
