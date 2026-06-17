// ─── 机构知识图谱 — Token 资本可视化 ─────────────────
// P0: 聚合全机构知识资产到统一图谱
// P1a: 私有评估框架 — 企业自定义业务指标
// P1b: 知识复利仪表盘 — 人力资本 vs Token资本增长
// P2: 模型无关知识层 — 机构记忆独立于底层LLM

import { loadRooms, MemoryRoom, PalaceItem } from "./memory-palace"
import { loadModules, loadRecords, getEnterpriseDashboard } from "./enterprise-training"
import { loadDecisions, loadKnowledgeFlows } from "./enterprise-ai-capability"
import { loadInstitution } from "./institution"
import { loadUsers } from "./sijian-user"
import { loadWorkflows } from "./enterprise-ai-capability"
import { loadMetrics } from "./orchestrator"

// ═══════════════════════════════════════════════════
// P0: 机构知识图谱
// ═══════════════════════════════════════════════════

export interface KnowledgeNode {
  id: string
  label: string
  type: "concept" | "training_point" | "decision" | "workflow" | "content_item"
  department: string
  mastery: number
  contributors: string[]
  createdAt: string
  relations: KnowledgeEdge[]
  metadata: Record<string, any>
}

export interface KnowledgeEdge {
  targetNodeId: string
  relationType: "related_to" | "derived_from" | "assessed_in" | "applied_in" | "reviewed"
  strength: number
}

export interface InstitutionalKnowledgeGraph {
  generatedAt: string
  totalNodes: number
  totalEdges: number
  // Token 资本指标
  tokenCapital: {
    codifiedConcepts: number              // 已编码的概念
    codifiedWorkflows: number             // 已编码的工作流
    codifiedDecisions: number             // 已记录的决策
    knowledgeCoverage: number             // 0-1, 机构知识覆盖率
    knowledgeDepth: number                // 平均掌握深度
  }
  // 人力资本指标
  humanCapital: {
    totalContributors: number
    activeContributors: number
    avgMastery: number
    skillDiversity: number               // 技能多样性
    collaborationDensity: number         // 协作密度
  }
  // 知识流动
  knowledgeFlows: {
    interDeptTransfers: number
    crossPollinationRate: number
    knowledgeSilos: string[]             // 存在知识孤岛的部门
  }
  // 图谱数据
  nodes: KnowledgeNode[]
  departmentHeatmap: { department: string; nodes: number; avgMastery: number; tokenScore: number }[]
}

