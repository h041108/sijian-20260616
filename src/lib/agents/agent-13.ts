import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent13 extends BaseAgent {
  id: AgentId = "agent_13"
  getRegistration(): AgentRegistration {
    return { id: "agent_13", name: "选题分析", icon: "💡", group: "planning", description: "8维度x9风格标题方案", version: "1.0.0", isActive: true, triggers: ["每日选题", "热点追踪"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位选题分析师。为用户提供今日最佳选题方案。\n\n基于用户赛道" + platform + "，生成TOP 3选题：\n每个选题包含：标题+切入角度+预估热度\n\nJSON：\n{\"topics\":[{\"title\":\"...\",\"angle\":\"...\",\"heat\":\"高/中\",\"reason\":\"...\"}],\"strategy\":\"整体策略建议\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.topics) {
      return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: parsed.topics.map((t,i) => (i+1) + ". " + t.title + "（热度" + t.heat + "）\n   " + t.angle).join("\n") + (parsed.strategy ? "\n\n策略：" + parsed.strategy : ""), structuredOutput: parsed, qualityScore: 82, confidence: 78 }
    }
    return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}
