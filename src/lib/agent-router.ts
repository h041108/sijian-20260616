// ─── 15Agent 智能路由引擎 ─────────────────────────
// 根据用户赛道+平台，自动匹配最合适的Agent组合
// 三级赛道分类 + 智能路由

import { AgentRegistry } from "./agents/registry"
import type { AgentId } from "./agents/types"

// ═══════════════════════════════════════════════════
// 1. 三级赛道分类
// ═══════════════════════════════════════════════════

export interface NicheCategory {
  id: string
  name: string
  icon: string
  children?: NicheSubCategory[]
}

export interface NicheSubCategory {
  id: string
  name: string
  children?: NicheLeaf[]
}

export interface NicheLeaf {
  id: string
  name: string
  description?: string
}

// ── 一级分类 ──
export const NICHE_TREE: NicheCategory[] = [
  {
    id: "meishi", name: "美食", icon: "🍳",
    children: [
      { id: "meishi_caipu", name: "菜谱教程", children: [
        { id: "meishi_caipu_jiachang", name: "家常菜" },
        { id: "meishi_caipu_hongbei", name: "烘焙甜品" },
        { id: "meishi_caipu_richi", name: "日料" },
        { id: "meishi_caipu_jiucai", name: "减脂餐" },
      ]},
      { id: "meishi_tandian", name: "探店测评", children: [
        { id: "meishi_tandian_difang", name: "地方美食" },
        { id: "meishi_tandian_gaoduan", name: "高端餐厅" },
        { id: "meishi_tandian_xiaochi", name: "街头小吃" },
      ]},
      { id: "meishi_dongxi", name: "美食测评", children: [
        { id: "meishi_dongxi_lingshi", name: "零食测评" },
        { id: "meishi_dongxi_liaoli", name: "料理包测评" },
      ]},
    ],
  },
  {
    id: "meizhuang", name: "美妆护肤", icon: "💄",
    children: [
      { id: "meizhuang_hufu", name: "护肤", children: [
        { id: "meizhuang_hufu_huji", name: "护肤教程" },
        { id: "meizhuang_hufu_chanpin", name: "产品测评" },
        { id: "meizhuang_hufu_chengfen", name: "成分分析" },
      ]},
      { id: "meizhuang_caizhuang", name: "彩妆", children: [
        { id: "meizhuang_caizhuang_jiaocheng", name: "化妆教程" },
        { id: "meizhuang_caizhuang_haowu", name: "彩妆好物" },
        { id: "meizhuang_caizhuang_pingti", name: "平价替代" },
      ]},
    ],
  },
  {
    id: "chuanda", name: "穿搭时尚", icon: "👗",
    children: [
      { id: "chuanda_nvzhuang", name: "女装穿搭", children: [
        { id: "chuanda_nvzhuang_richang", name: "日常穿搭" },
        { id: "chuanda_nvzhuang_tongqin", name: "通勤穿搭" },
        { id: "chuanda_nvzhuang_jiyi", name: "季节穿搭" },
      ]},
      { id: "chuanda_nanzhuang", name: "男装穿搭", children: [
        { id: "chuanda_nanzhuang_jichu", name: "基础穿搭" },
        { id: "chuanda_nanzhuang_shangwu", name: "商务穿搭" },
      ]},
      { id: "chuanda_peishi", name: "配饰", children: [
        { id: "chuanda_peishi_bao", name: "包袋" },
        { id: "chuanda_peishi_xie", name: "鞋靴" },
      ]},
    ],
  },
  {
    id: "shuma", name: "数码科技", icon: "📱",
    children: [
      { id: "shuma_shouji", name: "手机", children: [
        { id: "shuma_shouji_pingce", name: "手机评测" },
        { id: "shuma_shouji_sheyin", name: "手机摄影" },
      ]},
      { id: "shuma_diannao", name: "电脑外设", children: [
        { id: "shuma_diannao_zhuangji", name: "装机配置" },
        { id: "shuma_diannao_waishe", name: "外设推荐" },
      ]},
      { id: "shuma_keji", name: "科技资讯", children: [
        { id: "shuma_keji_dongtai", name: "科技动态" },
        { id: "shuma_keji_wanju", name: "智能玩具" },
      ]},
    ],
  },
  {
    id: "jiaoyu", name: "教育知识", icon: "📚",
    children: [
      { id: "jiaoyu_yuyan", name: "语言学习", children: [
        { id: "jiaoyu_yuyan_yingyu", name: "英语学习" },
        { id: "jiaoyu_yuyan_riyu", name: "日语学习" },
      ]},
      { id: "jiaoyu_kemu", name: "学科教育", children: [
        { id: "jiaoyu_kemu_shuxue", name: "数学" },
        { id: "jiaoyu_kemu_yuwen", name: "语文" },
      ]},
      { id: "jiaoyu_zhishi", name: "知识科普", children: [
        { id: "jiaoyu_zhishi_lishi", name: "历史" },
        { id: "jiaoyu_zhishi_kexue", name: "科学" },
      ]},
    ],
  },
  {
    id: "shenghuo", name: "生活", icon: "🏠",
    children: [
      { id: "shenghuo_jiating", name: "家居", children: [
        { id: "shenghuo_jiating_zhuangxiu", name: "装修" },
        { id: "shenghuo_jiating_shouna", name: "收纳整理" },
      ]},
      { id: "shenghuo_chongwu", name: "宠物", children: [
        { id: "shenghuo_chongwu_mao", name: "猫咪" },
        { id: "shenghuo_chongwu_gou", name: "狗狗" },
      ]},
      { id: "shenghuo_lvyou", name: "旅行", children: [
        { id: "shenghuo_lvyou_gonglve", name: "旅游攻略" },
        { id: "shenghuo_lvyou_jiudian", name: "酒店测评" },
      ]},
    ],
  },
  {
    id: "jiankang", name: "健康养生", icon: "🏃",
    children: [
      { id: "jiankang_yundong", name: "运动健身", children: [
        { id: "jiankang_yundong_jianshen", name: "健身教程" },
        { id: "jiankang_yundong_pilates", name: "普拉提/瑜伽" },
      ]},
      { id: "jiankang_yangsheng", name: "养生", children: [
        { id: "jiankang_yangsheng_shiiliao", name: "食疗" },
        { id: "jiankang_yangsheng_zhongyi", name: "中医养生" },
      ]},
    ],
  },
  {
    id: "qinzi", name: "母婴亲子", icon: "👶",
    children: [
      { id: "qinzi_yuer", name: "育儿", children: [
        { id: "qinzi_yuer_zaojiao", name: "早教" },
        { id: "qinzi_yuer_buyu", name: "哺育" },
      ]},
      { id: "qinzi_haowu", name: "母婴好物", children: [
        { id: "qinzi_haowu_tuijian", name: "好物推荐" },
        { id: "qinzi_haowu_bilei", name: "避雷指南" },
      ]},
    ],
  },
  {
    id: "nongye", name: "农业乡村", icon: "🌾",
    children: [
      { id: "nongye_zhongzhi", name: "种植", children: [
        { id: "nongye_zhongzhi_shucai", name: "蔬菜种植" },
        { id: "nongye_zhongzhi_huahui", name: "花卉园艺" },
      ]},
      { id: "nongye_yangzhi", name: "养殖", children: [
        { id: "nongye_yangzhi_jiaqin", name: "家禽养殖" },
        { id: "nongye_yangzhi_shuichan", name: "水产养殖" },
      ]},
    ],
  },
  {
    id: "shangye", name: "商业创业", icon: "💼",
    children: [
      { id: "shangye_chuangye", name: "创业", children: [
        { id: "shangye_chuangye_dianpu", name: "开店经验" },
        { id: "shangye_chuangye_zhuanqian", name: "赚钱思维" },
      ]},
      { id: "shangye_touzi", name: "投资理财", children: [
        { id: "shangye_touzi_gupiao", name: "股票" },
        { id: "shangye_touzi_jijin", name: "基金" },
      ]},
    ],
  },
  {
    id: "yule", name: "娱乐", icon: "🎮",
    children: [
      { id: "yule_youxi", name: "游戏", children: [
        { id: "yule_youxi_dianjing", name: "电竞" },
        { id: "yule_youxi_shouyou", name: "手游" },
      ]},
      { id: "yule_dianying", name: "影视", children: [
        { id: "yule_dianying_pingce", name: "影视评测" },
        { id: "yule_dianying_jijie", name: "剪辑解说" },
      ]},
    ],
  },
  {
    id: "qiche", name: "汽车", icon: "🚗",
    children: [
      { id: "qiche_pingce", name: "汽车评测", children: [
        { id: "qiche_pingce_xinche", name: "新车评测" },
        { id: "qiche_pingce_dianche", name: "电动车" },
      ]},
    ],
  },
]

