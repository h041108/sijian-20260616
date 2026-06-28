import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent09 extends BaseAgent {
  id: AgentId = "agent_09"
  getRegistration(): AgentRegistration {
    return { id: "agent_09", name: "知识图谱", icon: "🧠", group: "planning", description: "行业PESTEL+SWOT分析", version: "3.0.0", isActive: true, triggers: ["行业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位行业分析师。进行PESTEL+SWOT分析。直接输出，不要用JSON。\n\n行业：\n\nPESTEL分析：\n政治：\n经济：\n社会：\n技术：\n环境：\n法律：\n\nSWOT分析：\n优势：\n劣势：\n机会：\n威胁：\n\n关键趋势：\n机会窗口："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "知识图谱", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
