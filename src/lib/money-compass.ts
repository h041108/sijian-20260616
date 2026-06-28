// ─── 即影 · 赚钱罗盘 ──────────────────────────

export type MonetizationStage = "cold_start" | "traffic_accumulate" | "early_monetize" | "private_domain" | "high_value"

export const STAGE_INFO: Record<MonetizationStage, { label: string; icon: string; desc: string; timeRange: string }> = {
  cold_start:         { label: "冷启动期",   icon: "🚀", desc: "打好账号基础，每日更新内容", timeRange: "第1-2周" },
  traffic_accumulate: { label: "流量积累期", icon: "📈", desc: "持续输出爆款，积累粉丝", timeRange: "第3-8周" },
  early_monetize:    { label: "变现初期",   icon: "💰", desc: "带货/广告/知识付费试水", timeRange: "第2-3月" },
  private_domain:    { label: "私域沉淀期", icon: "🔗", desc: "引导高意向用户进入私域", timeRange: "第3-6月" },
  high_value:        { label: "高价值期",   icon: "👑", desc: "知识付费/社群/复购唤醒", timeRange: "第6月+" },
}

export interface MoneyTask {
  id: string; title: string; description: string; reward: string
  type: "content" | "social" | "promotion" | "learn"
  status: "locked" | "available" | "completed"
  stage: MonetizationStage; order: number
}

export interface RevenueStream {
  id: string; name: string; icon: string
  potentialMonthly: string; currentMonthly: string
  difficulty: "低" | "中" | "高"
  status: "未开启" | "已开启" | "已稳定"
  progress: number; nextStep: string
}

export interface MoneyCompassData {
  currentStage: MonetizationStage
  stageProgress: number
  totalEarnings: number
  thisMonthEarnings: number
  daysOnPlatform: number
  followers: number
  tasks: MoneyTask[]
  revenueStreams: RevenueStream[]
  estimatedNextMonth: number
}

export const DEFAULT_MONEY_DATA: MoneyCompassData = {
  currentStage: "cold_start", stageProgress: 15,
  totalEarnings: 0, thisMonthEarnings: 0,
  daysOnPlatform: 3, followers: 0,
  tasks: [
    { id: "task_1", title: "完成人设定位", description: "用Agent 02生成你的完整人设方案", reward: "基础奠定", type: "learn", status: "available", stage: "cold_start", order: 1 },
    { id: "task_2", title: "发布第一篇内容", description: "用即影生成并发布第一篇图文", reward: "预计+50粉", type: "content", status: "available", stage: "cold_start", order: 2 },
    { id: "task_3", title: "连续更新3天", description: "保持日更，让平台识别为活跃账号", reward: "预计+200粉", type: "content", status: "locked", stage: "cold_start", order: 3 },
    { id: "task_4", title: "粉丝破100", description: "积累首批100个真实粉丝", reward: "解锁变现初期", type: "social", status: "locked", stage: "traffic_accumulate", order: 4 },
    { id: "task_5", title: "第一条带货视频", description: "生成并发布产品推荐视频", reward: "预计+¥50", type: "promotion", status: "locked", stage: "early_monetize", order: 5 },
    { id: "task_6", title: "私域引流启动", description: "在主页设置微信号/社群入口", reward: "预计+50私域", type: "social", status: "locked", stage: "private_domain", order: 6 },
    { id: "task_7", title: "发布知识付费产品", description: "用Agent 01生成课程大纲", reward: "预计+¥500", type: "promotion", status: "locked", stage: "high_value", order: 7 },
  ],
  revenueStreams: [
    { id: "rev_1", name: "平台广告分成", icon: "📢", potentialMonthly: "¥200-1000", currentMonthly: "¥0", difficulty: "低", status: "未开启", progress: 0, nextStep: "粉丝达1000后开通" },
    { id: "rev_2", name: "电商带货佣金", icon: "🛒", potentialMonthly: "¥500-5000", currentMonthly: "¥0", difficulty: "中", status: "未开启", progress: 0, nextStep: "发布第一条带货内容" },
    { id: "rev_3", name: "品牌商单合作", icon: "🤝", potentialMonthly: "¥1000-10000", currentMonthly: "¥0", difficulty: "高", status: "未开启", progress: 0, nextStep: "粉丝达1万后自动匹配" },
    { id: "rev_4", name: "知识付费/课程", icon: "📚", potentialMonthly: "¥500-5000", currentMonthly: "¥0", difficulty: "中", status: "未开启", progress: 0, nextStep: "积累1000粉后启动" },
    { id: "rev_5", name: "私域/社群", icon: "🔗", potentialMonthly: "¥1000-5000", currentMonthly: "¥0", difficulty: "中", status: "未开启", progress: 0, nextStep: "私域达100人后启动" },
  ],
  estimatedNextMonth: 0,
}

const STORAGE_KEY = "sijian_money_compass"
export function loadMoneyCompass(): MoneyCompassData {
  if (typeof window === "undefined") return DEFAULT_MONEY_DATA
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || DEFAULT_MONEY_DATA } catch { return DEFAULT_MONEY_DATA }
}
export function saveMoneyCompass(data: MoneyCompassData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
export function completeTask(data: MoneyCompassData, taskId: string): MoneyCompassData {
  return { ...data, tasks: data.tasks.map(t => t.id === taskId ? { ...t, status: "completed" as const } : t) }
}
