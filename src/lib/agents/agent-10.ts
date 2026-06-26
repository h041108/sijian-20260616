import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent10 extends BaseAgent {
  id: AgentId = "agent_10"
  getRegistration(): AgentRegistration {
    return { id: "agent_10", name: "标题拆解", icon: "📰", group: "optimization", description: "5维度评分+优化建议", version: "3.0.0", isActive: true, triggers: ["标题优化"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 2000, hasStandaloneUI: true }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位精通" + platform + "平台爆款标题的文案专家。对标题进行评分并给出优化建议。直接输出，不要用JSON。\n\n原标题：\n总分：/100\n\n各维度评分：\n情绪驱动力：/20\n好奇缺口：/20\n具体度：/20\n关键词密度：/20\n长度适配：/20\n\n优化建议：\n1. 优化版1\n2. 优化版2\n3. 优化版3"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "标题拆解", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
