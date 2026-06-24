// ─── 即影 · 图片工作室 ──────────────────────────
// 统一视觉内容生产中枢：prompt编辑→参考图上传→模型路由→3版对比→增强

export type StudioModel =
  | "midjourney" | "jimeng" | "flux" | "dalle3" | "stable_diffusion"

export const STUDIO_MODELS: { id: StudioModel; name: string; provider: string; strengths: string; bestFor: string }[] = [
  { id: "midjourney", name: "Midjourney V7", provider: "Midjourney", strengths: "艺术质感·光影构图", bestFor: "商品主图/角色定妆/艺术创作" },
  { id: "jimeng", name: "即梦4.0", provider: "ByteDance", strengths: "中文理解·角色一致", bestFor: "封面/海报/漫剧关键帧" },
  { id: "flux", name: "Flux Pro", provider: "Black Forest Labs", strengths: "指令跟随·细节丰富", bestFor: "产品详情页/精确描述" },
  { id: "dalle3", name: "DALL-E 3", provider: "OpenAI", strengths: "自然语言·文字渲染", bestFor: "创意概念/文字图文" },
]

export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16" | "3:4" | "custom"

export interface StudioProject {
  id: string
  prompt: string
  optimizedPrompt?: string
  referenceImages: string[]
  style: string
  model: StudioModel
  aspectRatio: AspectRatio
  results: {
    url: string
    score: number
    model: StudioModel
    prompt: string
    seed?: number
  }[]
  selectedIndex?: number
  enhanced?: { url: string; type: string }
  createdAt: string
}

export function createStudioProject(prompt: string): StudioProject {
  return {
    id: `studio_${Date.now()}`,
    prompt,
    referenceImages: [],
    style: "写实电影风格",
    model: "jimeng",
    aspectRatio: "16:9",
    results: [],
    createdAt: new Date().toISOString(),
  }
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
