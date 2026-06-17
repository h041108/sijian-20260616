// ─── 基础类型 ─────────────────────────────────────

export interface Position {
  x: number
  y: number
  z: number
}

export type ShapeType = "sphere" | "box" | "cylinder" | "torus"

// ─── 11种图形框架 ──────────────────────────────────

export type FrameType =
  | "tree" | "network" | "helix" | "strata"
  | "orbital" | "pipeline" | "lens" | "cycle"
  | "spectrum" | "matrix" | "diffusion"

// ─── 46种知识领域 ──────────────────────────────────

export type DomainType =
  | "physics" | "chemistry" | "astronomy"
  | "geology" | "meteorology" | "oceanography" | "materials"
  | "biology" | "genetics" | "medicine" | "neuroscience"
  | "ecology" | "evolution" | "nutrition"
  | "history" | "economics" | "sociology" | "political"
  | "anthropology" | "law" | "education" | "linguistics"
  | "mathematics" | "logic" | "philosophy" | "literature"
  | "art" | "music" | "architecture" | "design"
  | "tech" | "ai" | "computerscience" | "software" | "engineering"
  | "telecom" | "cybersecurity" | "robotics"
  | "cooking" | "gardening" | "sports" | "craft"
  | "navigation" | "firstaid" | "timemanagement" | "finance"
  | "general"

// ─── 应用锚点 ─────────────────────────────────────

export interface ApplicationAnchor {
  id: string
  label: string              // "卫星天线抛物面"
  domain: string              // "通信工程"
  profession: string          // "天线工程师"
  parameters: string          // "焦距 = D²/(16d), f/D ∈ [0.3,0.5]"
  nodeId: string              // 关联的抽象节点ID
  relevanceScore: number      // 0-1
}

// ─── 核心节点 ─────────────────────────────────────

export interface MindNode {
  id: string
  label: string               // ≤6字
  frameType?: FrameType
  depth: number               // 在框架中的层级（0=根）
  shape: ShapeType
  color: string
  position?: Position
  content: string              // 知识内容
  parentIds: string[]          // 抽象层父节点
  anchors: ApplicationAnchor[] // 应用锚点
  metadata: {
    createdBy: "ai" | "user" | "teacher"
    createdAt: string
    version: number
  }
}

export interface MindEdge {
  id: string
  source: string
  target: string
  edgeType?: "abstract" | "anchor"  // 抽象关系 or 映射连线
  weight?: number                    // 0-1, 边粗细
}

// ─── 思维空间状态 ─────────────────────────────────

export interface MindSpaceState {
  nodes: MindNode[]
  edges: MindEdge[]
  frameType?: FrameType
  anchors?: ApplicationAnchor[]
}

// ─── 对话消息 ─────────────────────────────────────

export interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  mindSpace?: MindSpaceState
  domainType?: DomainType
  reasoning?: string
  createdAt: string
}

// ─── AI 响应 ──────────────────────────────────────

export interface AIResponse {
  message: string
  mindSpaceUpdate: MindSpaceState
  domain_type: DomainType
  thinkingLines?: { lineId: string; confidence: number; triggers: string[] }[]
}

// ─── 用户 ────────────────────────────────────────

export type RoleType = "core" | "observer"

export interface User {
  id: string
  role_type: RoleType
  name: string
  created_at: string
}

export interface ObserverGrant {
  id: string
  core_user_id: string
  observer_user_id: string
  granted_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}
