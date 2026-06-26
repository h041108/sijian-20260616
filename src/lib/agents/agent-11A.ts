import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent11A extends BaseAgent {
  id: AgentId = "agent_11A"
  getRegistration(): AgentRegistration {
    return { id: "agent_11A", name: "爆款复刻", icon: "📋", group: "optimization", description: "基因解析+3版复刻", version: "3.0.0", isActive: true, triggers: ["对标分析", "爆款复刻"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.6, maxTokens: 2500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位爆款内容分析师。分析对标内容，输出差异化复刻方案。直接输出，不要用JSON。\n\n爆款基因分析：\n标题结构：\n钩子风格：\n脚本模式：\n\n复刻方案（3版）：\n\n方案1：标题\n差异化：\n内容概要\n\n方案2：\n\n方案3：\n\n整体策略建议："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.6, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "爆款复刻", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
