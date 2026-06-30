"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { DETAIL_TEMPLATES, type DetailTemplate, type DetailSection } from "@/lib/detail-templates"

interface DetailRendererProps {
  productName: string
  sellingPoints: string[]
  productImages: string[]
  specs: string
  description: string
  templateId: string
}

function drawSection(ctx: CanvasRenderingContext2D, sec: DetailSection, values: Record<string, any>, template: DetailTemplate) {
  const w = template.width
  if (sec.type === "productImage" && values.mainImg) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = values.mainImg
    try {
      const scale = (sec.w || w) / img.width
      ctx.drawImage(img, sec.x, sec.y, sec.w || w, (sec.h || (sec.w || w)) || img.height * scale)
    } catch {}
  }
  if (sec.type === "subImage" && values.subImgs?.length) {
    const idx = values._subIdx || 0
    if (values.subImgs[idx]) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = values.subImgs[idx]
      try {
        const scale = (sec.w || 300) / img.width
        ctx.drawImage(img, sec.x, sec.y, sec.w || 300, (sec.h || 300) || img.height * scale)
      } catch {}
    }
  }
  if (sec.type === "sceneImage" && values.sceneImg) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = values.sceneImg
    try {
      ctx.drawImage(img, sec.x, sec.y, sec.w || w, sec.h || 540)
    } catch {}
  }
  if (sec.type === "title" && values.name) {
    ctx.fillStyle = sec.color || "#1a1a1a"
    ctx.font = `bold ${sec.fontSize || 36}px system-ui`
    ctx.textAlign = sec.align === "center" ? "center" : "left"
    const x = sec.align === "center" ? w / 2 : sec.x
    ctx.fillText(values.name.slice(0, 25), x, sec.y)
  }
  if (sec.type === "price" && values.price) {
    ctx.fillStyle = sec.color || "#E53935"
    ctx.font = `bold ${sec.fontSize || 36}px system-ui`
    ctx.textAlign = sec.align === "center" ? "center" : "left"
    const x = sec.align === "center" ? w / 2 : sec.x
    ctx.fillText(values.price, x, sec.y)
  }
  if (sec.type === "sellingPoint" && values.points?.length) {
    ctx.fillStyle = sec.color || "#333"
    ctx.font = `${sec.fontSize || 22}px system-ui`
    ctx.textAlign = "left"
    values.points.slice(0, 5).forEach((p: string, i: number) => {
      ctx.fillText(`• ${p.slice(0, 25)}`, sec.x, sec.y + i * 42)
    })
  }
  if (sec.type === "specs" && values.specs) {
    ctx.fillStyle = sec.color || "#666"
    ctx.font = `${sec.fontSize || 18}px system-ui`
    ctx.textAlign = "left"
    const lines = values.specs.split("\n").filter((l: string) => l.trim())
    lines.slice(0, 6).forEach((line: string, i: number) => {
      ctx.fillText(line.slice(0, 35), sec.x, sec.y + i * 32)
    })
  }
  if (sec.type === "description" && values.desc) {
    ctx.fillStyle = sec.color || "#999"
    ctx.font = `${sec.fontSize || 20}px system-ui`
    ctx.textAlign = "left"
    let y = sec.y
    for (const line of values.desc.split("\n").filter((l: string) => l.trim())) {
      if (y > (sec.y || 0) + 200) break
      ctx.fillText(line.slice(0, 30), sec.x, y)
      y += 32
    }
  }
  if (sec.type === "cta") {
    ctx.fillStyle = sec.bgColor || "#E53935"
    ctx.beginPath()
    const r = 12
    ctx.moveTo(sec.x + r, sec.y)
    ctx.lineTo(sec.x + (sec.w || 960) - r, sec.y)
    ctx.quadraticCurveTo(sec.x + (sec.w || 960), sec.y, sec.x + (sec.w || 960), sec.y + r)
    ctx.lineTo(sec.x + (sec.w || 960), sec.y + (sec.h || 80) - r)
    ctx.quadraticCurveTo(sec.x + (sec.w || 960), sec.y + (sec.h || 80), sec.x + (sec.w || 960) - r, sec.y + (sec.h || 80))
    ctx.lineTo(sec.x + r, sec.y + (sec.h || 80))
    ctx.quadraticCurveTo(sec.x, sec.y + (sec.h || 80), sec.x, sec.y + (sec.h || 80) - r)
    ctx.lineTo(sec.x, sec.y + r)
    ctx.quadraticCurveTo(sec.x, sec.y, sec.x + r, sec.y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = sec.color || "#FFFFFF"
    ctx.font = `bold ${sec.fontSize || 28}px system-ui`
    ctx.textAlign = "center"
    ctx.fillText("立即购买", sec.x + (sec.w || 960) / 2, sec.y + (sec.h || 80) / 2 + 10)
  }
}

