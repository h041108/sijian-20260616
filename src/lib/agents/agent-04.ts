import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent04 extends BaseAgent {
  id: AgentId = "agent_04"
  getRegistration(): AgentRegistration {
    return { id: "agent_04", name: "\u811A\u672C\u5206\u955C", icon: "\uD83C\uDFAC", group: "production", description: "\u6267\u884C\u7EA7\u62CD\u6444\u65B9\u6848", version: "1.0.0", isActive: true, triggers: ["\u89C6\u9891\u811A\u672C", "\u62CD\u6444\u65B9\u6848"], requiredInputs: ["instruction"], optionalInputs: ["context.platform", "parameters.duration"], defaultModel: "deepseek", temperature: 0.5, maxTokens: 3000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const dur = input.parameters?.duration || "60"
    const sp = "\u4F60\u662F\u4E00\u4F4D\u5206\u955C\u5BFC\u6F14\u3002\u5C06\u9009\u9898\u6269\u5C55\u4E3A\u542B\u9884\u7B97\u7269\u6599\u7684\u6267\u884C\u7EA7\u62CD\u6444\u65B9\u6848\u3002\u6BCF\u4E2A\u955C\u5934\u5305\u542B\uFF1A\u955C\u5934\u53F7+\u753B\u9762\u63CF\u8FF0+\u5BF9\u767D\u65C1\u767D+\u65F6\u957F+\u8FD0\u955C+\u666F\u522B+\u60C5\u7EEA+\u8F6C\u573A\u3002\u51715-8\u4E2A\u955C\u5934\uFF0C\u603B\u65F6\u957F" + dur + "\u79D2"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 3000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.shots) {
      return { success: true, agentId: this.id, agentName: "\u811A\u672C\u5206\u955C", mainOutput: parsed.title + " (" + parsed.totalDuration + "\u79D2, " + parsed.shots.length + "\u4E2A\u955C\u5934)", structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "\u811A\u672C\u5206\u955C", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}