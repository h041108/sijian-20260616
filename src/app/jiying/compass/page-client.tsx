"use client"
import { useState, useEffect, useCallback } from "react"
import { loadMoneyCompass, saveMoneyCompass, completeTask, STAGE_INFO } from "@/lib/money-compass"
import type { MonetizationStage } from "@/lib/money-compass"

const STAGE_ORDER: MonetizationStage[] = ["cold_start", "traffic_accumulate", "early_monetize", "private_domain", "high_value"]

export default function CompassPage() {
  const [data, setData] = useState(() => loadMoneyCompass())
  const [activeTab, setActiveTab] = useState<"roadmap" | "revenue" | "tasks">("roadmap")

  useEffect(() => { saveMoneyCompass(data) }, [data])

  const handleCompleteTask = useCallback((taskId: string) => {
    setData(prev => {
      const updated = completeTask(prev, taskId)
      const currentTasks = updated.tasks.filter(t => t.stage === updated.currentStage)
      const allDone = currentTasks.length > 0 && currentTasks.every(t => t.status === "completed")
      if (allDone) {
        const curIdx = STAGE_ORDER.indexOf(updated.currentStage)
        if (curIdx < STAGE_ORDER.length - 1) {
          return { ...updated, currentStage: STAGE_ORDER[curIdx + 1], stageProgress: 0 }
        }
      }
      return { ...updated, stageProgress: Math.min(100, updated.stageProgress + 20) }
    })
  }, [])

  const curStage = STAGE_INFO[data.currentStage]
  const curIdx = STAGE_ORDER.indexOf(data.currentStage)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧭</span>
        <div><h1 className="text-xl font-bold text-gray-800">赚钱罗盘</h1><p className="text-sm text-gray-400">你的自媒体赚钱路线图 · 从0到月入过万</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-gray-800">{data.daysOnPlatform}</div>
          <div className="text-[10px] text-gray-400">运营天数</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-indigo-600">{data.followers}</div>
          <div className="text-[10px] text-gray-400">粉丝数</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-green-600">{data.totalEarnings}</div>
          <div className="text-[10px] text-gray-400">累计收益</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-amber-600">{data.thisMonthEarnings}</div>
          <div className="text-[10px] text-gray-400">本月预估</div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-indigo-800">{curStage.icon} {curStage.label}</span>
          <span className="text-[10px] text-indigo-500">{curStage.timeRange}</span>
        </div>
        <p className="text-xs text-indigo-600 mb-2">{curStage.desc}</p>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: data.stageProgress + "%" }} />
        </div>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs">
        {[{ id: "roadmap", label: "路线图" }, { id: "tasks", label: "任务" }, { id: "revenue", label: "变现渠道" }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-1.5 rounded-lg font-medium ${activeTab === t.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>{t.label}</button>
        ))}
      </div>
      {activeTab === "roadmap" && (
        <div className="space-y-1">
          {STAGE_ORDER.map((stageId, i) => {
            const s = STAGE_INFO[stageId]
            const isActive = i === curIdx
            const isPast = i < curIdx
            return (
              <div key={stageId} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${isActive ? "bg-indigo-50 border-indigo-300" : isPast ? "bg-green-50 border-green-200 opacity-70" : "bg-white border-gray-200 opacity-50"}`}>
                <span className="text-lg">{isPast ? "✅" : s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{s.label}</div>
                  <div className="text-[10px] text-gray-400">{s.timeRange} {s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {activeTab === "tasks" && (
        <div className="space-y-2">
          {data.tasks.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border p-3 ${t.status === "completed" ? "opacity-50 border-green-200" : "border-gray-200"}`}>
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">{t.status === "completed" ? "✅" : t.status === "available" ? "⬜" : "🔒"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{t.title}</div>
                  <div className="text-[10px] text-gray-400">{t.description}</div>
                  <div className="text-[10px] text-indigo-500 mt-0.5">{t.reward}</div>
                </div>
                {t.status === "available" && <button onClick={() => handleCompleteTask(t.id)} className="shrink-0 px-2.5 py-1 text-[10px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">完成</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === "revenue" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 px-1">随着粉丝增长逐步解锁变现渠道</p>
          {data.revenueStreams.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{r.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{r.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{r.difficulty}</span>
                </div>
                <span className="text-xs font-bold text-gray-700">{r.potentialMonthly}/月</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{r.status} {r.nextStep}</span>
                <span>当前：{r.currentMonthly}</span>
              </div>
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: r.progress + "%" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