interface ProductDetailPageProps {
  productName: string; sellingPoints: string[]; productImages: string[]
  specs: string; description: string
  onDone?: (blob: Blob) => void
}

export default function ProductDetailPage({ productName, sellingPoints, productImages, specs, description, onDone }: ProductDetailPageProps) {
  const [templateId, setTemplateId] = useState(DETAIL_TEMPLATES[0].id)
  const [generating, setGenerating] = useState(false)
  const [doneBlob, setDoneBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const template = DETAIL_TEMPLATES.find(t => t.id === templateId) || DETAIL_TEMPLATES[0]

  const generate = useCallback(async () => {
    if (!canvasRef.current) return
    setGenerating(true); setDoneBlob(null); setPreviewUrl("")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = template.width
    canvas.height = template.height
    ctx.fillStyle = template.bgColor
    ctx.fillRect(0, 0, template.width, template.height)

    // 先加载产品图
    let mainImgLoaded = false
    const loadPromises: Promise<void>[] = []
    if (productImages.length > 0) {
      loadPromises.push(new Promise(resolve => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => { mainImgLoaded = true; resolve() }
        img.onerror = () => resolve()
        img.src = productImages[0]
      }))
    }

    // 等待图片加载
    if (loadPromises.length > 0) {
      await Promise.race([...loadPromises, new Promise(r => setTimeout(r, 3000))])
    }

    // 全部用 Canvas 绘制
    const values = {
      name: productName,
      points: sellingPoints,
      mainImg: productImages[0],
      subImgs: productImages.slice(1, 4),
      sceneImg: productImages.length > 1 ? productImages[1] : undefined,
      price: "¥" + (Math.random() * 100 + 10).toFixed(0),
      specs,
      desc: description || productName,
    }

    // 分两次绘制：先画图片，再画文字
    for (const sec of template.sections) {
      drawSection(ctx, sec, values, template)
    }

    // 输出预览
    const dataUrl = canvas.toDataURL("image/png")
    setPreviewUrl(dataUrl)
    canvas.toBlob((blob) => {
      if (blob) { setDoneBlob(blob); onDone?.(blob) }
    }, "image/png")
    setGenerating(false)
  }, [template, productName, sellingPoints, productImages, specs, description, onDone])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DETAIL_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTemplateId(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs border transition-all ${templateId === t.id ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "bg-[#0C0C14] border-white/[0.06] text-white/40 hover:text-white/60"}`}>
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-white/40">产品名称</label>
            <div className="text-sm text-white/80 px-3 py-2 bg-[#0C0C14] rounded-xl border border-white/10">{productName || "未填写"}</div>
          </div>
          {productImages.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] text-white/40">产品图</label>
              <div className="flex gap-1">
                {productImages.slice(0, 3).map((url, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={generate} disabled={generating || !productName.trim() || productImages.length === 0}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
          {generating ? "生成中..." : `🎨 生成详情页 - ${template.name}`}
        </button>
      </div>

      {previewUrl && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">{template.name} · {template.width}×{template.height}</span>
            {doneBlob && (
              <a href={URL.createObjectURL(doneBlob)} download={`${productName}_详情页.png`}
                className="px-4 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-xs border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">📥 下载 PNG</a>
            )}
          </div>
          <img src={previewUrl} alt="详情页预览" className="w-full max-w-sm mx-auto rounded-xl border border-white/10" />
        </div>
      )}
    </div>
  )
}
