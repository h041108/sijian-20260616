// ─── 成本追踪 ──────────────────────────────────────
// 每次生成前显示预估 token/费用，用户确认后执行

const MODEL_COST: Record<string, { input: number; output: number }> = {
  "deepseek-chat": { input: 0.0003, output: 0.0006 },
  "deepseek-v4-flash": { input: 0.0002, output: 0.0004 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "doubao-seedream-4-5-251128": { input: 0.002, output: 0.002 },
  "doubao-seedance-2-0-fast": { input: 0.01, output: 0.01 },
}

export interface CostEstimate {
  model: string
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCost: number
  currency: string
}

export function estimateCost(modelName: string, inputChars: number, outputChars?: number): CostEstimate {
  const rate = MODEL_COST[modelName] || MODEL_COST["deepseek-chat"]
  const inputTokens = Math.ceil(inputChars / 2.5)
  const outputTokens = outputChars ? Math.ceil(outputChars / 2.5) : inputTokens * 2
  const cost = (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output

  return {
    model: modelName,
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens: outputTokens,
    estimatedCost: parseFloat(cost.toFixed(6)),
    currency: "USD",
  }
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}k`
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(3)}`
}

export function getDailySpend(): number {
  if (typeof window === "undefined") return 0
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem("sijian_cost_log")
    if (!raw) return 0
    const logs = JSON.parse(raw) as { date: string; cost: number }[]
    return logs.filter(l => l.date === today).reduce((s, l) => s + l.cost, 0)
  } catch { return 0 }
}

export function logCost(model: string, cost: number) {
  if (typeof window === "undefined") return
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem("sijian_cost_log") || "[]"
    const logs = JSON.parse(raw)
    logs.push({ date: today, cost, model, timestamp: new Date().toISOString() })
    localStorage.setItem("sijian_cost_log", JSON.stringify(logs.slice(-100)))
  } catch {}
}
