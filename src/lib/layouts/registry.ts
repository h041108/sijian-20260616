import type { Position, ShapeType, FrameType, MindNode, MindEdge } from "@/lib/types"

export type TextPlacement = "above" | "below" | "side" | "inside" | "radial" | "tangent" | "none"

export interface LayoutResult {
  positions: Record<string, Position>
  shapes: Record<string, ShapeType>
  textPlacement: TextPlacement
  cameraPos: Position
  cameraTarget: Position
  edges: MindEdge[]
}

// ─── 核心参数 ──────────────────────────
const NODE_GAP = 2.2       // 节点间距（基础值）
const DEPTH_GAP = 3.0      // 层级间距
const BASE_RADIUS = 3.5    // 环形布局基础半径

// ─── 1. 层级树 ─────────────────────────
function treeLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}

  const byDepth: Record<number, MindNode[]> = {}
  for (const n of nodes) {
    const d = n.depth ?? 0
    if (!byDepth[d]) byDepth[d] = []
    byDepth[d].push(n)
  }
  const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b)
  const maxDepth = depths[depths.length - 1] || 0

  for (const d of depths) {
    const layer = byDepth[d]
    const count = layer.length
    const y = d * DEPTH_GAP
    const totalWidth = Math.max(count - 1, 0) * NODE_GAP

    layer.forEach((n, i) => {
      const x = count === 1 ? 0 : i * NODE_GAP - totalWidth / 2
      positions[n.id] = { x, y, z: 0 }

      if (d === 0) shapes[n.id] = "box"
      else if (d === maxDepth) shapes[n.id] = "sphere"
      else shapes[n.id] = d % 2 === 0 ? "box" : "cylinder"
    })
  }

  const camY = maxDepth * DEPTH_GAP * 0.5 + 1
  const camDist = Math.max(8, maxDepth * DEPTH_GAP * 0.9 + 5)
  return {
    positions, shapes, textPlacement: "below",
    cameraPos: { x: 4, y: camY, z: camDist },
    cameraTarget: { x: 0, y: camY, z: 0 },
    edges,
  }
}

