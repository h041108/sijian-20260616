import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent03 extends BaseAgent {
  id: AgentId = "agent_03"

  getRegistration(): AgentRegistration {
    return {
      id: "agent_03", name: "提示词大师", icon: "🎨", group: "production",
      description: "多模型结构化prompt生成", version: "1.0.0", isActive: true,
      triggers: ["图片生成", "视频生成", "prompt优化"],
      requiredInputs: ["instruction"], optionalInputs: ["context.styleGuide", "referenceImages"],
      defaultModel: "deepseek", temperature: 0.3, maxTokens: 2500, hasStandaloneUI: true,
    }
  }

  private modelLabel(id: string): string {
    const m: Record<string,string> = { midjourney: "Midjourney V7", jimeng: "即梦4.0", flux: "Flux Pro", dalle3: "DALL-E 3" }
    return m[id] || id
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const style = input.context?.styleGuide || input.parameters?.style || "写实电影风格"
    const refNote = input.referenceImages?.length ? "\n【有参考图】请分析并融入参考图风格" : ""

    const sp = "你是一位精通AI图像生成模型的提示词工程师。\n为以下场景生成4个模型的prompt：\n\n## Midjourney V7（英文）\n格式：主体描述+环境+光线+镜头+风格 --ar 16:9 --v 7\n\n## 即梦4.0（中文）\n格式：风格关键词+主体+动作+环境+光线+镜头+氛围+质量词\n\n## Flux Pro（英文）\n格式：详细描述+技术参数+艺术风格\n\n## DALL-E 3（英文）\n格式：自然语言描述\n\n输出JSON，不加markdown：\n{\"prompts\":{\"midjourney\":\"...\",\"jimeng\":\"...\",\"flux\":\"...\",\"dalle3\":\"...\"},\"styleTips\":\"注意点\",\"recommendedModel\":\"jimeng\"}"

    const raw = await this.callLLM(sp, "【风格】" + style + "\n【描述】" + input.instruction + refNote, { temperature: 0.3, maxTokens: 2500 })
    const parsed = this.parseJSON(raw)

    if (parsed?.prompts) {
      const lines = Object.entries(parsed.prompts).map(([k, v]) => "【" + this.modelLabel(k) + "】\n" + v)
      const extra = (parsed.styleTips ? "\n\n💡 " + parsed.styleTips : "") + (parsed.recommendedModel ? "\n推荐模型：" + parsed.recommendedModel : "")
      return {
        success: true, agentId: this.id, agentName: "提示词大师",
        mainOutput: lines.join("\n\n") + extra, structuredOutput: parsed, qualityScore: 88, confidence: 82,
        alternatives: Object.entries(parsed.prompts).map(([k, v]) => ({ title: this.modelLabel(k), content: v as string, score: 85 })),
      }
    }
    return { success: true, agentId: this.id, agentName: "提示词大师", mainOutput: raw, qualityScore: 65, confidence: 55 }
  }
}
