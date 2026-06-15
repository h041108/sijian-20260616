// ─── 企业价值验证实验 — 数据采集引擎 ─────────────────────

const EXP_KEY = "sijian_experiments"

export interface ExperimentRecord {
  id: string
  createdAt: string
  taskName: string           // "处理客户投诉"
  mode: "with_template" | "without_template"
  templateId?: string         // 用了哪个模板
  templateOwner?: string      // "张师傅"
  startTime: string
  endTime: string
  durationSeconds: number
  // 自我评估（1-5分）
  confidence: number          // 完成任务后你有多确定自己做对了？
  clarity: number             // 思考过程中思路有多清晰？
  // 路线记录
  linesUsed: string[]         // 走了哪些思维线路
  nodesCreated: string[]      // 创建了哪些思维节点
  notes: string               // 自由反馈
}

export function saveExperiment(exp: ExperimentRecord): void {
  if (typeof window === "undefined") return
  const all = loadExperiments()
  all.push(exp)
  localStorage.setItem(EXP_KEY, JSON.stringify(all))
}

export function loadExperiments(): ExperimentRecord[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(EXP_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}

export function getExperimentStats(): {
  withTemplate: { avgDuration: number; avgConfidence: number; avgClarity: number; count: number }
  withoutTemplate: { avgDuration: number; avgConfidence: number; avgClarity: number; count: number }
  total: number
} {
  const all = loadExperiments()
  const withT = all.filter(e => e.mode === "with_template")
  const withoutT = all.filter(e => e.mode === "without_template")

  const avg = (arr: ExperimentRecord[], fn: (e: ExperimentRecord) => number) =>
    arr.length > 0 ? arr.reduce((s, e) => s + fn(e), 0) / arr.length : 0

  return {
    withTemplate: {
      avgDuration: avg(withT, e => e.durationSeconds),
      avgConfidence: avg(withT, e => e.confidence),
      avgClarity: avg(withT, e => e.clarity),
      count: withT.length,
    },
    withoutTemplate: {
      avgDuration: avg(withoutT, e => e.durationSeconds),
      avgConfidence: avg(withoutT, e => e.confidence),
      avgClarity: avg(withoutT, e => e.clarity),
      count: withoutT.length,
    },
    total: all.length,
  }
}

export function clearExperiments(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(EXP_KEY)
}

function genId(): string { return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