export function buildInstitutionalKnowledgeGraph(): InstitutionalKnowledgeGraph {
  const rooms = loadRooms()
  const modules = loadModules()
  const records = loadRecords()
  const decisions = loadDecisions()
  const flows = loadKnowledgeFlows()
  const workflows = loadWorkflows()
  const institution = loadInstitution()

  const nodes: KnowledgeNode[] = []
  const contributors = new Set<string>()
  const deptMap = new Map<string, { nodes: number; masterySum: number }>()

  // ── 1. 从记忆宫殿提取概念节点 ──
  for (const room of rooms) {
    for (const item of room.items) {
      contributors.add(room.name.split(" · ")[0])
      const dept = institution?.categories?.[0] || "通用"
      if (!deptMap.has(dept)) deptMap.set(dept, { nodes: 0, masterySum: 0 })

      nodes.push({
        id: item.id,
        label: item.label,
        type: "concept",
        department: dept,
        mastery: item.mastery,
        contributors: [room.name.split(" · ")[0]],
        createdAt: item.createdAt,
        relations: (item.anchors || []).map(a => ({ targetNodeId: a.label, relationType: "applied_in" as const, strength: 0.7 })),
        metadata: { content: item.content, shape: item.shape, room: room.name },
      })
      deptMap.get(dept)!.nodes++
      deptMap.get(dept)!.masterySum += item.mastery
    }
  }

  // ── 2. 从培训模块提取知识点 ──
  for (const mod of modules) {
    for (const kp of mod.knowledgePoints) {
      if (!deptMap.has(mod.department)) deptMap.set(mod.department, { nodes: 0, masterySum: 0 })

      // Find mastery from employee records
      let avgPointMastery = 0
      let pointCount = 0
      for (const rec of records) {
        const tp = rec.trainings.find(t => t.trainingModuleId === mod.id)
        if (tp && tp.pointMastery[kp.id]) {
          avgPointMastery += tp.pointMastery[kp.id]
          pointCount++
          contributors.add(rec.employeeName)
        }
      }

      nodes.push({
        id: kp.id,
        label: kp.label,
        type: "training_point",
        department: mod.department,
        mastery: pointCount > 0 ? avgPointMastery / pointCount : 0.3,
        contributors: [mod.name],
        createdAt: mod.createdAt,
        relations: [],
        metadata: { moduleName: mod.name, importance: kp.importance },
      })
      deptMap.get(mod.department)!.nodes++
      deptMap.get(mod.department)!.masterySum += (pointCount > 0 ? avgPointMastery / pointCount : 0.3)
    }
  }

  // ── 3. 从决策记录提取 ──
  for (const d of decisions) {
    if (!deptMap.has(d.department)) deptMap.set(d.department, { nodes: 0, masterySum: 0 })
    contributors.add(d.decider)

    nodes.push({
      id: d.id,
      label: d.title.slice(0, 8),
      type: "decision",
      department: d.department,
      mastery: d.outcome === "正确" ? 1 : d.outcome === "部分正确" ? 0.7 : d.outcome === "错误" ? 0.3 : 0.5,
      contributors: [d.decider],
      createdAt: d.decisionDate,
      relations: d.lessons.map(l => ({ targetNodeId: l.slice(0, 6), relationType: "derived_from" as const, strength: 0.5 })),
      metadata: { description: d.description, outcome: d.outcome, lessonsCount: d.lessons.length },
    })
    deptMap.get(d.department)!.nodes++
    deptMap.get(d.department)!.masterySum += nodes[nodes.length - 1].mastery
  }

  // ── 4. 从工作流提取 ──
  for (const wf of workflows) {
    for (const node of wf.nodes) {
      if (node.type === "ai") {
        nodes.push({
          id: node.id,
          label: node.label,
          type: "workflow",
          department: "全员",
          mastery: 0.8,
          contributors: [wf.name],
          createdAt: wf.createdAt,
          relations: [],
          metadata: { workflowName: wf.name, nodeType: node.type, aiModel: node.aiModel },
        })
      }
    }
  }

  // ── 聚合指标 ──
  const totalNodes = nodes.length
  const avgMastery = nodes.length > 0 ? nodes.reduce((s, n) => s + n.mastery, 0) / nodes.length : 0

  const codifiedConcepts = nodes.filter(n => n.type === "concept").length
  const codifiedWorkflows = nodes.filter(n => n.type === "workflow").length
  const codifiedDecisions = nodes.filter(n => n.type === "decision").length

  const departmentHeatmap = Array.from(deptMap.entries()).map(([dept, d]) => ({
    department: dept,
    nodes: d.nodes,
    avgMastery: d.nodes > 0 ? d.masterySum / d.nodes : 0,
    tokenScore: Math.min(1, d.nodes / Math.max(totalNodes, 1) * 3),
  }))

  // 知识孤岛检测
  const knowledgeSilos = departmentHeatmap
    .filter(d => d.nodes > 0 && d.nodes < totalNodes * 0.05)
    .map(d => d.department)

  return {
    generatedAt: new Date().toISOString(),
    totalNodes,
    totalEdges: nodes.reduce((s, n) => s + n.relations.length, 0),
    tokenCapital: {
      codifiedConcepts, codifiedWorkflows, codifiedDecisions,
      knowledgeCoverage: Math.min(1, totalNodes / 50),
      knowledgeDepth: avgMastery,
    },
    humanCapital: {
      totalContributors: contributors.size,
      activeContributors: records.filter(r => r.trainings.some(t => t.status === "in_progress")).length || 1,
      avgMastery,
      skillDiversity: Math.min(1, departmentHeatmap.filter(d => d.nodes > 0).length / 5),
      collaborationDensity: Math.min(1, flows.length / 10),
    },
    knowledgeFlows: {
      interDeptTransfers: flows.filter(f => f.fromTeam !== f.toTeam).length,
      crossPollinationRate: flows.length > 0 ? flows.filter(f => f.fromTeam !== f.toTeam).length / flows.length : 0,
      knowledgeSilos,
    },
    nodes,
    departmentHeatmap,
  }
}

