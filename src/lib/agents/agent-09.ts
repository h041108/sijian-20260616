import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent09 extends BaseAgent {
  id: AgentId = "agent_09"
  getRegistration(): AgentRegistration {
    return { id: "agent_09", name: "知识图谱", icon: "🧠", group: "planning", description: "行业PESTEL+SWOT分析", version: "3.0.0", isActive: true, triggers: ["行业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位行业分析专家，擅长PESTEL+SWOT框架分析。

【PESTEL分析】政策/经济/社会/技术/环境/法律
【SWOT分析】优势/劣势/机会/威胁
【行业结构】产业链/竞争格局/进入壁垒
【趋势洞察】3个短期趋势+2个长期趋势
【竞争图谱】主要参与者/市场定位/差异化
【战略建议】基于分析的3个具体行动方向`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "知识图谱", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
