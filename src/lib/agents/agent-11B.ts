import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent11B extends BaseAgent {
  id: AgentId = "agent_11B"
  getRegistration(): AgentRegistration {
    return { id: "agent_11B", name: "评论分析", icon: "💬", group: "optimization", description: "7层交叉分析+预警", version: "2.0.0", isActive: true, triggers: ["评论分析"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位社交媒体评论分析师。输出7层交叉分析报告。严格JSON，不加markdown。\n\n{\"summary\":{\"totalComments\":0,\"positiveRate\":0.7,\"negativeRate\":0.1,\"engagementRate\":0.05},\"sentimentAnalysis\":{\"positive\":[\"正面话题\"],\"negative\":[\"负面话题\"],\"neutral\":[\"中性\"]},\"topicClusters\":[{\"topic\":\"话题\",\"count\":10,\"sentiment\":\"正面/负面\"}],\"userPortrait\":{\"ageGroup\":\"年龄\",\"painPoints\":[\"痛点\"],\"demands\":[\"需求\"]},\"alerts\":[\"预警\"],\"actionItems\":[\"建议\"]}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.summary) {
      return { success: true, agentId: this.id, agentName: "评论分析", mainOutput: "评论"+parsed.summary.totalComments+"条 | 正面率"+Math.round(parsed.summary.positiveRate*100)+"%\n\n热门话题：\n"+(parsed.topicClusters?.map((t:any) => t.topic+"("+t.count+"条)").join("\n")||"")+"\n\n预警："+(parsed.alerts?.join("; ")||"无"), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "评论分析", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}