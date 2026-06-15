"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { getAllLines, getLineInfo, ThinkingLineId } from "@/lib/thinking-lines"

interface Station {
  id: string; label: string; x: number; y: number; depth: number
  isTransfer: boolean; isStart: boolean; isEnd: boolean
  connectedLines: string[]; content?: string; thinkingAt?: string
}
interface MetroLine {
  id: string; name: string; category: string; color: string; lightColor: string
  stations: Station[]
  lineStyle: "solid" | "dashed" | "double" | "zigzag" | "curved"
}

function generate60Lines(): MetroLine[] {
  const all = getAllLines()
  const cats = [...new Set(all.map(l => l.category))]
  const W = 1400; const H = 900
  const pad = 50  // reduced padding to fit more stations

  return all.map((line, idx) => {
    const catIdx = cats.indexOf(line.category)
    const col = catIdx % 5
    const row = Math.floor(catIdx / 5)
    const baseX = pad + col * 240 + (idx % 5) * 10
    const baseY = pad + row * 120 + ((idx * 37) % 80)
    // 每条线路4-6个站点，让内容更丰富
    const count = 4 + (idx % 3)  // 4,5,6 交替
    const gap = Math.min(70, 55 - count)  // 站点越多间距稍窄

    // 站点名称不重复，体现真实概念的递进
    const labelSuffixes = ["定义","原理","应用","案例","工具","方法"]
    const stations: Station[] = Array.from({length: count}, (_, si) => ({
      id: line.id + "_s" + (si+1),
      label: line.name.slice(0, 5) + (si < labelSuffixes.length ? labelSuffixes[si] : ""),
      x: baseX + si * gap,
      y: baseY + (si % 2) * 28,
      depth: Math.round((si+1)/count * 10),
      isTransfer: si === Math.floor(count/2) && idx % 3 === 0,
      isStart: si === 0,
      isEnd: si === count-1,
      connectedLines: si === Math.floor(count/2) ? [all[(idx+3)%all.length].id, all[(idx+7)%all.length].id] : [],
      content: line.name + "的" + (si < labelSuffixes.length ? labelSuffixes[si] : "运用") + "——" + line.category + "思维",
    }))
    return {
      id: line.id, name: line.name, category: line.category,
      color: line.color, lightColor: line.gradient[0] || line.color,
      stations,
      lineStyle: (idx % 5 === 0 ? "dashed" : idx % 5 === 1 ? "double" : idx % 5 === 2 ? "zigzag" : idx % 5 === 3 ? "curved" : "solid") as any,
    }
  })
}

const LINES = generate60Lines()

// ---

