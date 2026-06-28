import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent08 extends BaseAgent {
  id: AgentId = "agent_08"
  getRegistration(): AgentRegistration {
    return { id: "agent_08", name: "投流分析", icon: "📈", group: "optimization", description: "ROI诊断+预算优化", version: "3.0.0", isActive: true, triggers: ["投流", "广告优化"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位投流优化专家。分析广告投放数据并输出优化方案。直接输出，不要用JSON。\n\n当前投放效果：\nROI：\n花费：\n收入：\nCPA：\n\n优化建议：\n1. 预算分配调整：\n2. 定向优化：\n3. 素材轮换：\n\n预测优化后ROI："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "投流分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
