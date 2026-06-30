"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { DETAIL_TEMPLATES, type DetailTemplate } from "@/lib/detail-templates"

interface ProductDetailPageProps {
  productName: string; sellingPoints: string[]; productImages: string[]
  specs: string; description: string
  onDone?: (blob: Blob) => void
}

function drawTemplate(
  ctx: CanvasRenderingContext2D, tmpl: DetailTemplate,
  values: { name: string; price: string; points: string[]; specs: string; desc: string },
  imgs: { main?: HTMLImageElement; sub: HTMLImageElement[]; scene?: HTMLImageElement }
) {
  const w = tmpl.width; const h = tmpl.height
  ctx.fillStyle = tmpl.bgColor; ctx.fillRect(0, 0, w, h)

  for (const sec of tmpl.sections) {
    switch (sec.type) {
      case "productImage":
        if (imgs.main) {
          const s = (sec.w || w) / imgs.main.width
          ctx.drawImage(imgs.main, sec.x, sec.y, sec.w || w, (sec.h || (sec.w || w)) || imgs.main.height * s)
        }
        break
      case "subImage":
        if (imgs.sub.length > 0) {
          // 平分横向空间
          const count = Math.min(imgs.sub.length, 3)
          const gap = 20; const totalW = sec.w || (w - sec.x * 2); const cw = (totalW - gap * (count - 1)) / count
          imgs.sub.slice(0, count).forEach((img, i) => {
            const sx = sec.x + i * (cw + gap)
            ctx.drawImage(img, sx, sec.y, cw, sec.h || cw)
          })
        }
        break
      case "sceneImage":
        if (imgs.scene) ctx.drawImage(imgs.scene, sec.x, sec.y, sec.w || w, sec.h || 540)
        break
      case "title":
        ctx.fillStyle = sec.color || "#1a1a1a"
        ctx.font = `bold ${sec.fontSize || 36}px system-ui`
        ctx.textAlign = sec.align === "center" ? "center" : "left"
        ctx.fillText(values.name.slice(0, 25), sec.align === "center" ? w / 2 : sec.x, sec.y)
        break
      case "price":
        ctx.fillStyle = sec.color || "#E53935"
        ctx.font = `bold ${sec.fontSize || 36}px system-ui`
        ctx.textAlign = sec.align === "center" ? "center" : "left"
        ctx.fillText(values.price, sec.align === "center" ? w / 2 : sec.x, sec.y)
        break
      case "sellingPoint":
        ctx.fillStyle = sec.color || "#333"
        ctx.font = `${sec.fontSize || 22}px system-ui`
        ctx.textAlign = "left"
        values.points.slice(0, 6).forEach((p, i) => ctx.fillText(`• ${p.slice(0, 25)}`, sec.x, sec.y + i * 42))
        break
      case "specs":
        ctx.fillStyle = sec.color || "#666"
        ctx.font = `${sec.fontSize || 18}px system-ui`
        ctx.textAlign = "left"
        values.specs.split("\n").filter(Boolean).slice(0, 6).forEach((l, i) => ctx.fillText(l.slice(0, 35), sec.x, sec.y + i * 32))
        break
      case "description":
        ctx.fillStyle = sec.color || "#999"
        ctx.font = `${sec.fontSize || 20}px system-ui`
        ctx.textAlign = "left"
        let dy = sec.y
        for (const l of values.desc.split("\n").filter(Boolean)) {
          if (dy > sec.y + 200) break
          ctx.fillText(l.slice(0, 30), sec.x, dy); dy += 32
        }
        break
      case "cta": {
        ctx.fillStyle = sec.bgColor || "#E53935"
        const r = 12; const cw = sec.w || 960; const ch = sec.h || 80
        ctx.beginPath()
        ctx.moveTo(sec.x + r, sec.y); ctx.lineTo(sec.x + cw - r, sec.y)
        ctx.quadraticCurveTo(sec.x + cw, sec.y, sec.x + cw, sec.y + r)
        ctx.lineTo(sec.x + cw, sec.y + ch - r); ctx.quadraticCurveTo(sec.x + cw, sec.y + ch, sec.x + cw - r, sec.y + ch)
        ctx.lineTo(sec.x + r, sec.y + ch); ctx.quadraticCurveTo(sec.x, sec.y + ch, sec.x, sec.y + ch - r)
        ctx.lineTo(sec.x, sec.y + r); ctx.quadraticCurveTo(sec.x, sec.y, sec.x + r, sec.y)
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = sec.color || "#FFFFFF"
        ctx.font = `bold ${sec.fontSize || 28}px system-ui`
        ctx.textAlign = "center"
        ctx.fillText("立即购买", sec.x + cw / 2, sec.y + ch / 2 + 10)
        break
      }
    }
  }
}

export default function ProductDetailPage({ productName, sellingPoints, productImages, specs, description, onDone }: ProductDetailPageProps) {
  const [templateId, setTemplateId] = useState(DETAIL_TEMPLATES[0].id)
  const [generating, setGenerating] = useState(false)
  const [doneBlob, setDoneBlob] = useState<Blob | null>(null)
  const [canvasKey, setCanvasKey] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const template = DETAIL_TEMPLATES.find(t => t.id === templateId) || DETAIL_TEMPLATES[0]

  const generate = useCallback(async () => {
    if (!canvasRef.current || !template) return
    setGenerating(true); setDoneBlob(null)

    const loadImg = (url: string): Promise<HTMLImageElement> => new Promise(resolve => {
      const img = new Image(); img.crossOrigin = "anonymous"
      img.onload = () => resolve(img); img.onerror = () => resolve(img)
      img.src = url
    })

    const loaded = await Promise.all(productImages.slice(0, 4).map(url => loadImg(url)))
    const [mainImg, ...subImgs] = loaded

    const canvas = canvasRef.current
    canvas.width = template.width; canvas.height = template.height
    const ctx = canvas.getContext("2d")
    if (!ctx) { setGenerating(false); return }

    const values = { name: productName, price: `¥${(Math.random() * 100 + 10).toFixed(0)}`, points: sellingPoints, specs, desc: description || productName }
    const imgs = { main: mainImg, sub: subImgs.filter(Boolean), scene: subImgs[0] }

    drawTemplate(ctx, template, values, imgs)
    canvas.toBlob(blob => { if (blob) { setDoneBlob(blob); onDone?.(blob) } }, "image/png")
    setGenerating(false)
  }, [template, productName, sellingPoints, productImages, specs, description, onDone])

  useEffect(() => { setDoneBlob(null); setCanvasKey(k => k + 1) }, [templateId])

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

      {/* 可见画布 + 下载按钮 */}
      <canvas ref={canvasRef} className="w-full max-w-sm mx-auto rounded-xl border border-white/10" style={{ display: doneBlob ? "block" : "none" }} />
      {doneBlob && (
        <div className="flex justify-center">
          <a href={URL.createObjectURL(doneBlob)} download={`${productName}_详情页.png`}
            className="px-6 py-2.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] text-sm font-medium border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">📥 下载 PNG</a>
        </div>
      )}
    </div>
  )
}
