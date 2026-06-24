import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent09 extends BaseAgent {
  id: AgentId = "agent_09"
  getRegistration(): AgentRegistration {
    return { id: "agent_09", name: "\u77E5\u8BC6\u56FE\u8C31", icon: "\uD83E\uDDE0", group: "planning", description: "\u884C\u4E1A\u8BCA\u65ADPESTEL+SWOT", version: "1.0.0", isActive: true, triggers: ["\u884C\u4E1A\u5206\u6790", "\u5E02\u573A\u8BCA\u65AD"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "\u4F60\u662F\u4E00\u4F4D\u884C\u4E1A\u5206\u6790\u4E13\u5BB6\u3002\u5BF9\u7528\u6237\u63D0\u4F9B\u7684\u884C\u4E1A\u8FDB\u884CPESTEL+SWOT\u5206\u6790\u3002"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.swot) {
      return { success: true, agentId: this.id, agentName: "\u77E5\u8BC6\u56FE\u8C31", mainOutput: "SWOT\u5206\u6790\u5B8C\u6210", structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "\u77E5\u8BC6\u56FE\u8C31", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}