"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { getPerformanceSummary, loadRegistry, classifyTask, route } from "@/lib/orchestrator"

export default function OrchestratorDashboard() {
  const [registry, setRegistry] = useState<ReturnType<typeof loadRegistry> | null>(null)
  const [perf, setPerf] = useState<ReturnType<typeof getPerformanceSummary>>([])
  const [testMsg, setTestMsg] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [view, setView] = useState<"status" | "route" | "history">("status")

  useEffect(() => {
    const r = loadRegistry()
    setRegistry(r)
    setPerf(getPerformanceSummary())
  }, [])

  const handleTest = useCallback(() => {
    if (!testMsg.trim() || !registry) return
    const classification = classifyTask(testMsg.trim())
    const routing = route(testMsg.trim(), registry)
    setTestResult({ classification, routing })
  }, [testMsg, registry])

  if (!registry) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4 opacity-20">🔧</div>
      <p className="text-gray-500 text-sm">编排引擎加载中</p>
    </div>
  )

  const allModels = [registry.primary, ...registry.secondary]
  const availableCount = allModels.filter(m => m.available).length

  return (
    <div className="space-y-6">
      {/* ═══ 状态概览 ═══ */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-indigo-700">{availableCount}</div>
          <div className="text-xs text-indigo-500 mt-1">可用模型</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-green-700">{allModels.length}</div>
          <div className="text-xs text-green-500 mt-1">模型注册</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-purple-700">{perf.length}</div>
          <div className="text-xs text-purple-500 mt-1">有使用记录</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-orange-700">3</div>
          <div className="text-xs text-orange-500 mt-1">预置流水线</div>
        </div>
      </div>

      {/* ── 模式切换 ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
        {[
          { id: "status" as const, icon: "📊", label: "模型状态" },
          { id: "route" as const, icon: "🔀", label: "路由测试" },
          { id: "history" as const, icon: "📈", label: "性能历史" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === v.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* ═══ 模型状态 ═══ */}
      {view === "status" && (
        <div className="space-y-4">
          {allModels.map(model => {
            const metrics = perf.find(p => p.model === model.id)
            return (
              <div key={model.id} className={`bg-white rounded-2xl border-2 p-6 ${model.available ? "border-green-200" : "border-gray-200 opacity-50"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      model.available ? "bg-gradient-to-br from-indigo-100 to-purple-100" : "bg-gray-100"
                    }`}>
                      {model.name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">{model.name}</h3>
                      <p className="text-xs text-gray-400">{model.provider}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    model.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {model.available ? "✅ 已就绪" : "🔒 未配置"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">擅长技能</div>
                    <div className="flex flex-wrap gap-1">
                      {model.strengths.map(s => (
                        <span key={s} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">成本</div>
                    <div className="text-sm font-bold text-gray-700">${(model.costPer1kTokens * 1000).toFixed(2)}/M tokens</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">延迟</div>
                    <div className="text-sm font-bold text-gray-700">{model.avgLatency}ms</div>
                  </div>
                </div>

                {metrics && (
                  <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                    {metrics.calls} 次调用 | 成功率 {metrics.successRate} | 均延迟 {metrics.avgLatency} | 最近 {metrics.lastUsed}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ 路由测试 ═══ */}
      {view === "route" && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🔀 路由模拟</h3>
          <p className="text-xs text-gray-400 mb-3">输入一条消息，查看编排引擎如何分类和路由</p>

          <div className="flex gap-2 mb-4">
            <input value={testMsg} onChange={e => setTestMsg(e.target.value)}
              placeholder="输入测试消息，如：帮我写一篇关于AI伦理的文章"
              className="flex-1 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm"
              onKeyDown={e => e.key === "Enter" && handleTest()} />
            <button onClick={handleTest} disabled={!testMsg.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
              🔍 分析
            </button>
          </div>

          {testResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-500 font-medium mb-2">🧠 任务分类</p>
                  <p className="text-lg font-bold text-purple-800">{testResult.classification.category}</p>
                  <p className="text-sm text-purple-600">置信度: {Math.round(testResult.classification.confidence * 100)}%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-500 font-medium mb-2">🎯 路由决策</p>
                  <p className="text-lg font-bold text-green-800">{testResult.routing.model.name}</p>
                  <p className="text-xs text-green-600 leading-relaxed">{testResult.routing.reason}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-xs text-yellow-600 font-medium mb-2">🔄 Fallback 模型</p>
                <div className="flex gap-2">
                  {testResult.routing.fallback.map((m: any) => (
                    <span key={m.id} className="text-xs bg-white px-2 py-1 rounded border border-yellow-200 text-gray-600">
                      {m.name} {m.available ? "✅" : "❌"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 性能历史 ═══ */}
      {view === "history" && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 模型性能历史</h3>
          {perf.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-20">📊</div>
              <p className="text-gray-500 text-sm">还没有性能数据</p>
              <p className="text-xs text-gray-400 mt-1">开始使用后自动记录每次调用的延迟和成功率</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="pb-2 text-left">模型</th>
                    <th className="pb-2 text-left">调用次数</th>
                    <th className="pb-2 text-left">成功率</th>
                    <th className="pb-2 text-left">均延迟</th>
                    <th className="pb-2 text-left">健康</th>
                    <th className="pb-2 text-left">最近使用</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.map(p => (
                    <tr key={p.model} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-800">{p.model}</td>
                      <td className="py-2.5 text-xs">{p.calls}</td>
                      <td className="py-2.5 text-xs">{p.successRate}</td>
                      <td className="py-2.5 text-xs">{p.avgLatency}</td>
                      <td className="py-2.5">{p.reliability}</td>
                      <td className="py-2.5 text-xs text-gray-400">{p.lastUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
