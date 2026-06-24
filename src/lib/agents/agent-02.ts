import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent02 extends BaseAgent {
  id: AgentId = "agent_02"
  getRegistration(): AgentRegistration {
    return { id: "agent_02", name: "人设建模", icon: "👤", group: "planning", description: "人设方案+风格调性", version: "1.0.0", isActive: true, triggers: ["新账号", "内容风格调整"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位人设建模专家。为" + platform + "账号创建完整人设方案。\n\n【人设标签】3-5个\n【语气风格】描述\n【内容调性】描述\n【视觉风格】描述\n【招牌动作/口癖】描述\n【目标粉丝画像】描述\n\nJSON：\n{\"personaTags\":[\"...\"],\"tone\":\"...\",\"contentMood\":\"...\",\"visualStyle\":\"...\",\"signatures\":[\"...\"],\"targetFans\":\"...\",\"platform\":\"" + platform + "\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.personaTags) {
      return { success: true, agentId: this.id, agentName: "人设建模", mainOutput: "【标签】" + parsed.personaTags.join(" · ") + "\n【语气】" + parsed.tone + "\n【视觉】" + parsed.visualStyle, structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "人设建模", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}
