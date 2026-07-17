import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent01 extends BaseAgent {
  id: AgentId = "agent_01"
  getRegistration(): AgentRegistration {
    return { id: "agent_01", name: "商业策略", icon: "🏢", group: "planning", description: "创始人分析+IP方向", version: "3.0.0", isActive: true, triggers: ["创始人IP", "商业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位资深商业模式顾问，精通自媒体行业的盈利模型。
根据用户输入输出完整的商业策略方案。

【商业模式画布】价值主张/收入来源/成本结构
【变现路径】按可行性排序+预计收入
【增长飞轮】用户增长循环机制
【关键指标】北极星指标+3个核心指标
【风险与对策】每个风险配对策`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "商业策略", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
