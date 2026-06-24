// ─── 即影 · 漫剧生成引擎 ─────────────────────────
// 图片序列→排序→TTS配音→运镜→字幕→BGM→封面→导出

export interface MangaFrame {
  id: string
  imageUrl: string
  duration: number           // 停留时长(秒)
  cameraMove: string         // 运镜：推/拉/左移/右移/上移/下移/缩放/无
  dialogue: string           // 对白/旁白
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
  subtitles: {
    enabled: boolean
    style: "white" | "yellow" | "custom"
    content?: string          // SRT格式字幕文本
  }
  cover?: string             // 封面图URL
  outputUrl?: string         // 最终导出视频URL
  status: "draft" | "rendering" | "done" | "failed"
  aspectRatio: string
  createdAt: string
}

export const CAMERA_MOVES = [
  { id: "none", label: "无" },
  { id: "push", label: "推镜" },
  { id: "pull", label: "拉镜" },
  { id: "pan_left", label: "左移" },
  { id: "pan_right", label: "右移" },
  { id: "pan_up", label: "上移" },
  { id: "pan_down", label: "下移" },
  { id: "zoom_in", label: "放大" },
  { id: "zoom_out", label: "缩小" },
  { id: "shake", label: "震动" },
]

export const TTS_VOICES = [
  { id: "male_deep", label: "深沉男声" },
  { id: "male_warm", label: "温暖男声" },
  { id: "female_sweet", label: "甜美女声" },
  { id: "female_professional", label: "专业女声" },
  { id: "child_cute", label: "可爱童声" },
]

export function createMangaProject(title: string): MangaProject {
  return {
    id: `manga_${Date.now()}`,
    title,
    frames: [],
    audio: { ttsVoice: "female_sweet", bgmVolume: 30, ttsVolume: 80 },
    subtitles: { enabled: true, style: "white" },
    status: "draft",
    aspectRatio: "9:16",
    createdAt: new Date().toISOString(),
  }
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

export function deleteMangaProject(id: string) {
  const projects = loadMangaProjects()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.filter(p => p.id !== id)))
}

export function generateSRT(frames: MangaFrame[]): string {
  let srt = ""
  let time = 0
  frames.forEach((frame, i) => {
    if (!frame.dialogue) return
    const start = time
    const end = time + frame.duration
    const startStr = new Date(start * 1000).toISOString().substr(11, 8).replace(/\.\d+/, "") + ",000"
    const endStr = new Date(end * 1000).toISOString().substr(11, 8).replace(/\.\d+/, "") + ",000"
    srt += `${i + 1}\n${startStr} --> ${endStr}\n${frame.dialogue}\n\n`
    time = end
  })
  return srt
}
