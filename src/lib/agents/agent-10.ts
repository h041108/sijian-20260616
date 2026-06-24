import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent10 extends BaseAgent {
  id: AgentId = "agent_10"

  getRegistration(): AgentRegistration {
    return {
      id: "agent_10", name: "标题拆解", icon: "📰", group: "optimization",
      description: "5维度评分+优化建议", version: "1.0.0", isActive: true,
      triggers: ["标题优化", "文案发布前"], requiredInputs: ["instruction"],
      optionalInputs: ["context.platform"],
      defaultModel: "deepseek", temperature: 0.4, maxTokens: 2000, hasStandaloneUI: true,
    }
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"

    const systemPrompt = `你是一位精通${platform}爆款标题的文案专家。5维度评分体系（每项0-20，满分100）：
1. 情绪驱动力：引发好奇/恐惧/共鸣等强情绪
2. 好奇缺口：话只说一半，必须点开才知道
3. 具体度：有数字/场景/结果承诺
4. 关键词密度：包含搜索热词+赛道词
5. 长度适配：${platform}最佳长度内

只输出JSON，不加markdown：
{"score":72,"dimensions":{"emotion":{"score":15,"max":20,"comment":"..."},"curiosity":{"score":12,"max":20,"comment":"..."},"specificity":{"score":16,"max":20,"comment":"..."},"keywords":{"score":14,"max":20,"comment":"..."},"length":{"score":15,"max":20,"comment":"..."}},"suggestions":[{"title":"优化版","reason":"增加情绪钩子","expectedScore":85}],"summary":"一句话总评"}`

    const raw = await this.callLLM(systemPrompt, `【平台】${platform}\n【标题】${input.instruction}`, { temperature: 0.4, maxTokens: 2000 })
    const parsed = this.parseJSON<{ score: number; dimensions: any; suggestions: any[]; summary: string }>(raw)

    if (parsed?.score) {
      return {
        success: true, agentId: this.id, agentName: "标题拆解",
        mainOutput: `【总分】${parsed.score}/100${parsed.summary ? `\n💡 ${parsed.summary}` : ""}${parsed.suggestions?.length ? `\n\n优化建议：\n${parsed.suggestions.map((s,i) => `${i+1}. ${s.title}（预计${s.expectedScore}分）\n   理由：${s.reason}`).join("\n")}` : ""}`,
        structuredOutput: parsed, qualityScore: 90, confidence: 85,
        alternatives: parsed.suggestions?.map(s => ({ title: s.title, content: s.title, score: s.expectedScore })) || [],
      }
    }
    return { success: true, agentId: this.id, agentName: "标题拆解", mainOutput: raw, qualityScore: 65, confidence: 55 }
  }
}
