import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent12 extends BaseAgent {
  id: AgentId = "agent_12"

  getRegistration(): AgentRegistration {
    return {
      id: "agent_12", name: "封面灵感", icon: "🖼️", group: "production",
      description: "3套封面方案+点击率预测", version: "1.0.0", isActive: true,
      triggers: ["封面设计", "发布前"], requiredInputs: ["instruction"],
      optionalInputs: ["context.platform", "referenceImages"],
      defaultModel: "deepseek", temperature: 0.5, maxTokens: 2000, hasStandaloneUI: true,
    }
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = "你是一位精通" + platform + "封面设计的视觉策略专家。输出3套封面方案。\n\n平台规范：\n- 抖音：1080×1920竖屏，主标题≤15字\n- 小红书：1080×1440 3:4，主标题≤12字\n- 视频号：1080×1080 1:1，主标题≤20字\n- B站：1920×1080横屏，主标题≤20字\n\n严格JSON输出，不加markdown：\n{\"schemes\":[{\"name\":\"...\",\"visual\":\"...\",\"colorPalette\":[\"#...\"],\"title\":\"...\",\"subtitle\":\"...\",\"layoutDescription\":\"...\",\"predictedCTR\":\"X%\",\"strength\":\"...\"}],\"bestPick\":0,\"totalScore\":85}"

    const raw = await this.callLLM(sp, "【平台】" + platform + "\n【主题】" + input.instruction, { temperature: 0.5, maxTokens: 2000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.schemes) {
      return {
        success: true, agentId: this.id, agentName: "封面灵感",
        mainOutput: JSON.stringify(parsed.schemes.map((s,i) => "【" + s.name + "】\n视觉：" + s.visual).join("\n\n")),
        structuredOutput: parsed, qualityScore: 85, confidence: 80,
        alternatives: parsed.schemes.map(s => ({ title: s.name, content: s.title, score: parseInt(s.predictedCTR || "0") })),
      }
    }
    return { success: true, agentId: this.id, agentName: "封面灵感", mainOutput: raw, qualityScore: 65, confidence: 55 }
  }
}
