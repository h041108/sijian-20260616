"use client"

import { useState, useCallback, useRef } from "react"

export interface ProductAssets {
  photos: string[]           // 产品照片 URL（正/侧/背/场景）
  name: string                // 产品名称
  sellingPoints: string[]     // 核心卖点
}

interface ProductPhotoUploadProps {
  onAssetsReady: (assets: ProductAssets) => void
  initialAssets?: ProductAssets
}

export default function ProductPhotoUpload({ onAssetsReady, initialAssets }: ProductPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialAssets?.photos || [])
  const [name, setName] = useState(initialAssets?.name || "")
  const [sellingPointInput, setSellingPointInput] = useState("")
  const [sellingPoints, setSellingPoints] = useState<string[]>(initialAssets?.sellingPoints || [])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setPhotos(p => [...p, data.url])
    } catch {}
    setUploading(false)
  }, [])

  const removePhoto = useCallback((idx: number) => {
    setPhotos(p => p.filter((_, i) => i !== idx))
  }, [])

  const addSellingPoint = useCallback(() => {
    const s = sellingPointInput.trim()
    if (!s) return
    setSellingPoints(p => [...p, s])
    setSellingPointInput("")
  }, [sellingPointInput])

  const removeSellingPoint = useCallback((idx: number) => {
    setSellingPoints(p => p.filter((_, i) => i !== idx))
  }, [])

  const handleSubmit = useCallback(() => {
    if (photos.length === 0 || !name.trim()) return
    onAssetsReady({ photos, name: name.trim(), sellingPoints })
  }, [photos, name, sellingPoints, onAssetsReady])

  const PHOTO_LABELS = ["产品正面", "产品侧面", "产品背面", "使用场景"]
  const PHOTO_COLORS = ["from-blue-500/20 border-blue-500/30", "from-purple-500/20 border-purple-500/30", "from-teal-500/20 border-teal-500/30", "from-amber-500/20 border-amber-500/30"]

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50 font-medium">📦 产品素材</div>

      {/* 产品图片网格 */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative">
            {photos[i] ? (
              <div className="aspect-square rounded-xl overflow-hidden bg-[#0C0C14] border border-white/10 relative group">
                <img src={photos[i]} alt={PHOTO_LABELS[i]} className="w-full h-full object-contain p-2"
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%231A1A2E' width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%235A5A72' font-size='8'>加载失败</text></svg>" }} />
                <button onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white/70 text-center py-0.5">{PHOTO_LABELS[i]}</div>
              </div>
            ) : (
              <button onClick={() => { fileRef.current!.click(); labelRef.current!.value = PHOTO_LABELS[i] }}
                className={`aspect-square rounded-xl border-2 border-dashed bg-gradient-to-br ${PHOTO_COLORS[i]} flex items-center justify-center hover:bg-white/[0.06] transition-all`}>
                <div className="text-center">
                  <div className="text-lg mb-0.5">📷</div>
                  <div className="text-[8px] text-white/30">{PHOTO_LABELS[i]}</div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />

      {/* 产品信息 */}
      <div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="产品名称（如：智能扫地机器人）"
          className="w-full px-3 py-2 text-sm rounded-xl bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40 mb-2" />

        <div className="flex gap-1">
          <input value={sellingPointInput} onChange={e => setSellingPointInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSellingPoint()}
            placeholder="核心卖点（如：自动集尘）"
            className="flex-1 px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none" />
          <button onClick={addSellingPoint} disabled={!sellingPointInput.trim()}
            className="px-3 py-1.5 text-[10px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06] disabled:opacity-30">+ 添加</button>
        </div>
        {sellingPoints.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sellingPoints.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[9px] text-[#F59E0B]/80">
                {s}
                <button onClick={() => removeSellingPoint(i)} className="text-[#F59E0B]/40 hover:text-[#F59E0B]">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {photos.length > 0 && name.trim() && (
        <button onClick={handleSubmit}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold">
          ✅ 确认产品素材 ({photos.length} 张图 · {sellingPoints.length} 个卖点)
        </button>
      )}
    </div>
  )
}
