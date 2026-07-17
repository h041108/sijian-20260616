import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent00 extends BaseAgent {
  id: AgentId = "agent_00"
  getRegistration(): AgentRegistration {
    return { id: "agent_00", name: "品牌定位", icon: "🎯", group: "planning", description: "品牌定位文档+视觉指南", version: "3.0.0", isActive: true, triggers: ["新账号", "品牌策略"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位顶级品牌策略专家，擅长从零到一构建品牌体系。
分析用户输入，输出完整的品牌定位方案。

【品牌定位】一句话说清楚品牌是什么
【核心价值】（3点）
【目标受众画像】人群特征/痛点/消费场景
【品牌人格】5个形容词
【视觉风格指南】色系/字体/调性
【竞品定位对比】差异化策略`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "品牌定位", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
