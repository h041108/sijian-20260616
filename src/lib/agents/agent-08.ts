import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent08 extends BaseAgent {
  id: AgentId = "agent_08"
  getRegistration(): AgentRegistration {
    return { id: "agent_08", name: "投流分析", icon: "📈", group: "optimization", description: "ROI诊断+预算优化", version: "3.0.0", isActive: true, triggers: ["投流", "广告优化"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位信息流投流专家，精通抖音/腾讯/快手广告投放。

【ROI诊断】当前投放效率分析
【预算分配】不同渠道的预算配比建议
【定向策略】人群包/兴趣定向/行为定向
【出价策略】OCPM/CPA/CPS选择建议
【AB测试方案】素材/人群/出价的对比测试设计
【归因模型】选择适合的归因方式
【优化节奏】每日/每周投放优化计划`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "投流分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
