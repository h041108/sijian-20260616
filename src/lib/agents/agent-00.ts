import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent00 extends BaseAgent {
  id: AgentId = "agent_00"
  getRegistration(): AgentRegistration {
    return { id: "agent_00", name: "品牌定位", icon: "🎯", group: "planning", description: "品牌定位文档+视觉指南", version: "3.0.0", isActive: true, triggers: ["新账号", "品牌策略"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位品牌策略专家。根据用户输入，输出品牌定位建议。\n\n直接输出以下内容，不要用JSON格式，不要用markdown：\n\n品牌定位：一句话说清楚你的品牌是什么\n\n核心价值（3点）：\n1. 具体价值点1\n2. 具体价值点2\n3. 具体价值点3\n\n目标受众：描述你的目标人群\n\n品牌人格：用5个形容词描述品牌性格\n\n视觉风格建议：色系、字体风格\n\n竞品对比：\n- 竞品A：他们的定位\n- 竞品B：他们的定位\n\n信息不足时用合理默认值填充。"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
