"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { parseContentToSlides, type SlideDeckConfig } from "@/lib/slide-engine"

interface SlideRendererProps {
  title: string
  content: string
  onRecordingComplete?: (blob: Blob) => void
  width?: number
  height?: number
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function SlideRenderer({ title, content, onRecordingComplete, width = 1080, height = 1920 }: SlideRendererProps) {
  const [deck, setDeck] = useState<SlideDeckConfig | null>(null)
  const [slideImages, setSlideImages] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingImages, setLoadingImages] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const imagesRef = useRef<Record<string, string>>({})

  // 初始化幻灯片
  useEffect(() => {
    if (!content) return
    const parsed = parseContentToSlides(content, title)
    setDeck(parsed)

    // 为每个幻灯片搜索免费配图
    const fetchImages = async () => {
      setLoadingImages(true)
      const results: Record<string, string> = {}
      const slideQueries = parsed.slides.map(s => s.content.slice(0, 30)).filter((q, i, a) => a.indexOf(q) === i)
      for (const q of slideQueries.slice(0, 8)) {
        try {
          const res = await fetch("/api/stock/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q, count: 1 }),
          })
          const data = await res.json()
          if (data.images?.[0]?.url) results[q] = data.images[0].url
        } catch {}
      }
      setSlideImages(results)
      imagesRef.current = results
      setLoadingImages(false)
    }
    fetchImages()
  }, [content, title])

  const renderSlide = useCallback((slideIdx: number, slideDeck: SlideDeckConfig) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const slide = slideDeck.slides[slideIdx]
    if (!slide) return

    const w = canvas.width; const h = canvas.height; const pad = 60
    const imgUrl = imagesRef.current[slide.content.slice(0, 30)]

    // 背景：有免费图就用图
    if (imgUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imgUrl
      try {
        ctx.drawImage(img, 0, 0, w, h)
        // 半透明遮罩
        ctx.fillStyle = "#0F172A99"
        ctx.fillRect(0, 0, w, h)
      } catch {}
    } else {
      const grad = ctx.createLinearGradient(0, 0, w * 0.5, h)
      grad.addColorStop(0, `${slideDeck.accentColor}18`)
      grad.addColorStop(1, `${slideDeck.accentColor}08`)
      ctx.fillStyle = slideDeck.bgColor
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    // 底部色条
    ctx.fillStyle = slideDeck.accentColor
    ctx.fillRect(0, h - 6, w, 6)
    ctx.fillStyle = "#ffffff20"
    ctx.font = "14px system-ui"
    ctx.textAlign = "right"
    ctx.fillText(`${slideIdx + 1} / ${slideDeck.slides.length}`, w - pad, h - 30)
    ctx.textAlign = "left"

    if (slide.type === "title") {
      ctx.fillStyle = slideDeck.accentColor
      ctx.font = "bold 48px system-ui"; ctx.textAlign = "center"
      ctx.fillText(slideDeck.title, w / 2, h * 0.35)
      ctx.fillStyle = slideDeck.textColor + "80"
      ctx.font = "24px system-ui"
      ctx.fillText(slideDeck.subtitle, w / 2, h * 0.45)
      ctx.fillStyle = slideDeck.textColor + "40"
      ctx.font = "16px system-ui"
      ctx.fillText("AI 自动生成 · 知识讲解", w / 2, h * 0.55)
    } else if (slide.type === "bullet") {
      const cardX = pad; const cardY = pad + 20
      const cardW = w - pad * 2; const cardH = h - pad * 2 - 40
      ctx.fillStyle = "#0F172ADD"
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, 16); ctx.fill()
      ctx.fillStyle = slideDeck.accentColor
      ctx.font = "bold 28px system-ui"
      ctx.fillText(slide.content.slice(0, 30), cardX + 30, cardY + 50)
      ctx.strokeStyle = `${slideDeck.accentColor}30`; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cardX + 30, cardY + 65); ctx.lineTo(cardX + cardW - 30, cardY + 65); ctx.stroke()
      if (slide.subContent) {
        const lines = slide.subContent.split("\n").filter(l => l.trim())
        ctx.fillStyle = slideDeck.textColor
        ctx.font = "20px system-ui"
        lines.forEach((line, i) => {
          const y = cardY + 110 + i * 45
          ctx.fillStyle = slideDeck.accentColor
          ctx.beginPath(); ctx.arc(cardX + 50, y - 5, 5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = slideDeck.textColor
          ctx.fillText(line.slice(0, 40), cardX + 70, y)
        })
      }
    } else if (slide.type === "cta") {
      ctx.fillStyle = slideDeck.accentColor
      ctx.font = "bold 36px system-ui"; ctx.textAlign = "center"
      ctx.fillText(slide.content, w / 2, h * 0.40)
      ctx.fillStyle = slideDeck.textColor + "80"
      ctx.font = "20px system-ui"
      ctx.fillText(slide.subContent || "", w / 2, h * 0.48)
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 1 ? slideDeck.accentColor : `${slideDeck.accentColor}40`
        ctx.beginPath(); ctx.arc(w / 2 + (i - 1) * 60, h * 0.58, 8, 0, Math.PI * 2); ctx.fill()
      }
    }
  }, [])

  useEffect(() => {
    if (!deck || !canvasRef.current) return
    let currentIdx = 0, elapsed = 0
    const animate = () => {
      if (!deck) return
      elapsed += 1 / 30
      const slide = deck.slides[currentIdx]
      if (slide && elapsed >= slide.duration) {
        currentIdx = Math.min(currentIdx + 1, deck.slides.length - 1)
        elapsed = 0
      }
      renderSlide(currentIdx, deck)
      setProgress(Math.min(99, Math.round(currentIdx / deck.slides.length * 100)))
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [deck, renderSlide])

  const handleRecord = useCallback(async () => {
    if (!canvasRef.current || !deck) return
    setRecording(true)
    try {
      const canvas = canvasRef.current
      const stream = canvas.captureStream(30)
      const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
      const chunks: Blob[] = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        onRecordingComplete?.(blob)
        setRecording(false); setProgress(100)
      }
      mr.start()
      setTimeout(() => { if (mr.state !== "inactive") mr.stop() }, (deck.totalDuration + 1) * 1000)
    } catch { setRecording(false) }
  }, [deck, onRecordingComplete])

  if (!deck) return null

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
        <canvas ref={canvasRef} width={width} height={height} className="w-full max-h-[70vh] mx-auto" style={{ aspectRatio: `${width}/${height}` }} />
        {recording && <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-red-500/80 text-white text-[10px]"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />REC {progress}%</div>}
      </div>
      {loadingImages && !recording && (
        <div className="text-center text-[10px] text-white/30 animate-pulse">🖼️ 正在搜索免费配图...</div>
      )}
      {!recording ? (
        <button onClick={handleRecord} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold hover:from-red-400 hover:to-red-500 transition-all">
          ⏺ 录制为视频（{deck.totalDuration}秒）
          {Object.keys(slideImages).length > 0 ? ` · ${Object.keys(slideImages).length}张实拍图` : ""}
        </button>
      ) : (
        <div className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs text-center border border-red-500/20">
          ⏺ 录制中... 共 {deck.slides.length} 页，约 {deck.totalDuration} 秒
        </div>
      )}
    </div>
  )
}
