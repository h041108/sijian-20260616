// ─── 即影 · 图片工作室 ──────────────────────────
// 统一视觉内容生产中枢：prompt编辑→参考图上传→模型路由→3版对比→增强

export type StudioModel =
  | "jimeng" | "midjourney" | "flux" | "dalle3" | "gpt_image"

export const STUDIO_MODELS: { id: StudioModel; name: string; provider: string; strengths: string; bestFor: string; apiAvailable: boolean }[] = [
  { id: "jimeng",    name: "即梦 Seedream 4.5", provider: "ByteDance", strengths: "中文理解·角色一致",     bestFor: "封面/海报/漫剧关键帧",     apiAvailable: true },
  { id: "gpt_image", name: "GPT-Image 2",       provider: "OpenAI",    strengths: "指令跟随·文字渲染",     bestFor: "创意概念/文字图文",       apiAvailable: false },
  { id: "midjourney",name: "Midjourney V7",      provider: "Midjourney",strengths: "艺术质感·光影构图",   bestFor: "商品主图/角色定妆",       apiAvailable: false },
  { id: "flux",      name: "Flux Pro",           provider: "Black Forest Labs", strengths: "细节丰富·精确描述", bestFor: "产品详情页",             apiAvailable: false },
]

export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16" | "3:4"
export const ASPECT_PIXELS: Record<AspectRatio, { w: number; h: number }> = {
  "1:1":  { w: 1920, h: 1920 },
  "4:3":  { w: 1920, h: 1440 },
  "16:9": { w: 1920, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "3:4":  { w: 1440, h: 1920 },
}

export interface StudioResult {
  url: string
  score: number
  model: StudioModel
  prompt: string
  seed?: number
}

export interface StudioProject {
  id: string
  prompt: string
  optimizedPrompt?: string
  referenceImages: string[]
  style: string
  model: StudioModel
  aspectRatio: AspectRatio
  results: StudioResult[]
  selectedIndex?: number
  createdAt: string
}

export function createStudioProject(prompt: string): StudioProject {
  return { id: `studio_${Date.now()}`, prompt, referenceImages: [], style: "写实电影风格", model: "jimeng", aspectRatio: "16:9", results: [], createdAt: new Date().toISOString() }
}

const STORAGE_KEY = "sijian_studio_projects"
export function loadProjects(): StudioProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}
export function saveProject(p: StudioProject) {
  const projects = loadProjects()
  const idx = projects.findIndex((x) => x.id === p.id)
  if (idx >= 0) projects[idx] = p
  else projects.unshift(p)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 50)))
}

// ─── 统一生图函数 ─────────────────────────────
// 根据选中的模型，调用对应的API
export async function generateImage(
  prompt: string,
  model: StudioModel,
  aspectRatio: AspectRatio,
  existingImageUrl?: string,
): Promise<{ url: string; seed?: number }> {
  const pixels = ASPECT_PIXELS[aspectRatio] || { w: 1920, h: 1080 }

  // 即梦 → /api/video/frame
  if (model === "jimeng") {
    const body: any = { prompt, width: pixels.w, height: pixels.h }
    if (existingImageUrl) {
      body.image = existingImageUrl
      body.image_strength = 0.35
    }
    const res = await fetch("/api/video/frame", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.url && !data.placeholder) return { url: data.url, seed: data.seed }
    throw new Error(data.message || "生成失败")
  }

  // 其他模型暂不可用
  throw new Error("该模型的API尚未配置")
}
