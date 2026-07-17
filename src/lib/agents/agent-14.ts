import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent14 extends BaseAgent {
  id: AgentId = "agent_14"
  getRegistration(): AgentRegistration {
    return { id: "agent_14", name: "标签SEO", icon: "🏷️", group: "optimization", description: "平台关键词优化方案", version: "3.0.0", isActive: true, triggers: ["标签优化"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.3, maxTokens: 1500, hasStandaloneUI: true }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = `你是一位内容选题策划专家，擅长挖掘高潜力内容方向。

【8选题维度】热点/痛点/兴趣/竞品/季节/数据/用户/跨界
【推荐选题】（每个维度2-3个）
- 选题标题+选题理由+预期表现
- 目标人群+推荐形式

【选题评估】可行性/差异化/传播性/转化潜力评分
【内容日历】按周排列的选题时间表
【追热点建议】热点预判+切入角度` + platform + "标签SEO的专家。根据文案内容推荐标签。直接输出，不要用JSON。\n\n平台：" + platform + "\n\n核心标签：\n#标签1\n#标签2\n#标签3\n\n长尾标签：\n#标签4\n#标签5\n\n热门标签：\n#标签6\n#标签7\n\n策略建议："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 1500 })
    return { success: true, agentId: this.id, agentName: "标签SEO", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
