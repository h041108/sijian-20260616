"use client"

import { useRef, useCallback, useState, useMemo, Suspense, useEffect } from "react"
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Html, Line, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import type { MindNode, MindEdge, Position, FrameType, DomainType } from "@/lib/types"
import { computeLayout, getDefaultFrameType } from "@/lib/layouts/registry"
import type { LayoutResult, TextPlacement } from "@/lib/layouts/registry"

export { getDefaultFrameType }
export type { TextPlacement, LayoutResult }

// ─── Props ──────────────────────────────────────────

interface MindSpace3DProps {
  nodes: MindNode[]
  edges: MindEdge[]
  domainType: DomainType
  frameType: FrameType
  onNodeClick: (node: MindNode) => void
  onNodePositionChange: (id: string, position: Position) => void
  onExport: () => void
}

// ─── 冻结倒计时覆盖层 ──────────────────────────────

function FreezeOverlay({ frozenUntil, onUnfreeze }: { frozenUntil: number; onUnfreeze: () => void }) {
  const [remaining, setRemaining] = useState(5)

  useEffect(() => {
    const tick = setInterval(() => {
      const r = Math.ceil((frozenUntil - Date.now()) / 1000)
      if (r <= 0) { setRemaining(0); clearInterval(tick); onUnfreeze() } else setRemaining(r)
    }, 200)
    return () => clearInterval(tick)
  }, [frozenUntil, onUnfreeze])

  if (remaining <= 0) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-fade-in pointer-events-none">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>平面视图 · {remaining}秒</span>
      <span className="text-white/40 text-[10px]">滚轮缩放可用</span>
    </div>
  )
}

// ─── 场景灯光 ──────────────────────────────────────

function SceneLights({ index }: { index: number }) {
  const configs = [
    { amb: "#ffffff", ambI: 0.55, p1: [12, 10, 12] as [number, number, number], p1I: 1.0, p1C: "#ffffff", p2: [-10, -6, -8] as [number, number, number], p2I: 0.35, p2C: "#aaccff" },
    { amb: "#f0e8d8", ambI: 0.6, p1: [10, 12, 10] as [number, number, number], p1I: 1.0, p1C: "#ffe8d0", p2: [-8, -6, -8] as [number, number, number], p2I: 0.4, p2C: "#e0c8a0" },
    { amb: "#e0e8f0", ambI: 0.55, p1: [12, 10, 12] as [number, number, number], p1I: 1.0, p1C: "#ffffff", p2: [-10, -6, -8] as [number, number, number], p2I: 0.4, p2C: "#aabbdd" },
  ]
  const c = configs[index % 3]
  return (
    <>
      <ambientLight intensity={c.ambI} color={c.amb} />
      <pointLight position={c.p1} intensity={c.p1I} color={c.p1C} />
      <pointLight position={c.p2} intensity={c.p2I} color={c.p2C} />
    </>
  )
}

// ─── 场景 ──────────────────────────────────────────

function Scene({
  nodes, edges, selectedId, domainType, frameType, frozen,
  onNodeClick, onPositionChange, onCanvasClick,
}: {
  nodes: MindNode[]; edges: MindEdge[]; selectedId: string | null
  domainType: DomainType; frameType: FrameType; frozen: boolean
  onNodeClick: (node: MindNode) => void; onPositionChange: (id: string, pos: Position) => void
  onCanvasClick: () => void
}) {
  const layout = useMemo(() => computeLayout(frameType, nodes, edges), [frameType, nodes, edges])

  const style = useMemo(() => ({
    nodeEmissiveIntensity: 0.25, nodeRoughness: 0.3, nodeMetalness: 0.1,
    edgeColor: "#8888aa", edgeOpacity: 0.5,
  }), [])

  return (
    <>
      <color attach="background" args={["#e8f4f8"]} />
      <SceneLights index={frameType.length % 3} />
      <PerspectiveCamera makeDefault position={[layout.cameraPos.x, layout.cameraPos.y, layout.cameraPos.z]} fov={50} />

      {/* OrbitControls：冻结时禁用旋转+平移，缩放始终启用 */}
      <OrbitControls
        enablePan={!frozen}
        enableZoom
        enableRotate={!frozen}
        minDistance={2}
        maxDistance={20}
        target={[layout.cameraTarget.x, layout.cameraTarget.y, layout.cameraTarget.z]}
      />

      {/* 背景板：捕获点击空白区域触发冻结 */}
      <mesh
        onPointerDown={(e) => { e.stopPropagation(); onCanvasClick() }}
        position={[0, -4, -2]}
        raycast={() => {}}
      >
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#e8f4f8" transparent opacity={0.01} depthWrite={false} />
      </mesh>

      {edges.map(e => <EdgeLine key={e.id} edge={e} nodes={nodes} style={style} />)}
      {nodes.map(n => (
        <NodeMesh key={n.id} node={n} isSelected={selectedId === n.id} style={style} layout={layout}
          onClick={() => onNodeClick(n)} onPositionChange={(pos) => onPositionChange(n.id, pos)}
          onFreeze={() => onCanvasClick()} />
      ))}
    </>
  )
}

// ─── 节点渲染 ──────────────────────────────────────

