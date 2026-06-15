"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import MindTransit from "@/components/MindTransit"
import type { MindNode, MindEdge, Position, DomainType, FrameType } from "@/lib/types"
import type { StudentGrowth, GrowthSession } from "@/lib/growth-data"

interface GrowthViewerProps {
  growth: StudentGrowth
  color: string
}

// ─── 节点状态标记 ────────────────────────────────

type NodeState = "new" | "updated" | "unchanged" | "removed"

interface GrowthNode {
  id: string; label: string; content: string; shape: string; color: string
  mastery: number; isNew: boolean; isUpdated: boolean; anchors: string[]
  depth: number; parentIds: string[]
  metadata: { createdBy: "ai"; createdAt: string; version: number }
  state: NodeState
  masteryChange: number
}

export default function GrowthViewer({ growth, color }: GrowthViewerProps) {
  const [sessionIdx, setSessionIdx] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const sessions = growth.sessions
  const session = sessions[sessionIdx]
  const prevSession = sessionIdx > 0 ? sessions[sessionIdx - 1] : null

  // 对比前后两轮，标记每个节点的新/更新/不变
  const growthNodes = useMemo((): GrowthNode[] => {
    const prevLabels = new Set(prevSession?.nodes.map(n => n.label) || [])
    const prevMastery: Record<string, number> = {}
    prevSession?.nodes.forEach(n => { prevMastery[n.label] = n.mastery })

    return session.nodes.map(n => {
      let state: NodeState = "unchanged"
      if (!prevSession) state = "new"
      else if (!prevLabels.has(n.label)) state = "new"
      else if (n.isUpdated || (n.content !== prevSession.nodes.find(pn => pn.label === n.label)?.content)) state = "updated"

      const mChange = prevMastery[n.label] !== undefined ? n.mastery - prevMastery[n.label] : n.mastery
      return { ...n, state, masteryChange: mChange }
    })
  }, [session, prevSession])

  // 转换为 MindTransit 接受的格式
  const mindNodes: MindNode[] = useMemo(() => growthNodes.map(n => ({
    id: n.id || `n_${n.label}`, label: n.label, depth: 0, shape: n.shape as any,
    color: n.state === "new" ? "#22c55e" : n.state === "updated" ? "#3b82f6" : n.color,
    position: undefined,
    content: n.content, parentIds: [], anchors: (n.anchors || []).map((a: any, ai: number) => ({
      id: `a_${n.label}_${ai}`, label: typeof a === "string" ? a : a, nodeId: n.id || `n_${n.label}`,
      profession: "", domain: "", parameters: "", relevanceScore: 0.8
    })),
    metadata: { createdBy: "ai" as const, createdAt: session.date, version: 1 }
  })), [growthNodes, session.date])

  const mindEdges: MindEdge[] = useMemo(() => session.edges.map((e, i) => ({
    id: `e_${i}`, source: e.source, target: e.target, edgeType: "abstract" as const, weight: 0.8
  })), [session.edges])

  // 自动播放
  useEffect(() => {
    if (!autoPlay) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSessionIdx(prev => {
        if (prev >= sessions.length - 1) { setAutoPlay(false); return prev }
        return prev + 1
      })
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoPlay, sessions.length])

  const firstMastery = sessions[0].nodes.reduce((s,n)=>s+n.mastery,0)/sessions[0].nodes.length
  const currentMastery = session.nodes.reduce((s,n)=>s+n.mastery,0)/session.nodes.length
  const masteryChange = currentMastery - firstMastery

  const subjectName = growth.subject === "mathematics" ? "数学" : growth.subject === "physics" ? "物理" : "化学"
  const milestoneIcons: Record<string, string> = { "首次掌握":"⭐","应用锚点突破":"🔗","思维纠错":"🔄","概念重构":"🏗️" }

  return (
    <div className="bg-white rounded-2xl border border-[#d8e0c8] overflow-hidden">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-[#e8ecd8]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}40` }}>
            {Math.round(currentMastery * 100)}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{growth.studentName}</div>
            <div className="text-xs text-gray-500">
              {subjectName} · {sessions.length}轮对话 · 掌握度 {Math.round(firstMastery*100)}% → {Math.round(currentMastery*100)}%
              <span className={masteryChange >= 0 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                ({masteryChange >= 0 ? "+" : ""}{Math.round(masteryChange*100)}%)
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay) setSessionIdx(0) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${autoPlay ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}>
          {autoPlay ? "⏸ 停止" : "▶ 播放演进"}
        </button>
      </div>

      {/* 时间轴滑块 */}
      <div className="px-6 py-4 bg-gray-50 border-b border-[#e8ecd8]">
        <div className="flex items-center gap-2 mb-2">
          {sessions.map((s, i) => {
            const sMastery = s.nodes.reduce((sum,n)=>sum+n.mastery,0)/s.nodes.length
            const isCurrent = i === sessionIdx
            const isPast = i < sessionIdx
            return (
              <button key={i}
                onClick={() => setSessionIdx(i)}
                className={`flex-1 relative group`}>
                {/* 进度条 */}
                <div className={`h-1.5 rounded-full mb-2 transition-all ${isPast ? "bg-purple-400" : isCurrent ? "bg-purple-600" : "bg-gray-200"}`}>
                  <div className="h-full rounded-full bg-purple-400" style={{ width: `${isPast ? 100 : isCurrent ? sMastery*100/maxMastery(sessions)*100 : 0}%` }} />
                </div>
                {/* 日期 */}
                <div className={`text-[10px] text-center transition-all ${isCurrent ? "font-bold text-purple-700" : "text-gray-400"}`}>
                  {s.date.slice(5)}
                </div>
                {/* 里程碑标记 */}
                {s.milestone && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                    {milestoneIcons[s.milestone]}
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {/* 当前节点数 */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>{session.date} · {session.frameType} · {session.topic}</span>
          <span>
            <span className="text-green-600">{growthNodes.filter(n=>n.state==="new").length} 新增</span>
            {" · "}
            <span className="text-blue-600">{growthNodes.filter(n=>n.state==="updated").length} 更新</span>
            {" · "}
            <span className="text-gray-400">{growthNodes.filter(n=>n.state==="unchanged").length} 保留</span>
          </span>
        </div>
      </div>

      {/* 思维线路图 */}
      <div style={{ height: "400px" }}>
        {mindNodes.length > 0 ? (
          <MindTransit
            nodes={mindNodes}
            edges={mindEdges}
            domainType={growth.subject as DomainType}
            frameType={(session.frameType || "tree") as FrameType}
            onNodeClick={() => {}}
            onExport={() => {}}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            该轮暂无节点数据
          </div>
        )}
      </div>

      {/* 底部：对话摘要 + 节点详情 */}
      <div className="p-4 border-t border-[#e8ecd8]">
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{session.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {growthNodes.map(n => (
            <div key={n.label}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border ${
                n.state === "new" ? "border-green-300 bg-green-50 text-green-700" :
                n.state === "updated" ? "border-blue-300 bg-blue-50 text-blue-700" :
                "border-gray-200 bg-white text-gray-500"
              }`}
              title={n.content}>
              <div className={`w-1.5 h-1.5 rounded-full ${n.state === "new" ? "bg-green-500" : n.state === "updated" ? "bg-blue-500" : ""}`}
                style={{ backgroundColor: n.state === "unchanged" ? n.color : undefined }} />
              {n.label}
              <span className="font-medium">{(n.mastery*100).toFixed(0)}%</span>
              {n.masteryChange > 0.05 && <span className="text-green-500 text-[9px]">↑</span>}
              {n.masteryChange < -0.05 && <span className="text-red-500 text-[9px]">↓</span>}
              {n.anchors && n.anchors.length > 0 && (
                <span className="text-[8px] text-gray-400" title={Array.isArray(n.anchors[0]) ? String(n.anchors[0]) : (typeof n.anchors[0] === 'string' ? n.anchors[0] as string : (n.anchors[0] as any)?.label || '')}>
                  📍{n.anchors.length}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function maxMastery(sessions: GrowthSession[]): number {
  return Math.max(...sessions.map(s => s.nodes.reduce((sum,n)=>sum+n.mastery,0)/s.nodes.length), 0.01)
}