// ═══════════════════════════════════════════════════
// P1a: 私有评估框架
// ═══════════════════════════════════════════════════

export interface BusinessMetric {
  id: string
  name: string
  description: string
  category: "quality" | "speed" | "cost" | "satisfaction" | "innovation" | "compliance"
  unit: string
  targetValue: number
  currentValue: number
  trend: "up" | "down" | "stable"
  dataSource: string
  aiImpact: number          // AI 对指标的影响 (0-1)
  baselineWithoutAI: number // 不用 AI 的基准值
  lastUpdated: string
  history: { date: string; value: number; withAI: boolean }[]
}

const METRICS_KEY = "sijian_business_metrics"

export function loadBusinessMetrics(): BusinessMetric[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(METRICS_KEY) || "[]") } catch { return [] }
}

export function saveBusinessMetrics(metrics: BusinessMetric[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))
}

export function createBusinessMetric(name: string, category: BusinessMetric["category"], unit: string, targetValue: number): BusinessMetric {
  return {
    id: `metric_${Date.now()}`,
    name, description: "", category, unit, targetValue,
    currentValue: 0, trend: "stable", dataSource: "manual",
    aiImpact: 0, baselineWithoutAI: 0,
    lastUpdated: new Date().toISOString(),
    history: [],
  }
}

export function updateMetricValue(id: string, value: number, withAI: boolean, baselineWithoutAI?: number): void {
  const metrics = loadBusinessMetrics()
  const m = metrics.find(m => m.id === id)
  if (!m) return

  const prev = m.history[m.history.length - 1]
  m.currentValue = value
  m.trend = prev ? (value > prev.value ? "up" : value < prev.value ? "down" : "stable") : "stable"
  m.history.push({ date: new Date().toISOString().slice(0, 10), value, withAI })
  if (withAI) {
    // Estimate AI impact
    const noAIBaseline = baselineWithoutAI || m.baselineWithoutAI || value * 0.8
    m.baselineWithoutAI = noAIBaseline
    m.aiImpact = noAIBaseline > 0 ? Math.min(1, Math.max(0, (value - noAIBaseline) / noAIBaseline)) : 0
  }
  m.lastUpdated = new Date().toISOString()
  saveBusinessMetrics(metrics)
}

export function deleteBusinessMetric(id: string): void {
  saveBusinessMetrics(loadBusinessMetrics().filter(m => m.id !== id))
}

