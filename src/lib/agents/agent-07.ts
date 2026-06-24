import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent07 extends BaseAgent {
  id: AgentId = "agent_07"
  getRegistration(): AgentRegistration {
    return { id: "agent_07", name: "\u6570\u636E\u5206\u6790", icon: "\uD83D\uDCCA", group: "optimization", description: "\u4E09\u7EF4\u8BCA\u65AD\u62A5\u544A", version: "1.0.0", isActive: true, triggers: ["\u6570\u636E\u5206\u6790", "\u8FD0\u8425\u8BCA\u65AD"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "\u4F60\u662F\u4E00\u4F4D\u5185\u5BB9\u6570\u636E\u5206\u6790\u5E08\u3002\u5206\u6790\u89C6\u9891/\u56FE\u6587\u6570\u636E\uFF0C\u8F93\u51FA\u4E09\u7EF4\u8BCA\u65AD\u62A5\u544A\u3002"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.contentDimension) {
      return { success: true, agentId: this.id, agentName: "\u6570\u636E\u5206\u6790", mainOutput: "\u6570\u636E\u5206\u6790\u5B8C\u6210", structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "\u6570\u636E\u5206\u6790", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}