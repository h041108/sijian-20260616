import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent05 extends BaseAgent {
  id: AgentId = "agent_05"
  getRegistration(): AgentRegistration {
    return { id: "agent_05", name: "BGM作曲", icon: "🎵", group: "production", description: "情感匹配+曲目推荐", version: "3.0.0", isActive: true, triggers: ["BGM", "背景音乐"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.4, maxTokens: 1500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位影视配乐师。根据视频脚本或故事描述推荐BGM方案。直接输出，不要用JSON。\n\n情感基调：\n节奏：\n\n推荐曲目：\n1. 风格（BPM）\n   音乐描述\n2. ...\n\nAI音乐生成提示词："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 1500 })
    return { success: true, agentId: this.id, agentName: "BGM作曲", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
