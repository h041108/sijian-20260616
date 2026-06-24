import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent14 extends BaseAgent {
  id: AgentId = "agent_14"

  getRegistration(): AgentRegistration {
    return {
      id: "agent_14", name: "标签SEO", icon: "🏷️", group: "optimization",
      description: "平台关键词优化方案", version: "1.0.0", isActive: true,
      triggers: ["内容发布前", "标签优化", "SEO"],
      requiredInputs: ["instruction"], optionalInputs: ["context.platform"],
      defaultModel: "deepseek", temperature: 0.3, maxTokens: 1500, hasStandaloneUI: true,
    }
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"

    const systemPrompt = `你是一位精通${platform}标签SEO策略的专家。
标签分三层：核心标签（精准定位）、长尾标签（扩展流量）、热门标签（蹭热度）
标签数量：${platform === "视频号" || platform === "B站" ? "≤7个" : "≤10个"}
核心标签3个，长尾标签5个，热门标签2个

只输出JSON，不加markdown：
{"coreTags":[{"tag":"#xxx","searchVolume":"10万+","competition":"低/中/高","reason":"原因"}],"longTailTags":[{"tag":"#xxx","searchVolume":"1万+","competition":"低/中/高","reason":"原因"}],"trendingTags":[{"tag":"#xxx","searchVolume":"50万+","competition":"高","reason":"原因"}],"strategy":"策略总结","optimizedTitle":"含关键词优化后的标题"}`

    const raw = await this.callLLM(systemPrompt, `【平台】${platform}\n【文案】${input.instruction}`, { temperature: 0.3, maxTokens: 1500 })
    const parsed = this.parseJSON<{ coreTags?: any[]; longTailTags?: any[]; trendingTags?: any[]; strategy?: string; optimizedTitle?: string }>(raw)

    if (parsed?.coreTags) {
      const allTags = [...(parsed.coreTags || []), ...(parsed.longTailTags || []), ...(parsed.trendingTags || [])].map(t => t.tag).join(" ")
      return {
        success: true, agentId: this.id, agentName: "标签SEO",
        mainOutput: `【${platform}标签方案】\n📌 核心: ${parsed.coreTags.map(t=>t.tag).join(" ")}\n🔗 长尾: ${parsed.longTailTags?.map(t=>t.tag).join(" ") || ""}\n🔥 热门: ${parsed.trendingTags?.map(t=>t.tag).join(" ") || ""}${parsed.strategy ? `\n\n策略：${parsed.strategy}` : ""}${parsed.optimizedTitle ? `\n优化标题：${parsed.optimizedTitle}` : ""}`,
        structuredOutput: parsed, qualityScore: 90, confidence: 85,
        alternatives: [{ title: `${platform}标签集`, content: allTags, score: 90 }],
      }
    }
    return { success: true, agentId: this.id, agentName: "标签SEO", mainOutput: raw, qualityScore: 65, confidence: 55 }
  }
}
