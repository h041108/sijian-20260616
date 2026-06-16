"use client"

import { useState, useCallback } from "react"
import {
  CollaborationWorkflow, WorkflowNode, WorkflowEdge, WorkflowNodeType,
  loadWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  addWorkflowNode, addWorkflowEdge, removeWorkflowNode,
} from "@/lib/enterprise-ai-capability"

const NODE_TYPE_CONFIG: Record<WorkflowNodeType, { icon: string; bg: string; label: string }> = {
  human: { icon: "👤", bg: "bg-blue-100 border-blue-300", label: "人工" },
  ai: { icon: "🤖", bg: "bg-purple-100 border-purple-300", label: "AI" },
  review: { icon: "✅", bg: "bg-green-100 border-green-300", label: "审核" },
  input: { icon: "📥", bg: "bg-gray-100 border-gray-300", label: "输入" },
  output: { icon: "📤", bg: "bg-gray-100 border-gray-300", label: "输出" },
  decision: { icon: "🔀", bg: "bg-orange-100 border-orange-300", label: "决策" },
}
const CATEGORIES: CollaborationWorkflow["category"][] = ["客户服务","内容生产","数据分析","研发协作","项目管理","营销运营"]

// ═══════════════════════════════════════════════════
// 预置模板
// ═══════════════════════════════════════════════════
const TEMPLATES: { name:string; description:string; category:CollaborationWorkflow["category"]; nodes:WorkflowNode[]; edges:WorkflowEdge[] }[] = [
  {
    name:"客户投诉处理", description:"AI自动分类+情感分析→人工审核+制定方案→AI起草回复→人工发送", category:"客户服务",
    nodes:[
      {id:"t1_in",type:"input",label:"客户投诉到达",description:"邮件/IM/电话录入",inputs:[],outputs:["投诉原文"]},
      {id:"t1_ai1",type:"ai",label:"AI分类+情感分析",description:"自动判断投诉类型和紧急程度",aiModel:"Claude",inputs:["投诉原文"],outputs:["分类标签","紧急度","情感摘要"]},
      {id:"t1_h1",type:"human",label:"客服审核",description:"核实AI分类是否准确，制定处理方案",assignedRole:"客服专员",inputs:["分类标签","紧急度","情感摘要","投诉原文"],outputs:["处理方案"]},
      {id:"t1_ai2",type:"ai",label:"AI起草回复",description:"根据处理方案生成回复话术",aiModel:"Claude",inputs:["处理方案","投诉原文"],outputs:["回复草稿"]},
      {id:"t1_rev",type:"review",label:"人工发送",description:"审核AI回复，修改后发送",assignedRole:"客服组长",qualityGate:true,inputs:["回复草稿"],outputs:["最终回复"]},
      {id:"t1_out",type:"output",label:"投诉关闭",description:"归档并记录处理结果",inputs:["最终回复"],outputs:[]},
    ],
    edges:[
      {id:"te1",source:"t1_in",target:"t1_ai1"},{id:"te2",source:"t1_ai1",target:"t1_h1"},
      {id:"te3",source:"t1_h1",target:"t1_ai2"},{id:"te4",source:"t1_ai2",target:"t1_rev"},
      {id:"te5",source:"t1_rev",target:"t1_out"},
    ],
  },
  {
    name:"周报生成与分发", description:"各成员提供要点→AI整合润色→主管审核→自动分发", category:"项目管理",
    nodes:[
      {id:"w1_in",type:"input",label:"成员提交要点",description:"各成员提交本周工作要点",inputs:[],outputs:["成员要点列表"]},
      {id:"w1_ai",type:"ai",label:"AI整合+润色",description:"将零散要点整合为结构化的团队周报",aiModel:"Claude",inputs:["成员要点列表"],outputs:["周报草稿"]},
      {id:"w1_h",type:"human",label:"主管审核",description:"补充战略视角的点评，调整优先级",assignedRole:"Team Lead",inputs:["周报草稿"],outputs:["最终周报"]},
      {id:"w1_rev",type:"review",label:"自动分发",description:"发送到邮件组+企业微信群",qualityGate:true,inputs:["最终周报"],outputs:[]},
      {id:"w1_out",type:"output",label:"归档",description:"存入知识库",inputs:[],outputs:[]},
    ],
    edges:[
      {id:"we1",source:"w1_in",target:"w1_ai"},{id:"we2",source:"w1_ai",target:"w1_h"},
      {id:"we3",source:"w1_h",target:"w1_rev"},{id:"we4",source:"w1_rev",target:"w1_out"},
    ],
  },
  {
    name:"竞品分析报告", description:"AI抓取+分析数据→人工深度解读→AI制图→人工发布", category:"数据分析",
    nodes:[
      {id:"c1_in",type:"input",label:"分析需求",description:"明确分析范围：竞品名称、维度、周期",inputs:[],outputs:["分析需求"]},
      {id:"c1_ai1",type:"ai",label:"AI数据收集+初筛",description:"从公开信息抓取竞品数据，初步结构化",aiModel:"Claude",inputs:["分析需求"],outputs:["原始数据"]},
      {id:"c1_h1",type:"human",label:"分析师深度分析",description:"基于原始数据进行战略解读",assignedRole:"市场分析师",inputs:["原始数据"],outputs:["分析洞察"]},
      {id:"c1_ai2",type:"ai",label:"AI生成图表",description:"将分析洞察自动生成可视化图表",aiModel:"Claude",inputs:["分析洞察"],outputs:["图表"]},
      {id:"c1_rev",type:"review",label:"报告终审",description:"审核数据准确性和战略建议",qualityGate:true,assignedRole:"市场总监",inputs:["图表","分析洞察"],outputs:["最终报告"]},
      {id:"c1_out",type:"output",label:"发布",description:"分享给管理层",inputs:["最终报告"],outputs:[]},
    ],
    edges:[
      {id:"ce1",source:"c1_in",target:"c1_ai1"},{id:"ce2",source:"c1_ai1",target:"c1_h1"},
      {id:"ce3",source:"c1_h1",target:"c1_ai2"},{id:"ce4",source:"c1_ai2",target:"c1_rev"},
      {id:"ce5",source:"c1_rev",target:"c1_out"},
    ],
  },
]

