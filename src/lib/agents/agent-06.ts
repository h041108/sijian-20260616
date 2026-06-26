import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent06 extends BaseAgent {
  id: AgentId = "agent_06"
  getRegistration(): AgentRegistration {
    return { id: "agent_06", name: "音效设计", icon: "🔊", group: "production", description: "4层声音蓝图", version: "3.0.0", isActive: true, triggers: ["音效", "声音设计"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位电影音效设计师。设计4层声音蓝图。直接输出，不要用JSON。\n\n场景1\n环境音：\n动作音：\n情绪音：\n过渡音：\n\n场景2\n...\n\n整体氛围："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "音效设计", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
