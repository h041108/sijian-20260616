"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { MindNode, MindEdge, Position, FrameType, DomainType } from "@/lib/types"
import { computeLayout, getDefaultFrameType } from "@/lib/layouts/registry"
import type { LayoutResult, TextPlacement } from "@/lib/layouts/registry"

export { getDefaultFrameType }
export type { TextPlacement, LayoutResult }

interface MindSpace2DProps {
  nodes: MindNode[]
  edges: MindEdge[]
  domainType: DomainType
  frameType: FrameType
  onNodeClick: (node: MindNode) => void
  onNodePositionChange: (id: string, position: Position) => void
  onExport: () => void
}

// ─── SVG 形状渲染 ────────────────────────────────

function shapeSvg(shape: string, size: number, color: string, selected: boolean) {
  const s = size
  const glow = selected ? `filter="url(#glow)"` : ""
  const stroke = selected ? `stroke="#333" stroke-width="2"` : ""

  switch (shape) {
    case "sphere":
      return `<circle cx="0" cy="0" r="${s / 2}" fill="${color}" ${glow} ${stroke}/>`
    case "box":
      return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="3" fill="${color}" ${glow} ${stroke}/>`
    case "cylinder":
      return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s / 2}" fill="${color}" ${glow} ${stroke}/>`
    case "torus":
      return `<circle cx="0" cy="0" r="${s / 2}" fill="none" stroke="${color}" stroke-width="${s / 4}" ${glow}/>${selected ? `<circle cx="0" cy="0" r="${s / 2}" fill="none" stroke="#333" stroke-width="2"/>` : ""}`
    default:
      return `<circle cx="0" cy="0" r="${s / 2}" fill="${color}" ${glow} ${stroke}/>`
  }
}

// ─── 主组件 ──────────────────────────────────────

