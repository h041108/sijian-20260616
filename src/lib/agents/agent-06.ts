import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent06 extends BaseAgent {
  id: AgentId = "agent_06"
  getRegistration(): AgentRegistration {
    return { id: "agent_06", name: "音效设计", icon: "🔊", group: "production", description: "4层声音蓝图", version: "3.0.0", isActive: true, triggers: ["音效", "声音设计"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.35, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位影视级音效设计师，精通短视频声音层次设计。

【声音蓝图】4层声音结构（环境/动作/情绪/人声）
【环境音】场景背景音建议
【动作音效】关键动作/转场的音效
【情绪音效】烘托情感的音效选择
【人声处理】语气/语速/音调建议
【音量配比】各层级的音量比例建议

参考专业音频制作标准，确保输出可直接用于剪辑。`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.35, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "音效设计", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
