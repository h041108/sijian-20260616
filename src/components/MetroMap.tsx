"use client"

import { useState, useCallback, useMemo } from "react"
import { getAllLines } from "@/lib/thinking-lines"

// ═══════════════════════════════════════════════════
// 从真实数据生成地铁图
// ═══════════════════════════════════════════════════

interface Station {
  id: string; label: string; x: number; y: number; r: number
  color: string; isHub: boolean; depth: number
  content: string; lineIds: string[]
}
interface MetroLine {
  id: string; name: string; color: string
  stations: Station[]
}

function generateEduLines(): MetroLine[] {
  const allLines = getAllLines()
  const lines: MetroLine[] = []

  try {
    const rooms = JSON.parse(localStorage.getItem("sijian_memory_palace") || "[]") || []
    if (rooms.length === 0) {
      // 无数据时展示空的线路模板
      return allLines.slice(0, 8).map((l, i) => ({
        id: l.id, name: l.name, color: l.color,
        stations: [{
          id: `${l.id}_empty`, label: l.name.slice(0, 4), x: 100 + i * 160, y: 200 + (i % 3) * 180,
          r: 6, color: l.color, isHub: false, depth: 0,
          content: "暂无学习记录，开始对话后这里会显示你的思维轨迹",
          lineIds: [l.id],
        }],
      }))
    }

    // 按学科分组房间
    const bySubject: Record<string, typeof rooms> = {}
    for (const r of rooms) {
      const subj = r.subject || "general"
      if (!bySubject[subj]) bySubject[subj] = []
      bySubject[subj].push(r)
    }

    const subjectNames: Record<string, string> = {
      mathematics:"数学", physics:"物理", chemistry:"化学", biology:"生物",
      history:"历史", geography:"地理", chinese:"语文", english:"英语", general:"通用",
    }

    let lineIdx = 0
    const cols = 3
    const colW = 440, rowH = 220, pad = 80

    for (const [subj, rooms] of Object.entries(bySubject)) {
      const subjName = subjectNames[subj] || subj
      const items = rooms.flatMap((r: any) => r.items)
      const lineColor = allLines[lineIdx % allLines.length]?.color || "#6366F1"
      const lineName = allLines[lineIdx % allLines.length]?.name || subjName

      lineIdx++

      const col = (lineIdx - 1) % cols
      const row = Math.floor((lineIdx - 1) / cols)

      const stations: Station[] = items.slice(0, 8).map((item: any, si: number) => {
        const angle = (si / Math.min(items.length, 8)) * Math.PI * 1.5 + Math.PI * 0.25
        const radius = 40 + si * 12
        return {
          id: item.id, label: item.label.slice(0, 6),
          x: pad + col * colW + 160 + Math.cos(angle) * radius,
          y: pad + row * rowH + 120 + Math.sin(angle) * radius * 0.4,
          r: Math.round(5 + item.mastery * 7), color: item.color || lineColor,
          isHub: item.mastery >= 0.7, depth: Math.round(item.mastery * 10),
          content: `${item.label}: ${item.content?.slice(0, 80) || "学习概念"} · 掌握度${Math.round(item.mastery * 100)}%`,
          lineIds: [allLines[lineIdx % allLines.length]?.id || "general"],
        }
      })

      if (stations.length > 0) {
        lines.push({ id: subj, name: `${subjName} · ${items.length}概念`, color: lineColor, stations })
      }
    }
  } catch {}

  if (lines.length === 0) {
    return allLines.slice(0, 6).map((l, i) => ({
      id: l.id, name: l.name, color: l.color,
      stations: [{
        id: `${l.id}_start`, label: "开始学习", x: 120 + i * 180, y: 200 + (i % 2) * 120,
        r: 8, color: l.color, isHub: true, depth: 0,
        content: "开始对话后，AI帮你构建思维空间，在这里能看到你的学习轨迹",
        lineIds: [l.id],
      }],
    }))
  }

  return lines
}

