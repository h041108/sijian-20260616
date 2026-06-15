"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DecisionRecord, KnowledgeFlowMetric, OrgCognitionReport,
  loadDecisions, recordDecision, reviewDecision,
  loadKnowledgeFlows, saveKnowledgeFlows,
  getOrgCognitionReport,
} from "@/lib/enterprise-ai-capability"

const DEPARTMENTS = ["研发部", "市场部", "销售部", "行政部", "客服部", "财务部", "人事部"]
const FLOW_TYPES: KnowledgeFlowMetric["flowType"][] = ["主动分享", "被动获取", "会议传递", "文档流转", "AI辅助"]

export default function L5OrgCognition() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() => loadDecisions())
  const [flows, setFlows] = useState<KnowledgeFlowMetric[]>(() => loadKnowledgeFlows())
  const [report, setReport] = useState<OrgCognitionReport | null>(null)
  const [view, setView] = useState<"decisions" | "flows" | "report">("decisions")

  // 新决策表单
  const [showNewDecision, setShowNewDecision] = useState(false)
  const [ndTitle, setNdTitle] = useState("")
  const [ndDesc, setNdDesc] = useState("")
  const [ndDecider, setNdDecider] = useState("")
  const [ndDept, setNdDept] = useState("研发部")
  const [ndOptions, setNdOptions] = useState<{ label: string; pros: string; cons: string }[]>([])
  const [ndAssumptions, setNdAssumptions] = useState("")
  const [ndUnknowns, setNdUnknowns] = useState("")
  const [ndAiInput, setNdAiInput] = useState("")

  // 复盘表单
  const [reviewingDecisionId, setReviewingDecisionId] = useState<string | null>(null)
  const [reviewOutcome, setReviewOutcome] = useState<DecisionRecord["outcome"]>("待评估")
  const [reviewLessons, setReviewLessons] = useState("")

  // 新知识流
  const [showNewFlow, setShowNewFlow] = useState(false)
  const [nfFrom, setNfFrom] = useState("研发部")
  const [nfTo, setNfTo] = useState("市场部")
  const [nfTopic, setNfTopic] = useState("")
  const [nfType, setNfType] = useState<KnowledgeFlowMetric["flowType"]>("文档流转")
  const [nfQuality, setNfQuality] = useState(3)
  const [nfDelay, setNfDelay] = useState(1)

  const handleAddOption = useCallback(() => {
    setNdOptions(prev => [...prev, { label: "", pros: "", cons: "" }])
  }, [])

  const handleUpdateOption = useCallback((idx: number, field: string, value: string) => {
    setNdOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o))
  }, [])

  const handleRemoveOption = useCallback((idx: number) => {
    setNdOptions(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const handleRecordDecision = useCallback(() => {
    if (!ndTitle.trim()) return
    const options = ndOptions.filter(o => o.label.trim()).map(o => ({
      label: o.label,
      pros: o.pros.split(",").map(s => s.trim()).filter(Boolean),
      cons: o.cons.split(",").map(s => s.trim()).filter(Boolean),
      chosen: false,
    }))
    recordDecision({
      title: ndTitle.trim(),
      description: ndDesc.trim(),
      decider: ndDecider.trim() || "当前用户",
      department: ndDept,
      options,
      assumptions: ndAssumptions.split("\n").filter(Boolean),
      unknownFactors: ndUnknowns.split("\n").filter(Boolean),
      aiInput: ndAiInput.trim() || undefined,
      decisionDate: new Date().toISOString(),
    })
    setDecisions(loadDecisions())
    setShowNewDecision(false)
    setNdTitle(""); setNdDesc(""); setNdDecider(""); setNdOptions([])
    setNdAssumptions(""); setNdUnknowns(""); setNdAiInput("")
  }, [ndTitle, ndDesc, ndDecider, ndDept, ndOptions, ndAssumptions, ndUnknowns, ndAiInput])

  const handleReviewDecision = useCallback(() => {
    if (!reviewingDecisionId) return
    reviewDecision(reviewingDecisionId, reviewOutcome,
      reviewLessons.split("\n").map(s => s.trim()).filter(Boolean))
    setDecisions(loadDecisions())
    setReviewingDecisionId(null)
    setReviewLessons("")
  }, [reviewingDecisionId, reviewOutcome, reviewLessons])

  const handleAddFlow = useCallback(() => {
    if (!nfTopic.trim()) return
    const flow: KnowledgeFlowMetric = {
      fromTeam: nfFrom, toTeam: nfTo, topic: nfTopic.trim(),
      flowType: nfType, frequency: 1,
      quality: nfQuality / 5, delay: nfDelay,
    }
    const updated = [...flows, flow]
    saveKnowledgeFlows(updated)
    setFlows(updated)
    setShowNewFlow(false)
    setNfTopic("")
  }, [nfFrom, nfTo, nfTopic, nfType, nfQuality, nfDelay, flows])

  const handleGenerateReport = useCallback(() => {
    setReport(getOrgCognitionReport())
    setView("report")
  }, [])

  const stats = useMemo(() => ({
    total: decisions.length,
    reviewed: decisions.filter(d => d.outcome !== undefined && d.outcome !== "待评估").length,
    correct: decisions.filter(d => d.outcome === "正确").length,
    wrong: decisions.filter(d => d.outcome === "错误").length,
  }), [decisions])

  return (
    <div className="space-y-6">
      {/* ── 导航 ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
        <button onClick={() => setView("decisions")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "decisions" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          🧠 决策追溯
        </button>
        <button onClick={() => setView("flows")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "flows" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          🔄 知识流动
        </button>
        <button onClick={handleGenerateReport}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "report" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          📊 组织认知报告
        </button>
        <div className="flex-1" />
        {view === "decisions" && (
          <button onClick={() => setShowNewDecision(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all">
            + 记录决策
          </button>
        )}
        {view === "flows" && (
          <button onClick={() => setShowNewFlow(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all">
            + 记录知识流动
          </button>
        )}
      </div>

      {/* ── 1. 决策追溯 ── */}
      {view === "decisions" && (
        <div className="space-y-4">
          {/* 统计 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-indigo-700">{stats.total}</div>
              <div className="text-xs text-indigo-500 mt-1">总决策</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.reviewed}</div>
              <div className="text-xs text-blue-500 mt-1">已复盘</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.correct}</div>
              <div className="text-xs text-green-500 mt-1">正确决策</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
              <div className="text-xs text-red-500 mt-1">错误决策</div>
            </div>
          </div>

          {/* 决策列表 */}
          {decisions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
              <div className="text-5xl mb-4 opacity-20">🧠</div>
              <p className="text-gray-500 text-sm">还没有记录任何决策</p>
              <p className="text-xs text-gray-400 mt-1">每次做重要决策时记录下来，复盘时你会看到自己的思维模式</p>
            </div>
          ) : (
            decisions.map(d => (
              <div key={d.id} className={`bg-white rounded-2xl border p-6 ${
                d.outcome === "正确" ? "border-green-200" :
                d.outcome === "错误" ? "border-red-200" :
                "border-[#e8e5df]"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-800">{d.title}</h3>
                      {d.outcome && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          d.outcome === "正确" ? "bg-green-100 text-green-700" :
                          d.outcome === "错误" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>{d.outcome}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{d.decider} · {d.department} · {new Date(d.decisionDate).toLocaleDateString("zh")}</p>
                  </div>
                  {!d.reviewDate && (
                    <button onClick={() => setReviewingDecisionId(d.id)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
                      📝 复盘
                    </button>
                  )}
                </div>

                {d.description && <p className="text-sm text-gray-600 mb-3">{d.description}</p>}

                {/* 选项 */}
                {d.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {d.options.map((o, i) => (
                      <div key={i} className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs">
                        <span className="font-medium text-gray-700">{o.label}</span>
                        {o.pros.length > 0 && <div className="text-green-600 mt-0.5">👍 {o.pros.join(" · ")}</div>}
                        {o.cons.length > 0 && <div className="text-red-500 mt-0.5">👎 {o.cons.join(" · ")}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* 假设 & 未知因素 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {d.assumptions.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-[10px] text-yellow-600 font-medium mb-1">🔑 当时的关键假设</p>
                      {d.assumptions.map((a, i) => <p key={i} className="text-xs text-gray-600">• {a}</p>)}
                    </div>
                  )}
                  {d.unknownFactors.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-medium mb-1">❓ 当时不知道的因素</p>
                      {d.unknownFactors.map((u, i) => <p key={i} className="text-xs text-gray-500">• {u}</p>)}
                    </div>
                  )}
                </div>

                {d.aiInput && (
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 mb-2">
                    <p className="text-[10px] text-purple-500 font-medium">🤖 AI 的输入</p>
                    <p className="text-xs text-gray-600">{d.aiInput}</p>
                  </div>
                )}

                {/* 复盘内容 */}
                {d.lessons.length > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-indigo-500 font-medium mb-1">📖 复盘教训</p>
                    {d.lessons.map((l, i) => <p key={i} className="text-xs text-gray-700">• {l}</p>)}
                  </div>
                )}
              </div>
            ))
          )}

          {/* 复盘弹窗 */}
          {reviewingDecisionId && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setReviewingDecisionId(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-gray-800 mb-4">📝 决策复盘</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">结果评估</label>
                    <select value={reviewOutcome || "待评估"} onChange={e => setReviewOutcome(e.target.value as any)}
                      className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 px-4 py-2.5 text-sm">
                      <option value="待评估">待评估</option>
                      <option value="正确">✅ 正确</option>
                      <option value="部分正确">⚠️ 部分正确</option>
                      <option value="错误">❌ 错误</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">复盘教训（每行一条）</label>
                    <textarea value={reviewLessons} onChange={e => setReviewLessons(e.target.value)}
                      placeholder="这个决策的关键教训是什么？&#10;如果重新来一次会怎么做？&#10;有哪些认知偏差影响了你？"
                      className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 p-3 text-sm h-28 resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setReviewingDecisionId(null)}
                    className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
                  <button onClick={handleReviewDecision}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm">保存复盘</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 新决策弹窗 ── */}
      {showNewDecision && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNewDecision(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">🧠 记录一个决策</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={ndTitle} onChange={e => setNdTitle(e.target.value)} placeholder="决策标题"
                className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <input value={ndDecider} onChange={e => setNdDecider(e.target.value)} placeholder="决策人"
                className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
            </div>
            <input value={ndDesc} onChange={e => setNdDesc(e.target.value)} placeholder="决策背景描述"
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm mb-3" />
            <select value={ndDept} onChange={e => setNdDept(e.target.value)}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm mb-3">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* 可选方案 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">备选方案</span>
                <button onClick={handleAddOption} className="text-xs text-indigo-500">+ 添加方案</button>
              </div>
              {ndOptions.map((o, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={o.label} onChange={e => handleUpdateOption(i, "label", e.target.value)}
                    placeholder="方案名称" className="flex-1 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-xs" />
                  <input value={o.pros} onChange={e => handleUpdateOption(i, "pros", e.target.value)}
                    placeholder="优点(逗号分隔)" className="flex-1 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-xs" />
                  <input value={o.cons} onChange={e => handleUpdateOption(i, "cons", e.target.value)}
                    placeholder="缺点" className="flex-1 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-xs" />
                  <button onClick={() => handleRemoveOption(i)} className="text-xs text-red-400">✕</button>
                </div>
              ))}
            </div>

            <textarea value={ndAssumptions} onChange={e => setNdAssumptions(e.target.value)}
              placeholder="当时的关键假设（每行一条）" rows={2}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm mb-3 resize-none" />
            <textarea value={ndUnknowns} onChange={e => setNdUnknowns(e.target.value)}
              placeholder="当时不知道的因素（每行一条）" rows={2}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm mb-3 resize-none" />
            <textarea value={ndAiInput} onChange={e => setNdAiInput(e.target.value)}
              placeholder="AI在这个决策中提供了什么输入？"
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm mb-3 resize-none" rows={2} />

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewDecision(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
              <button onClick={handleRecordDecision} disabled={!ndTitle.trim()}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm disabled:opacity-40">记录决策</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. 知识流动 ── */}
      {view === "flows" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🔄 知识流动记录</h3>
            {flows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">还没有记录知识流动</p>
            ) : (
              <div className="space-y-2">
                {flows.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e5df] text-sm">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">{f.fromTeam}</span>
                    <span className="text-gray-300">→</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{f.toTeam}</span>
                    <span className="text-gray-700 font-medium flex-1">{f.topic}</span>
                    <span className="text-xs text-gray-400">{f.flowType}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">质量:</span>
                      <div className="w-12 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${f.quality * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{f.delay}天延迟</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新知识流弹窗 */}
          {showNewFlow && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNewFlow(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-gray-800 mb-4">🔄 记录知识流动</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select value={nfFrom} onChange={e => setNfFrom(e.target.value)}
                      className="rounded-xl border border-[#e8e5df] bg-gray-50 px-3 py-2.5 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d} (来源)</option>)}
                    </select>
                    <select value={nfTo} onChange={e => setNfTo(e.target.value)}
                      className="rounded-xl border border-[#e8e5df] bg-gray-50 px-3 py-2.5 text-sm">
                      {DEPARTMENTS.filter(d => d !== nfFrom).map(d => <option key={d} value={d}>{d} (目标)</option>)}
                    </select>
                  </div>
                  <input value={nfTopic} onChange={e => setNfTopic(e.target.value)}
                    placeholder="信息/知识主题" className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 px-4 py-2.5 text-sm" />
                  <select value={nfType} onChange={e => setNfType(e.target.value as any)}
                    className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 px-4 py-2.5 text-sm">
                    {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">传递质量:</span>
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} onClick={() => setNfQuality(i)}
                        className={`w-6 h-6 rounded-full text-xs font-medium ${i <= nfQuality ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"}`}>{i}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">传递延迟:</span>
                    <input type="number" min={0} max={30} value={nfDelay} onChange={e => setNfDelay(Number(e.target.value))}
                      className="w-20 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-sm text-center" />
                    <span className="text-xs text-gray-400">天</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setShowNewFlow(false)}
                    className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
                  <button onClick={handleAddFlow} disabled={!nfTopic.trim()}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm disabled:opacity-40">记录</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. 组织认知报告 ── */}
      {view === "report" && report && (
        <div className="space-y-6">
          {/* AI依赖分析 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
              <div className="text-3xl font-bold text-indigo-700">{(report.aiDependency.collaborationRatio * 100).toFixed(0)}%</div>
              <div className="text-xs text-indigo-500 mt-1">人机协作占比</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
              <div className="text-3xl font-bold text-purple-700">{report.cognitiveDiversity.frameworksInUse.length}</div>
              <div className="text-xs text-purple-500 mt-1">思维框架</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
              <div className="text-3xl font-bold text-green-700">{Math.round(report.cognitiveDiversity.innovationIndex * 100)}</div>
              <div className="text-xs text-green-500 mt-1">创新指数</div>
            </div>
          </div>

          {/* 认知多样性 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">🧠 思维框架使用分布</h3>
              {report.cognitiveDiversity.frameworksInUse.length > 0 ? (
                <div className="space-y-3">
                  {report.cognitiveDiversity.frameworksInUse.map(fw => (
                    <div key={fw.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{fw.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gray-100">
                          <div className="h-full bg-indigo-400 rounded-full"
                            style={{ width: `${(fw.count / report.cognitiveDiversity.frameworksInUse.reduce((m, f) => Math.max(m, f.count), 1)) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{fw.count}次</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">记录更多决策后，这里会显示组织最常用的思维框架</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">⚠️ 主要认知偏差</h3>
              {report.cognitiveDiversity.dominantBias.length > 0 ? (
                <div className="space-y-3">
                  {report.cognitiveDiversity.dominantBias.map(b => (
                    <div key={b.bias} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-sm text-gray-700">{b.bias}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.prevalence > 0.5 ? "bg-red-200 text-red-700" : "bg-yellow-200 text-yellow-700"}`}>
                        {Math.round(b.prevalence * 100)}% 决策中出现
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">复盘更多决策后，这里会统计组织的常见认知偏差</p>
              )}
            </div>
          </div>

          {/* 团队认知画像 */}
          {report.teamCognition.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 团队认知画像</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 text-left">团队</th>
                      <th className="pb-2 text-left">思维深度</th>
                      <th className="pb-2 text-left">决策速度</th>
                      <th className="pb-2 text-left">反转率</th>
                      <th className="pb-2 text-left">诊断</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.teamCognition.map(team => (
                      <tr key={team.teamName} className="border-b border-gray-50">
                        <td className="py-2.5 font-medium text-gray-800">{team.teamName}</td>
                        <td className="py-2.5">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100">
                            <div className={`h-full rounded-full ${team.averageThinkingDepth > 0.6 ? "bg-green-500" : "bg-yellow-500"}`}
                              style={{ width: `${team.averageThinkingDepth * 100}%` }} />
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-gray-500">{team.decisionSpeed.toFixed(1)} 天</td>
                        <td className="py-2.5">
                          <span className={`text-xs ${team.reversalRate > 0.3 ? "text-red-600" : "text-green-600"}`}>
                            {(team.reversalRate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-gray-400">
                          {team.averageThinkingDepth < 0.4 ? "⚠️ 偏浅" :
                           team.reversalRate > 0.3 ? "🔄 频繁反转" : "✅ 健康"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI依赖度分析 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">🤖 AI高度依赖任务</h3>
              {report.aiDependency.highDependencyTasks.length > 0 ? (
                <div className="space-y-2">
                  {report.aiDependency.highDependencyTasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-700">{t.task}</span>
                      <span className="text-xs font-medium text-purple-600">依赖度 {t.aiReliance}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">记录知识流后自动生成</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">👤 纯人工任务</h3>
              {report.aiDependency.humanOnlyTasks.length > 0 ? (
                <div className="space-y-2">
                  {report.aiDependency.humanOnlyTasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-700">{t.task}</span>
                      <span className="text-xs text-blue-500">{t.count}次</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">记录知识流后自动生成</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
