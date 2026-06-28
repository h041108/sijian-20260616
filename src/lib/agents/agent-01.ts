import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent01 extends BaseAgent {
  id: AgentId = "agent_01"
  getRegistration(): AgentRegistration {
    return { id: "agent_01", name: "商业策略", icon: "🏢", group: "planning", description: "创始人分析+IP方向", version: "3.0.0", isActive: true, triggers: ["创始人IP", "商业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位商业策略分析师。对用户提供的创始人或品牌进行深度分析。\n\n直接输出，不要用JSON格式，不要用markdown标记：\n\n核心洞察：一句话\n\n创始人画像：背景、优势、需要补足的地方\n\nIP方向建议（至少3个）：\n1. 方向名称 — 内容类型，目标受众\n2. ...\n3. ...\n\n变现路径：\n短期（1-2月）：\n中期（3-6月）：\n长期（6月+）："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "商业策略", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
