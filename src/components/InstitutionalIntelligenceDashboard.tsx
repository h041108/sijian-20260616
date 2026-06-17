"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  buildInstitutionalKnowledgeGraph, InstitutionalKnowledgeGraph,
  loadBusinessMetrics, createBusinessMetric, updateMetricValue, deleteBusinessMetric,
  seedBusinessMetrics, computeCompoundIndex, CompoundIndex,
  exportKnowledgeCore, importKnowledgeCore,
  BusinessMetric,
} from "@/lib/institutional-intelligence"

const DEPT_COLORS = ["#6366F1","#22C55E","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#F97316"]
const METRIC_CATEGORIES = ["quality","speed","cost","satisfaction","innovation","compliance"] as const
const CATEGORY_LABELS: Record<string, string> = { quality:"质量",speed:"速度",cost:"成本",satisfaction:"满意度",innovation:"创新",compliance:"合规" }

export default function InstitutionalIntelligenceDashboard() {
  const [graph, setGraph] = useState<InstitutionalKnowledgeGraph | null>(null)
  const [compound, setCompound] = useState<CompoundIndex | null>(null)
  const [metrics, setMetrics] = useState<BusinessMetric[]>([])
  const [tab, setTab] = useState<"graph" | "metrics" | "compound" | "export">("graph")
  const [knowledgeJson, setKnowledgeJson] = useState("")
  const [importResult, setImportResult] = useState<string | null>(null)

  // New metric form
  const [showNewMetric, setShowNewMetric] = useState(false)
  const [nmName, setNmName] = useState(""); const [nmCat, setNmCat] = useState<BusinessMetric["category"]>("speed")
  const [nmUnit, setNmUnit] = useState(""); const [nmTarget, setNmTarget] = useState(100)
  // Edit value form
  const [editMetricId, setEditMetricId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0); const [editWithAI, setEditWithAI] = useState(true)
  const [editBaseline, setEditBaseline] = useState(0)

  const refresh = useCallback(() => {
    seedBusinessMetrics()
    const g = buildInstitutionalKnowledgeGraph()
    setGraph(g)
    setCompound(computeCompoundIndex())
    setMetrics(loadBusinessMetrics())
    setKnowledgeJson(exportKnowledgeCore())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  if (!graph || !compound) return (
    <div className="text-center py-20"><div className="text-5xl mb-4 opacity-20">🧬</div><p className="text-gray-500 text-sm">加载中</p></div>
  )

  return (
    <div className="space-y-6">
      {/* ═══ 顶部切换 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 flex items-center gap-2 flex-wrap">
        {[
          { id: "graph" as const, icon: "🧬", label: "知识图谱" },
          { id: "metrics" as const, icon: "📊", label: "私有评估" },
          { id: "compound" as const, icon: "📈", label: "复利指数" },
          { id: "export" as const, icon: "💾", label: "知识导出" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          P0: 机构知识图谱
          ════════════════════════════════════════ */}
      {tab === "graph" && (
        <div className="space-y-4">
          {/* Token 资本 vs 人力资本概览 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="text-sm font-semibold text-indigo-700 mb-4">🤖 Token 资本</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "已编码概念", value: graph.tokenCapital.codifiedConcepts },
                  { label: "已编码工作流", value: graph.tokenCapital.codifiedWorkflows },
                  { label: "已记录决策", value: graph.tokenCapital.codifiedDecisions },
                ].map(c => (
                  <div key={c.label} className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-700">{c.value}</div>
                    <div className="text-[10px] text-indigo-400 mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs">
                <span className="text-gray-500">知识覆盖率</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${graph.tokenCapital.knowledgeCoverage * 100}%` }} />
                </div>
                <span className="font-bold text-indigo-700">{Math.round(graph.tokenCapital.knowledgeCoverage * 100)}%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
              <h3 className="text-sm font-semibold text-green-700 mb-4">👥 人力资本</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "贡献者", value: graph.humanCapital.totalContributors },
                  { label: "活跃", value: graph.humanCapital.activeContributors },
                  { label: "掌握深度", value: `${Math.round(graph.humanCapital.avgMastery * 100)}%` },
                ].map(c => (
                  <div key={c.label} className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-green-700">{c.value}</div>
                    <div className="text-[10px] text-green-400 mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs">
                <span className="text-gray-500">协作密度</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${graph.humanCapital.collaborationDensity * 100}%` }} />
                </div>
                <span className="font-bold text-green-700">{Math.round(graph.humanCapital.collaborationDensity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* 部门热力图 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 部门知识热力图</h3>
            <div className="space-y-3">
              {graph.departmentHeatmap.map((dept, i) => (
                <div key={dept.department} className="p-3 rounded-xl border border-[#e8e5df]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                    </div>
                    <span className="text-xs text-gray-400">{dept.nodes} 节点 · 均掌握 {Math.round(dept.avgMastery * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${dept.tokenScore * 100}%`, backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 知识孤岛警告 */}
          {graph.knowledgeFlows.knowledgeSilos.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-sm text-yellow-700">
              ⚠️ 检测到知识孤岛：{graph.knowledgeFlows.knowledgeSilos.join("、")}。跨部门知识流动率仅 {Math.round(graph.knowledgeFlows.crossPollinationRate * 100)}%。
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          P1a: 私有评估框架
          ════════════════════════════════════════ */}
      {tab === "metrics" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">📊 业务私有评估指标</h3>
              <button onClick={() => setShowNewMetric(true)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-medium">+ 新建指标</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">定义企业自己的业务评估标准，追踪 AI 辅助是否真的提升了业务成果。</p>

            {metrics.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">还没有定义业务指标</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(m => {
                  const catColor = m.category === "speed" ? "bg-blue-100 text-blue-700" : m.category === "quality" ? "bg-purple-100 text-purple-700" : m.category === "satisfaction" ? "bg-green-100 text-green-700" : m.category === "cost" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"
                  return (
                    <div key={m.id} className="p-4 rounded-xl border-2 border-[#e8e5df] hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${catColor}`}>{CATEGORY_LABELS[m.category]}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                          <div className="text-lg font-bold text-gray-800">{m.currentValue}<span className="text-xs text-gray-400 ml-0.5">{m.unit}</span></div>
                          <div className="text-[10px] text-gray-400">当前值</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                          <div className={`text-lg font-bold ${m.trend === "up" ? "text-green-600" : m.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                            {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.trend === "up" ? "+" : m.trend === "down" ? "-" : ""}{(Math.abs(m.currentValue - (m.history[m.history.length - 2]?.value || m.currentValue))).toFixed(1)}
                          </div>
                          <div className="text-[10px] text-gray-400">趋势</div>
                        </div>
                      </div>

                      {/* AI 影响力 */}
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-indigo-600 font-medium">🤖 AI 影响力</span>
                          <span className="text-xs font-bold text-indigo-700">+{Math.round(m.aiImpact * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-indigo-100">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, m.aiImpact * 100 + 30)}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400">
                          <span>基线: {m.baselineWithoutAI}{m.unit}</span>
                          <span>目标: {m.targetValue}{m.unit}</span>
                        </div>
                      </div>

                      {/* 迷你时间线 */}
                      {m.history.length >= 2 && (
                        <div className="flex items-end gap-1 h-8 mt-2">
                          {m.history.map((h, i) => (
                            <div key={i} className="flex-1 rounded-t"
                              style={{ height: `${30 + (h.value / Math.max(...m.history.map(x => x.value), 1)) * 30}px`, backgroundColor: h.withAI ? "#6366F1" : "#d4d4d4", opacity: 0.5 + (i / m.history.length) * 0.5 }}
                              title={`${h.date}: ${h.value}${m.unit} ${h.withAI ? "(AI)" : "(人工)"}`} />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => { setEditMetricId(m.id); setEditValue(m.currentValue); setEditBaseline(m.baselineWithoutAI) }}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700">✏️ 更新</button>
                        <button onClick={() => { deleteBusinessMetric(m.id); refresh() }}
                          className="text-[10px] text-red-400 hover:text-red-600">删除</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 新建指标弹窗 */}
          {showNewMetric && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNewMetric(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-gray-800 mb-4">+ 新建业务指标</h3>
                <div className="space-y-3">
                  <input value={nmName} onChange={e => setNmName(e.target.value)} placeholder="指标名称，如：客户投诉处理时间"
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={nmCat} onChange={e => setNmCat(e.target.value as any)}
                      className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                      {METRIC_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                    <input value={nmUnit} onChange={e => setNmUnit(e.target.value)} placeholder="单位：小时/分/%"
                      className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm" />
                  </div>
                  <input type="number" value={nmTarget} onChange={e => setNmTarget(Number(e.target.value))} placeholder="目标值"
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setShowNewMetric(false)} className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
                  <button onClick={() => {
                    const m = createBusinessMetric(nmName.trim(), nmCat, nmUnit, nmTarget)
                    metrics.push(m); setMetrics([...metrics])
                    setShowNewMetric(false); setNmName(""); setNmTarget(100)
                  }} disabled={!nmName.trim()}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm disabled:opacity-40">创建</button>
                </div>
              </div>
            </div>
          )}

          {/* 更新指标值弹窗 */}
          {editMetricId && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setEditMetricId(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-gray-800 mb-4">✏️ 更新指标值</h3>
                <div className="space-y-3">
                  <input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))} placeholder="当前值"
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={editWithAI} onChange={e => setEditWithAI(e.target.checked)} />
                    使用了 AI 辅助
                  </label>
                  {editWithAI && (
                    <input type="number" value={editBaseline} onChange={e => setEditBaseline(Number(e.target.value))}
                      placeholder="不使用 AI 的基准值" className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
                  )}
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setEditMetricId(null)} className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
                  <button onClick={() => {
                    updateMetricValue(editMetricId, editValue, editWithAI, editBaseline || undefined); refresh(); setEditMetricId(null)
                  }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm">保存</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          P1b: 知识复利仪表盘
          ════════════════════════════════════════ */}
      {tab === "compound" && (
        <div className="space-y-4">
          {/* 复利核心卡片 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6 text-center">
              <div className="text-4xl font-bold text-amber-700 mb-1">{(compound.compoundRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-amber-600 font-medium">知识复利指数</div>
              <div className="text-xs text-amber-400 mt-1">本月综合增长率</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 p-6 text-center">
              <div className="text-4xl font-bold text-cyan-700 mb-1">{compound.doublingTime}月</div>
              <div className="text-sm text-cyan-600 font-medium">Token 资本翻倍</div>
              <div className="text-xs text-cyan-400 mt-1">按当前速率预计</div>
            </div>
          </div>

          {/* 人力 vs Token 对比 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 人力资本 vs Token 资本增长率</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <div className="text-xs text-green-500 mb-1">👥 人力资本</div>
                <div className="text-3xl font-bold text-green-700">{humanLabel(compound.humanCapitalGrowth)}</div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl text-center">
                <div className="text-xs text-indigo-500 mb-1">🤖 Token 资本</div>
                <div className="text-3xl font-bold text-indigo-700">{tokenLabel(compound.tokenCapitalGrowth)}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              人力:Token = 1:{compound.humanVsTokenRatio.toFixed(1)} — 每个贡献者对应 {humanPerToken(compound.humanVsTokenRatio)}
            </p>
          </div>

          {/* 本月新编码知识 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📦 本月新编码</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "新概念", value: compound.newConceptsThisMonth, icon: "🧠", color: "text-indigo-700" },
                { label: "新工作流", value: compound.newWorkflowsThisMonth, icon: "🔗", color: "text-purple-700" },
                { label: "新决策", value: compound.newDecisionsThisMonth, icon: "🎯", color: "text-amber-700" },
                { label: "已优化", value: compound.improvedWorkflows, icon: "✨", color: "text-green-700" },
              ].map(c => (
                <div key={c.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{c.icon} {c.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 里程碑 */}
          {compound.milestones.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏆 里程碑</h3>
              <div className="space-y-2">
                {compound.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100 text-xs">
                    <span className="text-yellow-500">★</span>
                    <span className="text-gray-700">{m.description}</span>
                    <span className="text-gray-400 ml-auto">{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          P2: 知识导出 / 导入
          ════════════════════════════════════════ */}
      {tab === "export" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">💾 模型无关知识核心</h3>
            <p className="text-xs text-gray-400 mb-4">
              将机构所有知识（概念、培训点、决策记录、工作流、业务指标）导出为独立于 LLM 的 JSON 格式。
              切换底层模型时，知识层不受影响。
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-700">{graph.tokenCapital.codifiedConcepts + graph.tokenCapital.codifiedWorkflows + graph.tokenCapital.codifiedDecisions}</div>
                <div className="text-xs text-gray-400">总知识节点</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-green-700">v1.0.0</div>
                <div className="text-xs text-gray-400">核心版本</div>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={() => {
                const blob = new Blob([knowledgeJson], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a"); a.href = url
                a.download = `sijian-knowledge-core-${new Date().toISOString().slice(0, 10)}.json`
                a.click(); URL.revokeObjectURL(url)
              }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium">
                📥 导出知识核心
              </button>
              <label className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 text-sm font-medium cursor-pointer">
                📤 导入知识核心
                <input type="file" accept=".json" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return
                  const text = await file.text()
                  const ok = importKnowledgeCore(text)
                  setImportResult(ok ? `✅ 导入成功！刷新页面后在记忆宫殿中查看。` : "❌ 导入失败，请检查文件格式。")
                  e.target.value = ""
                }} className="hidden" />
              </label>
            </div>
            {importResult && (
              <div className={`p-3 rounded-xl text-sm ${importResult.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {importResult}
              </div>
            )}
          </div>

          {/* JSON 预览 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 知识核心 JSON 预览</h3>
            <pre className="text-[11px] text-gray-600 bg-gray-50 rounded-xl p-4 max-h-[400px] overflow-y-auto font-mono leading-relaxed">
              {knowledgeJson.slice(0, 3000)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function humanLabel(rate: number): string {
  if (rate >= 0.15) return "快速增长 ↑"
  if (rate >= 0.05) return "稳定增长 →"
  return "缓慢增长 ↓"
}
function tokenLabel(rate: number): string {
  if (rate >= 0.2) return "复利加速 🚀"
  if (rate >= 0.1) return "积累中 ↗"
  return "起步阶段 →"
}
function humanPerToken(ratio: number): string {
  if (ratio >= 10) return `${ratio.toFixed(0)} 个知识节点`
  if (ratio >= 3) return `${ratio.toFixed(0)} 个知识节点`
  return `${ratio.toFixed(1)} 个知识节点`
}