function generateEnterpriseLines(): MetroLine[] {
  const allLines = getAllLines()
  const lines: MetroLine[] = []

  try {
    // 从机构知识图谱获取数据
    const modules = JSON.parse(localStorage.getItem("sijian_enterprise_modules") || "[]") || []
    const records = JSON.parse(localStorage.getItem("sijian_enterprise_records") || "[]") || []

    if (modules.length === 0) {
      return allLines.slice(0, 6).map((l, i) => ({
        id: l.id, name: l.name, color: l.color,
        stations: [{
          id: `${l.id}_empty`, label: "待培训", x: 100 + i * 200, y: 250,
          r: 6, color: l.color, isHub: false, depth: 0,
          content: "创建培训模块后，这里会展示企业知识分布图",
          lineIds: [l.id],
        }],
      }))
    }

    const cols = 3, colW = 430, rowH = 180, pad = 70

    modules.forEach((mod: any, mi: number) => {
      const col = mi % cols, row = Math.floor(mi / cols)
      const color = allLines[mi % allLines.length]?.color || "#6366F1"

      // 找到该模块的员工完成情况
      let totalMastery = 0, count = 0
      for (const rec of records) {
        const tp = rec.trainings?.find((t: any) => t.trainingModuleId === mod.id)
        if (tp) { totalMastery += tp.overallMastery || 0; count++ }
      }
      const avgMastery = count > 0 ? totalMastery / count : 0.3

      const stations: Station[] = mod.knowledgePoints?.slice(0, 6).map((kp: any, ki: number) => ({
        id: kp.id, label: kp.label?.slice(0, 6) || "知识点",
        x: pad + col * colW + 140 + (ki % 3) * 80,
        y: pad + row * rowH + 100 + Math.floor(ki / 3) * 60,
        r: 5 + avgMastery * 6 + (kp.importance === "critical" ? 2 : 0),
        color: kp.importance === "critical" ? "#EF4444" : kp.importance === "important" ? color : "#9CA3AF",
        isHub: kp.importance === "critical",
        depth: Math.round(avgMastery * 10),
        content: `${kp.label}: ${kp.content?.slice(0, 60) || ""} (${kp.importance === "critical" ? "关键" : kp.importance === "important" ? "重要" : "了解"})`,
        lineIds: [mod.id],
      })) || []

      if (stations.length > 0) {
        lines.push({ id: mod.id, name: mod.name?.slice(0, 12) || "培训", color, stations })
      }
    })
  } catch {}

  if (lines.length === 0) {
    return allLines.slice(0, 6).map((l, i) => ({
      id: l.id, name: l.name, color: l.color,
      stations: [{
        id: `${l.id}_enterprise`, label: "创建培训", x: 100 + i * 200, y: 250,
        r: 8, color: l.color, isHub: true, depth: 0,
        content: "在思维训练中创建培训模块，数据会汇总到这里",
        lineIds: [l.id],
      }],
    }))
  }

  return lines
}

// ═══════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════

