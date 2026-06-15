"use client"

import { useState, useCallback, useMemo } from "react"
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

const CATEGORIES: CollaborationWorkflow["category"][] = ["客户服务", "内容生产", "数据分析", "研发协作", "项目管理", "营销运营"]

// ─── 预置工作流模板 ───
const TEMPLATES: { name: string; description: string; category: CollaborationWorkflow["category"]; nodes: WorkflowNode[]; edges: WorkflowEdge[] }[] = [
  {
    name: "客户投诉处理",
    description: "AI自动分类+情感分析→人工审核+制定方案→AI起草回复→人工发送",
    category: "客户服务",
    nodes: [
      { id: "t1_in", type: "input", label: "客户投诉到达", description: "邮件/IM/电话录入", inputs: [], outputs: ["投诉原文"] },
      { id: "t1_ai1", type: "ai", label: "AI分类+情感分析", description: "自动判断投诉类型和紧急程度", aiModel: "Claude", inputs: ["投诉原文"], outputs: ["分类标签", "紧急度", "情感摘要"] },
      { id: "t1_h1", type: "human", label: "客服审核", description: "核实AI分类是否准确，制定处理方案", assignedRole: "客服专员", inputs: ["分类标签", "紧急度", "情感摘要", "投诉原文"], outputs: ["处理方案"] },
      { id: "t1_ai2", type: "ai", label: "AI起草回复", description: "根据处理方案生成回复话术", aiModel: "Claude", inputs: ["处理方案", "投诉原文"], outputs: ["回复草稿"] },
      { id: "t1_rev", type: "review", label: "人工发送", description: "审核AI回复，修改后发送", assignedRole: "客服组长", qualityGate: true, inputs: ["回复草稿"], outputs: ["最终回复"] },
      { id: "t1_out", type: "output", label: "投诉关闭", description: "归档并记录处理结果", inputs: ["最终回复"], outputs: [] },
    ],
    edges: [
      { id: "te1", source: "t1_in", target: "t1_ai1" },
      { id: "te2", source: "t1_ai1", target: "t1_h1" },
      { id: "te3", source: "t1_h1", target: "t1_ai2" },
      { id: "te4", source: "t1_ai2", target: "t1_rev" },
      { id: "te5", source: "t1_rev", target: "t1_out" },
    ],
  },
  {
    name: "周报生成与分发",
    description: "各成员提供要点→AI整合润色→主管审核→自动分发",
    category: "项目管理",
    nodes: [
      { id: "w1_in", type: "input", label: "成员提交要点", description: "各成员提交本周工作要点", inputs: [], outputs: ["成员要点列表"] },
      { id: "w1_ai", type: "ai", label: "AI整合+润色", description: "将零散要点整合为结构化的团队周报", aiModel: "Claude", inputs: ["成员要点列表"], outputs: ["周报草稿"] },
      { id: "w1_h", type: "human", label: "主管审核", description: "补充战略视角的点评，调整优先级", assignedRole: "Team Lead", inputs: ["周报草稿"], outputs: ["最终周报"] },
      { id: "w1_rev", type: "review", label: "自动分发", description: "发送到邮件组+企业微信群", qualityGate: true, inputs: ["最终周报"], outputs: [] },
      { id: "w1_out", type: "output", label: "归档", description: "存入知识库", inputs: [], outputs: [] },
    ],
    edges: [
      { id: "we1", source: "w1_in", target: "w1_ai" },
      { id: "we2", source: "w1_ai", target: "w1_h" },
      { id: "we3", source: "w1_h", target: "w1_rev" },
      { id: "we4", source: "w1_rev", target: "w1_out" },
    ],
  },
  {
    name: "竞品分析报告",
    description: "AI抓取+分析数据→人工深度解读→AI制图→人工发布",
    category: "数据分析",
    nodes: [
      { id: "c1_in", type: "input", label: "分析需求", description: "明确分析范围：竞品名称、维度、周期", inputs: [], outputs: ["分析需求"] },
      { id: "c1_ai1", type: "ai", label: "AI数据收集+初筛", description: "从公开信息抓取竞品数据，初步结构化", aiModel: "Perplexity + Claude", inputs: ["分析需求"], outputs: ["原始数据"] },
      { id: "c1_h1", type: "human", label: "分析师深度分析", description: "基于原始数据进行战略解读，发现洞察", assignedRole: "市场分析师", inputs: ["原始数据"], outputs: ["分析洞察"] },
      { id: "c1_ai2", type: "ai", label: "AI生成图表", description: "将分析洞察自动生成可视化图表", aiModel: "Napkin AI", inputs: ["分析洞察"], outputs: ["图表"] },
      { id: "c1_rev", type: "review", label: "报告终审", description: "审核数据准确性和战略建议", qualityGate: true, assignedRole: "市场总监", inputs: ["图表", "分析洞察"], outputs: ["最终报告"] },
      { id: "c1_out", type: "output", label: "发布", description: "分享给管理层", inputs: ["最终报告"], outputs: [] },
    ],
    edges: [
      { id: "ce1", source: "c1_in", target: "c1_ai1" },
      { id: "ce2", source: "c1_ai1", target: "c1_h1" },
      { id: "ce3", source: "c1_h1", target: "c1_ai2" },
      { id: "ce4", source: "c1_ai2", target: "c1_rev" },
      { id: "ce5", source: "c1_rev", target: "c1_out" },
    ],
  },
]

