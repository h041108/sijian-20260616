"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import ChatPanel from "@/components/ChatPanel"
import MindTransit from "@/components/MindTransit"
import NodeDetail from "@/components/NodeDetail"
import { analyzeImageInBrowser } from "@/lib/image-analyzer"
import { incrementChatCount, canChat, getCurrentPlan } from "@/lib/subscription"
import { saveChat, loadLatestChat, loadAllChats, deleteChat, generateTitle, SavedChat } from "@/lib/memory"
import ExperimentBar from "@/components/ExperimentBar"
import SharedList from "@/components/SharedList"
import AuthBar from "@/components/AuthBar"
import { getCurrentUser, loginAs, logout, updateUserRole, UserRole, SijianUser } from "@/lib/sijian-user"
import { getLineInfo } from "@/lib/thinking-lines"
import ParentReportView from "@/components/ParentReportView"
import { saveCognitionLog, FullCognitionSnapshot } from "@/lib/cognition"
import CognitionPanel from "@/components/CognitionPanel"
import type {
  ChatMessage, MindNode, MindEdge, MindSpaceState,
  Position, DomainType, FrameType,
} from "@/lib/types"

// ─── 工具 ───────────────────────────────────────────

function genId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// API 返回的 position 可能是数组 [x,y,z]，统一转成 {x,y,z}
function normalizePosition(
  p: Position | [number, number, number] | undefined | null,
): Position {
  if (!p) return { x: 0, y: 0, z: 0 }
  if (Array.isArray(p)) return { x: p[0], y: p[1], z: p[2] }
  return p
}

// 将新节点按合理间距分布到3D空间
function layoutNodes(nodes: MindNode[]): MindNode[] {
  if (nodes.length === 0) return nodes
  // 半径随节点数适度增长，但不超过4.5
  const radius = Math.min(4.5, Math.max(2.2, 1.8 + nodes.length * 0.25))
  const spreadY = Math.min(2, nodes.length * 0.15)
  return nodes.map((node, i) => {
    if (node.position && (node.position.x !== 0 || node.position.y !== 0 || node.position.z !== 0)) {
      return node
    }
    const angle = (i / nodes.length) * Math.PI * 2
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * spreadY,
        z: (i % 3 - 1) * 1.2,
      },
    }
  })
}

