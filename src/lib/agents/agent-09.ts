import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent09 extends BaseAgent {
  id: AgentId = "agent_09"
  getRegistration(): AgentRegistration {
    return { id: "agent_09", name: "知识图谱", icon: "🧠", group: "planning", description: "PESTEL+SWOT分析", version: "2.0.0", isActive: true, triggers: ["行业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位行业分析专家。输出PESTEL+SWOT分析。严格JSON，不加markdown。\n\n{\"industry\":\"行业\",\"pestel\":{\"political\":\"政治\",\"economic\":\"经济\",\"social\":\"社会\",\"technological\":\"技术\",\"environmental\":\"环境\",\"legal\":\"法律\"},\"swot\":{\"strengths\":[\"优势\"],\"weaknesses\":[\"劣势\"],\"opportunities\":[\"机会\"],\"threats\":[\"威胁\"]},\"keyTrends\":[\"趋势1\",\"趋势2\"],\"opportunityWindow\":\"机会窗口\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.swot) {
      return { success: true, agentId: this.id, agentName: "知识图谱", mainOutput: "行业："+parsed.industry+"\n\nSWOT：\n优势："+parsed.swot.strengths.join(", ")+"\n劣势："+parsed.swot.weaknesses.join(", ")+"\n机会："+parsed.swot.opportunities.join(", ")+"\n威胁："+parsed.swot.threats.join(", "), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "知识图谱", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}