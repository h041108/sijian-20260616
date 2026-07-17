import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent11B extends BaseAgent {
  id: AgentId = "agent_11B"
  getRegistration(): AgentRegistration {
    return { id: "agent_11B", name: "评论分析", icon: "💬", group: "optimization", description: "评论交叉分析+预警", version: "3.0.0", isActive: true, triggers: ["评论分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位社交媒体评论分析师，精通用户舆情分析。

【7层交叉分析】情绪/话题/用户画像/时间/平台/竞品/KOL
【情感分析】正面/负面/中性比例+趋势
【高频词提取】核心关键词+关联词
【预警机制】负面舆情识别+紧急度评分
【竞品评论对比】同领域竞品的评论特征
【优化建议】基于评论的内容改进方向`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "评论分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
