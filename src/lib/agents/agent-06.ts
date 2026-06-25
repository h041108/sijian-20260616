import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent06 extends BaseAgent {
  id: AgentId = "agent_06"
  getRegistration(): AgentRegistration {
    return { id: "agent_06", name: "音效设计", icon: "🔊", group: "production", description: "4层声音蓝图", version: "2.0.0", isActive: true, triggers: ["音效", "声音设计"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位电影音效设计师。设计4层声音蓝图。严格JSON，不加markdown。\n\n{\"soundscape\":[{\"scene\":\"场景\",\"ambient\":\"环境音\",\"foley\":[\"动作音1\",\"动作音2\"],\"emotionPad\":\"情绪音\",\"transition\":\"过渡音\"}],\"totalAtmosphere\":\"整体氛围\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.soundscape) {
      return { success: true, agentId: this.id, agentName: "音效设计", mainOutput: parsed.soundscape.map((s:any) => "【"+s.scene+"】\n环境："+s.ambient+"\n动作："+(s.foley?.join(", ")||"")).join("\n\n"), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "音效设计", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}