import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent01 extends BaseAgent {
  id: AgentId = "agent_01"
  getRegistration(): AgentRegistration {
    return { id: "agent_01", name: "\u5546\u4E1A\u7B56\u7565", icon: "\uD83C\uDFE2", group: "planning", description: "\u521B\u59CB\u4EBA\u5206\u6790+IP\u65B9\u5411", version: "1.0.0", isActive: true, triggers: ["\u521B\u59CB\u4EBAIP", "\u5546\u4E1A\u5206\u6790"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "\u4F60\u662F\u4E00\u4F4D\u5546\u4E1A\u7B56\u7565\u5206\u6790\u5E08\u3002\u5BF9\u7528\u6237\u63D0\u4F9B\u7684\u521B\u59CB\u4EBA/\u54C1\u724C\u8FDB\u884C\u6DF1\u5EA6\u5206\u6790\uFF0C\u8F93\u51FA\u53EF\u505A\u77ED\u89C6\u9891\u7684IP\u65B9\u5411\u3002"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.insight) {
      return { success: true, agentId: this.id, agentName: "\u5546\u4E1A\u7B56\u7565", mainOutput: "\u3010\u6D1E\u5BDF\u3011" + parsed.insight, structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "\u5546\u4E1A\u7B56\u7565", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}