import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent13 extends BaseAgent {
  id: AgentId = "agent_13"
  getRegistration(): AgentRegistration {
    return { id: "agent_13", name: "选题分析", icon: "💡", group: "planning", description: "今日最佳选题推荐", version: "3.1.0", isActive: true, triggers: ["每日选题"], requiredInputs: ["instruction"], optionalInputs: ["context.platform", "context.niche"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const niche = input.context?.userProfile?.niche || ""
    const nichePrefix = niche ? `你在${niche}领域深耕，` : ""
    const sp = `你是一位${platform}平台专业内容创作者。${nichePrefix}根据用户需求创作一篇爆款内容，直接输出完整文案。`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
