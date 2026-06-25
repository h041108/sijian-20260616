import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent05 extends BaseAgent {
  id: AgentId = "agent_05"
  getRegistration(): AgentRegistration {
    return { id: "agent_05", name: "BGM作曲", icon: "🎵", group: "production", description: "情感匹配+曲目推荐", version: "2.0.0", isActive: true, triggers: ["BGM", "背景音乐"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.4, maxTokens: 1500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = "你是一位影视配乐师。推荐BGM方案。严格JSON，不加markdown。\n\n{\"analysis\":{\"primaryEmotion\":\"情绪\",\"emotionalArc\":\"情绪变化\",\"pace\":\"节奏\"},\"recommendations\":[{\"genre\":\"风格\",\"bpm\":120,\"mood\":\"适用情绪\",\"placement\":\"位置\",\"description\":\"描述\",\"referenceArtist\":\"参考艺人\"}],\"aiGenerationPrompt\":\"AI音乐提示词\"}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 1500 })
    const parsed = this.parseJSON(raw)
    if (parsed?.recommendations) {
      return { success: true, agentId: this.id, agentName: "BGM作曲", mainOutput: "【情感基调】"+(parsed.analysis?.primaryEmotion||"")+"\n\n推荐：\n"+parsed.recommendations.map((r:any,i:number) => (i+1)+". "+r.genre+" ("+r.bpm+"BPM)\n   位置："+r.placement).join("\n"), structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "BGM作曲", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}