// ═══════════════════════════════════════════════════
// 执行状态类型
// ═══════════════════════════════════════════════════
type NodeRunState = "idle" | "running" | "done" | "skipped"
interface ExecutionState {
  running: boolean
  currentNodeId: string | null
  nodeStates: Record<string, NodeRunState>
  nodeOutputs: Record<string, string>     // nodeId → output text
  nodeErrors: Record<string, string>     // nodeId → error
  startedAt: number
  totalAICalls: number
  humanInput: string                     // current human input form value
  reviewAction: "approve" | "reject" | null
  reviewComment: string
}

// ═══════════════════════════════════════════════════
// 拓扑排序 — 按 DAG 顺序排列节点
// ═══════════════════════════════════════════════════
function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const n of nodes) { inDegree.set(n.id, 0); adj.set(n.id, []) }
  for (const e of edges) {
    if (inDegree.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source)!.push(e.target)
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
    }
  }
  const queue: string[] = []
  for (const [id, deg] of inDegree) { if (deg === 0) queue.push(id) }
  const order: string[] = []
  while (queue.length > 0) {
    const cur = queue.shift()!
    order.push(cur)
    for (const next of adj.get(cur) || []) {
      inDegree.set(next, inDegree.get(next)! - 1)
      if (inDegree.get(next) === 0) queue.push(next)
    }
  }
  return order
}

