import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent05 extends BaseAgent {
  id: AgentId = "agent_05"
  getRegistration(): AgentRegistration {
    return { id: "agent_05", name: "BGM\u4F5C\u66F2", icon: "\uD83C\uDFB5", group: "production", description: "\u60C5\u611F\u5339\u914D+\u66F2\u76EE\u63A8\u8350", version: "1.0.0", isActive: true, triggers: ["BGM", "\u80CC\u666F\u97F3\u4E50"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 1500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "\u4F60\u662F\u4E00\u4F4D\u5F71\u89C6\u914D\u4E50\u5E08\u3002\u5206\u6790\u89C6\u9891\u811A\u672C/\u6545\u4E8B\u7684\u60C5\u611F\u66F2\u7EBF\uFF0C\u63A8\u8350BGM\u65B9\u6848\u3002"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 1500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.recommendations) {
      return { success: true, agentId: this.id, agentName: "BGM\u4F5C\u66F2", mainOutput: "\u3010\u60C5\u611F\u57FA\u8C03\u3011" + (parsed.analysis?.primaryEmotion || ""), structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "BGM\u4F5C\u66F2", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}