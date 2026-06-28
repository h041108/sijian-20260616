"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import ChatPanel from "@/components/ChatPanel"
import MindTransit from "@/components/MindTransit"
import NodeDetail from "@/components/NodeDetail"
import { analyzeImageInBrowser } from "@/lib/image-analyzer"
import { getCurrentPlan } from "@/lib/subscription"
import { saveChat, loadLatestChat, loadAllChats, deleteChat, generateTitle, SavedChat } from "@/lib/memory"
import ExperimentBar from "@/components/ExperimentBar"
import ErrorBoundary from "@/components/ErrorBoundary"
import SharedList from "@/components/SharedList"
import AuthBar from "@/components/AuthBar"
import { getCurrentUser as getAuthUser, loginAs, logout, updateUserRole, generateMockWechatLogin, registerUser } from "@/lib/auth"
import type { UserRole, SijianUser } from "@/lib/auth"
import { getLineInfo } from "@/lib/thinking-lines"
import ParentReportView from "@/components/ParentReportView"
import MindReviewCard from "@/components/MindReviewCard"
import { saveCognitionLog, FullCognitionSnapshot } from "@/lib/cognition"
import CognitionPanel from "@/components/CognitionPanel"
import VideoFactoryDashboard from "@/components/VideoFactoryDashboard"
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
    (async () => {
      const cu = await getAuthUser()
      if (cu) {
        setUser(cu)
      } else {
        const autoUser = generateMockWechatLogin("student")
        const registered = await registerUser(autoUser)
        setUser(registered)
      }
    })()
  }, [])

  const handleLogin = useCallback(async (u: SijianUser) => {
    setUser(u)
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const handleRoleChange = useCallback(async (role: UserRole) => {
    await updateUserRole(role)
    const cu = await getAuthUser()
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
                  reasoning: event.reasoning || undefined,
                } as ChatMessage : m
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
        const result = await analyzeImageInBrowser(file)
        imageData = result.dataUrl
        handleSend(`[上传: ${file.name}] 请根据这张图片内容回复`, imageData)
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

  // ── 抽屉状态 ────────────────────────────────
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showMindReview, setShowMindReview] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showVideoFactory, setShowVideoFactory] = useState(false)

  const hamburgerLinks = (
    <>
      <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 block">定价</a>
      <a href="/b-end" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 block">B端工作台</a>
      <div className="px-3 py-1.5"><SharedList /></div>
    </>
  )

  const FRAME_LABELS: Record<string, string> = {
    tree: "🌳 层级", network: "🕸️ 网络", helix: "🧬 螺旋",
    strata: "📐 分层", orbital: "🪐 轨道", pipeline: "🔗 流程",
    lens: "🔍 透镜", cycle: "🔄 循环", spectrum: "🌈 光谱",
    matrix: "📊 矩阵", diffusion: "💧 扩散",
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white">

      {/* 顶栏 — 品牌区 */}
      <div className="shrink-0 h-11 px-4 flex items-center justify-between bg-white border-b border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="text-[22px] font-extrabold tracking-tight select-none"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 40%, #EC4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            思见
          </span>
          <span className="text-[10px] font-medium hidden sm:inline-block mt-1.5"
            style={{ background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            所思即所见
          </span>
        </div>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08))" }}>
          <span className="text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366F1, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {showMobileMenu ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {/* 下拉菜单 — 桌面端+移动端共用 */}
      {showMobileMenu && (
        <div className="shrink-0 px-2 py-2 border-b border-gray-100 bg-white flex flex-col animate-fade-in">
          {hamburgerLinks}
        </div>
      )}

      {/* 主内容区 — 聊天居中 + 浮动迷你思维空间 */}
      <div className="flex-1 min-h-0 flex justify-center relative bg-[#fafafa]">
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl">
          <ChatPanel
            messages={messages} onSend={handleSend} onFileSelect={handleFileSelect} loading={loading}
            nodesCount={nodes.length}
            mindFrame={frameType}
            onToggleDrawer={() => setDrawerOpen(true)}
            onOpenVideoFactory={() => setShowVideoFactory(true)}
            extraToolbar={
              <div className="flex items-center gap-1.5">
                <AuthBar user={user} onLogin={handleLogin} onLogout={handleLogout} onRoleChange={handleRoleChange} />
                {user?.role === "parent" && (
                  <button onClick={() => setShowReport(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="思维报告">
                    <span className="text-sm">📋</span>
                  </button>
                )}
                <button onClick={() => setShowMindReview(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="思维回顾">
                  <span className="text-sm">🧠</span>
                </button>
                <button onClick={handleNewSession}
                  className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
                  新对话
                </button>
              </div>
            }
          />

          {/* 浮动迷你思维空间 — 桌面端，有节点时始终可见 */}
          {nodes.length > 0 && (
            <div className="hidden md:block fixed bottom-[130px] right-6 z-20">
              <button onClick={() => setDrawerOpen(true)}
                className="group block w-[180px] bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-indigo-300 transition-all overflow-hidden">
                <div className="px-2 py-1 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nodes[0]?.color || "#6366F1" }} />
                    {FRAME_LABELS[frameType] || "思维空间"}
                  </span>
                  <span className="text-[9px] text-gray-300">{nodes.length}节点</span>
                </div>
                <div className="w-full aspect-[4/3] bg-[#fafbfc] overflow-hidden pointer-events-none">
                  <MiniMindSpace nodes={nodes} edges={edges} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600/5">
                  <span className="text-[10px] text-white bg-gray-900/80 px-2 py-0.5 rounded-full">点击展开</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 思维空间全尺寸抽屉 ═══ */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(85vw,420px)] bg-white shadow-2xl border-r flex flex-col animate-fade-in">
            <div className="shrink-0 px-4 py-3 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">思维空间</span>
                <span className="text-[10px] text-gray-400">{FRAME_LABELS[frameType]} · {nodes.length}概念</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            {topicArchive.length > 0 && (
              <div className="shrink-0 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto border-b bg-gray-50/50">
                {topicArchive.map((t, i) => (
                  <button key={i} onClick={() => { setNodes(t.nodes); setEdges(t.edges); setDomainType(t.domain as DomainType); setFrameType(t.frame as FrameType); setTopicArchive(arch => arch.filter((_, j) => j !== i)) }}
                    className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white border hover:border-blue-300 text-gray-600">{t.topic}</button>
                ))}
              </div>
            )}
            <div className="flex-1 min-h-0 bg-[#f8fafb]">
              <ErrorBoundary name="MindTransit">
                <MindTransit nodes={nodes} edges={edges} domainType={domainType} frameType={frameType} thinkingLines={thinkingLines}
                  onNodeClick={handleNodeClick} onNodePositionChange={handleNodePositionChange} onExport={handleExport} />
              </ErrorBoundary>
              <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
            </div>
          </div>
        </>
      )}

      {/* ═══ 意识面板 ═══ */}
      <ErrorBoundary name="CognitionPanel">
        <CognitionPanel />
      </ErrorBoundary>

      {/* ═══ 思维回顾弹窗 ═══ */}
      {showMindReview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end md:justify-center"
          onClick={() => setShowMindReview(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl md:max-w-lg md:mx-auto w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 border-b flex items-center justify-between rounded-t-2xl">
              <span className="text-sm font-semibold text-gray-700">🧠 思维回顾</span>
              <button onClick={() => setShowMindReview(false)}
                className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="p-4">
              <MindReviewCard sessionId={sessionIdRef.current} onClose={() => setShowMindReview(false)} />
            </div>
          </div>
        </div>
      )}

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

      {/* ═══ 视频工厂弹窗 ═══ */}
      {showVideoFactory && (
        <div className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end md:justify-center"
          onClick={() => setShowVideoFactory(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl md:max-w-3xl md:mx-auto w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 border-b flex items-center justify-between rounded-t-2xl">
              <span className="text-sm font-semibold text-gray-700">🎬 即影</span>
              <button onClick={() => setShowVideoFactory(false)}
                className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="p-4">
              <VideoFactoryDashboard />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── MiniMindSpace: 浮动面板内的微型思维空间 ──────
function MiniMindSpace({ nodes, edges }: { nodes: MindNode[]; edges: MindEdge[] }) {
  const w = 180, h = 120
  const cx = w / 2, cy = h / 2
  const r = Math.min(55, 12 + nodes.length * 6)
  const palette = ["#6366F1","#EC4899","#F59E0B","#22C55E","#3B82F6"]

  if (nodes.length === 0) return null

  const positions: Record<string, { x: number; y: number }> = {}
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
    positions[n.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {edges.filter(e => positions[e.source] && positions[e.target]).map((e, i) => {
        const s = positions[e.source], t = positions[e.target]
        return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#e5e7eb" strokeWidth="0.8" />
      })}
      {nodes.map((n, i) => {
        const p = positions[n.id]; if (!p) return null
        const color = palette[i % palette.length]
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="white" strokeWidth="1" />
            <text x={p.x} y={p.y + 10} textAnchor="middle" fontSize="7" fill="#9ca3af" fontFamily="system-ui">
              {n.label?.slice(0, 3)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
