"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import {
  loadMedia, deleteMediaAsset, getFolderCounts,
  addUploadedToMediaLibrary,
  type MediaAsset, type MediaType, type MediaFolder,
} from "@/lib/media-library"

export default function MediaLibrary() {
  const { user } = useJiyingUser()
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [activeFolder, setActiveFolder] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMedia(loadMedia())
    setFolders(getFolderCounts())
  }, [])

  const refresh = useCallback(() => {
    setMedia(loadMedia())
    setFolders(getFolderCounts())
  }, [])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        addUploadedToMediaLibrary(data.url, file.name, "image", user.id, [])
        refresh()
      }
    } catch {}
    setUploading(false)
  }, [user, refresh])

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("确定删除？")) return
    deleteMediaAsset(id)
    refresh()
    setSelectedAsset(null)
  }, [refresh])

  const handleToggleFavorite = useCallback((asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation()
    asset.favorite = !asset.favorite
    const all = loadMedia()
    const idx = all.findIndex(a => a.id === asset.id)
    if (idx >= 0) {
      all[idx] = asset
      localStorage.setItem("jiying_media_library", JSON.stringify(all.slice(0, 200)))
    }
    refresh()
  }, [refresh])

  // 过滤
  const filtered = media.filter(a => {
    if (activeFolder === "favorites" && !a.favorite) return false
    if (activeFolder !== "all" && activeFolder !== "favorites" && a.type !== activeFolder) return false
    if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false
    return true
  })

  const CARD_STYLES: Record<string, string> = {
    image: "from-blue-500/10 border-blue-500/20",
    character: "from-purple-500/10 border-purple-500/20",
    product: "from-amber-500/10 border-amber-500/20",
    scene: "from-green-500/10 border-green-500/20",
    generated: "from-teal-500/10 border-teal-500/20",
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* 顶栏 */}
      <div className="flex items-center gap-4">
        <span className="text-3xl">🖼️</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">素材库</h1>
          <p className="text-xs text-[#9898B0] mt-0.5">管理你的图片、角色、产品和 AI 生成内容</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold disabled:opacity-40">
            {uploading ? "上传中..." : "📤 上传素材"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
        </div>
      </div>

      {/* 搜索 */}
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="搜索素材名称或标签..."
        className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />

      {/* 文件夹分类 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {folders.map(f => (
          <button key={f.id} onClick={() => setActiveFolder(f.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
              activeFolder === f.id
                ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]"
                : "bg-[#0C0C14] border-white/[0.06] text-white/40 hover:text-white/60"
            }`}>
            <span>{f.icon}</span>
            <span>{f.name}</span>
            <span className="text-[9px] opacity-60">({f.count})</span>
          </button>
        ))}
      </div>

      {/* 素材网格 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm text-[#9898B0]">还没有素材</p>
          <p className="text-xs text-[#5A5A72] mt-1">上传图片、创建角色、生成内容后会自动出现在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSelectedAsset(a)}
              className={`group relative rounded-xl overflow-hidden bg-[#0C0C14] border border-white/[0.06] cursor-pointer hover:border-white/20 transition-all ${
                selectedAsset?.id === a.id ? "ring-2 ring-[#F59E0B]" : ""
              }`}>
              <div className="aspect-square bg-[#0C0C14]">
                <img src={a.thumbnailUrl} alt={a.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class='flex items-center justify-center h-full text-white/20 text-2xl'>🖼️</div>` }} />
              </div>
              <div className="p-2">
                <div className="text-[10px] text-white/60 truncate">{a.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[8px] px-1 py-0.5 rounded ${CARD_STYLES[a.type] || "bg-white/5 text-white/40"} text-white/60`}>{a.type}</span>
                  <span className="text-[8px] text-white/20">{a.source === "ai_generated" ? "AI" : "上传"}</span>
                </div>
              </div>
              {/* 操作浮层 */}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleToggleFavorite(a, e)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${
                    a.favorite ? "bg-[#F59E0B]/30 text-[#F59E0B]" : "bg-black/50 text-white/60 hover:text-white"
                  }`}>{a.favorite ? "★" : "☆"}</button>
                <button onClick={(e) => handleDelete(a.id, e)}
                  className="w-6 h-6 rounded-lg bg-black/50 text-white/60 hover:text-red-400 flex items-center justify-center text-[10px]">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAsset(null)}>
          <div className="bg-[#1A1A2E] rounded-2xl max-w-lg w-full border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-[#0C0C14]">
              <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full h-full object-contain" />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white/80">{selectedAsset.name}</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">{selectedAsset.description || "无描述"}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${CARD_STYLES[selectedAsset.type] || "bg-white/5 text-white/40"}`}>{selectedAsset.type}</span>
              </div>
              {selectedAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAsset.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40">#{t}</span>)}
                </div>
              )}
              <div className="text-[9px] text-white/20 flex gap-4">
                <span>{selectedAsset.source === "ai_generated" ? "AI 生成" : "用户上传"}</span>
                <span>{new Date(selectedAsset.createdAt).toLocaleDateString("zh-CN")}</span>
                <span>使用 {selectedAsset.usedCount} 次</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const a = document.createElement("a")
                  a.href = selectedAsset.url
                  a.download = `${selectedAsset.name}.png`
                  a.click()
                }}
                  className="flex-1 py-2 rounded-xl bg-blue-500/10 text-blue-300 text-xs border border-blue-500/15 hover:bg-blue-500/20">📥 下载</button>
                <button onClick={() => { navigator.clipboard.writeText(selectedAsset.url); alert("链接已复制") }}
                  className="flex-1 py-2 rounded-xl bg-white/[0.04] text-white/60 text-xs border border-white/[0.06] hover:bg-white/[0.08]">📋 复制链接</button>
                <button onClick={() => { window.open(selectedAsset.url, "_blank") }}
                  className="flex-1 py-2 rounded-xl bg-white/[0.04] text-white/60 text-xs border border-white/[0.06] hover:bg-white/[0.08]">🔗 新窗口打开</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