export default function MetroMap({ role = "education" }: { role?: "education" | "enterprise" }) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const pan = { x: 0, y: 0 }
  const [viewMode, setViewMode] = useState<"map" | "list">("map")

  const lines = useMemo(() =>
    role === "education" ? generateEduLines() : generateEnterpriseLines(),
  [role])

  const categories = useMemo(() => {
    const cats: Record<string, MetroLine[]> = {}
    for (const l of lines) {
      const cat = l.id.slice(0, 8) || "默认"
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(l)
    }
    return cats
  }, [lines])

  const toggleLine = useCallback((id: string) => {
    setHiddenLines(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  const visibleLines = lines.filter(l => !hiddenLines.has(l.id))
  const totalStations = visibleLines.reduce((s, l) => s + l.stations.length, 0)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0F0F1A] text-[#F1F1F6] font-sans">
      {/* 顶栏 */}
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between border-b border-[#2A2A45] bg-[#1A1A2E]">
        <div>
          <h2 className="text-sm font-bold">
            {role === "education" ? "🎓 学习思维轨迹" : "🏢 企业知识图谱"}
          </h2>
          <p className="text-[10px] text-[#8888A0] mt-0.5">
            {role === "education"
              ? "每个节点都是你学习和思考过的概念"
              : "每个节点都是企业培训体系中已编码的知识"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg p-0.5 bg-[#0F0F1A]">
            <button onClick={() => setViewMode("map")}
              className={`px-3 py-1 text-[11px] rounded-md transition-all ${viewMode === "map" ? "bg-[#2A2A45] text-white" : "text-[#8888A0]"}`}>地图</button>
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-[11px] rounded-md transition-all ${viewMode === "list" ? "bg-[#2A2A45] text-white" : "text-[#8888A0]"}`}>列表</button>
          </div>
          <span className="text-[10px] text-[#8888A0]">{visibleLines.length}线路 · {totalStations}站</span>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="flex-1 relative overflow-hidden">
          {/* 图例 */}
          <div className="absolute left-3 top-3 z-20 rounded-xl border border-[#2A2A45] bg-[#1A1A2E] max-h-[70vh] overflow-y-auto w-48 p-2">
            <div className="text-[10px] font-medium text-[#8888A0] mb-2 px-1">线路图例</div>
            {lines.slice(0, 15).map(l => (
              <button key={l.id} onClick={() => toggleLine(l.id)}
                className="flex items-center gap-2 w-full text-left py-1 px-1 rounded text-xs hover:bg-[#2A2A45]"
                style={{ opacity: hiddenLines.has(l.id) ? 0.3 : 1 }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="truncate">{l.name}</span>
                <span className="ml-auto text-[10px] text-[#8888A0]">{l.stations.length}</span>
              </button>
            ))}
          </div>

          {/* SVG画布 */}
          <svg viewBox="0 0 1400 900" className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            {visibleLines.map(line => {
              const pts = line.stations.map(s => `${s.x},${s.y}`).join(" ")
              return (
                <polyline key={line.id} points={pts} fill="none"
                  stroke={line.color} strokeWidth={1.5} opacity={0.25}
                  strokeLinecap="round" strokeLinejoin="round" />
              )
            })}

            {visibleLines.flatMap(line =>
              line.stations.map(s => (
                <g key={s.id} onClick={() => setSelectedStation(s === selectedStation ? null : s)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} stroke="white" strokeWidth="1.5" />
                  {s.isHub && (
                    <circle cx={s.x} cy={s.y} r={s.r + 6} fill="none" stroke={s.color} strokeWidth="1" opacity={0.3}>
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text x={s.x} y={s.y + s.r + 14} textAnchor="middle" fontSize="9" fill="#8888A0">
                    {s.label}
                  </text>
                </g>
              ))
            )}
          </svg>

          {/* 选中站点详情 */}
          {selectedStation && (
            <div className="absolute right-4 top-16 w-72 rounded-xl border p-4 shadow-2xl z-20 animate-fade-in bg-[#1A1A2E] border-[#2A2A45]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedStation.color }} />
                  <span className="text-sm font-semibold">{selectedStation.label}</span>
                </div>
                <button onClick={() => setSelectedStation(null)} className="text-[#8888A0] text-xs">✕</button>
              </div>
              <p className="text-xs text-[#8888A0] lead-relaxed">{selectedStation.content}</p>
              {selectedStation.isHub && (
                <div className="mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block bg-[#2A2A45] text-[#F1F1F6]">
                  ⭐ 核心节点
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-[#8888A0] mt-2">
                <span>深度 {selectedStation.depth}/10</span>
                <span>半径 {Math.round(selectedStation.r)}px</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 列表视图 */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {visibleLines.map(line => (
            <div key={line.id} className="rounded-xl border border-[#2A2A45] bg-[#1A1A2E] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                <span className="text-sm font-semibold">{line.name}</span>
                <span className="text-[10px] text-[#8888A0]">{line.stations.length}站</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {line.stations.map(s => (
                  <div key={s.id} onClick={() => setSelectedStation(s)}
                    className={`p-2 rounded-lg cursor-pointer text-xs border transition-all ${
                      selectedStation?.id === s.id ? "border-white/40 bg-white/5" : "border-transparent hover:bg-white/5"
                    }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="font-medium">{s.label}</span>
                      {s.isHub && <span className="text-[10px]">⭐</span>}
                    </div>
                    <div className="text-[10px] text-[#8888A0] truncate">{s.content.slice(0, 40)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
