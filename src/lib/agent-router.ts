// ─── 15Agent 智能路由引擎 ─────────────────────────
// 根据用户赛道+平台，自动匹配最合适的Agent组合
// v4.0：统一使用 niches-100 赛道体系，支持 ns01-ns100 映射

import { AgentRegistry } from "./agents/registry"
import type { AgentId } from "./agents/types"
import { AGENT_META } from "./agents/types"
import { NICHE_CATEGORIES, getAllNiches } from "./niches-100"

// ═══════════════════════════════════════════════════
// 平台列表
// ═══════════════════════════════════════════════════

export interface Platform {
  id: string
  name: string
  icon: string
  url?: string
  needsVPN?: boolean
  category: "domestic" | "foreign"
}

export const PLATFORMS: Platform[] = [
  { id: "douyin", name: "抖音", icon: "🎵", category: "domestic" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", category: "domestic" },
  { id: "shipinhao", name: "视频号", icon: "💬", category: "domestic" },
  { id: "kuaishou", name: "快手", icon: "📹", category: "domestic" },
  { id: "bilibili", name: "B站", icon: "📺", category: "domestic" },
  { id: "weixin", name: "微信公众号", icon: "📱", category: "domestic" },
  { id: "youtube", name: "YouTube", icon: "▶️", needsVPN: true, category: "foreign" },
  { id: "tiktok", name: "TikTok", icon: "🎵", needsVPN: true, category: "foreign" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", needsVPN: true, category: "foreign" },
  { id: "instagram", name: "Instagram", icon: "📷", needsVPN: true, category: "foreign" },
  { id: "facebook", name: "Facebook", icon: "👍", needsVPN: true, category: "foreign" },
  { id: "threads", name: "Threads", icon: "🧵", needsVPN: true, category: "foreign" },
  { id: "pinterest", name: "Pinterest", icon: "📌", needsVPN: true, category: "foreign" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", needsVPN: true, category: "foreign" },
]

// ═══════════════════════════════════════════════════
// 赛道→Agent 路由映射（基于 niches-100 的 NicheCategory.id）
// 每个大类匹配一组 Agent，精确匹配优先
// ═══════════════════════════════════════════════════

export interface RouteRule {
  nicheCategoryId: string    // 对应 NICHE_CATEGORIES[].id（如 "life-skills"）
  agents: AgentId[]
  description: string
}

export const ROUTE_RULES: RouteRule[] = [
  // ── 生活技能 / 美食类 ──
  { nicheCategoryId: "life-skills", agents: ["agent_13", "agent_04", "agent_03", "agent_12", "agent_14"], description: "生活技能：选题→脚本→提示词→封面→标签" },
  { nicheCategoryId: "food-reverse", agents: ["agent_13", "agent_04", "agent_03", "agent_12", "agent_14"], description: "美食：选题→脚本→提示词→封面→标签" },

  // ── 极限运动 / 户外类 ──
  { nicheCategoryId: "extreme-sports", agents: ["agent_04", "agent_03", "agent_05", "agent_12", "agent_10"], description: "极限运动：脚本→提示词→BGM→封面→标题" },

  // ── 技能工艺类 ──
  { nicheCategoryId: "craft-master", agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_14"], description: "工艺：知识图谱→脚本→提示词→封面→标签" },

  // ── 手工文创类 ──
  { nicheCategoryId: "handmade-craft", agents: ["agent_02", "agent_04", "agent_03", "agent_12", "agent_14"], description: "手工：人设→脚本→提示词→封面→标签" },

  // ── 美妆护肤类 ──
  { nicheCategoryId: "beauty-skincare", agents: ["agent_00", "agent_02", "agent_03", "agent_12", "agent_14"], description: "美妆：定位→人设→提示词→封面→标签" },

  // ── 穿搭时尚类 ──
  { nicheCategoryId: "fashion-style", agents: ["agent_02", "agent_03", "agent_12", "agent_10", "agent_14"], description: "穿搭：人设→提示词→封面→标题→标签" },

  // ── 数码科技类 ──
  { nicheCategoryId: "digital-tech", agents: ["agent_01", "agent_04", "agent_03", "agent_05", "agent_10", "agent_14"], description: "数码：商业策略→脚本→提示词→BGM→标题→标签" },

  // ── 教育知识类 ──
  { nicheCategoryId: "education-knowledge", agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_10"], description: "教育：知识图谱→脚本→提示词→封面→标题" },

  // ── 健康养生类 ──
  { nicheCategoryId: "health-wellness", agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_14"], description: "健康：知识图谱→脚本→提示词→封面→标签" },

  // ── 母婴亲子类 ──
  { nicheCategoryId: "parenting", agents: ["agent_02", "agent_04", "agent_03", "agent_12", "agent_14"], description: "母婴：人设→脚本→提示词→封面→标签" },

  // ── 宠物类 ──
  { nicheCategoryId: "pets", agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "宠物：选题→提示词→封面→标签" },

  // ── 旅行类 ──
  { nicheCategoryId: "travel", agents: ["agent_04", "agent_03", "agent_12", "agent_10", "agent_14"], description: "旅行：脚本→提示词→封面→标题→标签" },

  // ── 商业创业类 ──
  { nicheCategoryId: "business-startup", agents: ["agent_01", "agent_09", "agent_04", "agent_10", "agent_14"], description: "商业：商业策略→知识图谱→脚本→标题→标签" },

  // ── 金融投资类 ──
  { nicheCategoryId: "finance-investing", agents: ["agent_01", "agent_09", "agent_04", "agent_10", "agent_14"], description: "金融：商业策略→知识图谱→脚本→标题→标签" },

  // ── 汽车类 ──
  { nicheCategoryId: "automotive", agents: ["agent_04", "agent_03", "agent_05", "agent_10", "agent_14"], description: "汽车：脚本→提示词→BGM→标题→标签" },

  // ── 游戏类 ──
  { nicheCategoryId: "gaming", agents: ["agent_04", "agent_03", "agent_05", "agent_06", "agent_12", "agent_10"], description: "游戏：脚本→提示词→BGM→音效→封面→标题" },

  // ── 影视娱乐类 ──
  { nicheCategoryId: "entertainment", agents: ["agent_04", "agent_05", "agent_06", "agent_10", "agent_11A"], description: "影视：脚本→BGM→音效→标题→爆款复刻" },

  // ── 文化艺术类 ──
  { nicheCategoryId: "art-culture", agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_10"], description: "文化：知识图谱→脚本→提示词→封面→标题" },

  // ── 农业乡村类 ──
  { nicheCategoryId: "agriculture", agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_14"], description: "农业：知识图谱→脚本→提示词→封面→标签" },

  // ── 房产家居类 ──
  { nicheCategoryId: "home-realestate", agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "家居：选题→提示词→封面→标签" },
]

// ── 默认 Agent 链（用于未匹配的赛道）──
const DEFAULT_AGENTS: AgentId[] = ["agent_13", "agent_03", "agent_12", "agent_14"]
const DEFAULT_DESC = "默认：选题→提示词→封面→标签"

// ═══════════════════════════════════════════════════
// 路由引擎
// ═══════════════════════════════════════════════════

export interface RoutedAgents {
  agents: AgentId[]
  agentNames: string[]
  description: string
}

/**
 * 根据 nsXX 赛道ID 匹配 Agent 路由规则
 * 先在 ROUTE_RULES 中按 nicheCategoryId 匹配大类
 * 未匹配则使用默认规则
 */
export function routeAgents(nicheId: string): RoutedAgents {
  // 找到 nsXX 所属的 NicheCategory
  const allNiches = getAllNiches()
  const nicheItem = allNiches.find(n => n.id === nicheId)
  const categoryId = nicheItem
    ? NICHE_CATEGORIES.find(cat => cat.items.some(it => it.id === nicheId))?.id
    : null

  // 按大类匹配
  if (categoryId) {
    const rule = ROUTE_RULES.find(r => r.nicheCategoryId === categoryId)
    if (rule) {
      const agentNames = rule.agents.map(id => {
        try { return AGENT_META[id]?.name || id } catch { return id }
      })
      return { agents: rule.agents, agentNames, description: rule.description }
    }
  }

  // 兜底：默认
  const agentNames = DEFAULT_AGENTS.map(id => {
    try { return AGENT_META[id]?.name || id } catch { return id }
  })
  return { agents: DEFAULT_AGENTS, agentNames, description: DEFAULT_DESC }
}

/**
 * 一键执行路由后的 Agent 流水线（端到端）
 * 每个 Agent 的输出会传递给下一个 Agent
 */
export async function runRoutedPipeline(
  nicheId: string,
  instruction: string,
  platform?: string,
): Promise<{ results: any[]; summary: string; generatedContent?: { text: string; imageUrls: string[]; hashtags: string[] } }> {
  const route = routeAgents(nicheId)
  const allNiches = getAllNiches()
  const nicheItem = allNiches.find(n => n.id === nicheId)
  const nicheName = nicheItem?.name || nicheId
  const results: any[] = []
  let previousOutput = ""

  // 顺序执行 Agent，传递前一个输出
  for (const agentId of route.agents) {
    try {
      const agentInstruction = previousOutput
        ? `${instruction}\n\n上一步输出参考：\n${previousOutput.slice(0, 500)}`
        : instruction

      const output = await AgentRegistry.execute(agentId, {
        instruction: agentInstruction,
        context: {
          userProfile: { platform, niche: nicheName },
          previousOutputs: previousOutput ? [previousOutput.slice(0, 1000)] : undefined,
        },
      })

      previousOutput = output.mainOutput || ""
      results.push({ agentId, agentName: output.agentName, output: output.mainOutput, success: output.success })
    } catch (e: any) {
      results.push({ agentId, agentName: agentId, output: "", success: false, error: e.message })
    }
  }

  const succeeded = results.filter(r => r.success)

  // 提取最终内容：最后一个 Agent 的输出作为文案
  const finalOutput = succeeded.length > 0 ? succeeded[succeeded.length - 1].output : ""
  // 提取标签（从 agent_14 或任何含 # 的输出中提取）
  const hashtagResult = results.find(r => r.agentId === "agent_14")
  const hashtags = hashtagResult?.output
    ? (hashtagResult.output.match(/#[^\s#,\n]+/g) || []).slice(0, 8)
    : [`#${nicheName}`]

  // 生成配图（通过即梦）
  const imageUrls: string[] = []
  const apiBase = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || "https://jiying.cc.cd")
  if (apiBase) {
    const imagePrompts = [
      `关于"${nicheName}"的插图，${platform || "小红书"}风格，电影质感，高清`,
      `"${nicheName}"，细节特写，高质量摄影风格，精致`,
    ]
    for (const p of imagePrompts) {
      try {
        const res = await fetch(`${apiBase}/api/video/frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p.slice(0, 380), width: 1080, height: 1920 }),
        })
        const data = await res.json()
        if (data.url && !data.placeholder) imageUrls.push(data.url)
      } catch {}
    }
  }

  return {
    results,
    summary: `${route.agentNames.join(" → ")} (${succeeded.length}/${results.length})`,
    generatedContent: {
      text: finalOutput || instruction,
      imageUrls,
      hashtags: hashtags.length > 0 ? hashtags : [`#${nicheName}`, platform ? `#${platform}` : ""].filter(Boolean),
    },
  }
}
