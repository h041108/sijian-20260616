import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent03 extends BaseAgent {
  id: AgentId = "agent_03"
  getRegistration(): AgentRegistration {
    return { id: "agent_03", name: "提示词大师", icon: "🎨", group: "production", description: "为不同AI模型生成优化提示词", version: "3.0.0", isActive: true, triggers: ["图片生成", "视频生成", "prompt优化"], requiredInputs: ["instruction"], optionalInputs: ["parameters.style"], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2500, hasStandaloneUI: true }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const style = input.parameters?.style || "写实电影风格"
    const sp = "你是一位AI提示词工程师。为以下场景生成4个模型的prompt。直接输出每个模型的prompt，用分隔线隔开，不要用JSON格式。\n\n===== Midjourney V7 =====\n英文，包含主体描述+环境+光线+镜头+风格，结尾加 --ar 16:9 --v 7\n\n===== 即梦4.0 =====\n中文，包含风格关键词+主体+动作+环境+光线+镜头+氛围+质量词\n\n===== Flux Pro =====\n英文，详细描述+技术参数+艺术风格\n\n===== DALL-E 3 =====\n英文，自然语言描述\n\n风格：" + style
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "提示词大师", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
