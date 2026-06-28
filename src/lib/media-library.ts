// ─── 即影素材管理中心 ────────────────────────────
// 统一管理用户上传的所有媒体资产：图片、角色、产品、生成内容

import { supabase } from "./supabase"

// ═══════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════

export type MediaType = "image" | "character" | "product" | "scene" | "generated"
export type MediaSource = "user_upload" | "ai_generated" | "imported"

export interface MediaAsset {
  id: string
  userId: string
  type: MediaType
  source: MediaSource
  url: string
  thumbnailUrl: string
  name: string
  description: string
  tags: string[]
  fileSize?: number
  width?: number
  height?: number
  // 关联数据
  characterId?: string    // 如果是角色图，关联的角色ID
  productId?: string       // 如果是产品图，关联的产品ID
  // 元数据
  createdAt: string
  updatedAt: string
  usedCount: number        // 被引用的次数
  favorite: boolean
}

export interface MediaFolder {
  id: string
  name: string
  icon: string
  type: MediaType
  count: number
}

// ═══════════════════════════════════════════════════
// 存储
// ═══════════════════════════════════════════════════

const STORAGE_KEY = "jiying_media_library"

export function loadMedia(): MediaAsset[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

export function saveMediaAsset(asset: MediaAsset) {
  const all = loadMedia()
  const idx = all.findIndex(a => a.id === asset.id)
  if (idx >= 0) { all[idx] = asset } else { all.unshift(asset) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 200)))
  // 异步同步 Supabase
  syncMediaToSupabase(asset)
}

export function deleteMediaAsset(id: string) {
  const all = loadMedia().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getMediaByType(type: MediaType): MediaAsset[] {
  return loadMedia().filter(a => a.type === type)
}

export function getFavorites(): MediaAsset[] {
  return loadMedia().filter(a => a.favorite)
}

async function syncMediaToSupabase(asset: MediaAsset) {
  try {
    if (!(process.env.NEXT_PUBLIC_SUPABASE_URL || "").length) return
    const { data: { user } }: any = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("media_assets").upsert({
      id: asset.id, user_id: user.id, type: asset.type, source: asset.source,
      url: asset.url, thumbnail_url: asset.thumbnailUrl, name: asset.name,
      description: asset.description, tags: asset.tags,
      file_size: asset.fileSize, width: asset.width, height: asset.height,
      character_id: asset.characterId, product_id: asset.productId,
      favorite: asset.favorite, used_count: asset.usedCount,
    }, { onConflict: "id" })
  } catch {}
}

// ═══════════════════════════════════════════════════
// 文件夹分类
// ═══════════════════════════════════════════════════

export const MEDIA_FOLDERS: MediaFolder[] = [
  { id: "all", name: "全部", icon: "🖼️", type: "image", count: 0 },
  { id: "image", name: "图片素材", icon: "📷", type: "image", count: 0 },
  { id: "character", name: "角色", icon: "👤", type: "character", count: 0 },
  { id: "product", name: "产品图", icon: "📦", type: "product", count: 0 },
  { id: "scene", name: "场景", icon: "🌄", type: "scene", count: 0 },
  { id: "generated", name: "AI 生成", icon: "✨", type: "generated", count: 0 },
  { id: "favorites", name: "收藏", icon: "⭐", type: "image", count: 0 },
]

export function getFolderCounts(): MediaFolder[] {
  const all = loadMedia()
  return MEDIA_FOLDERS.map(f => {
    if (f.id === "all") return { ...f, count: all.length }
    if (f.id === "favorites") return { ...f, count: all.filter(a => a.favorite).length }
    return { ...f, count: all.filter(a => a.type === f.type).length }
  })
}

// ═══════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════

export function genMediaId(): string {
  return `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function addUploadedToMediaLibrary(
  url: string,
  name: string,
  type: MediaType,
  userId: string,
  tags: string[] = [],
  extra?: Partial<MediaAsset>,
): MediaAsset {
  const asset: MediaAsset = {
    id: genMediaId(),
    userId,
    type,
    source: "user_upload",
    url,
    thumbnailUrl: url,
    name,
    description: "",
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usedCount: 0,
    favorite: false,
    ...extra,
  }
  saveMediaAsset(asset)
  return asset
}

export function addGeneratedToMediaLibrary(
  url: string,
  prompt: string,
  userId: string,
  tags: string[] = [],
): MediaAsset {
  const asset: MediaAsset = {
    id: genMediaId(),
    userId,
    type: "generated",
    source: "ai_generated",
    url,
    thumbnailUrl: url,
    name: prompt.slice(0, 30),
    description: prompt,
    tags: [...tags, "ai"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usedCount: 0,
    favorite: false,
  }
  saveMediaAsset(asset)
  return asset
}
