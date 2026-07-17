import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent04 extends BaseAgent {
  id: AgentId = "agent_04"
  getRegistration(): AgentRegistration {
    return { id: "agent_04", name: "脚本分镜", icon: "🎬", group: "production", description: "执行级拍摄方案", version: "3.0.0", isActive: true, triggers: ["视频脚本", "拍摄方案"], requiredInputs: ["instruction"], optionalInputs: ["parameters.duration"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 3000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const dur = input.parameters?.duration || "60"
    const sp = `你是一位短视频脚本创作专家，精通抖音/小红书/B站的爆款结构。

【视频信息】时长/风格/目标平台
【脚本正文】时间/画面/运镜/旁白/音效/字幕 表格格式
【封面文案】主标题/副标题/封面建议
【发布文案】标题/正文/话题标签5-8个
前3秒必须有钩子，总时长60秒内` + dur + "秒\n\n镜头1 | 时长 | 景别\n画面描述：主体+动作+环境+构图\n对白/旁白：\n运镜：\n情绪：\n转场：\n\n镜头2 | ...\n\n需要道具：\n拍摄地点：\n预算估算："
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 3000 })
    return { success: true, agentId: this.id, agentName: "脚本分镜", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