export default function MindSpace2D({
  nodes, edges, domainType, frameType, onNodeClick, onNodePositionChange, onExport,
}: MindSpace2DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [frozenUntil, setFrozenUntil] = useState(0)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 布局计算
  const layout = useMemo(() => computeLayout(frameType, nodes, edges), [frameType, nodes, edges])

  // 将布局位置映射为 SVG 坐标（缩放和平移）
  const svgNodes = useMemo(() => {
    const scale2d = 55 // 1 个单位 = 55px
    const w = 900
    const h = 600
    return nodes.map(n => {
      const p = layout.positions[n.id] || { x: 0, y: 0 }
      return {
        ...n,
        svgX: w / 2 + p.x * scale2d + pan.x,
        svgY: h / 2 - p.y * scale2d + pan.y,  // Y 轴翻转（3D 的 y 增大是向上，SVG 向下）
        shape: layout.shapes[n.id] || n.shape,
      }
    })
  }, [nodes, layout, pan])

  const svgEdges = useMemo(() => {
    const scale2d = 55
    const w = 900
    const h = 600
    return edges.map(e => {
      const src = nodes.find(n => n.id === e.source)
      const tgt = nodes.find(n => n.id === e.target)
      if (!src || !tgt) return null
      const sp = src.position || { x: 0, y: 0 }
      const tp = tgt.position || { x: 0, y: 0 }
      return {
        ...e,
        x1: w / 2 + sp.x * scale2d + pan.x,
        y1: h / 2 - sp.y * scale2d + pan.y,
        x2: w / 2 + tp.x * scale2d + pan.x,
        y2: h / 2 - tp.y * scale2d + pan.y,
      }
    }).filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number; weight?: number }[]
  }, [edges, nodes, pan])

  const handleNodeClick = useCallback((node: MindNode) => {
    setSelectedId(node.id)
    setFrozenUntil(Date.now() + 5000)
    onNodeClick(node)
  }, [onNodeClick])

  const handleCanvasClick = useCallback(() => {
    setSelectedId(null)
    setFrozenUntil(Date.now() + 5000)
  }, [])

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(prev => Math.max(0.3, Math.min(2.5, prev - e.deltaY * 0.001)))
  }, [])

  // 中键/空白区域拖拽平移
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).closest("svg")) {
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY, nodeX: pan.x, nodeY: pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || dragNodeId) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({ x: dragStart.current.nodeX + dx, y: dragStart.current.nodeY + dy })
  }, [dragging, dragNodeId])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    setDragNodeId(null)
  }, [])

  // 节点拖拽
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const svgNode = svgNodes.find(n => n.id === nodeId)
    if (!svgNode) return
    setDragNodeId(nodeId)
    dragStart.current = { x: e.clientX, y: e.clientY, nodeX: svgNode.svgX, nodeY: svgNode.svgY }
  }, [svgNodes])

  const handleNodeMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragNodeId) return
    e.stopPropagation()
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const newPan = { x: pan.x + dx, y: pan.y + dy }
    setPan(newPan)
    dragStart.current = { x: e.clientX, y: e.clientY, nodeX: dragStart.current.nodeX, nodeY: dragStart.current.nodeY }
  }, [dragNodeId, pan])

  // 冻结倒计时
  const frozen = frozenUntil > Date.now()
  const [freezeSeconds, setFreezeSeconds] = useState(0)

  useEffect(() => {
    if (!frozen) { setFreezeSeconds(0); return }
    const tick = setInterval(() => {
      const r = Math.ceil((frozenUntil - Date.now()) / 1000)
      if (r <= 0) { setFreezeSeconds(0); clearInterval(tick) } else setFreezeSeconds(r)
    }, 200)
    return () => clearInterval(tick)
  }, [frozen, frozenUntil])

  // 空状态
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-[#b8d8e8] m-2 flex items-center justify-center" style={{ background: "#e8f4f8" }}>
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
            <span className="text-3xl opacity-25">✦</span>
          </div>
          <p className="text-[15px] font-medium text-gray-600">思维空间为空</p>
          <p className="text-[13px] text-gray-500 max-w-[220px] leading-relaxed">
            在右侧说出你的想法，AI会在左侧展示思维空间
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden border border-[#e8e5df] m-2 bg-[#faf8f5] relative"
      onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleNodeMouseMove || handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
    >
      {/* 冻结倒计时覆盖层 */}
      {freezeSeconds > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-fade-in pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>静止视图 · {freezeSeconds}秒</span>
          <span className="text-white/40 text-[10px]">滚轮缩放可用</span>
        </div>
      )}

      {/* 工具栏 */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-1 rounded-lg border border-gray-200">
          {frameType} · {domainType}
        </span>
        <button onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
          className="text-xs text-gray-500 hover:text-gray-800 bg-white/80 hover:bg-white px-2 py-1 rounded-lg border border-gray-200 transition-all">
          +
        </button>
        <button onClick={() => setScale(s => Math.max(0.3, s - 0.15))}
          className="text-xs text-gray-500 hover:text-gray-800 bg-white/80 hover:bg-white px-2 py-1 rounded-lg border border-gray-200 transition-all">
          −
        </button>
        <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }}
          className="text-xs text-gray-500 hover:text-gray-800 bg-white/80 hover:bg-white px-2 py-1 rounded-lg border border-gray-200 transition-all">
          重置
        </button>
      </div>

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        viewBox="0 0 900 600"
        className="w-full h-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "center", transition: dragging ? "none" : "transform 0.2s ease" }}
        onClick={handleCanvasClick}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.4" result="color"/>
            <feMerge><feMergeNode in="color"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#999" />
          </marker>
        </defs>

        {/* 边 / 连线 */}
        {svgEdges.map(e => (
          <line
            key={e.id}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#b0b0b0" strokeWidth={0.8 + (e.weight || 0) * 1.2}
            strokeDasharray={e.weight && e.weight > 0.7 ? "none" : "4,2"}
            opacity={0.6}
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* 节点 */}
        {svgNodes.map(n => (
          <g
            key={n.id}
            transform={`translate(${n.svgX}, ${n.svgY})`}
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); handleNodeClick(n) }}
            onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
          >
            {/* 选中光环 */}
            {selectedId === n.id && (
              <circle cx="0" cy="0" r="24" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="4,2" opacity="0.4" />
            )}

            {/* 形状 */}
            <g dangerouslySetInnerHTML={{ __html: shapeSvg(n.shape, 28, n.color, selectedId === n.id) }} />

            {/* 标签 */}
            <text
              y={layout.textPlacement === "below" ? 24 : layout.textPlacement === "above" ? -18 : layout.textPlacement === "side" ? 0 : -18}
              x={layout.textPlacement === "side" ? 22 : 0}
              textAnchor={layout.textPlacement === "side" ? "start" : "middle"}
              className="text-[11px] font-medium fill-gray-700"
              style={{ textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}
            >
              {n.label}
            </text>

            {/* 应用锚点 */}
            {n.anchors?.map((a, ai) => {
              const ax = (ai - (n.anchors.length - 1) / 2) * 70
              const ay = 42
              return (
                <g key={a.id} transform={`translate(${ax}, ${ay})`}>
                  <rect x="-38" y="-2" width="76" height="28" rx="4" fill="#f8f6f0" stroke="#e0d8c0" strokeWidth="1" opacity={0.9} />
                  <text y="7" textAnchor="middle" className="fill-gray-600 text-[9px] font-medium">
                    📍 {a.label}
                  </text>
                  <text y="18" textAnchor="middle" className="fill-gray-400 text-[8px]">
                    {(a.parameters || "").slice(0, 18)}
                  </text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>

      {/* 导出按钮 */}
      <button onClick={onExport}
        className="absolute bottom-4 right-4 z-10 text-xs text-gray-600 hover:text-[#5b5f97] bg-white/90 hover:bg-white px-3 py-1.5 rounded-xl border border-[#b8d8e8] shadow-sm transition-all">
        导出思维空间
      </button>
    </div>
  )
}
