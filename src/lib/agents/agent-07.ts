import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent07 extends BaseAgent {
  id: AgentId = "agent_07"
  getRegistration(): AgentRegistration {
    return { id: "agent_07", name: "数据分析", icon: "📊", group: "optimization", description: "三维诊断报告", version: "3.0.0", isActive: true, triggers: ["数据分析", "运营诊断"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位内容数据分析师。分析数据并输出诊断报告。直接输出，不要用JSON。\n\n内容维度分析：\n表现最好的：\n表现最差的：\n规律总结：\n\n时间维度分析：\n最佳发布时间：\n最佳发布频率：\n\n优化建议：\n1.\n2.\n3."
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "数据分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