export function seedBusinessMetrics(): void {
  if (loadBusinessMetrics().length > 0) return
  const now = new Date().toISOString()
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)

  const seeds: BusinessMetric[] = [
    {
      id: "bm_001", name: "客户投诉处理时间", description: "从收到投诉到首次回复的平均时间", category: "speed", unit: "小时", targetValue: 2, currentValue: 1.8, trend: "down", dataSource: "手动录入", aiImpact: 0.25, baselineWithoutAI: 2.4, lastUpdated: now,
      history: [{ date: daysAgo(6), value: 2.4, withAI: false }, { date: daysAgo(5), value: 2.1, withAI: true }, { date: daysAgo(4), value: 1.9, withAI: true }, { date: daysAgo(3), value: 1.8, withAI: true }],
    },
    {
      id: "bm_002", name: "方案撰写速度", description: "完成一份标准竞品方案的所需时间", category: "speed", unit: "小时", targetValue: 4, currentValue: 3.5, trend: "down", dataSource: "手动录入", aiImpact: 0.35, baselineWithoutAI: 5.4, lastUpdated: now,
      history: [{ date: daysAgo(6), value: 5.4, withAI: false }, { date: daysAgo(4), value: 3.8, withAI: true }, { date: daysAgo(2), value: 3.5, withAI: true }],
    },
    {
      id: "bm_003", name: "客户满意度", description: "客户对服务的整体满意度评分", category: "satisfaction", unit: "分", targetValue: 85, currentValue: 82, trend: "up", dataSource: "手动录入", aiImpact: 0.15, baselineWithoutAI: 71, lastUpdated: now,
      history: [{ date: daysAgo(6), value: 71, withAI: false }, { date: daysAgo(4), value: 76, withAI: true }, { date: daysAgo(2), value: 82, withAI: true }],
    },
    {
      id: "bm_004", name: "新员工上岗周期", description: "新员工从入职到能独立处理业务的天数", category: "speed", unit: "天", targetValue: 14, currentValue: 18, trend: "down", dataSource: "手动录入", aiImpact: 0.20, baselineWithoutAI: 22, lastUpdated: now,
      history: [{ date: daysAgo(6), value: 22, withAI: false }, { date: daysAgo(3), value: 18, withAI: true }],
    },
  ]
  localStorage.setItem(METRICS_KEY, JSON.stringify(seeds))
}

// ═══════════════════════════════════════════════════
// P1b: 知识复利仪表盘
// ═══════════════════════════════════════════════════

export interface CompoundIndex {
  // 人力资本增长率
  humanCapitalGrowth: number
  humanCapitalTrend: number[]          // 最近 30 天的日变化

  // Token 资本增长率
  tokenCapitalGrowth: number
  tokenCapitalTrend: number[]

  // 复利指数 (复合增长率)
  compoundRate: number

  // 组成分解
  newConceptsThisMonth: number
  newWorkflowsThisMonth: number
  newDecisionsThisMonth: number
  improvedWorkflows: number            // 本月被优化的流程数

  // 对比
  humanVsTokenRatio: number            // 人力:Token = 1:?
  aiAssistedRatio: number              // AI 辅助完成的任务占比

  // 预测
  projectedGrowth: number              // 按当前速率下月预计增长
  doublingTime: number                 // Token 资本翻倍所需月数

  // 里程碑
  milestones: { date: string; description: string }[]
}

