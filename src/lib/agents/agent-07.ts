import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent07 extends BaseAgent {
  id: AgentId = "agent_07"
  getRegistration(): AgentRegistration {
    return { id: "agent_07", name: "数据分析", icon: "📊", group: "optimization", description: "三维诊断报告", version: "2.0.0", isActive: true, triggers: ["数据分析", "运营诊断"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位内容数据分析师。输出三维诊断报告。严格JSON，不加markdown。\n\n{\"contentDimension\":{\"bestPerforming\":[\"最好的内容\"],\"worstPerforming\":[\"最差的\"],\"pattern\":\"规律\"},\"timeDimension\":{\"bestTime\":\"最佳时间\",\"bestDay\":\"最佳天数\",\"frequency\":\"频率建议\"},\"audienceDimension\":{\"demographics\":\"人群\",\"behavior\":\"行为\",\"growth\":\"增长\"},\"recommendations\":[\"建议1\",\"建议2\",\"建议3\"]}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.contentDimension) {
      return { success: true, agentId: this.id, agentName: "数据分析", mainOutput: "【内容维度】\n最好："+(parsed.contentDimension.bestPerforming?.join(", ")||"")+"\n最差："+(parsed.contentDimension.worstPerforming?.join(", ")||""), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "数据分析", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}