function NodeMesh({
  node, isSelected, style, layout, onClick, onPositionChange, onFreeze,
}: {
  node: MindNode; isSelected: boolean; style: { nodeEmissiveIntensity: number; nodeRoughness: number; nodeMetalness: number; edgeColor: string; edgeOpacity: number }
  layout: LayoutResult; onClick: () => void; onPositionChange: (pos: Position) => void; onFreeze: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const color = useMemo(() => new THREE.Color(node.color), [node.color])
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const pos = layout.positions[node.id] || { x: 0, y: 0, z: 0 }
  const shapeName = layout.shapes[node.id] || node.shape

  const geometry = useMemo(() => {
    switch (shapeName) {
      case "sphere": return <sphereGeometry args={[0.5, 32, 32]} />
      case "box": return <boxGeometry args={[0.75, 0.75, 0.75]} />
      case "cylinder": return <cylinderGeometry args={[0.4, 0.4, 0.9, 32]} />
      case "torus": return <torusGeometry args={[0.4, 0.15, 16, 32]} />
    }
  }, [shapeName])

  useFrame(() => {
    if (groupRef.current && !isDragging) groupRef.current.rotation.y += 0.003
  })

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    onFreeze()
  }, [onFreeze])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const moved = Math.abs(dx) + Math.abs(dy) > 3
    setIsDragging(false)
    if (moved) {
      const p = groupRef.current.position
      onPositionChange({ x: p.x, y: p.y, z: p.z })
    } else {
      onClick()
    }
  }, [onClick, onPositionChange])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !groupRef.current) return; e.stopPropagation()
    const p = groupRef.current.position; onPositionChange({ x: p.x, y: p.y, z: p.z })
  }, [isDragging, onPositionChange])

  const textPos: [number, number, number] = layout.textPlacement === "below" ? [0, -0.5, 0]
    : layout.textPlacement === "above" ? [0, 0.5, 0]
    : layout.textPlacement === "side" ? [0.45, 0, 0]
    : layout.textPlacement === "radial" ? [Math.cos(Math.atan2(pos.z, pos.x)) * 0.45, 0, Math.sin(Math.atan2(pos.z, pos.x)) * 0.45]
    : [0, 0.5, 0]

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}
      <mesh onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}>
        {geometry}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? style.nodeEmissiveIntensity + 0.3 : style.nodeEmissiveIntensity} roughness={style.nodeRoughness} metalness={style.nodeMetalness} />
      </mesh>
      <Html position={textPos} center style={{ pointerEvents: "none", userSelect: "none" }}>
        <span className="text-[11px] text-gray-700 whitespace-nowrap font-medium drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
          {node.label}
        </span>
      </Html>

      {node.anchors?.map((a, ai) => {
        const ax = pos.x + (ai - (node.anchors.length - 1) / 2) * 1.2
        const ay = pos.y - 1.2
        const az = pos.z + 0.5
        return (
          <group key={a.id}>
            <Line points={[new THREE.Vector3(pos.x, pos.y - 0.3, pos.z), new THREE.Vector3(ax, ay, az)]} color={style.edgeColor} lineWidth={1} transparent opacity={style.edgeOpacity * a.relevanceScore} />
            <mesh position={[ax, ay, az]}>
              <boxGeometry args={[0.3, 0.15, 0.3]} />
              <meshStandardMaterial color={"#e0d8c8"} roughness={0.6} metalness={0.1} />
            </mesh>
            <Html position={[ax, ay - 0.2, az]} center style={{ pointerEvents: "none" }}>
              <span className="text-[9px] text-gray-500 whitespace-nowrap leading-tight" title={a.parameters}>
                {a.label}<br /><span className="text-[8px] text-gray-400">{a.parameters?.slice(0, 15)}…</span>
              </span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ─── 连线 ──────────────────────────────────────────

function EdgeLine({ edge, nodes, style }: { edge: MindEdge; nodes: MindNode[]; style: { edgeColor: string; edgeOpacity: number } }) {
  const source = nodes.find(n => n.id === edge.source)
  const target = nodes.find(n => n.id === edge.target)
  if (!source || !target) return null
  const sp = source.position || { x: 0, y: 0, z: 0 }
  const tp = target.position || { x: 0, y: 0, z: 0 }
  return (
    <Line points={[new THREE.Vector3(sp.x, sp.y, sp.z), new THREE.Vector3(tp.x, tp.y, tp.z)]} color={style.edgeColor} lineWidth={0.4 + (edge.weight || 0) * 0.4} transparent opacity={style.edgeOpacity} />
  )
}

// ─── 主组件 ────────────────────────────────────────

export default function MindSpace3D({
  nodes, edges, domainType, frameType, onNodeClick, onNodePositionChange, onExport,
}: MindSpace3DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [frozenUntil, setFrozenUntil] = useState(0)

  const handleNodeClick = useCallback((node: MindNode) => {
    setSelectedId(node.id)
    onNodeClick(node)
  }, [onNodeClick])

  const triggerFreeze = useCallback(() => {
    setFrozenUntil(Date.now() + 5000)
  }, [])

  const handleUnfreeze = useCallback(() => {
    setFrozenUntil(0)
  }, [])

  const frozen = frozenUntil > Date.now()

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
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[#e8e5df] m-2 bg-[#faf8f5] relative">
      <FreezeOverlay frozenUntil={frozenUntil} onUnfreeze={handleUnfreeze} />

      {nodes.length > 0 && (
        <button onClick={onExport}
          className="absolute bottom-4 right-4 z-10 text-xs text-gray-600 hover:text-[#5b5f97] bg-white/90 hover:bg-white px-3 py-1.5 rounded-xl border border-[#b8d8e8] shadow-sm transition-all">
          导出思维空间
        </button>
      )}
      <Canvas gl={{ antialias: true, alpha: false }} dpr={[1, 2]} performance={{ min: 0.5 }}>
        <Suspense fallback={null}>
          <Scene nodes={nodes} edges={edges} selectedId={selectedId} domainType={domainType} frameType={frameType}
            frozen={frozen}
            onNodeClick={handleNodeClick} onPositionChange={onNodePositionChange}
            onCanvasClick={triggerFreeze} />
        </Suspense>
      </Canvas>
    </div>
  )
}
