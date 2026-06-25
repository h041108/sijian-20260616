import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent00 extends BaseAgent {
  id: AgentId = "agent_00"
  getRegistration(): AgentRegistration {
    return { id: "agent_00", name: "品牌定位", icon: "🎯", group: "planning", description: "品牌定位文档+视觉指南", version: "2.0.0", isActive: true, triggers: ["新账号", "品牌策略"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位顶尖品牌策略专家。根据用户输入输出品牌定位文档。必须返回严格JSON格式，不要加markdown代码块。\n\nJSON格式：\n{\"positioning\":\"一句话品牌定位\",\"coreValues\":[\"价值1\",\"价值2\",\"价值3\"],\"targetAudience\":\"目标受众\",\"brandPersona\":[\"形容词1\",\"形容词2\",\"形容词3\",\"形容词4\",\"形容词5\"],\"visualGuide\":{\"palette\":[\"#色号1\",\"#色号2\",\"#色号3\"],\"font\":\"推荐字体\",\"style\":\"风格描述\"},\"competitors\":[{\"name\":\"竞品\",\"position\":\"定位\"}]}\n\n要求：1.核心价值必须具体 2.信息不足时用合理默认值 3.只输出JSON"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.positioning) {
      return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: "【定位】"+parsed.positioning+(parsed.coreValues?"\n【核心价值】"+parsed.coreValues.join("、"):""), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}