// ─── 主页面 ─────────────────────────────────────────

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [nodes, setNodes] = useState<MindNode[]>([])
  const [edges, setEdges] = useState<MindEdge[]>([])
  const [topicArchive, setTopicArchive] = useState<{topic:string; nodes:MindNode[]; edges:MindEdge[]; domain:string; frame:string; time:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null)
  const [domainType, setDomainType] = useState<DomainType>("general")
  const [frameType, setFrameType] = useState<FrameType>("tree")
  const [thinkingLines, setThinkingLines] = useState<{ lineId: string; confidence: number; triggers: string[] }[]>([])
  const [chatList, setChatList] = useState<SavedChat[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const sessionIdRef = useRef(genId())

  // 消息队列：loading 期间用户可继续输入，消息排队处理
  const messagesRef = useRef(messages)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const loadingRef = useRef(false)
  const queueRef = useRef<{ content: string; imageData?: string }[]>([])
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])
  useEffect(() => { loadingRef.current = loading }, [loading])

  // ── 用户状态 ─────────────────────────────────
  const [user, setUser] = useState<SijianUser | null>(null)

  useEffect(() => {
    const cu = getCurrentUser()
    if (cu) setUser(cu)
  }, [])

  const handleLogin = useCallback((u: SijianUser) => {
    setUser(u)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    setUser(null)
  }, [])

  const handleRoleChange = useCallback((role: UserRole) => {
    updateUserRole(role)
    const cu = getCurrentUser()
    if (cu) setUser({ ...cu, role })
  }, [])

  // ── 记忆：页面加载时恢复上次对话 ──────────────────
  useEffect(() => {
    const all = loadAllChats()
    setChatList(all)
    const latest = loadLatestChat()
    if (latest?.messages?.length) {
      setMessages(latest.messages)
      setNodes(latest.nodes || [])
      setEdges(latest.edges || [])
      setDomainType((latest.domainType || "general") as DomainType)
      setFrameType((latest.frameType || "tree") as FrameType)
      sessionIdRef.current = latest.createdAt || genId()
    }
  }, [])

  // ── 记忆：每次对话完成后保存（等 loading 从 true 变 false） ──
  const prevLoadingRef = useRef(false)
  useEffect(() => {
    // 只在 loading 从 true 变成 false 时保存（一轮对话刚完成）
    if (prevLoadingRef.current && !loading && messages.length > 0) {
      const timer = setTimeout(() => {
        saveChat({
          messages, nodes, edges,
          domainType, frameType,
          title: messages.find(m => m.role === "user")?.content?.slice(0, 30) || "新对话",
          createdAt: sessionIdRef.current,
          updatedAt: new Date().toISOString(),
        })
        setChatList(loadAllChats())
      }, 300)
      return () => clearTimeout(timer)
    }
    prevLoadingRef.current = loading
  }, [loading])
  const handleLoadChat = useCallback((chat: SavedChat) => {
    setMessages(chat.messages || [])
    setNodes(chat.nodes || [])
    setEdges(chat.edges || [])
    setDomainType((chat.domainType || "general") as DomainType)
    setFrameType((chat.frameType || "tree") as FrameType)
    sessionIdRef.current = chat.createdAt
    setShowHistory(false)
  }, [])

  // ── 发送消息（流式 + 队列：可连续输入）──

  const sendOne = useCallback(async (content: string, imageData?: string) => {
    const msgs = messagesRef.current
    const nds = nodesRef.current

    const userMsg: ChatMessage = {
      id: genId(), sessionId: sessionIdRef.current,
      role: "user", content, createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    // 创建 AI 消息占位
    const aiMsgId = genId()
    setMessages((prev) => [...prev, {
      id: aiMsgId, sessionId: sessionIdRef.current,
      role: "assistant", content: "", createdAt: new Date().toISOString(),
    }])

    try {
      const apiMessages = [...msgs, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, existingNodes: nds.map(n => ({ id: n.id, label: n.label, content: n.content })), imageData: imageData || null, stream: true }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => prev.map(m => m.id === aiMsgId ? { ...m, content: "抱歉，连接出了点问题。" } : m))
        return
      }

      // 读取 SSE 流
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const jsonStr = trimmed.slice(6)

          try {
            const event = JSON.parse(jsonStr)
            if (event.type === "token") {
              fullContent += event.content
              setMessages((prev) => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullContent } : m
              ))
            } else if (event.type === "done") {
              fullContent = event.message
              setMessages((prev) => prev.map(m =>
                m.id === aiMsgId ? {
                  ...m, content: event.message,
                  mindSpace: event.mindSpaceUpdate,
                  domainType: event.domain_type || "general",
                } : m
              ))

              // 记录认知日志
              if (event.cognition) {
                const cog = event.cognition as FullCognitionSnapshot
                saveCognitionLog({
                  timestamp: new Date().toISOString(),
                  userId: user?.id || "anonymous",
                  state: cog.l1.state,
                  intent: cog.l2.intent,
                  emotion: cog.l3.emotion,
                  cognitiveLoad: cog.l3.cognitiveLoad,
                  dominantLines: cog.l1.dominantLines,
                  messageLength: content.length,
                  sessionId: sessionIdRef.current,
                })
              }

              // 更新 domain/frame
              if (event.domain_type) setDomainType(event.domain_type)
              if (event.mindSpaceUpdate?.frameType) setFrameType(event.mindSpaceUpdate.frameType)

              // 更新思维空间
              const update = event.mindSpaceUpdate
              if (update?.nodes?.length) {
                setNodes((prev) => {
                  const newLabels = update.nodes.map((n: MindNode) => n.label)
                  const anyOverlap = newLabels.some((l: string) => new Set(prev.map(n => n.label)).has(l))
                  const isNewTopic = prev.length > 0 && !anyOverlap

                  if (isNewTopic) {
                    const lastTopic = messagesRef.current.filter(m => m.role === "user").pop()?.content?.slice(0, 30) || "对话"
                    setTopicArchive(arch => [...arch, {
                      topic: lastTopic, nodes: [...prev], edges: [...edgesRef.current],
                      domain: domainType, frame: frameType, time: new Date().toISOString()
                    }])
                  }

                  const base = isNewTopic ? [] : [...prev]
                  for (const nn of update.nodes) {
                    const existingIdx = base.findIndex((n) => n.id === nn.id)
                    if (existingIdx >= 0) base[existingIdx] = { ...base[existingIdx], ...nn, position: base[existingIdx].position }
                    else base.push({ ...nn, position: normalizePosition(nn.position) })
                  }
                  return layoutNodes(base)
                })
              }
              if (update?.edges?.length) {
                setEdges((prev) => {
                  const keys = new Set(prev.map((e) => `${e.source}→${e.target}`))
                  return [...prev, ...update.edges.filter((e: MindEdge) => !keys.has(`${e.source}→${e.target}`))]
                })
              }
            } else if (event.type === "error") {
              setMessages((prev) => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: event.content } : m
              ))
            }
          } catch { /* skip malformed event */ }
        }
      }

      // Ensure message is not empty
      setMessages((prev) => prev.map(m =>
        m.id === aiMsgId && !m.content ? { ...m, content: "…" } : m
      ))
    } catch {
      setMessages((prev) => prev.map(m =>
        m.id === aiMsgId ? { ...m, content: "抱歉，连接似乎出了点问题，请稍后再试。" } : m
      ))
    }
  }, [])

  // 队列处理器
  const processQueue = useCallback(async () => {
    const q = queueRef.current
    if (q.length === 0) { setLoading(false); return }
    const next = q.shift()!
    await sendOne(next.content, next.imageData)
    processQueue()
  }, [sendOne])

  const handleSend = useCallback((content: string, imageData?: string) => {
    queueRef.current.push({ content, imageData })
    if (!loadingRef.current) {
      setLoading(true)
      processQueue()
    }
  }, [processQueue])

  // ── 节点操作 ────────────────────────────────────

  const handleNodeClick = useCallback((node: MindNode) => {
    setSelectedNode(node)
  }, [])

  const handleNodePositionChange = useCallback(
    (id: string, position: Position) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, position } : n)),
      )
    },
    [],
  )

  // ── 导出思维空间 ──────────────────────────────

  const handleExport = useCallback(() => {
    const data = { nodes, edges, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mindspace-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  // ── 文件上传 ──────────────────────────────────

  const handleFileSelect = useCallback(
    async (file: File) => {
      // 先异步上传到服务器存档
      const formData = new FormData()
      formData.append("file", file)
      fetch("/api/upload", { method: "POST", body: formData }).catch(() => {})

      // 如果是图片，读取为 base64 传给 AI 做视觉识别
      const isImage = file.type.startsWith("image/")
      let imageData: string | undefined = undefined

      if (isImage) {
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        // 浏览器端分析图片特征
        const analysis = await analyzeImageInBrowser(file)

        // 判断是否为图表类图片，使用不同的引导提示词
        const isChart = analysis.includes("图表")
          || analysis.includes("K线图")
          || analysis.includes("表格")
          || analysis.includes("走势")

        let aiPrompt: string
        if (isChart) {
          aiPrompt = `[用户上传了一张图片: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]

以下是浏览器对该图片的视觉分析：
${analysis}

请像一个经验丰富的分析师一样，根据以上视觉特征数据反推这张图表可能的内容：
1. 如果有红/绿色块+网格+时间轴特征，这很可能是一张K线图或股票走势图。红色和绿色代表涨跌蜡烛，下半部分的密集方形可能是成交量柱。
2. 根据"视觉亮点区域"的颜色分布，尝试推断图表的关键区域——深色集中区可能是K线密集区或关键支撑位，亮区可能是空白区域或坐标轴标签。
3. 如果有明显的水平边缘线（>6%），说明有文字行或坐标线；如果有明显的垂直边缘线（>5%），说明有柱状图或K线柱体。

请用"我看到这是一张……大概在说……"的句式自然地描述你的推断，然后一定要输出<m>标签将图表的核心要素（比如"趋势""支撑位""成交量"等概念）构建成思维空间。`
        } else {
          aiPrompt = `[用户上传了一张图片: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]

以下是浏览器对该图片的视觉分析：
${analysis}

请根据以上视觉分析结果，推测这张图片可能是什么内容，用"我看到你上传了一张……"开头回复。一定要用<m>标签将你对图片的理解构造成思维空间。`
        }
        handleSend(aiPrompt, imageData)
      } else {
        const fileInfo = `[上传了文件: ${file.name} (${(file.size / 1024).toFixed(1)}KB, ${file.type || "未知类型"})]`
        handleSend(fileInfo)
      }
    },
    [handleSend],
  )

  // ── 新对话 ──────────────────────────────────────

  const handleNewSession = useCallback(() => {
    setMessages([])
    setNodes([])
    setEdges([])
    setSelectedNode(null)
    setDomainType("general")
    setFrameType("tree")
    sessionIdRef.current = genId()
    // 保存空状态，下次加载时不恢复旧对话
    saveChat({
      messages: [], nodes: [], edges: [],
      domainType: "general", frameType: "tree",
      title: "新对话",
      createdAt: sessionIdRef.current,
      updatedAt: new Date().toISOString(),
    })
    setChatList(loadAllChats())
  }, [])

  // ── 移动端状态 ────────────────────────────
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [mindExpanded, setMindExpanded] = useState(false)

  const headerLinks = (
    <>
      <a href="/pricing"
        className="text-[11px] text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        定价
      </a>
      <a href="/b-end"
        className="text-[11px] text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        B端
      </a>
      <SharedList />
      <button onClick={handleNewSession}
        className="text-[11px] text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        新对话
      </button>
    </>
  )

  const FRAME_LABELS: Record<string, string> = {
    tree: "🌳 层级", network: "🕸️ 网络", helix: "🧬 螺旋",
    strata: "📐 分层", orbital: "🪐 轨道", pipeline: "🔗 流程",
    lens: "🔍 透镜", cycle: "🔄 循环", spectrum: "🌈 光谱",
    matrix: "📊 矩阵", diffusion: "💧 扩散",
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden page-enter">

      {/* ═══════════════════════════════════════════
          移动端布局：上下分区
          ═══════════════════════════════════════════ */}

      {/* ── 移动端顶部栏 ── */}
      <div className="md:hidden shrink-0 px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white/95 backdrop-blur-sm safe-top">
        <h1 className="text-[15px] font-bold text-gray-900">思见</h1>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowReport(true)}
            className="text-xs font-medium text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition-all">
            📋 报告
          </button>
          <AuthBar user={user} onLogin={handleLogin} onLogout={handleLogout} onRoleChange={handleRoleChange} />
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-gray-500 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            {showMobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ── 移动端下拉菜单 ── */}
      {showMobileMenu && (
        <div className="md:hidden shrink-0 px-4 py-2 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto animate-fade-in">
          {headerLinks}
        </div>
      )}

      {/* ── 移动端：思维空间 38.2% / 聊天 61.8% 黄金分割 ── */}
      {nodes.length > 0 && (
        <div className={`md:hidden shrink-0 border-b border-[#c8dce8] bg-white transition-all duration-300 ${
          mindExpanded ? "h-[55vh]" : "h-[38.2vh]"
        }`}>
          {/* 折叠栏 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#e8f4f8]/60">
            <button onClick={() => setMindExpanded(!mindExpanded)}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800">
              <span>{mindExpanded ? "▾" : "▸"}</span>
              <span className="font-medium">
                {FRAME_LABELS[frameType] || "思维空间"}
              </span>
              <span className="text-gray-300">·</span>
              <span>{nodes.length}概念</span>
              {thinkingLines?.[0] && (
                <span className="text-gray-300">·</span>
              )}
              {thinkingLines?.[0] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: (getLineInfo(thinkingLines[0].lineId as any)?.color || "#6366F1") + "18",
                    color: getLineInfo(thinkingLines[0].lineId as any)?.color || "#6366F1"
                  }}>
                  {thinkingLines[0].lineId}
                </span>
              )}
            </button>
            {topicArchive.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-[50%]">
                {topicArchive.slice(-3).map((t, i) => (
                  <button key={i}
                    onClick={() => {
                      setNodes(t.nodes); setEdges(t.edges)
                      setDomainType(t.domain as DomainType); setFrameType(t.frame as FrameType)
                      setTopicArchive(arch => arch.filter((_, j) => j !== i))
                    }}
                    className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-[#c8dce8] text-gray-500">
                    {t.topic}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 思维空间内容 */}
          <div className={`${mindExpanded ? "h-[calc(55vh-32px)]" : "h-[calc(28vh-32px)]"}`}>
            <MindTransit
              nodes={nodes} edges={edges}
              domainType={domainType} frameType={frameType}
              thinkingLines={thinkingLines}
              onNodeClick={handleNodeClick}
              onExport={handleExport}
            />
          </div>
        </div>
      )}

      {/* ── 移动端：聊天区（~2/3 或全屏）── */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col" style={{ background: "#e8f5e9" }}>
        <ChatPanel
          messages={messages} onSend={handleSend} onFileSelect={handleFileSelect} loading={loading}
        />
      </div>


      {/* ═══════════════════════════════════════════
          桌面端布局：左右分栏（不变）
          ═══════════════════════════════════════════ */}

      {/* 左侧 思维空间 */}
      <div className="hidden md:flex md:w-[38.2%] min-w-0 h-full flex-col" style={{ background: "#e8f4f8" }}>
        {topicArchive.length > 0 && (
          <div className="shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-[#c8dce8] bg-white/50">
            <span className="text-[10px] text-gray-400 shrink-0">📂 话题:</span>
            {topicArchive.map((topic, i) => (
              <button key={i}
                onClick={() => {
                  setNodes(topic.nodes); setEdges(topic.edges)
                  setDomainType(topic.domain as DomainType); setFrameType(topic.frame as FrameType)
                  setTopicArchive(arch => arch.filter((_, j) => j !== i))
                }}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#c8dce8] hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-600">
                {topic.topic}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <MindTransit
            nodes={nodes} edges={edges}
            domainType={domainType} frameType={frameType}
            thinkingLines={thinkingLines}
            onNodeClick={handleNodeClick}
            onNodePositionChange={handleNodePositionChange}
            onExport={handleExport}
          />
          <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      </div>

      {/* 右侧 聊天 */}
      <div className="hidden md:flex md:w-[61.8%] min-w-0 h-full border-l border-[#c8e6c9] flex-col"
        style={{ background: "#e8f5e9" }}>
        <div className="px-5 py-3.5 border-b border-[#c8e6c9] flex items-center justify-between shrink-0 bg-white/60 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">思见</h1>
            <p className="text-sm text-gray-500 mt-0.5">所思即所见</p>
          </div>
          <div className="flex items-center gap-2">
            <AuthBar user={user} onLogin={handleLogin} onLogout={handleLogout} onRoleChange={handleRoleChange} />
            {headerLinks}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel
            messages={messages} onSend={handleSend} onFileSelect={handleFileSelect} loading={loading}
          />
        </div>
      </div>

      {/* ═══ 意识面板 ═══ */}
      <CognitionPanel />

      {/* ═══ 家长思维报告弹窗 ═══ */}
      {showReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end md:justify-center"
          onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl md:max-w-lg md:mx-auto w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 border-b flex items-center justify-between rounded-t-2xl">
              <span className="text-sm font-semibold text-gray-700">📋 思维报告</span>
              <button onClick={() => setShowReport(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="p-2">
              <ParentReportView />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
