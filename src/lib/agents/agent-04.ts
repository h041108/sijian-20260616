import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent04 extends BaseAgent {
  id: AgentId = "agent_04"
  getRegistration(): AgentRegistration {
    return { id: "agent_04", name: "脚本分镜", icon: "🎬", group: "production", description: "执行级拍摄方案", version: "2.0.0", isActive: true, triggers: ["视频脚本", "拍摄方案"], requiredInputs: ["instruction"], optionalInputs: ["parameters.duration"], defaultModel: "deepseek", temperature: 0.4, maxTokens: 3000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const dur = input.parameters?.duration || "60"
    const sp = "你是一位分镜导演。生成完整分镜脚本（5-8个镜头）。必须返回严格JSON，不加markdown。\n\n{\"title\":\"标题\",\"totalDuration\":' + dur + ',\"shots\":[{\"shotNumber\":1,\"duration\":10,\"description\":\"画面描述\",\"dialogue\":\"对白\",\"camera\":\"运镜\",\"scene\":\"场景\",\"emotion\":\"情绪\",\"transition\":\"转场\"}],\"materials\":{\"props\":[\"道具\"],\"locations\":[\"地点\"]}}"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.4, maxTokens: 3000 })
    const parsed = this.parseJSON(raw)
    if (parsed?.shots) {
      const out = parsed.title+" ("+parsed.totalDuration+"秒, "+parsed.shots.length+"个镜头)\n\n"+parsed.shots.map((s:any) => "镜头"+s.shotNumber+" | "+s.duration+"s\n画面："+s.description+"\n对白："+(s.dialogue||"无")).join("\n\n")
      return { success: true, agentId: this.id, agentName: "脚本分镜", mainOutput: out, structuredOutput: parsed, qualityScore: 90, confidence: 88 }
    }
    return { success: true, agentId: this.id, agentName: "脚本分镜", mainOutput: raw, qualityScore: 60, confidence: 50 }
  }
}