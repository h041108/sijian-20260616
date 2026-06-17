"use client"

import { useMemo, useState, useCallback } from "react"
import type { MindNode, MindEdge, Position, FrameType, DomainType } from "@/lib/types"
import { getLineInfo, ThinkingLineId } from "@/lib/thinking-lines"

interface MindTransitProps {
  nodes: MindNode[]
  edges: MindEdge[]
  domainType?: DomainType
  frameType?: FrameType
  onNodeClick?: (node: MindNode) => void
  onNodePositionChange?: (id: string, position: Position) => void
  onExport?: () => void
  thinkingLines?: { lineId: string; confidence: number; triggers: string[] }[]
}

const LINE_COLORS = [
  "#E53E3E","#D53F8C","#805AD5","#4C51BF",
  "#3182CE","#00B5D8","#319795","#38A169",
  "#D69E2E","#ED8936","#DD6B20","#8B4513",
  "#553C9A","#68D391","#F6E05E","#9AE6B4",
]

const FRAME_LABELS: Record<string, string> = {
  tree: "🌳 层级树", network: "🕸️ 关系网", helix: "🧬 双螺旋",
  strata: "📐 分层图", orbital: "🪐 轨道图", pipeline: "🔗 流程图",
  lens: "🔍 透镜图", cycle: "🔄 循环图", spectrum: "🌈 光谱图",
  matrix: "📊 矩阵图", diffusion: "💧 扩散图",
}

interface Station { x: number; y: number; color: string; layer?: number }

// ═══════════════════════════════════════════════════
// 11 种框架感知布局
// ═══════════════════════════════════════════════════

