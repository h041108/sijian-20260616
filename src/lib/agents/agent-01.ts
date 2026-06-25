import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent01 extends BaseAgent {
  id: AgentId = "agent_01"
  getRegistration(): AgentRegistration {
    return { id: "agent_01", name: "商业策略", icon: "🏢", group: "planning", description: "创始人分析+IP方向", version: "2.0.0", isActive: true, triggers: ["创始人IP", "商业分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位商业策略分析师。输出创始人IP方向和变现路径。必须返回严格JSON，不加markdown。\n\n{\"insight\":\"核心洞察\",\"founderProfile\":{\"background\":\"背景\",\"strengths\":[\"优势\"],\"blindspots\":[\"盲区\"]},\"ipDirections\":[{\"name\":\"方向名\",\"contentType\":\"内容类型\",\"targetAudience\":\"受众\"}],\"monetization\":{\"shortTerm\":\"短期\",\"midTerm\":\"中期\",\"longTerm\":\"长期\"}}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.insight) {
      const d = parsed.ipDirections?.map((d:any,i:number) => (i+1)+". "+d.name+" → "+d.contentType).join("\n")||""
      return { success: true, agentId: this.id, agentName: "商业策略", mainOutput: "【洞察】"+parsed.insight+"\n\n【IP方向】\n"+d, structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "商业策略", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}