// ─── 每日内容引擎类型定义 ─────────────────────────
// generateDailyContent 已合并到 agent-router.ts 的 runRoutedPipeline 中
// 此处保留类型定义供其他模块使用

export interface DailyContentResult {
  date: string
  userId: string
  niche: string
  platform: string
  items: {
    type: "text" | "image" | "video"
    title: string
    content: string
    imageUrls: string[]
    hashtags: string[]
    status: "pending"
  }[]
}
