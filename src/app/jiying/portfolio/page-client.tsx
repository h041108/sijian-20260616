"use client"
import { useState, useEffect, useCallback } from "react"
import { loadPortfolio, savePortfolio, deletePortfolioItem, toggleFeatured, generateMockPortfolio } from "@/lib/portfolio"
import type { PortfolioItem } from "@/lib/portfolio"

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    let loaded = loadPortfolio()
    if (loaded.length === 0) {
      loaded = generateMockPortfolio()
      savePortfolio(loaded)
    }
    setItems(loaded)
  }, [])

  const filtered = filter === "all" ? items : items.filter(i => i.type === filter)
  const featured = items.filter(i => i.featured)

  const handleDelete = useCallback((id: string) => {
    deletePortfolioItem(id)
    setItems(loadPortfolio())
  }, [])

  const handleToggleFeatured = useCallback((id: string) => {
    toggleFeatured(id)
    setItems(loadPortfolio())
  }, [])

  const typeIcon = (t: string) => ({ image: "🖼️", video: "🎬", manga: "📚", text: "📝" })[t] || "📄"

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🖼️</span>
        <div><h1 className="text-xl font-bold text-gray-800">作品展示</h1><p className="text-sm text-gray-400">你在即影创作的所有作品 · 一键分享</p></div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-semibold text-amber-700">⭐ 精选作品</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {featured.map(item => (
              <div key={item.id} className="min-w-[140px] bg-white rounded-xl border border-amber-200 p-3 flex-shrink-0">
                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-xs mb-2">
                  {typeIcon(item.type)} {item.type}
                </div>
                <div className="text-xs font-medium text-gray-800 truncate">{item.title}</div>
                <div className="text-[9px] text-gray-400">{item.stats.views}次播放</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-gray-800">{items.length}</div>
          <div className="text-[10px] text-gray-400">全部作品</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-indigo-600">{items.filter(i => i.type === "image").length}</div>
          <div className="text-[10px] text-gray-400">图片</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-green-600">{items.filter(i => i.type === "video").length}</div>
          <div className="text-[10px] text-gray-400">视频</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-extrabold text-amber-600">{items.reduce((s, i) => s + i.stats.views, 0)}</div>
          <div className="text-[10px] text-gray-400">总播放</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {[{ id: "all", label: "全部" }, { id: "image", label: "🖼️ 图片" }, { id: "video", label: "🎬 视频" }, { id: "text", label: "📝 文案" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border ${filter === f.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{f.label}</button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">还没有作品，开始创作吧</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300 text-sm relative">
                {typeIcon(item.type)} {item.type}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggleFeatured(item.id)}
                    className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${item.featured ? "bg-amber-400 text-white" : "bg-white/80 text-gray-400"}`}>⭐</button>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-[10px] w-5 h-5 rounded-full bg-white/80 text-red-400 flex items-center justify-center">✕</button>
                </div>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-medium text-gray-800 truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-1">
                  <span>{item.platform || "即影"}</span>
                  <span>{item.stats.views}次</span>
                  <span>{item.stats.likes}赞</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
