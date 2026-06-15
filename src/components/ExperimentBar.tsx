"use client"

import { useState, useCallback, useRef } from "react"
import { saveExperiment, ExperimentRecord } from "@/lib/experiments"

interface ExperimentBarProps {
  onApplyTemplate?: (templateName: string) => void
  thinkingLines?: { lineId: string; confidence: number; triggers: string[] }[]
}

const SAMPLE_TASKS = [
  { name: "处理客户投诉", template: "销冠投诉处理模板", owner: "张师傅", lines: ["causality","proscons","pipeline"] },
  { name: "评估一个新项目是否值得做", template: "项目评估决策模板", owner: "李总监", lines: ["proscons","second_order","scenario"] },
  { name: "给客户做产品演示", template: "产品演示说服模板", owner: "王销冠", lines: ["analogy","example","narrative"] },
  { name: "分析为什么上一季度的业绩下滑", template: "业绩分析复盘模板", owner: "赵经理", lines: ["causality","review","bottleneck"] },
]

export default function ExperimentBar({ onApplyTemplate, thinkingLines }: ExperimentBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [phase, setPhase] = useState<"idle" | "prep" | "running" | "scoring">("idle")
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null)
  const [useTemplate, setUseTemplate] = useState(true)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [confidence, setConfidence] = useState(3)
  const [clarity, setClarity] = useState(3)
  const [notes, setNotes] = useState("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startExperiment = useCallback(() => {
    const now = new Date().toISOString()
    setStartTime(now)
    setElapsed(0)
    setPhase("running")
    if (useTemplate && selectedTemplate) {
      onApplyTemplate?.(selectedTemplate)
    }
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
  }, [useTemplate, selectedTemplate, onApplyTemplate])

  const stopExperiment = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase("scoring")
  }, [])

  const submitExperiment = useCallback(() => {
    if (!startTime || !selectedTask) return
    const exp: ExperimentRecord = {
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      taskName: selectedTask,
      mode: useTemplate ? "with_template" : "without_template",
      templateId: selectedTemplate || undefined,
      templateOwner: selectedOwner || undefined,
      startTime,
      endTime: new Date().toISOString(),
      durationSeconds: elapsed,
      confidence,
      clarity,
      linesUsed: thinkingLines?.map(l => l.lineId) || [],
      nodesCreated: [],
      notes,
    }
    saveExperiment(exp)
    setPhase("idle")
    setExpanded(false)
    setSelectedTask(null)
    setSelectedTemplate(null)
    setElapsed(0)
    setConfidence(3)
    setClarity(3)
    setNotes("")
  }, [startTime, selectedTask, useTemplate, selectedTemplate, selectedOwner, elapsed, confidence, clarity, thinkingLines, notes])

  const formatTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  return (
    <div className="bg-white rounded-2xl border border-[#e8e5df] overflow-hidden transition-all">
      {/* 收起/展开条 */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-lg">{phase === "running" ? "⏱️" : "🧪"}</span>
          <span className="font-medium text-gray-700">
            {phase === "running"
              ? `实验中 · ${formatTime(elapsed)}`
              : phase === "scoring"
              ? "实验完成 · 请评分"
              : "思维模板验证实验"}
          </span>
        </div>
        <span className="text-xs text-gray-400">{expanded ? "收起 ▲" : "展开 ▼"}</span>
      </button>

      {expanded && phase === "idle" && (
        <div className="px-4 pb-4 border-t border-[#e8e5df] pt-4 space-y-3">
          <p className="text-xs text-gray-500">
            🧪 <strong>验证实验：</strong>让新人用老员工的思维模板解决同一个问题，对比效率差距。
          </p>

          {/* 选择任务 */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">1. 选择一个工作任务</div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TASKS.map(task => (
                <button key={task.name}
                  onClick={() => { setSelectedTask(task.name); setSelectedTemplate(task.template); setSelectedOwner(task.owner) }}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedTask === task.name ? "border-purple-400 bg-purple-50" : "border-[#e8e5df] hover:border-gray-300"
                  }`}>
                  <div className="font-medium text-gray-700">{task.name}</div>
                  <div className="text-gray-400 mt-0.5">模板: {task.template}</div>
                  <div className="text-gray-300 text-[10px]">作者: {task.owner}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 是否使用模板 */}
          {selectedTask && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">实验模式：</span>
              <button onClick={() => setUseTemplate(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${useTemplate ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                用模板
              </button>
              <button onClick={() => setUseTemplate(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!useTemplate ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                不用模板（对照组）
              </button>
            </div>
          )}

          {/* 开始按钮 */}
          {selectedTask && (
            <button onClick={startExperiment}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-all">
              {useTemplate ? "🧠 套用模板开始计时" : "🧠 不套模板开始计时"}
            </button>
          )}
        </div>
      )}

      {expanded && phase === "running" && (
        <div className="px-4 pb-4 border-t border-[#e8e5df] pt-4 text-center">
          <div className="text-3xl font-mono font-bold text-purple-700 mb-2">{formatTime(elapsed)}</div>
          <p className="text-sm text-gray-500 mb-3">
            {useTemplate
              ? `正在用「${selectedOwner}」的「${selectedTemplate}」解决"${selectedTask}"...`
              : `正在独立解决"${selectedTask}"...`}
          </p>
          <button onClick={stopExperiment}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all">
            停止计时 · 我完成任务了
          </button>
        </div>
      )}

      {expanded && phase === "scoring" && (
        <div className="px-4 pb-4 border-t border-[#e8e5df] pt-4 space-y-3">
          <div className="text-center text-sm font-medium text-gray-700">
            ⏱️ 任务完成耗时 <span className="text-purple-700">{formatTime(elapsed)}</span>
          </div>

          {/* 信心评分 */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">你有多确定自己做出了正确的判断？（1=完全不确定，5=非常确定）</div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setConfidence(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    confidence === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* 思路清晰度 */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">思考过程中你的思路有多清晰？（1=完全混乱，5=非常清晰）</div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setClarity(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    clarity === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="（可选）自由反馈：用模板和不用模板，最大的区别是什么？"
            rows={2} className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300" />

          <button onClick={submitExperiment}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all">
            提交实验结果
          </button>
        </div>
      )}
    </div>
  )
}
