// ─── 对话记忆持久化（localStorage） ─────────────────

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

// ─── 保存 ────────────────────────────────────────

export function saveChat(chat: SavedChat): void {
  if (typeof window === "undefined") return
  try {
    const all = loadAllChats()
    // 用 updatedAt 作为唯一标识
    const idx = all.findIndex((c) => c.createdAt === chat.createdAt)
    if (idx >= 0) {
      all[idx] = chat
    } else {
      all.unshift(chat)
    }
    // 最多存 50 条
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)))
  } catch {
    // 存储满了就清旧数据
  }
}

export function loadAllChats(): SavedChat[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function loadLatestChat(): SavedChat | null {
  const all = loadAllChats()
  return all.length > 0 ? all[0] : null
}

export function deleteChat(createdAt: string): void {
  const all = loadAllChats().filter((c) => c.createdAt !== createdAt)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

// ─── 生成对话标题 ───────────────────────────────

export function generateTitle(content: string): string {
  return content.slice(0, 30).replace(/\n/g, " ").trim() || "新对话"
}
