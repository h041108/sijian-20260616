"use client"

import { useState, useCallback, useRef, DragEvent } from "react"
import type { MindNode, MindEdge, DomainType, FrameType } from "@/lib/types"
import MindTransit from "@/components/MindTransit"
import NodeDetail from "@/components/NodeDetail"
import MemoryPalace from "@/components/MemoryPalace"
import EnterpriseMemoryPalace from "@/components/EnterpriseMemoryPalace"
import ContentStrategy from "@/components/ContentStrategy"
import ExperimentBar from "@/components/ExperimentBar"
import DashboardView from "@/components/DashboardView"
import MembersView from "@/components/MembersView"
import ReportsView from "@/components/ReportsView"
import SettingsView from "@/components/SettingsView"
import EnterpriseAICapability from "@/components/EnterpriseAICapability"
import ClassroomHeatmapView from "@/components/ClassroomHeatmapView"
import InstitutionManager from "@/components/InstitutionManager"
import OrchestratorDashboard from "@/components/OrchestratorDashboard"
import InstitutionalIntelligenceDashboard from "@/components/InstitutionalIntelligenceDashboard"
import StrategyDashboard from "@/components/StrategyDashboard"
import VideoFactoryDashboard from "@/components/VideoFactoryDashboard"

// ─── 导航配置 ────────────────────────────────────

type ToolId = "knowledge" | "solve" | "training" | "metro" | "content" | "experiment" | "ai_capability" | "heatmap" | "institution" | "orchestrator" | "intelligence" | "strategy" | "video_factory" | "dashboard" | "members" | "reports" | "settings"

interface NavSection {
  label: string
  items: { id: ToolId; icon: string; label: string; role: "all" | "edu" | "enterprise" }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "核心工具",
    items: [
      { id: "knowledge", icon: "📐", label: "知识构建", role: "all" },
      { id: "solve", icon: "✏️", label: "解题引擎", role: "edu" },
      { id: "training", icon: "🧠", label: "思维训练", role: "all" },
      { id: "heatmap", icon: "🌡️", label: "课堂热力", role: "edu" },
      { id: "institution", icon: "🏫", label: "机构SaaS", role: "edu" },
      { id: "orchestrator", icon: "🔧", label: "模型编排", role: "enterprise" },
      { id: "intelligence", icon: "🧬", label: "机构智能", role: "enterprise" },
      { id: "strategy", icon: "🚀", label: "战略增长", role: "all" },
      { id: "video_factory", icon: "🎬", label: "视频工厂", role: "enterprise" },
      { id: "metro", icon: "🚇", label: "思维地铁", role: "all" },
      { id: "content", icon: "🎬", label: "内容策略", role: "enterprise" },
      { id: "experiment", icon: "🧪", label: "验证实验", role: "enterprise" },
      { id: "ai_capability", icon: "🚀", label: "AI能力建设", role: "enterprise" },
    ],
  },
  {
    label: "数据管理",
    items: [
      { id: "dashboard", icon: "📊", label: "团队仪表盘", role: "all" },
      { id: "members", icon: "👥", label: "成员管理", role: "all" },
      { id: "reports", icon: "📈", label: "成长报告", role: "all" },
    ],
  },
  {
    label: "系统",
    items: [
      { id: "settings", icon: "⚙️", label: "空间配置", role: "all" },
    ],
  },
]

type RoleType = "education" | "enterprise"

// ─── 主组件 ────────────────────────────────────