// ─── 2. 关系网络 ────────────────────────
function networkLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length

  const degree: Record<string, number> = {}
  for (const n of nodes) degree[n.id] = 0
  for (const e of edges) {
    degree[e.source] = (degree[e.source] || 0) + 1
    degree[e.target] = (degree[e.target] || 0) + 1
  }
  const maxDeg = Math.max(...Object.values(degree), 1)

  // 根据节点数量调整半径
  const radius = Math.max(BASE_RADIUS, count * 0.6)

  nodes.forEach((n, i) => {
    const deg = degree[n.id] || 1
    const r = radius * (1 - (deg / maxDeg) * 0.5)
    const angle = (i / count) * Math.PI * 2
    // 添加高度变化，避免所有节点在同一平面
    const yRange = Math.max(2, count * 0.3)
    positions[n.id] = {
      x: Math.cos(angle) * r,
      y: (i % 3 - 1) * yRange * 0.35,
      z: Math.sin(angle) * r,
    }

    if (deg >= maxDeg * 0.6) shapes[n.id] = "sphere"
    else if (deg >= maxDeg * 0.3) shapes[n.id] = "torus"
    else shapes[n.id] = "cylinder"
  })

  return {
    positions, shapes, textPlacement: "above",
    cameraPos: { x: 0, y: radius * 0.3, z: radius * 1.8 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 3. 双螺旋 ───────────────────────────
function helixLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length
  const height = Math.max(count * 0.8, 6)
  const spiralR = 1.8

  nodes.forEach((n, i) => {
    const isRight = i % 2 === 0
    const t = (i / Math.max(count - 1, 1)) * Math.PI * 3
    positions[n.id] = {
      x: Math.cos(t) * spiralR * (isRight ? 1 : -1),
      y: (i / Math.max(count - 1, 1) - 0.5) * height,
      z: Math.sin(t) * spiralR,
    }
    shapes[n.id] = isRight ? "sphere" : "box"
  })

  const newEdges: MindEdge[] = [...edges]
  for (let i = 0; i < count - 1; i += 2) {
    if (i + 1 < count) {
      newEdges.push({ id: `helix_${i}`, source: nodes[i].id, target: nodes[i + 1].id, edgeType: "abstract" })
    }
  }

  return {
    positions, shapes, textPlacement: "side",
    cameraPos: { x: 6, y: 0, z: 6 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges: newEdges,
  }
}

// ─── 4. 分层剖面 ──────────────────────────
function strataLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const shapeOrder: ShapeType[] = ["box", "cylinder", "sphere"]

  const byDepth: Record<number, MindNode[]> = {}
  for (const n of nodes) {
    const d = n.depth ?? 0
    if (!byDepth[d]) byDepth[d] = []
    byDepth[d].push(n)
  }
  const depths = Object.keys(byDepth).map(Number).sort((a, b) => b - a)

  depths.forEach((d, layerIdx) => {
    const layer = byDepth[d]
    const y = d * DEPTH_GAP
    const totalWidth = Math.max(layer.length - 1, 0) * NODE_GAP
    layer.forEach((n, i) => {
      const x = layer.length === 1 ? 0 : i * NODE_GAP - totalWidth / 2
      positions[n.id] = { x, y, z: 0 }
      shapes[n.id] = shapeOrder[layerIdx % 3]
    })
  })

  const midY = depths.length * DEPTH_GAP * 0.5
  return {
    positions, shapes, textPlacement: "side",
    cameraPos: { x: 8, y: midY, z: 8 },
    cameraTarget: { x: 0, y: midY, z: 0 },
    edges,
  }
}

// ─── 5. 力场轨道 ─────────────────────────
function orbitalLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const center = nodes[0]
  const planets = nodes.slice(1)

  if (center) {
    positions[center.id] = { x: 0, y: 0, z: 0 }
    shapes[center.id] = "sphere"
  }

  planets.forEach((n, i) => {
    const r = BASE_RADIUS + i * 1.2
    const angle = (i / Math.max(planets.length, 1)) * Math.PI * 2
    const y = (i % 2 === 0 ? 0.6 : -0.6) * (i + 1) * 0.3
    positions[n.id] = {
      x: Math.cos(angle) * r,
      y,
      z: Math.sin(angle) * r,
    }
    shapes[n.id] = "sphere"
  })

  const maxR = BASE_RADIUS + planets.length * 1.2
  return {
    positions, shapes, textPlacement: "tangent",
    cameraPos: { x: maxR * 0.5, y: maxR * 0.3, z: maxR * 1.5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 6. 流程管线 ──────────────────────────
function pipelineLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length

  nodes.forEach((n, i) => {
    const x = (i - (count - 1) / 2) * NODE_GAP
    const y = (i % 3 - 1) * 0.6
    positions[n.id] = { x, y, z: 0 }

    if (i === 0 || i === count - 1) shapes[n.id] = "cylinder"
    else if (n.parentIds && n.parentIds.length > 1) shapes[n.id] = "sphere"
    else shapes[n.id] = "box"
  })

  const totalW = Math.max(count - 1, 0) * NODE_GAP
  return {
    positions, shapes, textPlacement: "below",
    cameraPos: { x: 0, y: 3, z: Math.max(8, totalW * 0.7 + 5) },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 7. 深度透镜 ──────────────────────────
function lensLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const shapeOrder: ShapeType[] = ["torus", "cylinder", "sphere"]

  const byDepth: Record<number, MindNode[]> = {}
  for (const n of nodes) {
    const d = n.depth ?? 0
    if (!byDepth[d]) byDepth[d] = []
    byDepth[d].push(n)
  }
  const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b)

  depths.forEach((d) => {
    const layer = byDepth[d]
    const r = (d + 1) * 2.5
    layer.forEach((n, i) => {
      const angle = (i / Math.max(layer.length, 1)) * Math.PI * 2
      positions[n.id] = {
        x: Math.cos(angle) * r,
        y: d * 0.6,
        z: Math.sin(angle) * r,
      }
      shapes[n.id] = shapeOrder[Math.min(d, 2)]
    })
  })

  const maxR = (depths.length) * 2.5 + 2
  return {
    positions, shapes, textPlacement: "above",
    cameraPos: { x: 0, y: maxR * 0.5, z: maxR * 1.6 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 8. 循环回路 ─────────────────────────
function cycleLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length
  const radius = Math.max(BASE_RADIUS, count * 0.5)

  nodes.forEach((n, i) => {
    const angle = (i / count) * Math.PI * 2
    positions[n.id] = {
      x: Math.cos(angle) * radius,
      y: (i % 3 - 1) * 1.0,
      z: Math.sin(angle) * radius,
    }
    shapes[n.id] = "sphere"
  })

  return {
    positions, shapes, textPlacement: "radial",
    cameraPos: { x: 0, y: radius * 0.3, z: radius * 1.6 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 9. 谱系连续 ─────────────────────────
function spectrumLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length
  const totalW = Math.max(count - 1, 0) * NODE_GAP

  nodes.forEach((n, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = (t - 0.5) * totalW
    positions[n.id] = { x, y: 0, z: (i % 2 - 0.5) * 1.0 }

    if (t < 0.3) shapes[n.id] = "box"
    else if (t < 0.6) shapes[n.id] = "cylinder"
    else shapes[n.id] = "sphere"
  })

  return {
    positions, shapes, textPlacement: "below",
    cameraPos: { x: 0, y: 2, z: Math.max(8, totalW * 0.5 + 5) },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 10. 矩阵映射 ────────────────────────
function matrixLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const count = nodes.length
  const side = Math.ceil(Math.sqrt(count))

  nodes.forEach((n, i) => {
    const col = i % side
    const row = Math.floor(i / side)
    positions[n.id] = {
      x: (col - (side - 1) / 2) * NODE_GAP,
      y: 0,
      z: (row - Math.floor((count - 1) / side) / 2) * NODE_GAP,
    }
    shapes[n.id] = "box"
  })

  const camDist = Math.max(10, side * NODE_GAP * 0.8 + 4)
  return {
    positions, shapes, textPlacement: "above",
    cameraPos: { x: side * 0.5, y: camDist * 0.6, z: camDist },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 11. 涟漪扩散 ─────────────────────────
function diffusionLayout(nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const positions: Record<string, Position> = {}
  const shapes: Record<string, ShapeType> = {}
  const shapeOrder: ShapeType[] = ["sphere", "box", "cylinder", "torus"]

  const center = nodes[0]
  const rest = nodes.slice(1)

  if (center) {
    positions[center.id] = { x: 0, y: 0, z: 0 }
    shapes[center.id] = "sphere"
  }

  rest.forEach((n, i) => {
    const wave = Math.floor(i / Math.max(1, Math.ceil(rest.length / 3)))
    const r = (wave + 1) * 3.5
    const angle = (i / Math.max(1, rest.length)) * Math.PI * 2
    positions[n.id] = {
      x: Math.cos(angle) * r,
      y: -wave * 0.8,
      z: Math.sin(angle) * r,
    }
    shapes[n.id] = shapeOrder[Math.min(wave, 3)]
  })

  const maxR = 4 * 3.5
  return {
    positions, shapes, textPlacement: "radial",
    cameraPos: { x: 0, y: 5, z: maxR * 1.2 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    edges,
  }
}

// ─── 注册表 ──────────────────────────────
const layoutEngines: Record<FrameType, (nodes: MindNode[], edges: MindEdge[]) => LayoutResult> = {
  tree: treeLayout,
  network: networkLayout,
  helix: helixLayout,
  strata: strataLayout,
  orbital: orbitalLayout,
  pipeline: pipelineLayout,
  lens: lensLayout,
  cycle: cycleLayout,
  spectrum: spectrumLayout,
  matrix: matrixLayout,
  diffusion: diffusionLayout,
}

export function computeLayout(frameType: FrameType, nodes: MindNode[], edges: MindEdge[]): LayoutResult {
  const engine = layoutEngines[frameType] || layoutEngines.tree
  return engine(nodes, edges)
}

export function getDefaultFrameType(domainType: string): FrameType {
  const map: Record<string, FrameType> = {
    evolution: "tree", linguistics: "tree", education: "tree", law: "tree", nutrition: "tree", timemanagement: "tree",
    sociology: "network", ecology: "network", economics: "network", neuroscience: "network", telecom: "network", cybersecurity: "network",
    genetics: "helix", philosophy: "helix", music: "helix", logic: "helix", mathematics: "helix",
    geology: "strata", oceanography: "strata", history: "strata", materials: "strata", meteorology: "strata",
    physics: "orbital", astronomy: "orbital", chemistry: "orbital",
    cooking: "pipeline", firstaid: "pipeline", software: "pipeline", sports: "pipeline", craft: "pipeline", navigation: "pipeline", finance: "pipeline",
    art: "lens", literature: "lens", architecture: "lens", design: "lens", anthropology: "lens", political: "lens", medicine: "lens",
    general: "tree",
  }
  return map[domainType] || "tree"
}
