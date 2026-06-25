import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent08 extends BaseAgent {
  id: AgentId = "agent_08"
  getRegistration(): AgentRegistration {
    return { id: "agent_08", name: "投流分析", icon: "📈", group: "optimization", description: "ROI诊断+预算优化", version: "2.0.0", isActive: true, triggers: ["投流", "广告优化"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位投流优化专家。输出ROI诊断和预算优化方案。严格JSON，不加markdown。\n\n{\"roiAnalysis\":{\"currentROI\":\"当前ROI\",\"spend\":\"花费\",\"revenue\":\"收入\",\"cpa\":\"CPA\",\"efficiency\":\"效率\"},\"optimization\":{\"budgetReallocation\":\"预算重分配\",\"targetingSuggestions\":[\"定向建议\"],\"creativeRotation\":\"素材轮换\"},\"forecast\":{\"optimizedROI\":\"优化后ROI\",\"optimalBudget\":\"最优预算\"},\"actionItems\":[\"操作1\",\"操作2\",\"操作3\"]}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.roiAnalysis) {
      return { success: true, agentId: this.id, agentName: "投流分析", mainOutput: "当前ROI："+parsed.roiAnalysis.currentROI+" | 花费："+parsed.roiAnalysis.spend+"\n\n建议：\n"+(parsed.actionItems?.map((a:any,i:number) => (i+1)+". "+a).join("\n")||""), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "投流分析", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}