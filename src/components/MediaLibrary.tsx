"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import {
  loadMedia, deleteMediaAsset, getFolderCounts,
  addUploadedToMediaLibrary,
  type MediaAsset, type MediaFolder,
} from "@/lib/media-library"
import { SCENE_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } from "@/lib/scene-templates"

export default function MediaLibrary() {
  const { user } = useJiyingUser()
  const [tab, setTab] = useState<"materials" | "templates">("materials")
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [activeFolder, setActiveFolder] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [tplCategory, setTplCategory] = useState("全部")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMedia(loadMedia()); setFolders(getFolderCounts()) }, [])

  const refresh = useCallback(() => { setMedia(loadMedia()); setFolders(getFolderCounts()) }, [])

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      addUploadedToMediaLibrary(reader.result as string, file.name, "image", user.id, [])
      refresh(); setUploading(false)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }, [user, refresh])

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteMediaAsset(id); refresh(); setSelectedAsset(null)
  }, [refresh])

  const handleToggleFavorite = useCallback((asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation()
    asset.favorite = !asset.favorite
    const all = loadMedia()
    const idx = all.findIndex(a => a.id === asset.id)
    if (idx >= 0) { all[idx] = asset; localStorage.setItem("jiying_media_library", JSON.stringify(all.slice(0, 200))) }
    refresh()
  }, [refresh])

  const filtered = media.filter(a => {
    if (activeFolder === "favorites" && !a.favorite) return false
    if (activeFolder !== "all" && activeFolder !== "favorites" && a.type !== activeFolder) return false
    if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase()) && !a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false
    return true
  })

  const CARD_STYLES: Record<string, string> = {
    image: "from-blue-500/10 border-blue-500/20", character: "from-purple-500/10 border-purple-500/20",
    product: "from-amber-500/10 border-amber-500/20", scene: "from-green-500/10 border-green-500/20",
    generated: "from-teal-500/10 border-teal-500/20",
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">🖼️</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">素材库</h1>
          <p className="text-xs text-[#9898B0] mt-0.5">{tab === "materials" ? "管理你的图片、角色、产品和 AI 生成内容" : "30个现成可用的场景模板"}</p>
        </div>
        <div className="ml-auto">
          <div className="flex gap-1 bg-[#0C0C14] rounded-xl p-1 border border-white/[0.06]">
            <button onClick={() => setTab("materials")} className={`px-3 py-1 text-[10px] rounded-lg transition-all ${tab === "materials" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>我的素材</button>
            <button onClick={() => setTab("templates")} className={`px-3 py-1 text-[10px] rounded-lg transition-all ${tab === "templates" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>📦 模板</button>
          </div>
        </div>
      </div>

      {tab === "materials" ? (
        <div className="space-y-4">
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索素材名称或标签..."
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
              {uploading ? "上传中..." : "📤 上传"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
            {folders.map(f => (
              <button key={f.id} onClick={() => setActiveFolder(f.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${activeFolder === f.id ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "bg-[#0C0C14] border-white/[0.06] text-white/40 hover:text-white/60"}`}>
                <span>{f.icon}</span><span>{f.name}</span><span className="text-[9px] opacity-60">({f.count})</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm text-[#9898B0]">还没有素材</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(a => (
                <div key={a.id} onClick={() => setSelectedAsset(a)}
                  className={`group relative rounded-xl overflow-hidden bg-[#0C0C14] border border-white/[0.06] cursor-pointer hover:border-white/20 transition-all ${selectedAsset?.id === a.id ? "ring-2 ring-[#F59E0B]" : ""}`}>
                  <div className="aspect-square bg-[#0C0C14]">
                    <img src={a.thumbnailUrl} alt={a.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  </div>
                  <div className="p-2">
                    <div className="text-[10px] text-white/60 truncate">{a.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[8px] px-1 py-0.5 rounded ${CARD_STYLES[a.type] || "bg-white/5 text-white/40"} text-white/60`}>{a.type}</span>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleToggleFavorite(a, e)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${a.favorite ? "bg-[#F59E0B]/30 text-[#F59E0B]" : "bg-black/50 text-white/60 hover:text-white"}`}>{a.favorite ? "★" : "☆"}</button>
                    <button onClick={(e) => handleDelete(a.id, e)}
                      className="w-6 h-6 rounded-lg bg-black/50 text-white/60 hover:text-red-400 flex items-center justify-center text-[10px]">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedAsset && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAsset(null)}>
              <div className="bg-[#1A1A2E] rounded-2xl max-w-lg w-full border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="aspect-video bg-[#0C0C14]">
                  <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full h-full object-contain" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-bold text-white/80">{selectedAsset.name}</h3></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${CARD_STYLES[selectedAsset.type] || "bg-white/5 text-white/40"}`}>{selectedAsset.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { const a = document.createElement("a"); a.href = selectedAsset.url; a.download = `${selectedAsset.name}.png`; a.click() }}
                      className="flex-1 py-2 rounded-xl bg-blue-500/10 text-blue-300 text-xs border border-blue-500/15 hover:bg-blue-500/20">📥 下载</button>
                    <button onClick={() => navigator.clipboard.writeText(selectedAsset.url)}
                      className="flex-1 py-2 rounded-xl bg-white/[0.04] text-white/60 text-xs border border-white/[0.06] hover:bg-white/[0.08]">📋 复制</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setTplCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs border transition-all ${tplCategory === cat ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "bg-[#0C0C14] border-white/[0.06] text-white/40 hover:text-white/60"}`}>{cat}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getTemplatesByCategory(tplCategory).map(tpl => (
              <div key={tpl.id} onClick={() => setSelectedTemplate(selectedTemplate === tpl.id ? null : tpl.id)}
                className={`glass-card rounded-xl p-4 cursor-pointer transition-all border-2 ${selectedTemplate === tpl.id ? "border-[#F59E0B] bg-[#F59E0B]/5" : "border-white/[0.06] hover:border-white/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{tpl.icon}</span>
                  <div><div className="text-sm font-medium text-white/80">{tpl.name}</div><div className="text-[9px] text-white/30">{tpl.category}</div></div>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2">{tpl.description}</p>
                {selectedTemplate === tpl.id && (
                  <div className="mt-3 space-y-1 text-[9px] text-white/30 bg-[#0C0C14] rounded-lg p-2">
                    <div>🌅 {tpl.params.environment}</div><div>💡 {tpl.params.lighting}</div><div>🎨 {tpl.params.colorTone}</div>
                    <button onClick={() => {
                          localStorage.setItem("sijian_template_params", JSON.stringify(tpl.params));
                          localStorage.setItem("sijian_template_name", tpl.name);
                          window.location.href = "/jiying/manga";
                        }}
                      className="mt-2 w-full py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-[9px] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">🎬 应用此模板到影片工厂</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
