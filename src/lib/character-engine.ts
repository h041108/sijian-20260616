// ─── 即影角色管理系统引擎 ──────────────────────────
// 角色模板定义、存储、参考图管理
// B方案为主：AI 生图创建角色，保留本地上传入

import { supabase } from "./supabase"

// ═══════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════

export type CharacterGender = "男" | "女" | "其他"
export type CharacterSource = "ai_generated" | "user_upload"

export interface CharacterTemplate {
  id: string
  userId: string
  name: string
  description: string            // 一句话描述
  referenceImages: {
    front: string                 // 正面图 URL
    side?: string                 // 侧面图 URL（可选）
    back?: string                 // 背面图 URL（可选）
  }
  appearance: {
    gender: CharacterGender
    age: string                   // "18岁青少年"
    hairStyle: string             // "黑色长直发"
    hairColor: string             // "黑色"
    height: string                // "165cm"
    bodyType: string              // "苗条/健壮/丰满"
    eyeColor?: string             // "棕色"
    skinTone?: string             // "白皙"
  }
  costume: {
    top: string                   // "白色校服衬衫"
    bottom: string                // "深蓝色百褶裙"
    shoes: string                 // "白色运动鞋"
    accessories?: string[]        // ["红色发带"]
    style?: string                // "现代/古风/科幻"
  }
  personality: string             // "活泼开朗"
  styleHint: string               // 生成时用的风格关键词，如"写实电影风格"
  source: CharacterSource
  thumbnailUrl: string            // 列表用缩略图
  createdAt: string
  updatedAt: string
}

export interface StoryboardShot {
  id: string
  shotNumber: number
  duration: number
  description: string             // 画面描述（可编辑）
  dialogue: string                // 对白（可编辑）
  cameraAngle: string             // "特写/全景/中景"
  cameraMovement: string          // "固定/推/拉/摇/跟"
  mood: string                    // "紧张/温馨/悬疑"
  transition: string              // "切/淡入淡出"
  characterActions: string        // 角色在这一镜的动作（可编辑）
  sceneSetting: string            // 场景设定（可编辑）
  keyframeUrl?: string            // 生成的关键帧
  seedanceTaskId?: string         // 视频任务ID
  videoUrl?: string               // 最终视频URL
  status: "pending" | "generating" | "done" | "failed"
}

export interface SceneTemplate {
  id: string
  userId: string
  name: string                    // "赛博朋克夜城"
  description: string
  referenceImageUrl?: string
  tags: string[]
  createdAt: string
}

// ═══════════════════════════════════════════════════
// 存储键
// ═══════════════════════════════════════════════════

const CHARS_KEY = "jiying_characters"
const SCENES_KEY = "jiying_scenes"

// ═══════════════════════════════════════════════════
// 角色 CRUD
// ═══════════════════════════════════════════════════

export function loadCharacters(): CharacterTemplate[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CHARS_KEY) || "[]") } catch { return [] }
}

export function saveCharacter(char: CharacterTemplate) {
  const all = loadCharacters()
  const idx = all.findIndex(c => c.id === char.id)
  if (idx >= 0) { all[idx] = char } else { all.unshift(char) }
  localStorage.setItem(CHARS_KEY, JSON.stringify(all))
  // 异步同步到 Supabase
  syncCharacterToSupabase(char)
}

export function deleteCharacter(id: string) {
  const all = loadCharacters().filter(c => c.id !== id)
  localStorage.setItem(CHARS_KEY, JSON.stringify(all))
}

export function getCharacter(id: string): CharacterTemplate | undefined {
  return loadCharacters().find(c => c.id === id)
}

async function syncCharacterToSupabase(char: CharacterTemplate) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.length) return
    const { data: { user } }: any = await supabase.auth.getUser()
    if (!user) return
    // 同步到 character_templates 表
    await supabase.from("character_templates").upsert({
      id: char.id, user_id: user.id, name: char.name,
      description: char.description,
      reference_images: JSON.stringify(char.referenceImages),
      appearance: JSON.stringify(char.appearance),
      costume: JSON.stringify(char.costume),
      personality: char.personality,
      style_hint: char.styleHint,
      source: char.source,
      thumbnail_url: char.thumbnailUrl,
      created_at: char.createdAt,
    }, { onConflict: "id" })
  } catch {}
}

// ═══════════════════════════════════════════════════
// 场景 CRUD
// ═══════════════════════════════════════════════════

export function loadScenes(): SceneTemplate[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(SCENES_KEY) || "[]") } catch { return [] }
}

export function saveScene(scene: SceneTemplate) {
  const all = loadScenes()
  const idx = all.findIndex(s => s.id === scene.id)
  if (idx >= 0) { all[idx] = scene } else { all.unshift(scene) }
  localStorage.setItem(SCENES_KEY, JSON.stringify(all))
}

// ═══════════════════════════════════════════════════
// 工具：生成 ID
// ═══════════════════════════════════════════════════

export function genId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ═══════════════════════════════════════════════════
// 工具：构建 Seedance 参考图参数
// ═══════════════════════════════════════════════════

export function buildReferenceImageUrls(char?: CharacterTemplate, scene?: SceneTemplate): string[] {
  const urls: string[] = []
  if (char?.referenceImages.front) urls.push(char.referenceImages.front)
  if (char?.referenceImages.side) urls.push(char.referenceImages.side)
  if (char?.referenceImages.back) urls.push(char.referenceImages.back)
  if (scene?.referenceImageUrl) urls.push(scene.referenceImageUrl)
  return urls.slice(0, 9) // API 限制最多 9 张
}

// ═══════════════════════════════════════════════════
// 工具：构建角色描述 prompt
// ═══════════════════════════════════════════════════

export function buildCharacterPrompt(char: CharacterTemplate): string {
  const parts = [
    `${char.appearance.gender}性`,
    char.appearance.age,
    char.appearance.hairStyle,
    char.appearance.hairColor ? `${char.appearance.hairColor}头发` : "",
    char.appearance.height,
    char.appearance.bodyType ? `${char.appearance.bodyType}身材` : "",
    char.appearance.eyeColor ? `${char.appearance.eyeColor}眼睛` : "",
    char.appearance.skinTone ? `${char.appearance.skinTone}皮肤` : "",
    `穿${char.costume.top}`,
    char.costume.bottom ? `和${char.costume.bottom}` : "",
    char.costume.shoes ? `，脚穿${char.costume.shoes}` : "",
    char.costume.style ? `，${char.costume.style}风格` : "",
  ].filter(Boolean).join("，")
  return `${char.name}：${parts}。性格：${char.personality}。`
}

// ═══════════════════════════════════════════════════
// 工具：构建 Seedance prompt（融入角色+场景）
// ═══════════════════════════════════════════════════

export function buildShotPrompt(
  character: CharacterTemplate | undefined,
  scene: SceneTemplate | undefined,
  shot: StoryboardShot,
  style: string,
): string {
  const charDesc = character ? buildCharacterPrompt(character) : ""
  const sceneDesc = scene ? `场景：${scene.description}。` : ""
  const actionDesc = shot.characterActions ? `，动作：${shot.characterActions}` : ""
  const moodDesc = shot.mood ? `，氛围：${shot.mood}` : ""
  const cameraDesc = `${shot.cameraAngle}${shot.cameraMovement ? `，运镜：${shot.cameraMovement}` : ""}`
  return `${style}风格。${charDesc}${sceneDesc}${shot.description}${actionDesc}。${cameraDesc}${moodDesc}，电影级画质，高清`.slice(0, 400)
}