function computeStations(
  nodes: MindNode[], edges: MindEdge[], frame: string,
  thinkingLines?: { lineId: string; confidence: number }[],
): { stations: Record<string, Station>; svgW: number; svgH: number; mainColor: string; arcPaths: { source: string; target: string; path: string }[] } {
  const count = nodes.length
  if (count === 0) return { stations: {}, svgW: 600, svgH: 400, mainColor: "#6366F1", arcPaths: [] }

  const mainColor = thinkingLines?.[0] ? (getLineInfo(thinkingLines[0].lineId as ThinkingLineId)?.color || "#6366F1") : LINE_COLORS[0]
  const stations: Record<string, Station> = {}
  const arcPaths: { source: string; target: string; path: string }[] = []
  let svgW = 700, svgH = 460

  switch (frame) {

    // ── 1. tree: 自上而下层级树 ──
    case "tree": {
      const byDepth: Record<number, MindNode[]> = {}
      for (const n of nodes) { const d = n.depth ?? 0; if (!byDepth[d]) byDepth[d] = []; byDepth[d].push(n) }
      const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b)
      const maxLayer = Math.max(2, depths.length)
      const w = 2000, h = 1500
      const padT = 200, padB = 260, padX = 200
      svgW = w; svgH = h
      for (const d of depths) {
        const layer = byDepth[d]
        const y = padT + (d / Math.max(maxLayer - 1, 1)) * (h - padT - padB)
        const gx = (count: number, i: number) => padX + ((i + 1) / (count + 1)) * (w - padX * 2)
        layer.forEach((n, i) => {
          stations[n.id] = { x: gx(layer.length, i), y, color: n.color || LINE_COLORS[d % LINE_COLORS.length], layer: d }
        })
        // Connect parent→child with curved lines
        if (d > 0) {
          const parentLayer = byDepth[depths[depths.indexOf(d) - 1]]
          for (const child of layer) {
            const parents = child.parentIds?.map(pid => parentLayer.find(p => p.id === pid)).filter(Boolean) || []
            if (parents.length === 0 && parentLayer.length > 0) {
              // Auto-connect to nearest parent
              const parent = parentLayer[Math.floor((layer.indexOf(child) / layer.length) * parentLayer.length)]
              arcPaths.push({ source: parent.id, target: child.id, path: "" })
            }
          }
        }
      }
      break
    }

    // ── 2. network: 力导向图(环形分布) ──
    case "network": {
      const cx = 960, cy = 660, r = Math.min(600, 180 + count * 55)
      nodes.forEach((n, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2
        stations[n.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, color: n.color || LINE_COLORS[i % LINE_COLORS.length] }
      })
      // Edge arcs
      for (const e of edges) {
        if (stations[e.source] && stations[e.target]) {
          arcPaths.push({ source: e.source, target: e.target, path: "" })
        }
      }
      svgW = 2000; svgH = 1500
      break
    }

    // ── 3. helix: 双螺旋交错 ──
    case "helix": {
      const cx = 960, cy = 700
      for (let i = 0; i < count; i++) {
        const isStrandA = i % 2 === 0
        const t = i / Math.max(count - 1, 1)
        const angle = t * Math.PI * 4 - Math.PI / 2
        const radius = 180 + t * 550
        const offsetY = isStrandA ? -30 : 30
        stations[nodes[i].id] = {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * Math.max(radius * 0.3, 20) + offsetY,
          color: isStrandA ? mainColor : LINE_COLORS[2],
        }
      }
      svgW = 2000; svgH = 1540
      break
    }

    // ── 4. strata: 水平分层 ──
    case "strata": {
      const byDepth: Record<number, MindNode[]> = {}
      for (const n of nodes) {
        const d = n.depth ?? 0
        if (!byDepth[d]) byDepth[d] = []
        byDepth[d].push(n)
      }
      const depthKeys = Object.keys(byDepth).map(Number).sort((a, b) => a - b)
      const maxD = Math.max(3, depthKeys.length)
      const padX = 200, padB = 240
      svgW = 2000; svgH = Math.max(1300, maxD * 120 + padB)
      let yi = 0
      const allDepths = new Set<number>()
      for (let d = 0; d < maxD; d++) allDepths.add(d)
      const layers = Array.from(allDepths).sort((a, b) => a - b)
      for (const d of layers) {
        const layerNodes = byDepth[d] || []
        const y = 190 + ((yi) / Math.max(layers.length - 1, 1)) * (svgH - 50 - padB)
        if (layerNodes.length > 0) {
          layerNodes.forEach((n, j) => {
            const gap = Math.min(400, (svgW - padX * 2) / Math.max(layerNodes.length, 1))
            stations[n.id] = {
              x: padX + gap * (j + 0.5),
              y,
              color: LINE_COLORS[d % LINE_COLORS.length],
              layer: d,
            }
          })
        } else {
          // empty layer: draw a faint band
          const ghostId = `ghost_${d}`
          stations[ghostId] = { x: svgW / 2, y, color: "#e0e0e0", layer: d }
        }
        yi++
      }
      break
    }

    // ── 5. orbital: 同心轨道 ──
    case "orbital": {
      const cx = 960, cy = 660
      const orbits = Math.min(count, Math.ceil(count / 3) || 1)
      const orbitRadii: number[] = []
      for (let o = 0; o < orbits; o++) orbitRadii.push(220 + o * 170)

      // Distribute nodes across orbits
      let ni = 0
      for (let o = 0; o < orbits && ni < count; o++) {
        const nodesInOrbit = o < orbits - 1 ? Math.min(3, count - ni) : count - ni
        for (let j = 0; j < nodesInOrbit && ni < count; j++, ni++) {
          const angle = (j / Math.max(nodesInOrbit, 1)) * Math.PI * 2 - Math.PI / 2
          const n = nodes[ni]
          stations[n.id] = {
            x: cx + Math.cos(angle) * orbitRadii[o],
            y: cy + Math.sin(angle) * orbitRadii[o],
            color: n.color || LINE_COLORS[o % LINE_COLORS.length],
          }
        }
      }
      svgW = 2000; svgH = 1540
      break
    }

    // ── 6. pipeline: 从左到右流程 ──
    case "pipeline": {
      const padX = 260, padY = 550
      svgW = Math.max(2000, padX * 2 + count * 400)
      svgH = 1400
      nodes.forEach((n, i) => {
        const yOffset = i % 2 === 1 ? 40 : -20
        stations[n.id] = {
          x: padX + (i / Math.max(count - 1, 1)) * (svgW - padX * 2),
          y: padY + yOffset,
          color: n.color || LINE_COLORS[i % LINE_COLORS.length],
        }
      })
      break
    }

    // ── 7. lens: 中心聚焦 ⟶ 外围在弧上 ──
    case "lens": {
      const cx = 960, cy = 660
      if (count === 1) {
        stations[nodes[0].id] = { x: cx, y: cy, color: nodes[0].color || mainColor }
      } else {
        // First node is the "lens center"
        stations[nodes[0].id] = { x: cx, y: cy, color: nodes[0].color || mainColor }
        const rest = count - 1
        const r = Math.min(600, 310 + rest * 64)
        for (let i = 0; i < rest; i++) {
          const angle = (i / rest) * Math.PI * 1.2 - Math.PI * 1.1
          const n = nodes[i + 1]
          stations[n.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, color: n.color || LINE_COLORS[(i + 2) % LINE_COLORS.length] }
        }
      }
      svgW = 2000; svgH = 1500
      break
    }

    // ── 8. cycle: 环形循环 ──
    case "cycle": {
      const cx = 960, cy = 660, r = Math.min(600, 240 + count * 40)
      nodes.forEach((n, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2
        stations[n.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, color: n.color || LINE_COLORS[i % LINE_COLORS.length] }
      })
      // Connect in cycle order
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count
        arcPaths.push({ source: nodes[i].id, target: nodes[next].id, path: "" })
      }
      svgW = 2000; svgH = 1540
      break
    }

    // ── 9. spectrum: 水平连续谱 ──
    case "spectrum": {
      const padX = 250, padY = 580
      svgW = Math.max(2000, count * 380 + padX * 2)
      svgH = 1400
      nodes.forEach((n, i) => {
        const ySpread = Math.sin((i / Math.max(count - 1, 1)) * Math.PI * 2) * 100
        stations[n.id] = {
          x: padX + (i / Math.max(count - 1, 1)) * (svgW - padX * 2),
          y: padY + ySpread,
          color: n.color || LINE_COLORS[i % LINE_COLORS.length],
        }
      })
      break
    }

    // ── 10. matrix: 网格矩阵 ──
    case "matrix": {
      const cols = Math.min(count, Math.ceil(Math.sqrt(count)))
      const rows = Math.ceil(count / cols)
      const cellW = Math.min(440, 1900 / cols)
      const cellH = Math.min(350, 1260 / rows)
      svgW = Math.max(2000, cols * cellW + 220)
      svgH = Math.max(1400, rows * cellH + 240)
      nodes.forEach((n, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        stations[n.id] = {
          x: 50 + col * cellW + cellW / 2,
          y: 50 + row * cellH + cellH / 2,
          color: n.color || LINE_COLORS[(row + col) % LINE_COLORS.length],
        }
      })
      break
    }

    // ── 11. diffusion: 中心扩散涟漪 ──
    case "diffusion": {
      const cx = 960, cy = 700
      if (count === 1) {
        stations[nodes[0].id] = { x: cx, y: cy, color: nodes[0].color || mainColor }
      } else {
        // Center node
        stations[nodes[0].id] = { x: cx, y: cy, color: nodes[0].color || mainColor }
        const rest = count - 1
        // Distribute remaining nodes in 2-3 ripple rings
        const ringCapacities = [3, 5, 7]
        let placed = 0
        for (let ring = 0; ring < ringCapacities.length && placed < rest; ring++) {
          const ringCount = Math.min(ringCapacities[ring], rest - placed)
          const radius = 310 + ring * 210
          for (let j = 0; j < ringCount && placed < rest; j++, placed++) {
            const angle = (j / ringCount) * Math.PI * 2 - Math.PI / 2
            const n = nodes[placed + 1]
            stations[n.id] = {
              x: cx + Math.cos(angle) * radius,
              y: cy + Math.sin(angle) * radius,
              color: LINE_COLORS[(ring + 3) % LINE_COLORS.length],
            }
          }
        }
      }
      svgW = 2000; svgH = 1540
      break
    }

    // ── default: 网格 fallback ──
    default: {
      const cols = Math.ceil(Math.sqrt(count))
      nodes.forEach((n, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        stations[n.id] = {
          x: 260 + col * 440 + (row % 2) * 70,
          y: 220 + row * 270,
          color: n.color || LINE_COLORS[i % LINE_COLORS.length],
        }
      })
      svgW = 2000; svgH = 1500
    }
  }

  return { stations, svgW, svgH, mainColor, arcPaths }
}

