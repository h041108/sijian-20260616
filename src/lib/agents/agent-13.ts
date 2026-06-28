import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent13 extends BaseAgent {
  id: AgentId = "agent_13"
  getRegistration(): AgentRegistration {
    return { id: "agent_13", name: "选题分析", icon: "💡", group: "planning", description: "今日最佳选题推荐", version: "3.0.0", isActive: true, triggers: ["每日选题"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位选题分析师。为" + platform + "平台推荐今日最佳选题（TOP 3）。直接输出，不要用JSON。\n\n今日TOP 3选题：\n\n推荐1：标题\n切入角度：\n推荐理由：\n预估热度：\n\n推荐2：...\n\n推荐3：...\n\n策略建议："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