// 构建每个节点的上游输出（作为 context 传给 AI）
function buildNodeContext(
  nodeId: string, edges: WorkflowEdge[],
  nodeOutputs: Record<string, string>, nodes: WorkflowNode[],
): string {
  const incoming = edges.filter(e => e.target === nodeId)
  if (incoming.length === 0) return ""
  return incoming.map(e => {
    const src = nodes.find(n => n.id === e.source)
    const label = src?.label || e.source
    const output = nodeOutputs[e.source] || ""
    return `【${label}的输出】\n${output.slice(0, 2000)}`
  }).join("\n\n")
}

// ═══════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════
export default function L4HumanAICollab() {
  const [workflows, setWorkflows] = useState<CollaborationWorkflow[]>(() => loadWorkflows())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"design" | "run">("design")

  // Design mode state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState(""); const [newDesc, setNewDesc] = useState("")
  const [newDept, setNewDept] = useState("全员")
  const [newCat, setNewCat] = useState<CollaborationWorkflow["category"]>("内容生产")
  const [showAddNode, setShowAddNode] = useState(false)
  const [newNodeLabel, setNewNodeLabel] = useState("")
  const [newNodeType, setNewNodeType] = useState<WorkflowNodeType>("human")
  const [newNodeDesc, setNewNodeDesc] = useState("")
  const [newNodeRole, setNewNodeRole] = useState(""); const [newNodeAiModel, setNewNodeAiModel] = useState("")
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  // Run mode state
  const [exec, setExec] = useState<ExecutionState>({
    running: false, currentNodeId: null,
    nodeStates: {}, nodeOutputs: {}, nodeErrors: {},
    startedAt: 0, totalAICalls: 0,
    humanInput: "", reviewAction: null, reviewComment: "",
  })

  const active = activeId ? workflows.find(w => w.id === activeId) : null

  // ── Design handlers ──
  const refresh = useCallback(() => setWorkflows(loadWorkflows()), [])

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return
    createWorkflow(newName.trim(), newDesc.trim(), newDept, newCat)
    refresh(); setShowCreate(false); setNewName(""); setNewDesc("")
  }, [newName, newDesc, newDept, newCat, refresh])

  const handleAddNode = useCallback(() => {
    if (!active || !newNodeLabel.trim()) return
    addWorkflowNode(active.id, {
      id: `n_${Date.now()}`, type: newNodeType, label: newNodeLabel.trim(),
      description: newNodeDesc.trim() || newNodeLabel.trim(),
      assignedRole: newNodeRole || undefined,
      aiModel: newNodeType === "ai" ? (newNodeAiModel || "Claude") : undefined,
      qualityGate: newNodeType === "review",
      inputs: [], outputs: [],
    })
    refresh(); setShowAddNode(false)
    setNewNodeLabel(""); setNewNodeDesc(""); setNewNodeRole(""); setNewNodeAiModel("")
  }, [active, newNodeLabel, newNodeType, newNodeDesc, newNodeRole, newNodeAiModel, refresh])

  const handleConnect = useCallback((targetId: string) => {
    if (!active || !connectingFrom) return
    if (active.edges.some(e => e.source === connectingFrom && e.target === targetId)) { setConnectingFrom(null); return }
    addWorkflowEdge(active.id, { id: `e_${Date.now()}`, source: connectingFrom, target: targetId })
    refresh(); setConnectingFrom(null)
  }, [active, connectingFrom, refresh])

  const handleUseTemplate = useCallback((tpl: typeof TEMPLATES[0]) => {
    const wf = createWorkflow(tpl.name, tpl.description, "全员", tpl.category)
    updateWorkflow(wf.id, { nodes: tpl.nodes, edges: tpl.edges })
    refresh(); setActiveId(wf.id); setViewMode("run")
  }, [refresh])

  // ── Run handlers ──
  const startRun = useCallback(() => {
    if (!active) return
    setExec({
      running: true, currentNodeId: null,
      nodeStates: {}, nodeOutputs: {}, nodeErrors: {},
      startedAt: Date.now(), totalAICalls: 0,
      humanInput: "", reviewAction: null, reviewComment: "",
    })
  }, [active])

  const stopRun = useCallback(() => {
    setExec(prev => ({ ...prev, running: false, currentNodeId: null }))
  }, [])

  const getNextNode = useCallback((currentId: string | null): string | null => {
    if (!active) return null
    const order = topologicalSort(active.nodes, active.edges)
    if (!currentId) return order[0] || null
    const idx = order.indexOf(currentId)
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null
  }, [active])

  // AI node execution
  const runAINode = useCallback(async (node: WorkflowNode) => {
    if (!active) return
    setExec(prev => ({ ...prev, nodeStates: { ...prev.nodeStates, [node.id]: "running" } }))
    const context = buildNodeContext(node.id, active.edges, exec.nodeOutputs, active.nodes)
    const prompt = `你正在执行一个工作流节点："${node.label}"。
${node.description}

${context ? `上游节点的输出作为你的输入：\n${context}\n` : ""}
请根据以上信息完成你的任务。如果是分析类任务，给出结构化的分析结果。如果是生成类任务，给出可直接使用的内容。`

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], existingNodes: [] }),
      })
      const data = await res.json()
      const output = data.message || "(AI 完成)"
      setExec(prev => ({
        ...prev,
        nodeStates: { ...prev.nodeStates, [node.id]: "done" },
        nodeOutputs: { ...prev.nodeOutputs, [node.id]: output },
        totalAICalls: prev.totalAICalls + 1,
      }))
    } catch {
      setExec(prev => ({
        ...prev,
        nodeStates: { ...prev.nodeStates, [node.id]: "done" },
        nodeErrors: { ...prev.nodeErrors, [node.id]: "AI 调用失败，请重试" },
        nodeOutputs: { ...prev.nodeOutputs, [node.id]: "⚠️ 执行失败" },
      }))
    }
  }, [active, exec.nodeOutputs])

  // Step to next node
  const stepNext = useCallback(async () => {
    if (!active) return
    const nextId = getNextNode(exec.currentNodeId)
    if (!nextId) { stopRun(); return }
    const node = active.nodes.find(n => n.id === nextId)
    if (!node) { stopRun(); return }

    setExec(prev => ({ ...prev, currentNodeId: nextId }))

    // Auto-run AI nodes
    if (node.type === "ai") {
      await runAINode(node)
    }
  }, [active, exec.currentNodeId, getNextNode, stopRun, runAINode])

  // Human input submit
  const submitHumanInput = useCallback((nodeId: string) => {
    if (!exec.humanInput.trim()) return
    setExec(prev => ({
      ...prev,
      nodeStates: { ...prev.nodeStates, [nodeId]: "done" },
      nodeOutputs: { ...prev.nodeOutputs, [nodeId]: prev.humanInput.trim() },
      humanInput: "",
    }))
  }, [exec.humanInput])

  // Review action
  const submitReview = useCallback((nodeId: string) => {
    setExec(prev => ({
      ...prev,
      nodeStates: { ...prev.nodeStates, [nodeId]: "done" },
      nodeOutputs: { ...prev.nodeOutputs, [nodeId]: prev.reviewAction === "approve"
        ? `✅ 已通过：${prev.nodeOutputs[nodeId] || "审核通过"}${prev.reviewComment ? `\n备注：${prev.reviewComment}` : ""}`
        : `❌ 已驳回：${prev.reviewComment || "需要修改"}` },
      reviewAction: null, reviewComment: "",
    }))
  }, [exec.reviewComment, exec.reviewAction, exec.nodeOutputs])

  // Input node submit
  const submitInput = useCallback((nodeId: string) => {
    if (!exec.humanInput.trim()) return
    setExec(prev => ({
      ...prev,
      nodeStates: { ...prev.nodeStates, [nodeId]: "done" },
      nodeOutputs: { ...prev.nodeOutputs, [nodeId]: prev.humanInput.trim() },
      humanInput: "",
    }))
  }, [exec.humanInput])

  const currentNode = exec.currentNodeId ? active?.nodes.find(n => n.id === exec.currentNodeId) : null
  const order = active ? topologicalSort(active.nodes, active.edges) : []
  const positionedNodes = active?.nodes.map(n => ({
    node: n, orderIdx: order.indexOf(n.id),
    state: exec.nodeStates[n.id] || "idle",
    output: exec.nodeOutputs[n.id] || "",
    error: exec.nodeErrors[n.id] || "",
    isCurrent: n.id === exec.currentNodeId,
  })).sort((a, b) => a.orderIdx - b.orderIdx)

  return (
    <div className="space-y-6">
      {/* ── 操作栏 ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
        <button onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-all">
          + 新建
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{workflows.length} 个工作流</span>
      </div>

      {/* ── 创建弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">+ 新建人机协作工作流</h3>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="工作流名称"
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="描述"
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <select value={newCat} onChange={e => setNewCat(e.target.value as any)}
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowCreate(false)} className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm disabled:opacity-40">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          工作流详情 / 运行
          ════════════════════════════════════════ */}
      {active ? (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => { setActiveId(null); stopRun(); setViewMode("design") }}
                className="text-xs text-gray-400 hover:text-gray-600 mb-1">← 返回列表</button>
              <h2 className="text-base font-bold text-gray-800">{active.name}</h2>
              <p className="text-xs text-gray-400">{active.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* 模式切换 */}
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                <button onClick={() => { setViewMode("design"); stopRun() }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${viewMode === "design" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>🔧 设计</button>
                <button onClick={() => { setViewMode("run"); startRun() }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${viewMode === "run" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>▶ 运行</button>
              </div>
              <button onClick={() => { deleteWorkflow(active.id); refresh(); setActiveId(null) }}
                className="text-xs text-red-400 hover:text-red-600">删除</button>
            </div>
          </div>

          {/* ── 设计模式 ── */}
          {viewMode === "design" && (
            <div>
              <div className="space-y-2 mb-4">
                {active.nodes.map(node => {
                  const cfg = NODE_TYPE_CONFIG[node.type]
                  return (
                    <div key={node.id} className={`p-3 rounded-xl border-2 ${cfg.bg} ${connectingFrom === node.id ? "ring-2 ring-orange-400" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span><span className="text-sm font-semibold text-gray-800">{node.label}</span>
                          <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">{cfg.label}</span>
                          {node.assignedRole && <span className="text-xs text-gray-400">👤 {node.assignedRole}</span>}
                          {node.aiModel && <span className="text-xs text-gray-400">🤖 {node.aiModel}</span>}
                          {node.qualityGate && <span className="text-[10px] bg-green-200 text-green-700 px-1.5 py-0.5 rounded">质量门</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setConnectingFrom(connectingFrom === node.id ? null : node.id) }}
                            className={`text-[10px] px-2 py-0.5 rounded ${connectingFrom === node.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                            {connectingFrom === node.id ? "取消" : "🔗"}
                          </button>
                          <button onClick={() => { removeWorkflowNode(active.id, node.id); refresh() }}
                            className="text-xs text-gray-400 hover:text-red-500">✕</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {active.edges.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 mb-1">连线 ({active.edges.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {active.edges.map(e => {
                      const src = active.nodes.find(n => n.id === e.source); const tgt = active.nodes.find(n => n.id === e.target)
                      return <span key={e.id} className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border">{src?.label || e.source} → {tgt?.label || e.target}</span>
                    })}
                  </div>
                </div>
              )}
              {connectingFrom && (
                <div className="mb-4 p-3 bg-orange-50 rounded-xl">
                  <p className="text-xs text-orange-700">从 "{active.nodes.find(n => n.id === connectingFrom)?.label}" 连线到：</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {active.nodes.filter(n => n.id !== connectingFrom).map(n => (
                      <button key={n.id} onClick={() => handleConnect(n.id)}
                        className="text-xs bg-white border border-orange-200 hover:border-orange-400 px-3 py-1.5 rounded-lg">{NODE_TYPE_CONFIG[n.type].icon} {n.label}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowAddNode(!showAddNode)}
                className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-dashed border-gray-300">+ 添加节点</button>
              {showAddNode && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl flex flex-wrap items-end gap-3">
                  <div><label className="text-[10px] text-gray-400 block mb-1">类型</label>
                    <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as WorkflowNodeType)}
                      className="rounded-lg border bg-white px-3 py-2 text-sm">
                      {Object.entries(NODE_TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <input value={newNodeLabel} onChange={e => setNewNodeLabel(e.target.value)} placeholder="名称" className="rounded-lg border bg-white px-3 py-2 text-sm w-28" />
                  <input value={newNodeDesc} onChange={e => setNewNodeDesc(e.target.value)} placeholder="描述" className="rounded-lg border bg-white px-3 py-2 text-sm w-32" />
                  {(newNodeType === "human" || newNodeType === "review") && <input value={newNodeRole} onChange={e => setNewNodeRole(e.target.value)} placeholder="角色" className="rounded-lg border bg-white px-3 py-2 text-sm w-24" />}
                  {newNodeType === "ai" && <input value={newNodeAiModel} onChange={e => setNewNodeAiModel(e.target.value)} placeholder="模型" className="rounded-lg border bg-white px-3 py-2 text-sm w-20" />}
                  <button onClick={handleAddNode} disabled={!newNodeLabel.trim()}
                    className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm disabled:opacity-40">添加</button>
                </div>
              )}
            </div>
          )}

          {/* ── 运行模式 ── */}
          {viewMode === "run" && (
            <div>
              {/* 执行工具栏 */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <button onClick={stepNext} disabled={!exec.running}
                  className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-40">
                  ▶ {exec.currentNodeId ? "下一步" : "开始执行"}
                </button>
                <button onClick={stopRun} className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2 text-sm">
                  ⏹ 停止
                </button>
                <div className="flex-1" />
                <span className="text-xs text-gray-400">
                  {exec.currentNodeId ? `当前: ${currentNode?.label || exec.currentNodeId}` : "点击开始执行"} | {Object.values(exec.nodeStates).filter(s => s === "done").length}/{active.nodes.length} 已完成
                </span>
              </div>

              {/* 节点执行视图 */}
              <div className="space-y-2">
                {positionedNodes?.map(({ node, state, output, error, isCurrent }) => {
                  const cfg = NODE_TYPE_CONFIG[node.type]

                  return (
                    <div key={node.id} className={`p-4 rounded-xl border-2 transition-all ${
                      isCurrent ? "ring-2 ring-orange-400 shadow-md" :
                      state === "done" ? "border-green-300 bg-green-50/50 opacity-90" :
                      state === "running" ? "border-purple-300 bg-purple-50/50" :
                      "border-gray-200 bg-gray-50/30 opacity-60"
                    } ${cfg.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">{node.label}</span>
                          <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">{cfg.label}</span>
                          {node.aiModel && <span className="text-[10px] text-purple-500">🤖 {node.aiModel}</span>}
                          {node.assignedRole && <span className="text-[10px] text-blue-500">👤 {node.assignedRole}</span>}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          state === "done" ? "bg-green-200 text-green-700" :
                          state === "running" ? "bg-purple-200 text-purple-700 animate-pulse" :
                          "bg-gray-200 text-gray-400"
                        }`}>
                          {state === "done" ? "✅ 完成" : state === "running" ? "⏳ 执行中…" : "○ 待执行"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">{node.description}</p>

                      {/* 输出展示 */}
                      {output && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-green-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {output.slice(0, 1500)}
                        </div>
                      )}
                      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}

                      {/* ── 当前节点交互表单 ── */}
                      {isCurrent && exec.running && (
                        <div className="mt-3">
                          {/* Input / Human 节点：文本框 */}
                          {(node.type === "input" || node.type === "human") && (
                            <div className="space-y-2">
                              <textarea value={exec.humanInput} onChange={e => setExec(prev => ({ ...prev, humanInput: e.target.value }))}
                                placeholder={node.type === "input" ? "输入初始数据或任务描述…" : `作为${node.assignedRole || "负责人"}，请输入你的内容…`}
                                className="w-full h-24 rounded-lg border border-[#e8e5df] bg-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300" />
                              <button onClick={() => node.type === "input" ? submitInput(node.id) : submitHumanInput(node.id)}
                                disabled={!exec.humanInput.trim()}
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm disabled:opacity-40">
                                确认提交
                              </button>
                            </div>
                          )}
                          {/* Review 节点：审批 */}
                          {node.type === "review" && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500">审核上游节点的输出：</p>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setExec(prev => ({ ...prev, reviewAction: "approve" }))}
                                  className={`rounded-lg px-4 py-1.5 text-sm font-medium ${exec.reviewAction === "approve" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>✅ 通过</button>
                                <button onClick={() => setExec(prev => ({ ...prev, reviewAction: "reject" }))}
                                  className={`rounded-lg px-4 py-1.5 text-sm font-medium ${exec.reviewAction === "reject" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>❌ 驳回</button>
                              </div>
                              <textarea value={exec.reviewComment} onChange={e => setExec(prev => ({ ...prev, reviewComment: e.target.value }))}
                                placeholder="审批意见（选填）" className="w-full rounded-lg border border-[#e8e5df] bg-white p-2 text-sm resize-none" rows={2} />
                              <button onClick={() => submitReview(node.id)} disabled={!exec.reviewAction}
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm disabled:opacity-40">提交审批</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 执行完成总结 */}
              {Object.values(exec.nodeStates).filter(s => s === "done").length >= active.nodes.length && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-300 animate-fade-in">
                  <h3 className="text-sm font-bold text-green-800 mb-2">🎉 工作流执行完成</h3>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
                    <div className="bg-white p-2 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{active.nodes.length}</div>
                      <div>节点完成</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">{exec.totalAICalls}</div>
                      <div>AI 调用</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{Math.round((Date.now() - exec.startedAt) / 1000)}s</div>
                      <div>总耗时</div>
                    </div>
                  </div>
                  <button onClick={() => startRun()}
                    className="mt-3 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-sm">重新运行</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 模板 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 预置模板 — 点击直接进入运行</h3>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((tpl, i) => (
                <div key={i} onClick={() => handleUseTemplate(tpl)}
                  className="p-4 rounded-xl border border-[#e8e5df] cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">📐 {tpl.name}</h4>
                  <p className="text-xs text-gray-400 mb-2">{tpl.description}</p>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tpl.category}</span>
                  <span className="text-xs text-gray-400 ml-2">{tpl.nodes.length} 节点</span>
                </div>
              ))}
            </div>
          </div>
          {/* 我的工作流 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📐 我的工作流 ({workflows.length})</h3>
            {workflows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">还没有工作流。使用预置模板快速创建。</p>
            ) : (
              <div className="space-y-3">
                {workflows.map(wf => {
                  const h = wf.nodes.filter(n => n.type === "human" || n.type === "review").length
                  const a = wf.nodes.filter(n => n.type === "ai").length
                  return (
                    <div key={wf.id}
                      className="p-4 rounded-xl border border-[#e8e5df] cursor-pointer hover:border-orange-300 transition-all">
                      <div className="flex items-center justify-between" onClick={() => { setActiveId(wf.id); setViewMode("design") }}>
                        <div><span className="text-sm font-semibold text-gray-800">{wf.name}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-2">{wf.category}</span>
                          <p className="text-xs text-gray-400 mt-0.5">{wf.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>👤 {h}</span><span>🤖 {a}</span><span>{wf.nodes.length} 节点</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setActiveId(wf.id); setViewMode("run"); startRun() }}
                          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg">▶ 运行</button>
                        <button onClick={() => { setActiveId(wf.id); setViewMode("design") }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg">🔧 编辑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