export default function L4HumanAICollab() {
  const [workflows, setWorkflows] = useState<CollaborationWorkflow[]>(() => loadWorkflows())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newDept, setNewDept] = useState("全员")
  const [newCat, setNewCat] = useState<CollaborationWorkflow["category"]>("内容生产")
  const [showAddNode, setShowAddNode] = useState(false)
  const [newNodeLabel, setNewNodeLabel] = useState("")
  const [newNodeType, setNewNodeType] = useState<WorkflowNodeType>("human")
  const [newNodeDesc, setNewNodeDesc] = useState("")
  const [newNodeRole, setNewNodeRole] = useState("")
  const [newNodeAiModel, setNewNodeAiModel] = useState("")
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  const active = activeId ? workflows.find(w => w.id === activeId) : null

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return
    createWorkflow(newName.trim(), newDesc.trim(), newDept, newCat)
    setWorkflows(loadWorkflows())
    setShowCreate(false); setNewName(""); setNewDesc("")
  }, [newName, newDesc, newDept, newCat])

  const handleDeleteWorkflow = useCallback((id: string) => {
    deleteWorkflow(id)
    setWorkflows(loadWorkflows())
    setActiveId(null)
  }, [])

  const handleAddNode = useCallback(() => {
    if (!active || !newNodeLabel.trim()) return
    const node: WorkflowNode = {
      id: `n_${Date.now()}`,
      type: newNodeType,
      label: newNodeLabel.trim(),
      description: newNodeDesc.trim() || newNodeLabel.trim(),
      assignedRole: newNodeRole || undefined,
      aiModel: newNodeAiModel || undefined,
      qualityGate: newNodeType === "review",
      inputs: [],
      outputs: [],
    }
    addWorkflowNode(active.id, node)
    setWorkflows(loadWorkflows())
    setShowAddNode(false)
    setNewNodeLabel(""); setNewNodeDesc(""); setNewNodeRole(""); setNewNodeAiModel("")
  }, [active, newNodeLabel, newNodeType, newNodeDesc, newNodeRole, newNodeAiModel])

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!active) return
    removeWorkflowNode(active.id, nodeId)
    setWorkflows(loadWorkflows())
  }, [active])

  const handleConnect = useCallback((targetId: string) => {
    if (!active || !connectingFrom) return
    // 检查是否已存在
    if (active.edges.some(e => e.source === connectingFrom && e.target === targetId)) {
      setConnectingFrom(null)
      return
    }
    const edge: WorkflowEdge = {
      id: `e_${Date.now()}`,
      source: connectingFrom,
      target: targetId,
    }
    addWorkflowEdge(active.id, edge)
    setWorkflows(loadWorkflows())
    setConnectingFrom(null)
  }, [active, connectingFrom])

  const handleUseTemplate = useCallback((template: typeof TEMPLATES[0]) => {
    const wf = createWorkflow(template.name, template.description, "全员", template.category)
    // 替换默认节点
    updateWorkflow(wf.id, { nodes: template.nodes, edges: template.edges })
    setWorkflows(loadWorkflows())
    setActiveId(wf.id)
  }, [])

  return (
    <div className="space-y-6">
      {/* ── 操作栏 ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-all">
          + 新建工作流
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{workflows.length} 个工作流</span>
      </div>

      {/* ── 创建工作流弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">+ 新建人机协作工作流</h3>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="工作流名称"
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="描述"
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <select value={newCat} onChange={e => setNewCat(e.target.value as CollaborationWorkflow["category"])}
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm disabled:opacity-40">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 工作流详情 ── */}
      {active ? (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => setActiveId(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-1">← 返回列表</button>
              <h2 className="text-base font-bold text-gray-800">{active.name}</h2>
              <p className="text-xs text-gray-400">{active.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDeleteWorkflow(active.id)}
                className="text-xs text-red-400 hover:text-red-600">删除</button>
            </div>
          </div>

          {/* 节点可视化 */}
          <div className="space-y-2 mb-4">
            {active.nodes.map(node => {
              const cfg = NODE_TYPE_CONFIG[node.type]
              const isConnecting = connectingFrom === node.id
              return (
                <div key={node.id} className={`relative p-3 rounded-xl border-2 ${cfg.bg} ${isConnecting ? "ring-2 ring-orange-400" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">{node.label}</span>
                      <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">{cfg.label}</span>
                      {node.assignedRole && <span className="text-xs text-gray-400">👤 {node.assignedRole}</span>}
                      {node.aiModel && <span className="text-xs text-gray-400">🤖 {node.aiModel}</span>}
                      {node.qualityGate && <span className="text-[10px] bg-green-200 text-green-700 px-1.5 py-0.5 rounded">质量门</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setConnectingFrom(connectingFrom === node.id ? null : node.id) }}
                        className={`text-[10px] px-2 py-0.5 rounded ${isConnecting ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-100"}`}>
                        {isConnecting ? "取消连线" : "🔗 连线"}
                      </button>
                      <button onClick={() => handleDeleteNode(node.id)}
                        className="text-xs text-gray-400 hover:text-red-500 ml-1">✕</button>
                    </div>
                  </div>
                  {isConnecting && (
                    <div className="mt-2 text-xs text-orange-600">
                      点击目标节点完成连线 →
                    </div>
                  )}
                </div>
              )
            })}
            {/* 连线可视化：用arrow符号显示 */}
            {active.edges.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl border border-[#e8e5df]">
                <p className="text-[10px] text-gray-400 mb-2">连线关系 ({active.edges.length})</p>
                <div className="flex flex-wrap gap-2">
                  {active.edges.map(e => {
                    const src = active.nodes.find(n => n.id === e.source)
                    const tgt = active.nodes.find(n => n.id === e.target)
                    return (
                      <span key={e.id} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                        {src?.label || e.source} → {tgt?.label || e.target}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 节点间连线快捷操作 */}
          {connectingFrom && (
            <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-xs text-orange-700">点击目标节点完成连线（从 "{active.nodes.find(n => n.id === connectingFrom)?.label}" 出发）</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {active.nodes.filter(n => n.id !== connectingFrom).map(n => (
                  <button key={n.id} onClick={() => handleConnect(n.id)}
                    className="text-xs bg-white border border-orange-200 hover:border-orange-400 px-3 py-1.5 rounded-lg transition-all">
                    {NODE_TYPE_CONFIG[n.type].icon} {n.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 添加节点 */}
          <button onClick={() => setShowAddNode(!showAddNode)}
            className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-dashed border-gray-300">
            {showAddNode ? "取消添加" : "+ 添加节点"}
          </button>
          {showAddNode && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-[#e8e5df] flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">类型</label>
                <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as WorkflowNodeType)}
                  className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-sm">
                  {Object.entries(NODE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <input value={newNodeLabel} onChange={e => setNewNodeLabel(e.target.value)}
                placeholder="节点名称" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-sm w-32" />
              <input value={newNodeDesc} onChange={e => setNewNodeDesc(e.target.value)}
                placeholder="描述" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-sm w-40" />
              {newNodeType === "human" || newNodeType === "review" ? (
                <input value={newNodeRole} onChange={e => setNewNodeRole(e.target.value)}
                  placeholder="角色" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-sm w-28" />
              ) : null}
              {newNodeType === "ai" ? (
                <input value={newNodeAiModel} onChange={e => setNewNodeAiModel(e.target.value)}
                  placeholder="AI模型" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-sm w-36" />
              ) : null}
              <button onClick={handleAddNode} disabled={!newNodeLabel.trim()}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm disabled:opacity-40">添加</button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── 预置模板 ── */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 预置模板</h3>
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

          {/* ── 我的工作流 ── */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📐 我的工作流 ({workflows.length})</h3>
            {workflows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">还没有工作流。使用预置模板快速创建，或新建空白工作流。</p>
            ) : (
              <div className="space-y-3">
                {workflows.map(wf => {
                  const humanNodes = wf.nodes.filter(n => n.type === "human" || n.type === "review").length
                  const aiNodes = wf.nodes.filter(n => n.type === "ai").length
                  return (
                    <div key={wf.id} onClick={() => setActiveId(wf.id)}
                      className="p-4 rounded-xl border border-[#e8e5df] cursor-pointer hover:border-orange-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">{wf.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{wf.category}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{wf.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>👤 {humanNodes}</span>
                          <span>🤖 {aiNodes}</span>
                          <span className="text-xs text-gray-400">{wf.nodes.length} 节点</span>
                        </div>
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
