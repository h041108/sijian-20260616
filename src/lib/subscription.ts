// ─── 套餐定义 ──────────────────────────────────────

export type PlanId = "free" | "pro" | "student" | "teacher" | "org_standard" | "org_flagship"

export interface Plan {
  id: PlanId
  name: string
  price: string
  priceYearly?: string
  target: string
  features: string[]
  limits: {
    dailyChats: number       // -1 = 无限
    savedSpaces: number       // -1 = 无限
    frameworks: number        // 可用框架数（-1=全部）
    anchors: boolean           // 是否显示完整锚点
    export: boolean            // 是否可导出
    historySearch: boolean     // 历史搜索
    dataBoard: boolean         // 数据看板
    teacherAccounts?: number   // B端教师账号数
    monthlyBuilds?: number     // B端每月构建数
    customDomain?: boolean
    apiAccess?: boolean
    whiteLabel?: boolean
  }
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "免费版",
    price: "¥0",
    target: "体验思维空间",
    features: [
      "每天 10 次对话",
      "最多保存 5 个思维空间",
      "3 种基础图形框架",
      "基础应用锚点",
    ],
    limits: {
      dailyChats: 10,
      savedSpaces: 5,
      frameworks: 3,
      anchors: false,
      export: false,
      historySearch: false,
      dataBoard: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro 版",
    price: "¥19/月",
    priceYearly: "¥168/年",
    target: "深度思考者",
    features: [
      "无限对话",
      "无限思维空间存档",
      "全部 11 种图形框架",
      "完整应用锚点展示",
      "导出 PNG / JSON",
      "历史记录搜索",
      "去广告 & 优先体验新功能",
    ],
    limits: {
      dailyChats: -1,
      savedSpaces: -1,
      frameworks: -1,
      anchors: true,
      export: true,
      historySearch: true,
      dataBoard: false,
    },
  },
  student: {
    id: "student",
    name: "学生年卡",
    price: "¥99/年",
    target: "高考 / 考研 / 考公",
    features: [
      "Pro 版全部功能",
      "高考 / 考研 专项知识库",
      "错题思维追踪",
      "知识掌握度评估",
    ],
    limits: {
      dailyChats: -1,
      savedSpaces: -1,
      frameworks: -1,
      anchors: true,
      export: true,
      historySearch: true,
      dataBoard: false,
    },
  },
  teacher: {
    id: "teacher",
    name: "个人教师版",
    price: "¥29/月",
    priceYearly: "¥269/年",
    target: "单科教师 / 家教",
    features: [
      "每月 50 个知识空间构建",
      "无限学生查看",
      "分享链接不限数",
      "基础数据看板",
      "知识空间可编辑",
    ],
    limits: {
      dailyChats: -1,
      savedSpaces: -1,
      frameworks: -1,
      anchors: true,
      export: true,
      historySearch: true,
      dataBoard: true,
      monthlyBuilds: 50,
    },
  },
  org_standard: {
    id: "org_standard",
    name: "机构标准版",
    price: "¥299/月",
    priceYearly: "¥2699/年",
    target: "培训机构 / 学校",
    features: [
      "5 个教师账号",
      "每人每月 100 个知识空间",
      "学生查看不限数",
      "机构专属品牌页",
      "学生查看数据分析",
      "机构知识库协同",
    ],
    limits: {
      dailyChats: -1,
      savedSpaces: -1,
      frameworks: -1,
      anchors: true,
      export: true,
      historySearch: true,
      dataBoard: true,
      teacherAccounts: 5,
      monthlyBuilds: 500,
    },
  },
  org_flagship: {
    id: "org_flagship",
    name: "机构旗舰版",
    price: "¥999/月",
    priceYearly: "¥8999/年",
    target: "大型机构 / 连锁",
    features: [
      "20 个教师账号",
      "每人无限构建",
      "API 接口接入自有系统",
      "定制域名",
      "学生思维成长报告",
      "白标定制",
      "优先技术支持",
    ],
    limits: {
      dailyChats: -1,
      savedSpaces: -1,
      frameworks: -1,
      anchors: true,
      export: true,
      historySearch: true,
      dataBoard: true,
      teacherAccounts: 20,
      monthlyBuilds: -1,
      customDomain: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
}

// ─── 使用量记录（localStorage，将来迁移到 Supabase）───

interface UsageRecord {
  date: string          // "2026-06-13"
  chatCount: number
  savedSpaceCount: number
}

const STORAGE_KEY = "sijian_usage"
const SUB_KEY = "sijian_subscription"

export function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getUsage(): UsageRecord {
  if (typeof window === "undefined") return { date: getToday(), chatCount: 0, savedSpaceCount: 0 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: getToday(), chatCount: 0, savedSpaceCount: 0 }
    const record: UsageRecord = JSON.parse(raw)
    if (record.date !== getToday()) {
      // 新的一天，重置计数
      const fresh = { date: getToday(), chatCount: 0, savedSpaceCount: record.savedSpaceCount }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
      return fresh
    }
    return record
  } catch {
    return { date: getToday(), chatCount: 0, savedSpaceCount: 0 }
  }
}

export function incrementChatCount(): UsageRecord {
  const record = getUsage()
  record.chatCount++
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  return record
}

export function incrementSpaceCount(): UsageRecord {
  const record = getUsage()
  record.savedSpaceCount++
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  return record
}

// ─── 订阅状态（localStorage + 将来 Stripe）───────

interface Subscription {
  planId: PlanId
  startDate: string
  expiryDate?: string   // 年卡到期日
  paymentMethod?: string
}

export function getSubscription(): Subscription {
  if (typeof window === "undefined") return { planId: "free", startDate: getToday() }
  try {
    const raw = localStorage.getItem(SUB_KEY)
    return raw ? JSON.parse(raw) : { planId: "free", startDate: getToday() }
  } catch {
    return { planId: "free", startDate: getToday() }
  }
}

export function setSubscription(planId: PlanId): void {
  localStorage.setItem(SUB_KEY, JSON.stringify({
    planId,
    startDate: getToday(),
    expiryDate: planId === "student" ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) : undefined,
  }))
}

export function isExpired(sub: Subscription): boolean {
  if (!sub.expiryDate) return false
  return new Date(sub.expiryDate) < new Date()
}

export function getCurrentPlan(): Plan {
  const sub = getSubscription()
  if (isExpired(sub)) {
    // 年卡过期降级到免费
    setSubscription("free")
    return PLANS.free
  }
  return PLANS[sub.planId] || PLANS.free
}

export function canChat(): { allowed: boolean; remaining: number; limit: number } {
  // 白名单模式：永久放开限制（正式版上线后切换）
  return { allowed: true, remaining: Infinity, limit: -1 }
}

export function canSaveSpace(): { allowed: boolean; remaining: number; limit: number } {
  // 白名单模式：永久放开限制
  return { allowed: true, remaining: Infinity, limit: -1 }
}
