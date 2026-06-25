import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent11A extends BaseAgent {
  id: AgentId = "agent_11A"
  getRegistration(): AgentRegistration {
    return { id: "agent_11A", name: "爆款复刻", icon: "📋", group: "optimization", description: "基因解析+3版复刻", version: "2.0.0", isActive: true, triggers: ["对标分析", "爆款复刻"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位爆款分析专家。分析对标内容，输出3版差异化复刻方案。严格JSON，不加markdown。\n\n{\"benchmarkAnalysis\":{\"titleStructure\":\"标题结构\",\"hookStyle\":\"钩子风格\",\"scriptPattern\":\"脚本模式\",\"pacing\":\"节奏\",\"conversionTactic\":\"转化话术\"},\"replicas\":[{\"title\":\"复刻版标题\",\"hook\":\"钩子\",\"content\":\"内容概要\",\"differentiation\":\"差异化\"}],\"strategy\":\"策略建议\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.replicas) {
      return { success: true, agentId: this.id, agentName: "爆款复刻", mainOutput: "【爆款基因】标题结构："+parsed.benchmarkAnalysis?.titleStructure+"\n钩子："+parsed.benchmarkAnalysis?.hookStyle+"\n\n复刻方案：\n"+parsed.replicas.map((r:any,i:number) => (i+1)+". "+r.title+"\n   差异化："+r.differentiation).join("\n\n"), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "爆款复刻", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}