// ═══════════════════════════════════════════════════
// 2. 平台列表
// ═══════════════════════════════════════════════════

export interface Platform {
  id: string
  name: string
  icon: string
  url?: string     // 注册页面链接
  needsVPN?: boolean
  category: "domestic" | "foreign"
}

export const PLATFORMS: Platform[] = [
  // 国内
  { id: "douyin", name: "抖音", icon: "🎵", category: "domestic" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", category: "domestic" },
  { id: "shipinhao", name: "视频号", icon: "💬", category: "domestic" },
  { id: "kuaishou", name: "快手", icon: "📹", category: "domestic" },
  { id: "bilibili", name: "B站", icon: "📺", category: "domestic" },
  { id: "weixin", name: "微信公众号", icon: "📱", category: "domestic" },
  // 国外
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
// 3. Agent 路由规则
// ═══════════════════════════════════════════════════

export interface RouteRule {
  nichePattern: string[]    // 匹配的赛道ID（支持通配）
  agents: AgentId[]         // 需要调用的Agent列表
  description: string
}

export const ROUTE_RULES: RouteRule[] = [
  // ── 美食类 ──
  { nichePattern: ["meishi_caipu*"], agents: ["agent_04", "agent_03", "agent_12", "agent_14"], description: "菜谱：脚本→提示词→封面→标签" },
  { nichePattern: ["meishi_tandian*"], agents: ["agent_13", "agent_02", "agent_03", "agent_12"], description: "探店：选题→人设→提示词→封面" },
  { nichePattern: ["meishi*"], agents: ["agent_13", "agent_04", "agent_03", "agent_12", "agent_14"], description: "美食通用：选题→脚本→提示词→封面→标签" },

  // ── 美妆类 ──
  { nichePattern: ["meizhuang_hufu*"], agents: ["agent_00", "agent_02", "agent_03", "agent_12", "agent_14"], description: "护肤：定位→人设→提示词→封面→标签" },
  { nichePattern: ["meizhuang_caizhuang*"], agents: ["agent_04", "agent_03", "agent_12", "agent_14"], description: "彩妆：脚本→提示词→封面→标签" },
  { nichePattern: ["meizhuang*"], agents: ["agent_02", "agent_03", "agent_12", "agent_14"], description: "美妆通用：人设→提示词→封面→标签" },

  // ── 穿搭类 ──
  { nichePattern: ["chuanda*"], agents: ["agent_02", "agent_03", "agent_12", "agent_10", "agent_14"], description: "穿搭：人设→提示词→封面→标题→标签" },

  // ── 数码类 ──
  { nichePattern: ["shuma_pingce*"], agents: ["agent_01", "agent_04", "agent_05", "agent_06", "agent_10"], description: "数码评测：商业策略→脚本→BGM→音效→标题" },
  { nichePattern: ["shuma*"], agents: ["agent_04", "agent_03", "agent_05", "agent_10", "agent_14"], description: "数码通用：脚本→提示词→BGM→标题→标签" },

  // ── 教育类 ──
  { nichePattern: ["jiaoyu*"], agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_10"], description: "教育：知识图谱→脚本→提示词→封面→标题" },

  // ── 生活类 ──
  { nichePattern: ["shenghuo_jiating*"], agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "家居：选题→提示词→封面→标签" },
  { nichePattern: ["shenghuo_chongwu*"], agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "宠物：选题→提示词→封面→标签" },
  { nichePattern: ["shenghuo_lvyou*"], agents: ["agent_04", "agent_03", "agent_12", "agent_10"], description: "旅行：脚本→提示词→封面→标题" },
  { nichePattern: ["shenghuo*"], agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "生活通用：选题→提示词→封面→标签" },

  // ── 健康类 ──
  { nichePattern: ["jiankang*"], agents: ["agent_09", "agent_04", "agent_03", "agent_12", "agent_14"], description: "健康：知识图谱→脚本→提示词→封面→标签" },

  // ── 母婴类 ──
  { nichePattern: ["qinzi*"], agents: ["agent_02", "agent_04", "agent_03", "agent_12", "agent_14"], description: "母婴：人设→脚本→提示词→封面→标签" },

  // ── 农业类 ──
  { nichePattern: ["nongye*"], agents: ["agent_09", "agent_04", "agent_03", "agent_12"], description: "农业：知识图谱→脚本→提示词→封面" },

  // ── 商业类 ──
  { nichePattern: ["shangye*"], agents: ["agent_01", "agent_09", "agent_04", "agent_10", "agent_14"], description: "商业：商业策略→知识图谱→脚本→标题→标签" },

  // ── 娱乐类 ──
  { nichePattern: ["yule_youxi*"], agents: ["agent_04", "agent_03", "agent_05", "agent_06", "agent_12", "agent_10"], description: "游戏：脚本→提示词→BGM→音效→封面→标题" },
  { nichePattern: ["yule_dianying*"], agents: ["agent_04", "agent_05", "agent_06", "agent_10", "agent_11A"], description: "影视：脚本→BGM→音效→标题→爆款复刻" },
  { nichePattern: ["yule*"], agents: ["agent_13", "agent_04", "agent_03", "agent_12"], description: "娱乐通用：选题→脚本→提示词→封面" },

  // ── 汽车类 ──
  { nichePattern: ["qiche*"], agents: ["agent_04", "agent_03", "agent_05", "agent_10", "agent_14"], description: "汽车：脚本→提示词→BGM→标题→标签" },

  // ── 默认 ──
  { nichePattern: ["*"], agents: ["agent_13", "agent_03", "agent_12", "agent_14"], description: "默认：选题→提示词→封面→标签" },
]

// ═══════════════════════════════════════════════════
// 4. 路由引擎
// ═══════════════════════════════════════════════════

export interface RoutedAgents {
  agents: AgentId[]
  agentNames: string[]
  description: string
}

/**
 * 根据赛道ID匹配Agent路由规则
 * 匹配优先级：最精确的规则优先
 */
export function routeAgents(nicheId: string): RoutedAgents {
  const { AGENT_META } = require("./agents/types")

  // 按精确度排序规则（通配符*的越少越精确）
  const sorted = [...ROUTE_RULES].sort((a, b) => {
    const aStars = a.nichePattern[0].split("*").length - 1
    const bStars = b.nichePattern[0].split("*").length - 1
    return aStars - bStars
  })

  for (const rule of sorted) {
    for (const pattern of rule.nichePattern) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
      if (regex.test(nicheId)) {
        const agentNames = rule.agents.map(id => (AGENT_META as any)[id]?.name || id)
        return { agents: rule.agents, agentNames, description: rule.description }
      }
    }
  }

  // 兜底：默认
  const defaultRule = ROUTE_RULES.find(r => r.nichePattern[0] === "*")!
  const agentNames = defaultRule.agents.map(id => (AGENT_META as any)[id]?.name || id)
  return { agents: defaultRule.agents, agentNames, description: defaultRule.description }
}

/**
 * 一键执行路由后的Agent流水线
 */
export async function runRoutedPipeline(
  nicheId: string,
  instruction: string,
  platform?: string,
): Promise<{ results: any[]; summary: string }> {
  const route = routeAgents(nicheId)
  const results: any[] = []

  for (const agentId of route.agents) {
    try {
      const output = await AgentRegistry.execute(agentId, {
        instruction,
        context: { userProfile: { platform, niche: nicheId } },
      })
      results.push({ agentId, agentName: output.agentName, output: output.mainOutput })
    } catch (e: any) {
      results.push({ agentId, agentName: agentId, output: "执行失败: " + e.message })
    }
  }

  return {
    results,
    summary: `${route.agentNames.join(" → ")} 执行完成 (${results.filter(r => !r.output.startsWith("执行失败")).length}/${results.length})`,
  }
}

/**
 * 获取某个赛道的完整分类名称路径
 */
export function getNichePath(nicheId: string): string[] {
  for (const cat of NICHE_TREE) {
    if (cat.id === nicheId) return [cat.name]
    if (!cat.children) continue
    for (const sub of cat.children) {
      if (sub.id === nicheId) return [cat.name, sub.name]
      if (!sub.children) continue
      for (const leaf of sub.children) {
        if (leaf.id === nicheId) return [cat.name, sub.name, leaf.name]
      }
    }
  }
  return [nicheId]
}
