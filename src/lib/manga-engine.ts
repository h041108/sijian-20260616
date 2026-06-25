// ─── 即影 · 漫剧生成引擎 ─────────────────────────
// 图片序列→Seedream出图→Seedance成片→字幕→BGM→导出

export interface MangaFrame {
  id: string
  imageUrl: string
  videoUrl?: string
  seedanceTaskId?: string
  seedanceStatus?: string
  duration: number
  cameraMove: string
  dialogue: string
  generating?: boolean
}

export interface MangaProject {
  id: string
  title: string
  frames: MangaFrame[]
  audio: {
    ttsVoice: string
    ttsUrl?: string
    bgmUrl?: string
    bgmVolume: number
    ttsVolume: number
  }
  subtitles: { enabled: boolean; style: "white" | "yellow" | "custom"; content?: string }
  cover?: string
  outputUrl?: string
  status: "draft" | "rendering" | "done" | "failed"
  aspectRatio: string
  createdAt: string
}

export const CAMERA_MOVES = [
  { id: "none", label: "无" }, { id: "push", label: "推镜" }, { id: "pull", label: "拉镜" },
  { id: "pan_left", label: "左移" }, { id: "pan_right", label: "右移" },
  { id: "pan_up", label: "上移" }, { id: "pan_down", label: "下移" },
  { id: "zoom_in", label: "放大" }, { id: "zoom_out", label: "缩小" },
]

export const TTS_VOICES = [
  { id: "male_deep", label: "深沉男声" }, { id: "male_warm", label: "温暖男声" },
  { id: "female_sweet", label: "甜美女声" }, { id: "female_professional", label: "专业女声" },
]

export function createMangaProject(title: string): MangaProject {
  return { id: `manga_${Date.now()}`, title, frames: [], audio: { ttsVoice: "female_sweet", bgmVolume: 30, ttsVolume: 80 }, subtitles: { enabled: true, style: "white" }, status: "draft", aspectRatio: "9:16", createdAt: new Date().toISOString() }
}

const STORAGE_KEY = "sijian_manga_projects"
export function loadMangaProjects(): MangaProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}
export function saveMangaProject(p: MangaProject) {
  const projects = loadMangaProjects()
  const idx = projects.findIndex((x) => x.id === p.id)
  if (idx >= 0) projects[idx] = p
  else projects.unshift(p)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)))
}

export function generateSRT(frames: MangaFrame[]): string {
  let srt = "", time = 0
  frames.forEach((frame, i) => {
    if (!frame.dialogue) return
    const pad = (n: number) => String(Math.floor(n)).padStart(2, "0")
    const fmt = (t: number) => `${pad(t/3600)}:${pad((t%3600)/60)}:${pad(t%60)},000`
    srt += `${i+1}\n${fmt(time)} --> ${fmt(time+frame.duration)}\n${frame.dialogue}\n\n`
    time += frame.duration
  })
  return srt
}

// ─── 生成帧图片（调Seedream） ──────────────
export async function generateFrameImage(frameId: string, prompt: string, aspectRatio: string, prevUrl?: string): Promise<string> {
  const [w, h] = aspectRatio === "9:16" ? [1080, 1920] : aspectRatio === "16:9" ? [1920, 1080] : [1920, 1920]
  const body: any = { prompt, width: w, height: h }
  if (prevUrl) { body.image = prevUrl; body.image_strength = 0.35 }
  const res = await fetch("/api/video/frame", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json()
  if (data.url && !data.placeholder) return data.url
  throw new Error(data.message || "图片生成失败")
}

// ─── 生成帧视频（调Seedance） ──────────────
export async function generateFrameVideo(frameId: string, prompt: string, imageUrl: string, dialogue: string, aspectRatio: string): Promise<string> {
  const res = await fetch("/api/video/seedance", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: prompt.slice(0, 400), imageUrl,
      model: dialogue?.length > 3 ? "seedance-1.5-pro" : "seedance-2.0-fast",
      ratio: aspectRatio, duration: 5,
      generateAudio: !!dialogue && dialogue.length > 3,
    }),
  })
  const data = await res.json()
  if (data.taskId) return data.taskId
  throw new Error(data.message || "视频生成失败")
}

// ─── 轮询Seedance任务 ────────────────────
export async function pollSeedanceTask(taskId: string): Promise<{ videoUrl?: string; status: string }> {
  const res = await fetch(`/api/video/seedance?task_id=${taskId}`)
  const data = await res.json()
  return { videoUrl: data.videoUrl, status: data.status || "unknown" }
}
