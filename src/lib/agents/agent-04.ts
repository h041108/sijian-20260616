import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent04 extends BaseAgent {
  id: AgentId = "agent_04"
  getRegistration(): AgentRegistration {
    return { id: "agent_04", name: "脚本分镜", icon: "🎬", group: "production", description: "执行级拍摄方案", version: "3.0.0", isActive: true, triggers: ["视频脚本", "拍摄方案"], requiredInputs: ["instruction"], optionalInputs: ["parameters.duration"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 3000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const dur = input.parameters?.duration || "60"
    const sp = "你是一位分镜导演。将选题扩展为分镜脚本（5-8个镜头）。直接输出，不要用JSON。\n\n标题：\n总时长：" + dur + "秒\n\n镜头1 | 时长 | 景别\n画面描述：主体+动作+环境+构图\n对白/旁白：\n运镜：\n情绪：\n转场：\n\n镜头2 | ...\n\n需要道具：\n拍摄地点：\n预算估算："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 3000 })
    return { success: true, agentId: this.id, agentName: "脚本分镜", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
