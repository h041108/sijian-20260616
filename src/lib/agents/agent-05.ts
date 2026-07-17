import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent05 extends BaseAgent {
  id: AgentId = "agent_05"
  getRegistration(): AgentRegistration {
    return { id: "agent_05", name: "BGM作曲", icon: "🎵", group: "production", description: "情感匹配+曲目推荐", version: "3.0.0", isActive: true, triggers: ["BGM", "背景音乐"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.4, maxTokens: 1500, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位BGM作曲与音乐编辑专家，精通短视频配乐策略。

【曲风分析】根据内容主题推荐曲风
【BGM方案】3个备选方案（曲名/风格/适用场景）
【情感匹配】BGM与内容情绪对应关系
【节奏建议】BPM范围/剪辑点/高潮对齐
【音效设计】转场音效/强调音效/环境音
【参考曲目】推荐实际可用曲目

考虑平台特性：抖音重节奏，小红书重氛围，B站重叙事。`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 1500 })
    return { success: true, agentId: this.id, agentName: "BGM作曲", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
