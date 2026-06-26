import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent14 extends BaseAgent {
  id: AgentId = "agent_14"
  getRegistration(): AgentRegistration {
    return { id: "agent_14", name: "标签SEO", icon: "🏷️", group: "optimization", description: "平台关键词优化方案", version: "3.0.0", isActive: true, triggers: ["标签优化"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.3, maxTokens: 1500, hasStandaloneUI: true }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位精通" + platform + "标签SEO的专家。根据文案内容推荐标签。直接输出，不要用JSON。\n\n平台：" + platform + "\n\n核心标签：\n#标签1\n#标签2\n#标签3\n\n长尾标签：\n#标签4\n#标签5\n\n热门标签：\n#标签6\n#标签7\n\n策略建议："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 1500 })
    return { success: true, agentId: this.id, agentName: "标签SEO", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
