// ─── 即影 · 作品集 ──────────────────────────

export interface PortfolioItem {
  id: string
  type: "image" | "video" | "manga" | "text"
  title: string
  description: string
  mediaUrl?: string
  thumbnailUrl?: string
  createdAt: string
  platform?: string
  stats: { likes: number; comments: number; views: number; shares: number }
  tags: string[]
  featured: boolean
  sourceAgent?: string   // 哪个Agent生成的
}

const STORAGE_KEY = "sijian_portfolio"

export function loadPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

export function savePortfolio(items: PortfolioItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)))
}

export function addPortfolioItem(item: PortfolioItem) {
  const items = loadPortfolio()
  items.unshift(item)
  savePortfolio(items)
}

export function deletePortfolioItem(id: string) {
  savePortfolio(loadPortfolio().filter(i => i.id !== id))
}

export function toggleFeatured(id: string) {
  const items = loadPortfolio()
  savePortfolio(items.map(i => i.id === id ? { ...i, featured: !i.featured } : i))
}

export function generateMockPortfolio(): PortfolioItem[] {
  return [
    { id: "p_1", type: "image", title: "冬日养生汤封面", description: "暖橙色系封面，配养生汤主题", createdAt: new Date(Date.now() - 86400000).toISOString(), platform: "小红书", stats: { likes: 127, comments: 23, views: 3200, shares: 15 }, tags: ["封面", "冬日"], featured: true },
    { id: "p_2", type: "video", title: "5分钟快手早餐教程", description: "15秒竖版制作视频", createdAt: new Date(Date.now() - 172800000).toISOString(), platform: "抖音", stats: { likes: 89, comments: 12, views: 1800, shares: 8 }, tags: ["美食", "教程"], featured: false },
    { id: "p_3", type: "text", title: "宿舍党10元吃饱攻略", description: "学生党省钱美食文案", createdAt: new Date(Date.now() - 259200000).toISOString(), platform: "小红书", stats: { likes: 234, comments: 45, views: 5600, shares: 32 }, tags: ["省钱", "学生"], featured: true },
  ]
}
