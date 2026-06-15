"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import type { MindNode, MindEdge, FrameType } from "@/lib/types"
import { computeLayout } from "@/lib/layouts/registry"

interface MindMapMiniProps {
  nodes: MindNode[]
  edges: MindEdge[]
  frameType: FrameType
}

export default function MindMapMini({ nodes, edges, frameType }: MindMapMiniProps) {
  const [expanded, setExpanded] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef({ x: 0, y: 0, px: 0, py: 0, active: false })

  const layout = useMemo(() => computeLayout(frameType, nodes, edges), [frameType, nodes, edges])

  const w = expanded ? 600 : 200
  const h = expanded ? 450 : 150
  const scale2d = expanded ? 55 : 18

  const svgNodes = useMemo(() => nodes.map(n => {
    const p = layout.positions[n.id] || { x: 0, y: 0 }
    return {
      ...n,
      x: w / 2 + p.x * scale2d + pan.x,
      y: h / 2 - p.y * scale2d + pan.y,
      shape: layout.shapes[n.id] || n.shape,
    }
  }), [nodes, layout, pan, w, h, scale2d])

  const svgEdges = useMemo(() => edges.map(e => {
    const src = nodes.find(n => n.id === e.source)
    const tgt = nodes.find(n => n.id === e.target)
    if (!src || !tgt) return null
    const sp = src.position || { x: 0, y: 0 }
    const tp = tgt.position || { x: 0, y: 0 }
    return {
      id: e.id, weight: e.weight,
      x1: w / 2 + sp.x * scale2d + pan.x, y1: h / 2 - sp.y * scale2d + pan.y,
      x2: w / 2 + tp.x * scale2d + pan.x, y2: h / 2 - tp.y * scale2d + pan.y,
    }
  }).filter(Boolean) as any[], [edges, nodes, pan, w, h, scale2d])

  const downloadPng = useCallback(() => {
    const svg = document.querySelector("#mindmap-mini-svg") as SVGSVGElement
    if (!svg) return
    const svgStr = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    canvas.width = 1200; canvas.height = 900
    const ctx = canvas.getContext("2d")!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = "#faf8f5"
      ctx.fillRect(0, 0, 1200, 900)
      ctx.drawImage(img, 0, 0, 1200, 900)
      const a = document.createElement("a")
      a.href = canvas.toDataURL("image/png")
      a.download = `mindspace-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)))
  }, [])

  // early return 必须在所有 hooks 之后
  if (nodes.length === 0) return null

  const size = expanded
    ? "w-[600px] h-[450px] top-2 right-2"
    : "w-[200px] h-[150px] top-3 right-3"

  return (
    <div className={`absolute ${size} z-30 rounded-xl bg-white/95 border border-gray-200 shadow-xl backdrop-blur-sm transition-all duration-300 overflow-hidden`}>
      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/80">
        <span className="text-[10px] text-gray-400 font-medium">
          思维地图 · {nodes.length}节点
        </span>
        <div className="flex items-center gap-1">
          {expanded && (
            <>
              <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-500">+</button>
              <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-500">−</button>
              <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }} className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-500">重置</button>
              <button onClick={downloadPng} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-white">下载</button>
            </>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-[10px] px-1.5 py-0.5 rounded hover:bg-gray-100 text-gray-500">
            {expanded ? "折叠" : "展开"}
          </button>
        </div>
      </div>

      <svg
        id="mindmap-mini-svg"
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full"
        style={{ transform: expanded ? `scale(${scale})` : "none", transformOrigin: "top left", cursor: expanded ? "grab" : "default" }}
        onMouseDown={(e) => { if (!expanded) return; dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, active: true } }}
        onMouseMove={(e) => { if (!dragRef.current.active) return; setPan({ x: dragRef.current.px + e.clientX - dragRef.current.x, y: dragRef.current.py + e.clientY - dragRef.current.y }) }}
        onMouseUp={() => { dragRef.current.active = false }}
        onMouseLeave={() => { dragRef.current.active = false }}
      >
        {svgEdges.map(e => (
          <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#ccc" strokeWidth={0.5 + (e.weight || 0) * 0.6} opacity={0.5} />
        ))}

        {svgNodes.map(n => {
          const s = expanded ? 10 : 5
          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              {n.shape === "box" ? <rect x={-s} y={-s} width={s * 2} height={s * 2} rx="1.5" fill={n.color} />
                : n.shape === "cylinder" ? <rect x={-s} y={-s * 0.7} width={s * 2} height={s * 1.4} rx={s} fill={n.color} />
                : n.shape === "torus" ? <circle cx="0" cy="0" r={s} fill="none" stroke={n.color} strokeWidth={s * 0.5} />
                : <circle cx="0" cy="0" r={s} fill={n.color} />}
              {expanded && (
                <text y={s + 9} textAnchor="middle" className="fill-gray-600 text-[7px] font-medium">{n.label}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
