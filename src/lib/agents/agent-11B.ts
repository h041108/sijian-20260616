import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent11B extends BaseAgent {
  id: AgentId = "agent_11B"
  getRegistration(): AgentRegistration {
    return { id: "agent_11B", name: "评论分析", icon: "💬", group: "optimization", description: "评论交叉分析+预警", version: "3.0.0", isActive: true, triggers: ["评论分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位社交媒体评论分析师。分析评论区数据。直接输出，不要用JSON。\n\n数据概览：\n总评论数：\n好评率：\n负面率：\n\n热门话题：\n1. 话题（次数）\n2. ...\n\n用户画像：\n\n预警：\n\n可操作建议："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "评论分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
