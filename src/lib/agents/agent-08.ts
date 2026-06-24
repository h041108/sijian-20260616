import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent08 extends BaseAgent {
  id: AgentId = "agent_08"
  getRegistration(): AgentRegistration {
    return { id: "agent_08", name: "\u6295\u6D41\u5206\u6790", icon: "\uD83D\uDCC8", group: "optimization", description: "ROI\u8BCA\u65AD+\u9884\u7B97\u4F18\u5316", version: "1.0.0", isActive: true, triggers: ["\u6295\u6D41", "\u5E7F\u544A\u4F18\u5316"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "\u4F60\u662F\u4E00\u4F4D\u6295\u6D41\u4F18\u5316\u4E13\u5BB6\u3002\u5206\u6790\u5E7F\u544A\u6295\u653E\u6570\u636E\uFF0C\u8F93\u51FAROI\u8BCA\u65AD\u548C\u9884\u7B97\u4F18\u5316\u65B9\u6848\u3002"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.roiAnalysis) {
      return { success: true, agentId: this.id, agentName: "\u6295\u6D41\u5206\u6790", mainOutput: "ROI\u8BCA\u65AD\u5B8C\u6210", structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "\u6295\u6D41\u5206\u6790", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}