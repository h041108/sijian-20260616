// ─── 即影 15 Agent 统一类型系统 ────────────────────

export type AgentGroup = "planning" | "production" | "optimization"

export const AGENT_GROUPS: Record<AgentGroup, string> = {
  planning: "🎯 策划群",
  production: "⚙️ 生产群",
  optimization: "🚀 优化群",
}

export type AgentId =
  | "agent_00" | "agent_01" | "agent_02" | "agent_03" | "agent_04"
  | "agent_05" | "agent_06" | "agent_07" | "agent_08" | "agent_09"
  | "agent_10" | "agent_11A" | "agent_11B" | "agent_12" | "agent_13" | "agent_14"

export const AGENT_META: Record<AgentId, {
  name: string; icon: string; group: AgentGroup; description: string; promptFile: string
}> = {
  agent_00:  { name: "品牌定位", icon: "🎯", group: "planning", description: "品牌定位文档+视觉指南", promptFile: "E00-brand-positioning.md" },
  agent_01:  { name: "商业策略", icon: "🏢", group: "planning", description: "创始人分析+IP方向", promptFile: "E01-founder-analysis.md" },
  agent_02:  { name: "人设建模", icon: "👤", group: "planning", description: "人设方案+风格调性", promptFile: "E02-persona-modeling.md" },
  agent_03:  { name: "提示词大师", icon: "🎨", group: "production", description: "结构化prompt多模型适配", promptFile: "E03-prompt-master.md" },
  agent_04:  { name: "脚本分镜", icon: "🎬", group: "production", description: "执行级拍摄方案", promptFile: "E04-shot-director.md" },
  agent_05:  { name: "BGM作曲", icon: "🎵", group: "production", description: "情感匹配+曲目推荐", promptFile: "E05-bgm-composer.md" },
  agent_06:  { name: "音效设计", icon: "🔊", group: "production", description: "4层声音蓝图", promptFile: "E06-sound-designer.md" },
  agent_07:  { name: "数据分析", icon: "📊", group: "optimization", description: "三维诊断报告", promptFile: "E07-data-analytics.md" },
  agent_08:  { name: "投流分析", icon: "📈", group: "optimization", description: "ROI诊断+预算优化", promptFile: "E08-ad-optimizer.md" },
  agent_09:  { name: "知识图谱", icon: "🧠", group: "planning", description: "行业诊断PESTEL+SWOT", promptFile: "E09-knowledge-graph.md" },
  agent_10:  { name: "标题拆解", icon: "📰", group: "optimization", description: "5维度评分+优化建议", promptFile: "E10-title-analyzer.md" },
  agent_11A: { name: "爆款复刻", icon: "📋", group: "optimization", description: "基因解析+3版复刻文案", promptFile: "E11A-content-replicator.md" },
  agent_11B: { name: "评论分析", icon: "💬", group: "optimization", description: "7层交叉分析+预警", promptFile: "E11B-comment-analytics.md" },
  agent_12:  { name: "封面灵感", icon: "🖼️", group: "production", description: "3套方案+点击率预测", promptFile: "E12-cover-designer.md" },
  agent_13:  { name: "选题分析", icon: "💡", group: "planning", description: "8维度×9风格标题方案", promptFile: "E13-topic-generator.md" },
  agent_14:  { name: "标签SEO", icon: "🏷️", group: "optimization", description: "平台关键词优化", promptFile: "E14-tag-seo.md" },
}

export interface AgentInput {
  instruction: string
  context?: { userProfile?: { niche?: string; platform?: string; brand?: string; product?: string; persona?: string; goal?: string }; brandGuide?: string; personaProfile?: string; characterBible?: string; styleGuide?: string; selectedTopic?: string; referenceUrls?: string[]; previousOutputs?: Record<string, any> }
  referenceImages?: string[]
  referenceText?: string
  referenceLinks?: string[]
  parameters?: Record<string, string>
}

export interface AgentOutput {
  success: boolean
  agentId: AgentId
  agentName: string
  mainOutput: string
  structuredOutput?: Record<string, any>
  qualityScore: number
  confidence: number
  alternatives?: { title: string; content: string; score: number }[]
  processingTime?: number
  modelUsed?: string
  error?: string
  requiresReview?: boolean
}

export interface AgentRegistration {
  id: AgentId; name: string; icon: string; group: AgentGroup
  description: string; version: string; isActive: boolean
  triggers: string[]; requiredInputs: string[]; optionalInputs: string[]
  defaultModel: string; temperature: number; maxTokens: number
  hasStandaloneUI: boolean
}
