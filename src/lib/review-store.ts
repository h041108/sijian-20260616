// ─── 即影 · 每日审核存储 ────────────────────────
// 每日内容队列 + 审核操作追踪

export type ReviewAction = "pending" | "confirmed" | "edited" | "skipped" | "published"

export interface DailyContentItem {
  id: string
  date: string
  type: "text" | "image" | "video" | "manga"
  title: string
  content: string           // 文案正文 or 描述
  mediaUrl?: string         // 图片/视频URL
  hashtags?: string[]       // 话题标签
  suggestedTime?: string    // 建议发布时间
  platform?: string         // 目标平台
  action: ReviewAction
  editedContent?: string    // 用户修改后的内容
  createdAt: string
}

export interface DailyContentLog {
  date: string
  items: DailyContentItem[]
  publishedAt?: string
  metrics?: {
    totalViews: number
    totalLikes: number
    totalComments: number
    followerGrowth: number
  }
}

export interface ReviewStatus {
  totalItems: number
  confirmed: number
  edited: number
  skipped: number
  pending: number
  allDone: boolean
}

const STORAGE_KEY = "sijian_daily_content"

export function loadDailyContents(): DailyContentLog[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

export function saveDailyContent(log: DailyContentLog) {
  const logs = loadDailyContents()
  const idx = logs.findIndex(l => l.date === log.date)
  if (idx >= 0) logs[idx] = log
  else logs.unshift(log)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 90)))
}

export function getTodayContent(): DailyContentLog {
  const today = new Date().toISOString().slice(0, 10)
  const logs = loadDailyContents()
  const existing = logs.find(l => l.date === today)
  if (existing) return existing
  return { date: today, items: [], publishedAt: undefined }
}

export function getReviewStatus(items: DailyContentItem[]): ReviewStatus {
  return {
    totalItems: items.length,
    confirmed: items.filter(i => i.action === "confirmed" || i.action === "published").length,
    edited: items.filter(i => i.action === "edited").length,
    skipped: items.filter(i => i.action === "skipped").length,
    pending: items.filter(i => i.action === "pending").length,
    allDone: items.length > 0 && items.every(i => i.action !== "pending"),
  }
}

export function updateItemAction(
  items: DailyContentItem[],
  itemId: string,
  action: ReviewAction,
  editedContent?: string,
): DailyContentItem[] {
  return items.map(i =>
    i.id === itemId
      ? { ...i, action, editedContent: editedContent || i.editedContent }
      : i,
  )
}

export function generateMockDailyItems(): DailyContentItem[] {
  const today = new Date().toISOString().slice(0, 10)
  const time = new Date().toTimeString().slice(0, 5)
  return [
    {
      id: `daily_${Date.now()}_1`, date: today, type: "text",
      title: "冬日养生汤，5块钱煮一锅！暖身又养颜🔥",
      content: "冬天不喝这碗汤真的亏大了！只需要5块钱的食材，15分钟就能煮出一锅暖身又养颜的养生汤。\n\n食材清单：红枣8颗、枸杞1小把、生姜3片、红糖适量、莲藕1节。\n\n做法：1. 莲藕去皮切片 2. 红枣枸杞洗净 3. 所有食材放入锅中加水 4. 大火煮开转小火15分钟 5. 加红糖调味。\n\n#冬日养生 #暖心汤 #懒人食谱",
      hashtags: ["#冬日养生", "#暖心汤", "#懒人食谱"],
      suggestedTime: "07:30",
      platform: "小红书",
      action: "pending",
      createdAt: `${today}T${time}`,
    },
    {
      id: `daily_${Date.now()}_2`, date: today, type: "image",
      title: "今日封面：冬日温暖色调",
      content: "暖橙色系封面，配养生汤主题，适合小红书3:4比例",
      suggestedTime: "07:30",
      platform: "小红书",
      action: "pending",
      createdAt: `${today}T${time}`,
    },
    {
      id: `daily_${Date.now()}_3`, date: today, type: "video",
      title: "冬日养生汤制作教程（15秒版）",
      content: "15秒竖版视频，展示从食材准备到出锅的全过程，快节奏卡点剪辑",
      mediaUrl: "",
      hashtags: ["#冬日养生", "#快手菜", "#美食教程"],
      suggestedTime: "12:00",
      platform: "抖音",
      action: "pending",
      createdAt: `${today}T${time}`,
    },
  ]
}
