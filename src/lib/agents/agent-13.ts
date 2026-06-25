import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent13 extends BaseAgent {
  id: AgentId = "agent_13"
  getRegistration(): AgentRegistration {
    return { id: "agent_13", name: "选题分析", icon: "💡", group: "planning", description: "TOP选题推荐", version: "2.0.0", isActive: true, triggers: ["每日选题"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位选题分析师。针对"+platform+"平台推荐今日最佳选题（TOP 3）。严格JSON，不加markdown。\n\n{\"topics\":[{\"title\":\"选题标题\",\"angle\":\"切入角度\",\"heat\":\"高/中\",\"reason\":\"推荐理由\"}],\"strategy\":\"整体策略\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.topics) {
      const out = "今日TOP 3选题（"+platform+"）：\n\n"+parsed.topics.map((t:any,i:number) => (i+1)+". "+t.title+"\n   切入角度："+t.angle+"\n   热度："+t.heat).join("\n\n")+(parsed.strategy?"\n\n策略："+parsed.strategy:"")
      return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: out, structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "选题分析", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}