export function computeCompoundIndex(): CompoundIndex {
  const graph = buildInstitutionalKnowledgeGraph()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // 本月新增
  const conceptsThisMonth = graph.nodes.filter(n => n.type === "concept" && new Date(n.createdAt) >= monthStart).length
  const workflowsThisMonth = graph.nodes.filter(n => n.type === "workflow" && new Date(n.createdAt) >= monthStart).length
  const decisionsThisMonth = graph.nodes.filter(n => n.type === "decision" && new Date(n.createdAt) >= monthStart).length
  const newThisMonth = conceptsThisMonth + workflowsThisMonth + decisionsThisMonth

  // 上月新增 (对比)
  const conceptsLastMonth = graph.nodes.filter(n => n.type === "concept" && new Date(n.createdAt) >= lastMonth && new Date(n.createdAt) < monthStart).length
  const workflowsLastMonth = graph.nodes.filter(n => n.type === "workflow" && new Date(n.createdAt) >= lastMonth && new Date(n.createdAt) < monthStart).length
  const decisionsLastMonth = graph.nodes.filter(n => n.type === "decision" && new Date(n.createdAt) >= lastMonth && new Date(n.createdAt) < monthStart).length
  const newLastMonth = conceptsLastMonth + workflowsLastMonth + decisionsLastMonth

  // 总 Token 资本
  const totalToken = graph.tokenCapital.codifiedConcepts + graph.tokenCapital.codifiedWorkflows + graph.tokenCapital.codifiedDecisions
  const prevToken = totalToken - newThisMonth

  // 增长率
  const tokenCapitalGrowth = prevToken > 0 ? newThisMonth / prevToken : 0.3
  const humanCapitalGrowth = Math.min(0.3, graph.humanCapital.activeContributors / graph.humanCapital.totalContributors * 0.2)

  // 复利指数
  const compoundRate = (tokenCapitalGrowth + humanCapitalGrowth) / 2

  // 人力 vs Token 对比
  const humanVsTokenRatio = totalToken / Math.max(graph.humanCapital.totalContributors, 1)

  // 翻倍时间
  const doublingTime = tokenCapitalGrowth > 0 ? Math.log(2) / Math.log(1 + tokenCapitalGrowth) : 999

  // 里程碑
  const milestones: CompoundIndex["milestones"] = []
  if (totalToken >= 50) milestones.push({ date: now.toISOString().slice(0, 10), description: "Token资本突破50节点" })
  if (graph.humanCapital.totalContributors >= 10) milestones.push({ date: now.toISOString().slice(0, 10), description: "贡献者突破10人" })
  if (graph.knowledgeFlows.crossPollinationRate >= 0.5) milestones.push({ date: now.toISOString().slice(0, 10), description: "跨部门知识流动率超过50%" })

  return {
    humanCapitalGrowth,
    humanCapitalTrend: Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 86400000)
      return graph.nodes.filter(n => new Date(n.createdAt) <= d).length / (totalToken || 1)
    }),
    tokenCapitalGrowth,
    tokenCapitalTrend: Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 86400000)
      return graph.nodes.filter(n => n.type === "concept" && new Date(n.createdAt) <= d).length
    }),
    compoundRate,
    newConceptsThisMonth: conceptsThisMonth,
    newWorkflowsThisMonth: workflowsThisMonth,
    newDecisionsThisMonth: decisionsThisMonth,
    improvedWorkflows: Math.floor(newThisMonth * 0.3),
    humanVsTokenRatio,
    aiAssistedRatio: graph.tokenCapital.codifiedDecisions > 0 ? 0.4 : 0,
    projectedGrowth: compoundRate * 1.2,
    doublingTime: Math.round(doublingTime),
    milestones,
  }
}

// ═══════════════════════════════════════════════════
// P2: 模型无关知识层
// ═══════════════════════════════════════════════════

export interface SerializableKnowledgeCore {
  version: string
  exportedAt: string
  institution: {
    name: string
    departments: string[]
  }
  concepts: {
    label: string
    content: string
    mastery: number
    department: string
    anchors: string[]
    createdAt: string
  }[]
  trainingPoints: {
    label: string
    content: string
    importance: string
    department: string
    avgMastery: number
  }[]
  decisions: {
    title: string
    description: string
    department: string
    outcome: string
    lessons: string[]
    date: string
  }[]
  workflows: {
    name: string
    description: string
    category: string
    nodeCount: number
    aiNodeCount: number
    humanNodeCount: number
  }[]
  businessMetrics: {
    name: string
    category: string
    currentValue: number
    targetValue: number
    aiImpact: number
  }[]
  compoundSummary: {
    totalNodes: number
    knowledgeCoverage: number
    humanVsTokenRatio: number
    knowledgeDepth: number
  }
}