// ═══════════════════════════════════════════════════
// Edge path generator
// ═══════════════════════════════════════════════════

function edgePath(x1: number, y1: number, x2: number, y2: number, frame: string): string {
  const midX = (x1 + x2) / 2
  switch (frame) {
    case "tree":
      // Branch-like curve: first go down vertically, then connect
      return `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`
    case "network":
      return `M${x1},${y1} Q${midX},${Math.min(y1, y2) - 30} ${x2},${y2}`
    case "pipeline":
      return `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`
    default:
      return `M${x1},${y1} L${x2},${y2}`
  }
}

// ═══════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════

export default function MindTransit({
  nodes, edges, domainType, frameType = "tree",
  onNodeClick, onExport, thinkingLines,
}: MindTransitProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const frame = frameType || "tree"

  const { stations, svgW, svgH, mainColor, arcPaths } = useMemo(
    () => computeStations(nodes, edges, frame, thinkingLines),
    [nodes, edges, frame, thinkingLines],
  )

  // Edges with explicit stations
  const edgeSegments = useMemo(() => {
    // First: explicit edges from data
    const explicit = edges
      .filter(e => stations[e.source] && stations[e.target])
      .map(e => {
        const s = stations[e.source], t = stations[e.target]
        return { x1: s.x, y1: s.y, x2: t.x, y2: t.y, color: s.color, weight: e.weight || 0.6, frame }
      })
    // Second: implicit edges from arcPaths (layout-generated connections)
    const implicit = arcPaths
      .filter(a => stations[a.source] && stations[a.target])
      .map(a => {
        const s = stations[a.source], t = stations[a.target]
        return { x1: s.x, y1: s.y, x2: t.x, y2: t.y, color: mainColor, weight: 0.5, frame }
      })
    return [...explicit, ...implicit]
  }, [edges, stations, arcPaths, mainColor, frame])

  const handleNodeClick = useCallback((n: MindNode) => {
    setSelectedId(n.id)
    onNodeClick?.(n)
  }, [onNodeClick])

  const activeLine = thinkingLines?.[0]
  const activeLineInfo = activeLine ? getLineInfo(activeLine.lineId as ThinkingLineId) : null

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full rounded-xl border border-[#e8e5df] bg-[#faf8f5] flex items-center justify-center m-2">
        <div className="text-center text-gray-400 text-sm">
          <div className="text-3xl mb-2 opacity-20">🚇</div>
          <p>思维轨道为空</p>
          <p className="text-xs text-gray-300 mt-1">开始对话，AI 会将你的思维可视化</p>
        </div>
      </div>
    )
  }

  const dotR = nodes.length <= 4 ? 72 : nodes.length <= 8 ? 56 : 44
  const labelSize = nodes.length <= 4 ? 48 : nodes.length <= 8 ? 40 : 34

  // Decorative background elements per frame
  const showRipples = frame === "diffusion"
  const showOrbits = frame === "orbital"
  const showGrid = frame === "matrix"
  const showStrata = frame === "strata"
  const showSpectrum = frame === "spectrum"

  return (
    <div className="w-full h-full rounded-xl border border-[#e8e5df] bg-white overflow-hidden relative m-2">
      {/* ── 顶部信息栏 ── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium text-gray-500">
          {FRAME_LABELS[frame] || "🚇 思维图"}
        </span>
        <span className="text-[10px] text-gray-300">{nodes.length}节点 · {edgeSegments.length}连线</span>
        {activeLineInfo && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: activeLineInfo.color + "18", color: activeLineInfo.color }}>
            {activeLineInfo.icon} {activeLineInfo.name}
          </span>
        )}
        {domainType && domainType !== "general" && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {domainType}
          </span>
        )}
      </div>

      {onExport && (
        <button onClick={onExport}
          className="absolute top-3 right-3 z-10 text-xs text-gray-400 hover:text-gray-600 bg-white/90 px-2.5 py-1 rounded-lg border border-gray-200">
          导出
        </button>
      )}

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" key={animKey}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
          {showRipples && Array.from({ length: 3 }).map((_, i) => (
            <radialGradient key={i} id={`ripple${i}`} cx="50%" cy="50%" r="50%">
              <stop offset={`${60 + i * 15}%`} stopColor={mainColor} stopOpacity={0.06} />
              <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* ── 装饰性背景 ── */}

        {/* Diffusion ripples */}
        {showRipples && stations[nodes[0]?.id] && (
          Array.from({ length: 3 }).map((_, i) => (
            <circle key={i} cx={stations[nodes[0].id].x} cy={stations[nodes[0].id].y}
              r={80 + i * 70} fill={`url(#ripple${i})`} />
          ))
        )}

        {/* Orbital rings */}
        {showOrbits && (() => {
          const orbits = new Set<number>()
          const cx = stations[nodes[0]?.id]?.x || 680
          const cy = stations[nodes[0]?.id]?.y || 460
          for (const s of Object.values(stations)) {
            const dist = Math.round(Math.sqrt((s.x - cx) ** 2 + (s.y - cy) ** 2) / 70) * 70
            if (dist > 10) orbits.add(dist)
          }
          return Array.from(orbits).map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth="1.5" opacity={0.12} strokeDasharray="8,6" />
          ))
        })()}

        {/* Strata background bands */}
        {showStrata && Array.from(new Set(Object.values(stations).map(s => s.layer).filter(Boolean))).map(layer => {
          const layerStations = Object.values(stations).filter(s => s.layer === layer)
          if (layerStations.length === 0) return null
          const ys = layerStations.map(s => s.y)
          const minY = Math.min(...ys) - 30, maxY = Math.max(...ys) + 30
          return (
            <rect key={layer} x={20} y={minY} width={svgW - 40} height={maxY - minY}
              fill={LINE_COLORS[(layer || 0) % LINE_COLORS.length]} opacity={0.04} rx="12" />
          )
        })}

        {/* Grid background */}
        {showGrid && (() => {
          const result: Array<React.ReactNode> = []
          const cellW = 130, cellH = 100
          for (let x = 40; x < svgW; x += cellW) {
            result.push(<line key={`gv${x}`} x1={x} y1={30} x2={x} y2={svgH - 30} stroke="#e8e5df" strokeWidth="0.5" />)
          }
          for (let y = 40; y < svgH; y += cellH) {
            result.push(<line key={`gh${y}`} x1={30} y1={y} x2={svgW - 20} y2={y} stroke="#e8e5df" strokeWidth="0.5" />)
          }
          return result
        })()}

        {/* Spectrum background gradient bar */}
        {showSpectrum && (
          <defs>
            <linearGradient id="spectrumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              {LINE_COLORS.slice(0, 8).map((c, i) => (
                <stop key={i} offset={`${(i / 7) * 100}%`} stopColor={c} stopOpacity="0.12" />
              ))}
            </linearGradient>
          </defs>
        )}
        {showSpectrum && (
          <rect x={40} y={svgH / 2 - 20} width={svgW - 80} height={40} fill="url(#spectrumGrad)" rx="20" />
        )}

        {/* ── 连线 ── */}
        {edgeSegments.map((seg, si) => (
          <line key={si}
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            stroke={seg.color}
            strokeWidth={1.5 + seg.weight * 2}
            opacity={0.25}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        ))}

        {/* ── 节点 ── */}
        {Object.entries(stations).map(([id, st]) => {
          const node = nodes.find(n => n.id === id)
          if (!node) {
            // Ghost node (e.g. empty strata layer): render as faint label
            return (
              <g key={id}>
                <text x={st.x} y={st.y} textAnchor="middle" fontSize="9" fill="#d0d0d0" fontStyle="italic">
                  —
                </text>
              </g>
            )
          }
          const isSelected = selectedId === id
          const r = isSelected ? dotR + 4 : dotR

          // Shape rendering per node
          const shape = node.shape || "sphere"

          return (
            <g key={id} onClick={() => handleNodeClick(node)}
              style={{ cursor: "pointer" }}
              filter={isSelected ? "url(#shadow)" : undefined}
              className="transition-all duration-300"
            >
              {/* Hover / selected ring */}
              {isSelected && (
                <circle cx={st.x} cy={st.y} r={r + 8} fill="none" stroke={st.color} strokeWidth="2" opacity={0.18} />
              )}

              {/* Node body — shape-aware */}
              {shape === "box" ? (
                <rect x={st.x - r * 0.8} y={st.y - r * 0.8} width={r * 1.6} height={r * 1.6}
                  rx={r * 0.3} fill={st.color} stroke="white" strokeWidth="2.5" />
              ) : shape === "cylinder" ? (
                <>
                  <rect x={st.x - r * 0.7} y={st.y - r * 0.9} width={r * 1.4} height={r * 1.8}
                    rx={r * 0.7} fill={st.color} stroke="white" strokeWidth="2.5" />
                  <ellipse cx={st.x} cy={st.y - r * 0.9} rx={r * 0.7} ry={r * 0.25} fill="white" opacity="0.3" />
                </>
              ) : shape === "torus" ? (
                <>
                  <circle cx={st.x} cy={st.y} r={r} fill={st.color} stroke="white" strokeWidth="2.5" />
                  <circle cx={st.x} cy={st.y} r={r * 0.45} fill="white" />
                  <circle cx={st.x} cy={st.y} r={r * 0.4} fill={st.color} opacity="0.6" />
                </>
              ) : (
                // sphere (default)
                <>
                  <circle cx={st.x} cy={st.y} r={r} fill={st.color} stroke="white" strokeWidth="2.5" />
                  <circle cx={st.x - r * 0.25} cy={st.y - r * 0.25} r={r * 0.28} fill="white" opacity="0.35" />
                </>
              )}

              {/* Label */}
              <text x={st.x} y={st.y + r + labelSize + 3}
                textAnchor="middle" fontSize={labelSize} fontWeight="600"
                fill={isSelected ? "#111" : "#333"} fontFamily="system-ui, sans-serif">
                {node.label?.slice(0, 12)}
              </text>

              {/* Anchor badge */}
              {node.anchors && node.anchors.length > 0 && (
                <>
                  <circle cx={st.x + r - 2} cy={st.y - r + 2} r={4.5} fill="#22c55e" stroke="white" strokeWidth="1.5" />
                  <text x={st.x + r - 2} y={st.y - r + 2} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold" dy="0.5">📍</text>
                </>
              )}
            </g>
          )
        })}

        {/* ── 图例 ── */}
        {thinkingLines && thinkingLines.length > 0 && (
          <g transform={`translate(${svgW - 160}, 10)`}>
            <rect x="0" y="0" width="148" height={24 + Math.min(thinkingLines.length, 3) * 22} rx="8"
              fill="white" fillOpacity="0.92" stroke="#e8e5df" />
            <text x="10" y="16" fontSize="10" fill="#888" fontWeight="600">思维线路</text>
            {thinkingLines.slice(0, 3).map((tl, i) => {
              const inf = getLineInfo(tl.lineId as ThinkingLineId)
              if (!inf) return null
              return (
                <g key={tl.lineId} transform={`translate(10, ${28 + i * 22})`}>
                  <rect x="0" y="0" width="8" height="14" rx="3" fill={inf.color} />
                  <text x="12" y="11" fontSize="9" fill="#444">{inf.icon} {inf.name}</text>
                  <text x="100" y="11" fontSize="8" fill="#aaa">{Math.round(tl.confidence * 100)}%</text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
