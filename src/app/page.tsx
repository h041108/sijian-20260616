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

  // ── 发送消息 ────────────────────────────────────

  const handleSend = useCallback(
    async (content: string, imageData?: string) => {
      // 内测期间：不做任何使用限制

      const userMsg: ChatMessage = {
        id: genId(),
        sessionId: sessionIdRef.current,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            existingNodes: nodes.map((n) => ({
              id: n.id,
              label: n.label,
              content: n.content,
            })),
            imageData: imageData || null,
          }),
        })

        const data = await res.json()

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              sessionId: sessionIdRef.current,
              role: "assistant",
              content: data.error,
              createdAt: new Date().toISOString(),
            },
          ])
        } else {
          const update = data.mindSpaceUpdate as MindSpaceState

          // 提取领域类型和框架类型
          if (data.domain_type) setDomainType(data.domain_type)
          if (data.mindSpaceUpdate?.frameType) setFrameType(data.mindSpaceUpdate.frameType)
          if (data.thinkingLines) setThinkingLines(data.thinkingLines)

          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              sessionId: sessionIdRef.current,
              role: "assistant",
              content: data.message,
              mindSpace: update,
              domainType: data.domain_type || "general",
              createdAt: new Date().toISOString(),
            },
          ])

          // 更新思维空间：检测是否为新话题
          if (update.nodes?.length) {
            setNodes((prev) => {
              // 新话题检测：新节点标签与旧节点标签无任何重叠 → 替换
              const oldLabels = new Set(prev.map(n => n.label))
              const newLabels = update.nodes.map((n: MindNode) => n.label)
              const anyOverlap = newLabels.some((l: string) => oldLabels.has(l))
              const isNewTopic = prev.length > 0 && !anyOverlap

              // 新话题切换时，先把旧话题存到档
              if (isNewTopic) {
                const lastTopic = messages.filter(m => m.role === "user").pop()?.content?.slice(0, 30) || "对话"
                setTopicArchive(arch => [...arch, {
                  topic: lastTopic, nodes: [...prev], edges: [...edges],
                  domain: domainType, frame: frameType,
                  time: new Date().toISOString()
                }])
              }

              const base = isNewTopic ? [] : [...prev]

              for (const nn of update.nodes) {
                const existingIdx = base.findIndex((n) => n.id === nn.id)
                if (existingIdx >= 0) {
                  base[existingIdx] = { ...base[existingIdx], ...nn, position: base[existingIdx].position }
                } else {
                  base.push({ ...nn, position: normalizePosition(nn.position) })
                }
              }
              return layoutNodes(base)
            })
          }

          if (update.edges?.length) {
            setEdges((prev) => {
              const existingKeys = new Set(prev.map((e) => `${e.source}→${e.target}`))
              const toAdd = update.edges.filter((e) => !existingKeys.has(`${e.source}→${e.target}`))
              return [...prev, ...toAdd]
            })
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            sessionId: sessionIdRef.current,
            role: "assistant",
            content: "抱歉，连接似乎出了点问题，请稍后再试。",
            createdAt: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, nodes],
  )

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

  // ── 移动端标签切换 ──────────────────────────
  const [mobileTab, setMobileTab] = useState<"mind" | "chat">("chat")
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const headerLinks = (
    <>
      <a href="/pricing"
        className="text-xs text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        定价
      </a>
      <a href="/b-end"
        className="text-xs text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        B端
      </a>
      <SharedList />
      <button onClick={handleNewSession}
        className="text-xs text-gray-500 hover:text-gray-800 transition-all px-2 py-1 rounded-lg border border-[#a5d6a7] hover:bg-[#c8e6c9] whitespace-nowrap">
        新对话
      </button>
    </>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen page-enter">

      {/* ═══ 移动端顶部栏 ═══ */}
      <div className="md:hidden shrink-0 px-3 py-2 border-b border-[#c8e6c9] flex items-center justify-between bg-white/90">
        <div>
          <h1 className="text-sm font-bold text-gray-900">推信 · 思见</h1>
        </div>
        <div className="flex items-center gap-1">
          <AuthBar user={user} onLogin={handleLogin} onLogout={handleLogout} onRoleChange={handleRoleChange} />
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-xs text-gray-500 px-2 py-1 rounded-lg border border-[#a5d6a7]">
            {showMobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {/* 移动端下拉菜单 */}
      {showMobileMenu && (
        <div className="md:hidden shrink-0 px-3 py-2 border-b border-[#c8e6c9] bg-white flex items-center gap-2 overflow-x-auto">
          {headerLinks}
        </div>
      )}

      {/* ═══ 左侧 思维空间 ═══ */}
      <div className={`${mobileTab === "mind" ? "flex" : "hidden"} md:flex md:w-1/2 min-w-0 h-full flex-col`}
        style={{ background: "#e8f4f8" }}>

        {/* 话题归档 */}
        {topicArchive.length > 0 && (
          <div className="shrink-0 px-3 md:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto border-b border-[#c8dce8] bg-white/50">
            <span className="text-[10px] text-gray-400 shrink-0">📂</span>
            {topicArchive.map((topic, i) => (
              <button key={i}
                onClick={() => {
                  setNodes(topic.nodes); setEdges(topic.edges)
                  setDomainType(topic.domain as DomainType); setFrameType(topic.frame as FrameType)
                  setTopicArchive(arch => arch.filter((_, j) => j !== i))
                }}
                className="shrink-0 text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#c8dce8] hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-600">
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

      {/* ═══ 右侧聊天面板 ═══ */}
      <div className={`${mobileTab === "chat" ? "flex" : "hidden"} md:flex md:w-1/2 min-w-0 h-full md:border-l border-[#c8e6c9] flex-col`}
        style={{ background: "#e8f5e9" }}>

        {/* 品牌 — 桌面端 */}
        <div className="hidden md:flex px-5 py-3.5 border-b border-[#c8e6c9] items-center justify-between shrink-0 bg-white/60 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">推信 · 思见</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">所思即所见</p>
          </div>
          <div className="flex items-center gap-2">
            <AuthBar user={user} onLogin={handleLogin} onLogout={handleLogout} onRoleChange={handleRoleChange} />
            {headerLinks}
          </div>
        </div>

        {/* 聊天 */}
        <div className="flex-1 min-h-0">
          <ChatPanel
            messages={messages} onSend={handleSend} onFileSelect={handleFileSelect} loading={loading}
          />
        </div>
      </div>

      {/* ═══ 移动端底部标签栏 ═══ */}
      <div className="md:hidden shrink-0 h-14 border-t border-[#c8e6c9] bg-white flex items-stretch">
        <button onClick={() => { setMobileTab("mind"); setShowMobileMenu(false) }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            mobileTab === "mind" ? "text-blue-600 bg-blue-50" : "text-gray-400"
          }`}>
          <span className="text-lg">🚇</span>
          <span className="text-[10px] font-medium">思维空间</span>
        </button>
        <button onClick={() => { setMobileTab("chat"); setShowMobileMenu(false) }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            mobileTab === "chat" ? "text-green-600 bg-green-50" : "text-gray-400"
          }`}>
          <span className="text-lg">💬</span>
          <span className="text-[10px] font-medium">对话</span>
        </button>
      </div>

    </div>
  )
}
