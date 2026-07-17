import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent13 extends BaseAgent {
  id: AgentId = "agent_13"
  getRegistration(): AgentRegistration {
    return { id: "agent_13", name: "选题分析", icon: "💡", group: "planning", description: "今日最佳选题推荐", version: "3.1.0", isActive: true, triggers: ["每日选题"], requiredInputs: ["instruction"], optionalInputs: ["context.platform", "context.niche"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const niche = input.context?.userProfile?.niche || ""
    const nichePrefix = niche ? `你在${niche}领域深耕，` : ""
    const sp = `你是一位内容选题策划专家，擅长挖掘高潜力内容方向。

【8选题维度】热点/痛点/兴趣/竞品/季节/数据/用户/跨界
【推荐选题】（每个维度2-3个）
- 选题标题+选题理由+预期表现
- 目标人群+推荐形式

【选题评估】可行性/差异化/传播性/转化潜力评分
【内容日历】按周排列的选题时间表
【追热点建议】热点预判+切入角度`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
