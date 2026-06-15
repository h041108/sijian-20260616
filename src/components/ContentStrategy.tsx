"use client"

import { useState, useCallback } from "react"
import MindTransit from "@/components/MindTransit"
import type { MindNode, MindEdge, DomainType, FrameType } from "@/lib/types"

// ─── 四步内容策略引擎 ────────────────────────────

const STEPS = [
  { id: 1, name: "发散选题", icon: "💡", line: "divergent", frame: "network" as FrameType, prompt: "头脑风暴：根据这个行业和产品，列出50个内容选题方向，尽量广泛" },
  { id: 2, name: "聚焦筛选", icon: "🎯", line: "convergent", frame: "spectrum" as FrameType, prompt: "从上面50个选题中，筛选出最有价值的5个核心选题。筛选标准：用户需求强度、差异化程度、制作成本" },
  { id: 3, name: "叙事结构", icon: "📖", line: "narrative", frame: "pipeline" as FrameType, prompt: "为排名第1的选题设计完整的叙事结构：钩子开头→价值主体→高潮论点→行动号召。每个部分写清楚" },
  { id: 4, name: "复盘优化", icon: "📊", line: "review", frame: "tree" as FrameType, prompt: "假设这条内容已发布。分析：预期效果如何？如果数据不好，最可能的3个原因是什么？下次如何优化？" },
]

export default function ContentStrategy() {
  const [industry, setIndustry] = useState("")
  const [product, setProduct] = useState("")
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ nodes: any[]; edges: any[]; frameType: string; message: string }[]>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)

  const currentStep = step < STEPS.length ? STEPS[step] : null

  const handleRun = useCallback(async () => {
    if (!industry.trim() || !product.trim() || loading || !currentStep) return
    setLoading(true)

    try {
      const prompt = `你是一位顶级自媒体内容策略专家。\n\n行业: ${industry}\n产品/服务: ${product}\n\n${currentStep.prompt}\n\n请给出具体、可执行的内容，不要空泛的建议。最后一定要输出<m>标签将你的分析构建成思维空间节点。`

      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], existingNodes: [] }),
      })
      const d = await r.json()
      if (d.error) { alert(d.error); return }

      setResults(prev => [...prev, {
        nodes: d.mindSpaceUpdate?.nodes || [],
        edges: d.mindSpaceUpdate?.edges || [],
        frameType: d.mindSpaceUpdate?.frameType || currentStep.frame,
        message: d.message || "",
      }])

      if (step < STEPS.length - 1) setStep(s => s + 1)
    } catch { alert("请求失败，请重试") }
    finally { setLoading(false) }
  }, [industry, product, loading, currentStep, step])

  const reset = useCallback(() => {
    setStep(0); setResults([]); setIndustry(""); setProduct("")
  }, [])

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="bg-white rounded-2xl border border-[#d8e0c8] p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">🎬 内容策 · 四步内容策略引擎</h2>
        <p className="text-xs text-gray-400 mb-4">
          输入你的行业和产品 → 思见带你走发散选题→聚焦筛选→叙事结构→复盘优化的完整策略流程
        </p>

        {results.length === 0 && (
          <div className="flex gap-3 flex-wrap">
            <input value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="你的行业，如：教育培训"
              className="flex-1 min-w-[200px] rounded-xl border border-[#d8e0c8] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              onKeyDown={e => e.key === "Enter" && handleRun()} />
            <input value={product} onChange={e => setProduct(e.target.value)}
              placeholder="你的产品/服务，如：高中数学1对1辅导"
              className="flex-1 min-w-[200px] rounded-xl border border-[#d8e0c8] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              onKeyDown={e => e.key === "Enter" && handleRun()} />
            <button onClick={handleRun} disabled={!industry.trim() || !product.trim() || loading}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
              {loading ? "AI 分析中…" : "开始第一步 →"}
            </button>
          </div>
        )}
      </div>

      {/* 步骤进度条 */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#d8e0c8] p-4">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 transition-all ${
                  i < results.length ? "bg-orange-500 text-white" : i === results.length ? "bg-orange-100 text-orange-600 border-2 border-orange-400" : "bg-gray-100 text-gray-400"
                }`}>
                  {i < results.length ? "✓" : s.icon}
                </div>
                <div className="text-[10px] text-center text-gray-500">{s.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${(results.length / STEPS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* 每一步的结果 */}
      {results.map((r, i) => {
        const s = STEPS[i]
        return (
          <div key={i} className="bg-white rounded-2xl border border-[#d8e0c8] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8ecd8] bg-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-semibold text-gray-700">第{i + 1}步：{s.name}</span>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{s.line}</span>
              </div>
              <span className="text-xs text-gray-400">{r.nodes.length} 节点</span>
            </div>

            {/* AI 文字回复 */}
            <div className="px-4 py-3 border-b border-[#e8ecd8] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {r.message}
            </div>

            {/* 思维线路图 */}
            <div style={{ height: "350px" }}>
              <MindTransit
                nodes={(r.nodes || []) as MindNode[]}
                edges={(r.edges || []) as MindEdge[]}
                domainType="general"
                frameType={(r.frameType || s.frame) as FrameType}
                onNodeClick={(n) => setSelectedNode(n)}
                onExport={() => {
                  const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url; a.download = `content-strategy-step${i+1}.json`; a.click()
                }}
              />
            </div>
          </div>
        )
      })}

      {/* 当前步骤执行区（第一步完成后自动推进到下一步） */}
      {results.length > 0 && step < results.length && (
        <div className="bg-white rounded-2xl border border-[#d8e0c8] p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            第 {results.length + 1} 步：{STEPS[results.length]?.name} — {STEPS[results.length]?.prompt?.slice(0, 30)}…
          </span>
          <button onClick={handleRun} disabled={loading}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
            {loading ? "生成中…" : "执行分析 →"}
          </button>
        </div>
      )}

      {/* 完成 */}
      {results.length === STEPS.length && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200 p-6 text-center">
          <div className="text-3xl mb-3">🎉</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">内容策略四步完成！</h2>
          <p className="text-sm text-gray-500 mb-4">
            你已完成：发散选题 → 聚焦筛选 → 叙事结构 → 复盘优化<br/>
            以上每一步都生成了可视化的思维线路图，可作为团队内容创作指南
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset}
              className="rounded-xl border border-orange-300 bg-white hover:bg-orange-50 text-orange-700 px-5 py-2 text-sm transition-all">
              重新分析
            </button>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url; a.download = "content-strategy-full.json"; a.click()
            }}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm transition-all">
              导出完整策略
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