export default function MetroMap() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [legendOpen, setLegendOpen] = useState(true)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [hoveredStation, setHoveredStation] = useState<string | null>(null)
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [inputText, setInputText] = useState("")
  const svgRef = useRef<SVGSVGElement>(null)

  const viewW = 1400; const viewH = 900

  const toggleLine = useCallback((id: string) => {
    setHiddenLines(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return; e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === "svg") {
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragStart) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragStart])

  const handleMouseUp = useCallback(() => setDragStart(null), [])

  // 换乘站高亮
  const highlightLines = useMemo(() => {
    if (!selectedStation?.isTransfer) return new Set<string>()
    return new Set(selectedStation.connectedLines)
  }, [selectedStation])

  // 线路分类
  const categories = useMemo(() => {
    const cats: Record<string, MetroLine[]> = {}
    for (const l of LINES) { if (!cats[l.category]) cats[l.category] = []; cats[l.category].push(l) }
    return cats
  }, [])

  // 站点形状渲染
  const renderStationShape = (s: Station, color: string, lightColor: string, r: number) => {
    const isHovered = hoveredStation === s.id
    const isSelected = selectedStation?.id === s.id
    const scale = isHovered ? 1.25 : 1
    const actualR = r * scale
    const glow = (s.isStart || s.isEnd) ? { filter: "url(#glow)" } : {}
    const line = LINES.find(l => l.stations.some(st => st.id === s.id))
    const shape = line?.lineStyle === "dashed" ? "diamond" : line?.id === "critical" || line?.id === "trialerror" ? "triangle" : line?.id === "convergent" ? "hexagon" : line?.id === "hypothesis" || line?.id === "qa" ? "question" : "circle"

    const fill = lerpColor(lightColor, color, s.depth / 10)

    switch (shape) {
      case "diamond": return <polygon points={`0,${-actualR} ${actualR},0 0,${actualR} ${-actualR},0`} fill={fill} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} {...glow} />
      case "triangle": return <polygon points={`0,${-actualR} ${actualR},${actualR} ${-actualR},${actualR}`} fill={fill} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} {...glow} />
      case "hexagon": return <polygon points={`0,${-actualR} ${actualR*0.87},${-actualR/2} ${actualR*0.87},${actualR/2} 0,${actualR} ${-actualR*0.87},${actualR/2} ${-actualR*0.87},${-actualR/2}`} fill={fill} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} {...glow} />
      default: return <circle cx={0} cy={0} r={actualR} fill={fill} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} {...glow} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0F0F1A", color: "#F1F1F6", fontFamily: "system-ui, sans-serif" }}>
      {/* 左侧栏 */}
      <div className={`shrink-0 transition-all duration-300 ${sidebarOpen ? "w-[280px]" : "w-[48px]"}`} style={{ background: "#1A1A2E", borderRight: "1px solid #2A2A45" }}>
        <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: "#2A2A45" }}>
          {sidebarOpen && <span className="text-sm font-semibold">📋 历史会话</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity" style={{ background: "#2A2A45", color: "#8888A0" }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        {sidebarOpen && (
          <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-48px)]">
            {["三角函数的学习路径","物理力学的思维梳理","化学平衡的类比理解","生态系统关系分析"].map((title, i) => (
              <div key={i} className="p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity text-xs" style={{ background: i === 0 ? "#2A2A45" : "transparent", color: i === 0 ? "#F1F1F6" : "#8888A0" }}>
                {title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 主画布 */}
      <div className="flex-1 flex flex-col relative" onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* 画布区域 */}
        <div className="flex-1 relative overflow-hidden pb-2">
          <svg ref={svgRef} viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-full"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: "center", cursor: dragStart ? "grabbing" : "grab" }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0F0F1A" floodOpacity="0.5"/></filter>
            </defs>

            {/* 线路路径 */}
            {LINES.map(line => {
              if (hiddenLines.has(line.id)) return null
              const pts = line.stations.map(s => `${s.x},${s.y}`).join(" ")
              const isHL = highlightLines.has(line.id)
              const sw = line.id === "contrast" || line.id === "proscons" ? (isHL ? 3 : 2) : (isHL ? 2.5 : 1.5)
              const op = isHL ? 1 : 0.35
              const dash = line.lineStyle === "dashed" ? "6,3" : line.lineStyle === "zigzag" ? "2,2" : "none"

              return line.lineStyle === "curved" ? (
                <path key={line.id} d={line.stations.map((s,i) => i === 0 ? `M${s.x},${s.y}` : `Q${(line.stations[i-1].x+s.x)/2},${Math.min(line.stations[i-1].y,s.y)-30} ${s.x},${s.y}`).join(" ")}
                  fill="none" stroke={line.color} strokeWidth={sw} opacity={op} strokeDasharray={dash} strokeLinecap="round" />
              ) : (
                <polyline key={line.id} points={pts} fill="none" stroke={line.color} strokeWidth={sw} opacity={op} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" />
              )
            })}

            {/* 换乘站的交汇高亮 */}
            {selectedStation?.isTransfer && selectedStation.connectedLines.map(cl => {
              const tl = LINES.find(l => l.id === cl); if (!tl || hiddenLines.has(cl)) return null
              return <circle key={cl} cx={selectedStation.x} cy={selectedStation.y} r={16} fill="none" stroke={tl.color} strokeWidth="3" opacity={0.6} />
            })}

            {/* 站点 */}
            {LINES.map(line => {
              if (hiddenLines.has(line.id)) return null
              const isHL = highlightLines.has(line.id)
              return line.stations.map(s => (
                <g key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedStation(s === selectedStation ? null : s) }}
                  onMouseEnter={() => setHoveredStation(s.id)} onMouseLeave={() => setHoveredStation(null)}
                  style={{ cursor: "pointer" }}>
                  {renderStationShape(s, isHL ? "#ffffff" : line.color, line.lightColor, s.isStart || s.isEnd ? 9 : s.isTransfer ? 8 : 6)}

                  {/* 标签 — 站点下方 */}
                  <text x={s.x} y={s.y + (s.isStart || s.isEnd ? 22 : s.isTransfer ? 20 : 16)}
                    textAnchor="middle"
                    fontSize={s.isTransfer ? 10 : 9} fill={isHL ? "#ffffff" : "#8888A0"} fontWeight={s.isTransfer ? 600 : 400}
                    fontFamily="system-ui, sans-serif">
                    {s.label}
                  </text>

                  {/* 起点/终点特效 */}
                  {s.isStart && <circle cx={s.x} cy={s.y} r={13} fill="none" stroke={line.color} strokeWidth="1.5" opacity={0.4}><animate attributeName="r" values="9;13;9" dur="2s" repeatCount="indefinite"/></circle>}
                  {s.isEnd && <circle cx={s.x} cy={s.y} r={12} fill="none" stroke={line.lightColor} strokeWidth="1" opacity={0.6}><animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.5s" repeatCount="indefinite"/></circle>}

                  {/* 换乘站标记 */}
                  {s.isTransfer && <circle cx={s.x} cy={s.y} r={14} fill="none" stroke="#F1F1F6" strokeWidth="0.5" opacity={0.3} />}
                </g>
              ))
            })}
          </svg>

          {/* 缩放指示器 */}
          <div className="absolute bottom-4 right-4 text-[10px] px-2 py-1 rounded-lg" style={{ background: "#1A1A2E", color: "#8888A0", border: "1px solid #2A2A45" }}>
            {Math.round(zoom * 100)}% · Ctrl+滚轮缩放
          </div>
        </div>

        {/* 底部输入栏 */}
        <div className="shrink-0 px-4 py-3" style={{ background: "#1A1A2E", borderTop: "1px solid #2A2A45" }}>
          <div className="flex items-center gap-3">
            <input value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="说说你的想法……"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
              style={{ background: "#0F0F1A", color: "#F1F1F6", border: "1px solid #2A2A45" }}
              onKeyDown={e => e.key === "Enter" && setInputText("")} />
            <button className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff" }}>
              发送
            </button>
          </div>
        </div>
      </div>

      {/* 站点详情浮层 */}
      {selectedStation && (() => {
        const line = LINES.find(l => l.stations.some(s => s.id === selectedStation.id))
        return (
          <div className="absolute right-4 top-20 w-72 rounded-xl border p-4 shadow-2xl z-20 animate-fade-in" style={{ background: "#1A1A2E", borderColor: line?.color || "#2A2A45" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line?.color }} />
                <span className="text-sm font-semibold" style={{ color: "#F1F1F6" }}>{selectedStation.label}</span>
              </div>
              <button onClick={() => setSelectedStation(null)} className="text-xs hover:opacity-70" style={{ color: "#8888A0" }}>✕</button>
            </div>
            <div className="text-xs mb-2" style={{ color: "#8888A0" }}>
              {line?.name} · 深度 {selectedStation.depth}/10
              {selectedStation.isTransfer && <span className="ml-2 px-1.5 py-0.5 rounded" style={{ background: "#2A2A45", color: "#F1F1F6" }}>换乘站</span>}
            </div>
            {selectedStation.content && <p className="text-xs leading-relaxed mb-2" style={{ color: "#F1F1F6" }}>{selectedStation.content}</p>}
            {selectedStation.isTransfer && selectedStation.connectedLines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedStation.connectedLines.map(cl => {
                  const tl = LINES.find(l => l.id === cl); if (!tl) return null
                  return <span key={cl} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: tl.color + "20", color: tl.color }}>{tl.name}</span>
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* 图例面板 */}
      <div className={`absolute right-3 top-3 z-20 rounded-xl border transition-all duration-300 ${legendOpen ? "w-56 max-h-[70vh] overflow-y-auto" : "w-auto"}`}
        style={{ background: "#1A1A2E", borderColor: "#2A2A45" }}>
        <button onClick={() => setLegendOpen(!legendOpen)} className="w-full px-3 py-2 text-xs font-medium flex items-center justify-between" style={{ color: "#F1F1F6" }}>
          🗺️ 线路图例 {legendOpen && <span style={{ color: "#8888A0" }}>点击切换显示</span>}
        </button>
        {legendOpen && Object.entries(categories).map(([cat, lines]) => (
          <div key={cat} className="px-3 py-1">
            <div className="text-[10px] font-medium mb-1" style={{ color: "#8888A0" }}>{cat}类</div>
            {lines.map(l => (
              <button key={l.id} onClick={() => toggleLine(l.id)}
                className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg text-xs transition-opacity hover:opacity-80"
                style={{ opacity: hiddenLines.has(l.id) ? 0.3 : 1 }}>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span style={{ color: "#F1F1F6" }}>{l.name}</span>
                <span className="ml-auto text-[10px]" style={{ color: "#8888A0" }}>{l.stations.length}站</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 颜色渐变工具 ─────────────────────────────

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16); const bh = parseInt(b.slice(1), 16)
  const ar = (ah >> 16) & 0xff; const ag = (ah >> 8) & 0xff; const ab = ah & 0xff
  const br = (bh >> 16) & 0xff; const bg = (bh >> 8) & 0xff; const bb = bh & 0xff
  const rr = Math.round(ar + (br - ar) * t); const rg = Math.round(ag + (bg - ag) * t); const rb = Math.round(ab + (bb - ab) * t)
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`
}