export function exportKnowledgeCore(): string {
  const graph = buildInstitutionalKnowledgeGraph()
  const metrics = typeof window !== "undefined" ? loadBusinessMetrics() : []
  const compound = computeCompoundIndex()
  const institution = typeof window !== "undefined" ? loadInstitution() : null

  const core: SerializableKnowledgeCore = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    institution: {
      name: institution?.name || "未命名机构",
      departments: institution?.categories || [],
    },
    concepts: graph.nodes
      .filter(n => n.type === "concept")
      .map(n => ({
        label: n.label, content: n.metadata?.content || "", mastery: n.mastery,
        department: n.department, anchors: n.relations.map(r => r.targetNodeId), createdAt: n.createdAt,
      })),
    trainingPoints: graph.nodes
      .filter(n => n.type === "training_point")
      .map(n => ({
        label: n.label, content: n.metadata?.moduleName || "", importance: n.metadata?.importance || "important",
        department: n.department, avgMastery: n.mastery,
      })),
    decisions: graph.nodes
      .filter(n => n.type === "decision")
      .map(n => ({
        title: n.label, description: n.metadata?.description || "", department: n.department,
        outcome: n.metadata?.outcome || "待评估", lessons: (n.metadata?.lessonsCount || 0),
        date: n.createdAt,
      })),
    workflows: [],
    businessMetrics: metrics.map(m => ({
      name: m.name, category: m.category, currentValue: m.currentValue, targetValue: m.targetValue, aiImpact: m.aiImpact,
    })),
    compoundSummary: {
      totalNodes: graph.totalNodes,
      knowledgeCoverage: graph.tokenCapital.knowledgeCoverage,
      humanVsTokenRatio: compound.humanVsTokenRatio,
      knowledgeDepth: graph.tokenCapital.knowledgeDepth,
    },
  }

  return JSON.stringify(core, null, 2)
}

export function importKnowledgeCore(json: string): boolean {
  try {
    const core: SerializableKnowledgeCore = JSON.parse(json)
    if (!core.version || !core.concepts) return false

    // 可以导入记忆宫殿
    const rooms = loadRooms()
    const importedConcepts = core.concepts.map((c, i) => ({
      id: `imported_${Date.now()}_${i}`,
      label: c.label.slice(0, 6), content: c.content, shape: "sphere", color: "#6366F1",
      anchors: c.anchors.map(a => ({ label: a, profession: "", parameters: "" })),
      sourceSpaceId: "imported",
      sourceTeacherId: "imported",
    } as any))

    // 添加到一个导入房间
    const importRoom: any = {
      id: `import_room_${Date.now()}`,
      name: `导入：${core.institution.name} — ${core.exportedAt.slice(0, 10)}`,
      subject: "general",
      description: `从知识核心导入 ${importedConcepts.length} 个概念`,
      createdAt: new Date().toISOString(),
      items: importedConcepts.map((c: any) => ({
        ...c, position: { x: 0, y: 0 }, reviewSchedule: [],
        reviewCount: 0, mastery: c.mastery || 0.3,
        parentIds: [], metadata: { createdBy: "ai", createdAt: new Date().toISOString(), version: 1 },
      })),
    }

    // localStorage 存储
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("sijian_memory_palace") || "[]")
      existing.push(importRoom)
      localStorage.setItem("sijian_memory_palace", JSON.stringify(existing))
    }

    return true
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════
// 综合 API：一次返回所有机构智能数据
// ═══════════════════════════════════════════════════

export interface InstitutionalIntelligence {
  knowledgeGraph: InstitutionalKnowledgeGraph
  compoundIndex: CompoundIndex
  businessMetrics: BusinessMetric[]
  serializableCore: string           // JSON string
  generatedAt: string
}

export function getInstitutionalIntelligence(): InstitutionalIntelligence {
  const graph = buildInstitutionalKnowledgeGraph()
  const compound = computeCompoundIndex()
  const metrics = typeof window !== "undefined" ? loadBusinessMetrics() : []
  const core = exportKnowledgeCore()

  return {
    knowledgeGraph: graph,
    compoundIndex: compound,
    businessMetrics: metrics,
    serializableCore: core,
    generatedAt: new Date().toISOString(),
  }
}
