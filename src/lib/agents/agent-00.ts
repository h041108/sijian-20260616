import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent00 extends BaseAgent {
  id: AgentId = "agent_00"
  getRegistration(): AgentRegistration {
    return { id: "agent_00", name: "品牌定位", icon: "🎯", group: "planning", description: "品牌定位文档+视觉指南", version: "1.0.0", isActive: true, triggers: ["新账号", "品牌策略"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位品牌策略专家。根据用户输入的品牌/产品/行业信息，输出品牌定位文档。\n格式：\n【品牌定位】一句话\n【核心价值】3点\n【目标受众】描述\n【品牌人格】5个形容词\n【视觉指南】色板+字体+风格\n【竞品定位】对比\n\nJSON输出：\n{\"positioning\":\"...\",\"coreValues\":[\"...\"],\"targetAudience\":\"...\",\"brandPersona\":[\"...\"],\"visualGuide\":{\"palette\":[\"#...\"],\"font\":\"...\",\"style\":\"...\"},\"competitors\":[{\"name\":\"...\",\"position\":\"...\"}]}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.positioning) {
      return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: "【定位】" + parsed.positioning + (parsed.coreValues?.length ? "\n【价值】" + parsed.coreValues.join(", ") : ""), structuredOutput: parsed, qualityScore: 85, confidence: 80 }
    }
    return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}