export default function BEndPage() {
  const [activeTool, setActiveTool] = useState<ToolId>("knowledge")
  const [role, setRole] = useState<RoleType>("education")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("mathematics")
  const [grade, setGrade] = useState("高三")
  const [industry, setIndustry] = useState("")
  const [product, setProduct] = useState("")
  const [loading, setLoading] = useState(false)
  const [space, setSpace] = useState<{ nodes: MindNode[]; edges: MindEdge[]; frameType?: string; domainType?: string } | null>(null)
  const [chatReply, setChatReply] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishPassword, setPublishPassword] = useState("")
  const [publishExpire, setPublishExpire] = useState(7)
  const [publisherName, setPublisherName] = useState("")
  const [myLinks, setMyLinks] = useState<any[]>([])
  const [showMyLinks, setShowMyLinks] = useState(false)
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null)

  const [uploadedImages, setUploadedImages] = useState<{ name: string; size: number; dataUrl: string; analysis: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 30 * 1024 * 1024) { alert("文件超30MB"); return }
    setUploading(true)
    const dataUrl = await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(file) })
    const fd = new FormData(); fd.append("file", file); fetch("/api/upload", { method: "POST", body: fd }).catch(() => {})
    let analysis = ""
    if (file.type.startsWith("image/")) { analysis = `[图片: ${file.name}, ${(file.size/1024).toFixed(1)}KB]` }
    else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) { analysis = await new Promise<string>(r => { const reader = new FileReader(); reader.onload = () => r(reader.result as string); reader.readAsText(file) }) }
    setUploadedImages(prev => [...prev, { name: file.name, size: file.size, dataUrl, analysis }])
    if (!topic.trim()) setTopic(file.name.replace(/\.[^.]+$/, ""))
    setUploading(false)
  }, [topic])

  const handleDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(f => handleFile(f)) }, [handleFile])
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => { const items = e.clipboardData?.items; if (!items) return; for (let i = 0; i < items.length; i++) { const blob = items[i].getAsFile(); if (blob) { e.preventDefault(); handleFile(blob); return } } }, [handleFile])

  const handleBuild = useCallback(async () => {
    if (!topic.trim() || loading) return
    setLoading(true); setSpace(null); setChatReply(null); setShareUrl(null)
    try {
      const fileText = uploadedImages.map(f => f.analysis).filter(Boolean).join("\n")
      const fullText = fileText ? `${topic.trim()}\n\n[上传资料分析]\n${fileText}` : topic.trim()
      const buildBody = role === "enterprise"
        ? { topic: fullText, subject: industry || "business", grade: product || "general" }
        : { topic: fullText, subject, grade }
      const r = await fetch("/api/b-end/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildBody) })
      const d = await r.json()
      if (d.error) { alert(d.error); return }
      setSpace(d)
    } catch { alert("构建失败") } finally { setLoading(false) }
  }, [topic, subject, grade, loading, uploadedImages, role, industry, product])

  const handleSolve = useCallback(async () => {
    if (loading) return
    const hasText = topic.trim().length > 0; const hasImages = uploadedImages.length > 0
    if (!hasText && !hasImages) return
    setLoading(true); setSpace(null); setChatReply(null); setShareUrl(null)
    try {
      const fileText = uploadedImages.map(f => f.analysis).filter(Boolean).join("\n\n")
      const userText = hasText ? topic.trim() : "请根据图片分析，逐题展示题目内容和答案"
      const hasOcrText = fileText.includes("OCR 文字识别结果")
      const prompt = fileText
        ? hasOcrText
          ? `${fileText}\n\n用户要求: ${userText}\n\n以上是图片 OCR 识别的真实文字。逐题展示，格式：**第X题** (题型) 题目: 解题思路: 答案:。用 --- 分隔。最后必须输出<m>标签。`
          : `${fileText}\n\n用户要求: ${userText}\n\nOCR 未能识别。诚实告知用户，同时根据用户的文字输入优先解答。最后必须输出<m>标签。`
        : `请解答以下题目，给出完整的解题思路、分步推导和最终答案。一定要输出<m>标签。\n\n题目: ${userText}`
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }], existingNodes: [] }) })
      const d = await r.json()
      if (d.error) { alert(d.error); return }
      setChatReply(d.message || "")
      if (d.mindSpaceUpdate?.nodes?.length) { setSpace({ nodes: d.mindSpaceUpdate.nodes, edges: d.mindSpaceUpdate.edges || [], frameType: d.mindSpaceUpdate.frameType || "tree", domainType: d.domain_type || "general" }) }
    } catch { alert("请求失败，请重试") } finally { setLoading(false) }
  }, [topic, loading, uploadedImages])

  const handlePublish = useCallback(async () => {
    if (!space) return; setPublishing(true)
    try {
      const body: any = { topic, subject, grade, nodes: space.nodes, edges: space.edges, frameType: space.frameType || "tree", domainType: space.domainType || "general", chatReply }
      if (publishPassword.trim()) body.password = publishPassword.trim()
      if (publishExpire > 0) body.expireDays = publishExpire
      if (publisherName.trim()) body.publisher = publisherName.trim()

      const r = await fetch("/api/b-end/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const d = await r.json()
      if (d.shareUrl) {
        setShareUrl(d.shareUrl)
        localStorage.setItem("sijian_my_links", JSON.stringify([d.shareId, ...JSON.parse(localStorage.getItem("sijian_my_links") || "[]")].slice(0, 50)))
      }
    } catch { alert("发布失败") } finally { setPublishing(false) }
  }, [space, topic, subject, grade, chatReply, publishPassword, publishExpire, publisherName])

  const copyShare = useCallback(() => { if (shareUrl) navigator.clipboard.writeText(`${location.origin}${shareUrl}`) }, [shareUrl])

  const subjects = [{ v: "mathematics", l: "数学" },{ v: "physics", l: "物理" },{ v: "chemistry", l: "化学" },{ v: "biology", l: "生物" },{ v: "history", l: "历史" },{ v: "geography", l: "地理" },{ v: "politics", l: "政治" },{ v: "chinese", l: "语文" },{ v: "english", l: "英语" },{ v: "art", l: "美术" },{ v: "music", l: "音乐" },{ v: "general", l: "通用" }]
  const grades = ["小学","初中","高一","高二","高三","大学","成人"]

  const visibleNav = NAV_SECTIONS.map(s => ({ ...s, items: s.items.filter(item => item.role === "all" || item.role === role) })).filter(s => s.items.length > 0)

  const toolLabel = NAV_SECTIONS.flatMap(s => s.items).find(t => t.id === activeTool)?.label || ""

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f7f4" }} onPaste={handlePaste}>
      {/* ── 移动端遮罩 ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── 左侧导航 ── */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-50 md:z-0 w-[220px] shrink-0 flex flex-col border-r h-full transition-transform duration-250`}
        style={{ background: "#1A1A2E", borderColor: "#2A2A45" }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "#2A2A45" }}>
          <h1 className="text-base font-bold" style={{ color: "#F1F1F6" }}>推信 · 思见</h1>
          <p className="text-[10px] mt-0.5" style={{ color: "#8888A0" }}>B端工作台</p>
        </div>

        {/* 角色切换 */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "#2A2A45" }}>
          <div className="flex rounded-lg p-0.5" style={{ background: "#0F0F1A" }}>
            <button onClick={() => setRole("education")}
              className={`flex-1 py-1.5 text-[11px] rounded-md font-medium transition-all ${role === "education" ? "text-white" : "text-[#8888A0] hover:text-[#C0C0D0]"}`}
              style={{ background: role === "education" ? "#3B82F6" : "transparent" }}>
              教育
            </button>
            <button onClick={() => setRole("enterprise")}
              className={`flex-1 py-1.5 text-[11px] rounded-md font-medium transition-all ${role === "enterprise" ? "text-white" : "text-[#8888A0] hover:text-[#C0C0D0]"}`}
              style={{ background: role === "enterprise" ? "#F97316" : "transparent" }}>
              企业
            </button>
          </div>
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {visibleNav.map(section => (
            <div key={section.label}>
              <div className="text-[10px] font-medium px-2 mb-1.5 uppercase tracking-wider" style={{ color: "#555568" }}>{section.label}</div>
              {section.items.map(item => (
                <button key={item.id} onClick={() => setActiveTool(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left ${
                    activeTool === item.id ? "font-medium" : "hover:opacity-90"
                  }`}
                  style={{
                    background: activeTool === item.id ? "rgba(99,102,241,0.15)" : "transparent",
                    color: activeTool === item.id ? "#C7D2FE" : "#8888A0",
                  }}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* 底部 */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "#2A2A45" }}>
          <a href="/" className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity" style={{ color: "#8888A0" }}>
            <span>←</span> 返回首页
          </a>
          <button onClick={() => setSidebarOpen(false)}
            className="md:hidden mt-2 w-full text-center text-xs py-1.5 rounded-lg border text-gray-400 hover:text-white transition-all"
            style={{ borderColor: "#2A2A45" }}>
            收起菜单 ✕
          </button>
        </div>
      </aside>

      {/* ── 右侧工作区 ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部信息栏 */}
        <div className="shrink-0 px-4 md:px-6 py-3 border-b flex items-center justify-between" style={{ background: "#fff", borderColor: "#e8e5df" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden text-lg text-gray-500 hover:text-gray-800">
              ☰
            </button>
            <h2 className="text-sm font-semibold text-gray-800">{toolLabel}</h2>
            {shareUrl && (
              <button onClick={copyShare} className="text-[11px] bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 transition-colors">
                复制分享链接
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${role === "education" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
              {role === "education" ? "🏫 教育版" : "🏢 企业版"}
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* ── 知识构建 ── */}
            {activeTool === "knowledge" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">📐 知识构建</h2>
                  <div onDrop={handleDrop} onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onClick={() => fileRef.current?.click()}
                    className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-blue-400 bg-blue-50" : "border-[#e8e5df] hover:border-blue-300 hover:bg-[#f8faf3]"}`}>
                    <input ref={fileRef} type="file" accept="image/*,.txt" multiple onChange={(e: any) => { Array.from(e.target.files || []).forEach((f: any) => handleFile(f)); e.target.value = "" }} className="hidden" />
                    <div className="text-2xl mb-2 opacity-30">📎</div>
                    <div className="text-sm font-medium text-gray-600">拖拽文件到此处，或点击上传</div>
                    <div className="text-xs text-gray-400 mt-1">支持图片/TXT · 最大30MB</div>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="mb-4 flex gap-3 flex-wrap">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewImage(img.dataUrl)}>
                          <img src={img.dataUrl} alt={img.name} className="w-24 h-24 object-cover rounded-xl border-2 border-[#e8e5df] hover:border-blue-400 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={role === "enterprise" ? "输入业务主题，如：客户投诉处理流程" : "输入知识主题，如：三角函数正弦定理"}
                      className="flex-1 min-w-[260px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onKeyDown={e => e.key === "Enter" && handleBuild()} />
                    {role === "education" ? (
                      <>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
                          {subjects.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                        </select>
                        <select value={grade} onChange={e => setGrade(e.target.value)} className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
                          {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </>
                    ) : (
                      <>
                        <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="行业，如：教育培训"
                          className="w-36 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="产品/服务，如：高中数学1对1"
                          className="w-44 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      </>
                    )}
                    <button onClick={handleBuild} disabled={!topic.trim() || loading}
                      className={`rounded-xl text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${role === "enterprise" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                      {loading ? "AI构建中…" : "生成知识空间"}
                    </button>
                  </div>
                </div>
                {space && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white rounded-2xl border border-[#e8e5df] px-6 py-3">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{topic}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {role === "education" ? `${subject} · ${grade}` : `${industry || "企业"} · ${product || "业务"}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">框架: {space.frameType || "tree"}</span><span className="text-xs text-gray-400">{space.nodes.length}节点</span></div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#e8e5df] overflow-hidden relative" style={{ height: "420px" }}>
                      <MindTransit nodes={space.nodes} edges={space.edges} domainType={(space.domainType || "general") as DomainType} frameType={(space.frameType || "tree") as FrameType} onNodeClick={(n: any) => setSelectedNode(n)} onExport={() => { const b = new Blob([JSON.stringify(space, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `knowledge.json`; a.click() }} />
                      <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
                    </div>
                    {/* 发布面板 */}
                    <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">📤 发布设置</h3>
                        <button onClick={() => setShowMyLinks(!showMyLinks)}
                          className="text-xs text-gray-400 hover:text-gray-600">我发布的链接</button>
                      </div>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">发布者</label>
                          <input value={publisherName} onChange={e => setPublisherName(e.target.value)}
                            placeholder="如：张老师"
                            className="w-28 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">访问密码（选填）</label>
                          <input value={publishPassword} onChange={e => setPublishPassword(e.target.value.replace(/\D/g,"").slice(0,4))}
                            placeholder="4位数字"
                            className="w-24 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 text-center tracking-widest" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">有效期</label>
                          <select value={publishExpire} onChange={e => setPublishExpire(Number(e.target.value))}
                            className="w-24 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-2 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300">
                            <option value={1}>1天</option>
                            <option value={7}>7天</option>
                            <option value={30}>30天</option>
                            <option value={0}>永久</option>
                          </select>
                        </div>
                        <button onClick={handlePublish} disabled={publishing}
                          className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-50">
                          {publishing ? "发布中…" : "发布"}
                        </button>
                        {shareUrl && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl flex-1 min-w-0">
                            <span className="text-xs shrink-0">已发布{publishPassword ? " 🔒" : ""}</span>
                            <input readOnly value={`${location.origin}${shareUrl}`} className="bg-white border border-green-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 flex-1 min-w-0" onClick={e => (e.target as HTMLInputElement).select()} />
                            <button onClick={copyShare} className="shrink-0 text-xs bg-white hover:bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200">复制</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {!space && !loading && (
                  <div className="text-center py-16"><div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center"><span className="text-2xl opacity-30">📖</span></div><p className="text-gray-500 text-sm">输入知识点，AI 自动构建知识空间</p></div>
                )}
              </div>
            )}

            {/* ── 解题引擎 ── */}
            {activeTool === "solve" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">✏️ 解题引擎</h2>
                  <div onDrop={handleDrop} onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onClick={() => fileRef.current?.click()}
                    className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-green-400 bg-green-50" : "border-[#e8e5df] hover:border-green-300 hover:bg-[#f8faf3]"}`}>
                    <input ref={fileRef} type="file" accept="image/*,.txt" multiple onChange={(e: any) => { Array.from(e.target.files || []).forEach((f: any) => handleFile(f)); e.target.value = "" }} className="hidden" />
                    <div className="text-2xl mb-2 opacity-30">📎</div>
                    <div className="text-sm font-medium text-gray-600">拖拽试卷图片或文字到此处</div>
                    <div className="text-xs text-gray-400 mt-1">支持拍照/Ctrl+V粘贴 · 最大30MB</div>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="mb-4 flex gap-3 flex-wrap">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewImage(img.dataUrl)}>
                          <img src={img.dataUrl} alt={img.name} className="w-24 h-24 object-cover rounded-xl border-2 border-[#e8e5df] hover:border-green-400 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="输入题目，如：已知三角形ABC中，角A=30°..."
                      className="flex-1 min-w-[260px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300"
                      onKeyDown={e => e.key === "Enter" && handleSolve()} />
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
                      {subjects.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    <button onClick={handleSolve} disabled={(!topic.trim() && uploadedImages.length === 0) || loading}
                      className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
                      {loading ? "AI解题中…" : "开始解题"}
                    </button>
                  </div>
                </div>
                {chatReply && (
                  <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">解题结果</h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{chatReply}</div>
                  </div>
                )}
                {space && space.nodes?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#e8e5df] overflow-hidden" style={{ height: "380px" }}>
                    <MindTransit nodes={space.nodes} edges={space.edges} domainType={(space.domainType || "general") as DomainType} frameType={(space.frameType || "tree") as FrameType} onNodeClick={(n: any) => setSelectedNode(n)} onExport={() => {}} />
                    <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
                  </div>
                )}
              </div>
            )}

            {/* ── 思维训练 ── */}
            {activeTool === "training" && (
              role === "enterprise" ? <EnterpriseMemoryPalace /> : <MemoryPalace />
            )}

            {/* ── 课堂热力图 ── */}
            {activeTool === "heatmap" && <ClassroomHeatmapView />}

            {/* ── 机构SaaS ── */}
            {activeTool === "institution" && <InstitutionManager />}

            {/* ── 模型编排 ── */}
            {activeTool === "orchestrator" && <OrchestratorDashboard />}

            {/* ── 机构智能 ── */}
            {activeTool === "intelligence" && <InstitutionalIntelligenceDashboard />}

            {/* ── 战略增长 ── */}
            {activeTool === "strategy" && <StrategyDashboard />}

            {/* ── 视频工厂 ── */}
            {activeTool === "video_factory" && <VideoFactoryDashboard />}

            {/* ── 思维地铁 ── */}
            {activeTool === "metro" && (
              <div className="bg-white rounded-2xl border border-[#e8e5df] overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
                <iframe src="/metro" className="w-full h-full border-0" title="思维地铁" />
              </div>
            )}

            {/* ── 内容策略 ── */}
            {activeTool === "content" && <ContentStrategy />}

            {/* ── 验证实验 ── */}
            {activeTool === "experiment" && (
              <div className="space-y-6">
                <ExperimentBar />
                <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 实验数据</h3>
                  <p className="text-xs text-gray-400">
                    进行至少 5 次"用模板"和 5 次"不用模板"的对比实验后，数据会自动在这里汇总。
                  </p>
                </div>
              </div>
            )}

            {/* ── AI能力建设 ── */}
            {activeTool === "ai_capability" && <EnterpriseAICapability />}

            {/* ── 仪表盘 ── */}
            {activeTool === "dashboard" && <DashboardView role={role} />}

            {/* ── 成员管理 ── */}
            {activeTool === "members" && <MembersView role={role} />}

            {/* ── 成长报告 ── */}
            {activeTool === "reports" && <ReportsView role={role} />}

            {/* ── 空间配置 ── */}
            {activeTool === "settings" && <SettingsView role={role} />}
          </div>
        </div>
      </main>

      {/* 图片预览 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center cursor-pointer" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="预览" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  )
}
