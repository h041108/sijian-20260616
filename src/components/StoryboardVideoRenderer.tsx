"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { StoryboardShot } from "@/lib/character-engine"

interface StoryboardVideoRendererProps {
  shots: StoryboardShot[]
  genre: string
  title: string
  onRecordingComplete?: (blob: Blob) => void
}

export default function StoryboardVideoRenderer({ shots, genre, title, onRecordingComplete }: StoryboardVideoRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const W = 1080, H = 1920
  const PER_SHOT = genre === "ad" ? 4 : 5 // 广告每镜4秒，其他5秒
  const totalDuration = shots.length * PER_SHOT
  const imgLoadCount = useRef(0)

  // 预加载所有关键帧
  useEffect(() => {
    if (shots.length === 0) return
    imgLoadCount.current = 0
    imagesRef.current = []
    const total = shots.filter(s => s.keyframeUrl).length
    if (total === 0) { setLoaded(true); return }

    shots.forEach((shot, i) => {
      if (!shot.keyframeUrl) { imgLoadCount.current++; return }
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        imgLoadCount.current++
        if (imgLoadCount.current >= total) setLoaded(true)
      }
      img.onerror = () => {
        imgLoadCount.current++
        if (imgLoadCount.current >= total) setLoaded(true)
      }
      img.src = shot.keyframeUrl
      imagesRef.current[i] = img
    })
  }, [shots])

  const getGenreColors = () => {
    switch (genre) {
      case "short_drama": return { primary: "#EC4899", bg: "#0F172A" }
      case "comic": return { primary: "#14B8A6", bg: "#0F172A" }
      case "ad": return { primary: "#F59E0B", bg: "#0F172A" }
      default: return { primary: "#3B82F6", bg: "#0F172A" }
    }
  }

  const colors = getGenreColors()

  // 渲染单帧
  const renderFrame = useCallback((timeMs: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const shotIdx = Math.min(Math.floor(timeMs / (PER_SHOT * 1000)), shots.length - 1)
    const shot = shots[shotIdx]
    if (!shot) return
    const progressInShot = (timeMs % (PER_SHOT * 1000)) / (PER_SHOT * 1000)

    // 背景
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // 关键帧（如果有）
    const img = imagesRef.current[shotIdx]
    if (img && shot.keyframeUrl) {
      try {
        // 缩放填满宽度
        const scale = W / img.width
        const imgH = img.height * scale
        const y = (H - imgH) / 2
        ctx.drawImage(img, 0, y, W, imgH)
        // 半透明遮罩
        ctx.fillStyle = `${colors.bg}AA`
        ctx.fillRect(0, 0, W, H)
      } catch {}
    }

    // 底部信息条 - 半透明背景
    const infoY = H - 240
    ctx.fillStyle = "#00000088"
    ctx.fillRect(0, infoY, W, 240)

    // 镜头编号与时长的上半部分
    ctx.fillStyle = colors.primary
    ctx.font = "bold 22px system-ui"
    ctx.textAlign = "left"
    ctx.fillText(`🎬 镜头 ${shot.shotNumber} / ${shots.length}`, 40, infoY + 45)

    // 持续时间进度条
    ctx.fillStyle = "#ffffff20"
    ctx.fillRect(40, infoY + 55, W - 80, 4)
    ctx.fillStyle = colors.primary
    ctx.fillRect(40, infoY + 55, (W - 80) * progressInShot, 4)

    // 画面描述
    ctx.fillStyle = "#E2E8F0"
    ctx.font = "20px system-ui"
    ctx.textAlign = "left"

    // Wrap text properly
    const maxWidth = W - 80
    const words = shot.description || ""
    const fontSize = 20
    ctx.font = `${fontSize}px system-ui`

    // 简单换行
    let line = "", lineY = infoY + 100
    for (const char of words) {
      const test = line + char
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, 40, lineY)
        line = char
        lineY += 28
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, 40, lineY)

    // 对话（如果有）
    if (shot.dialogue) {
      const dialY = lineY + 36
      ctx.fillStyle = colors.primary
      ctx.font = "18px system-ui"
      ctx.fillText(`💬 ${shot.dialogue.slice(0, 60)}`, 40, dialY)
    }

    // 右上角信息：镜头/运镜/氛围
    ctx.textAlign = "right"
    ctx.fillStyle = "#ffffff60"
    ctx.font = "16px system-ui"
    let rightY = 50
    if (shot.cameraAngle) { ctx.fillText(`📷 ${shot.cameraAngle}`, W - 40, rightY); rightY += 30 }
    if (shot.cameraMovement) { ctx.fillText(`🎥 ${shot.cameraMovement}`, W - 40, rightY); rightY += 30 }
    if (shot.mood) { ctx.fillText(`🎭 ${shot.mood}`, W - 40, rightY) }

    // 顶部标题
    ctx.textAlign = "center"
    ctx.fillStyle = "#ffffff40"
    ctx.font = "14px system-ui"
    ctx.fillText(title.slice(0, 30), W / 2, 30)

    // 类型标签
    ctx.textAlign = "left"
    const genreLabels: Record<string, string> = { short_drama: "🎭 微短剧", comic: "📚 漫剧", ad: "📢 产品广告", tutorial: "📖 知识图谱" }
    ctx.fillStyle = colors.primary
    ctx.font = "bold 14px system-ui"
    ctx.fillText(genreLabels[genre] || genre, 40, 30)
  }, [shots, genre, title, colors])

  // 动画循环
  useEffect(() => {
    if (!loaded) return
    let start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      renderFrame(elapsed)
      setProgress(Math.min(99, Math.round(elapsed / (totalDuration * 1000) * 100)))
      if (elapsed < totalDuration * 1000) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [loaded, totalDuration, renderFrame])

  // 录制
  const handleRecord = useCallback(() => {
    if (!canvasRef.current) return
    setRecording(true)
    const canvas = canvasRef.current
    const stream = canvas.captureStream(30)
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
    const chunks: Blob[] = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: "video/webm" })
        onRecordingComplete?.(blob)
      }
      setRecording(false)
    }
    mr.start()
    setTimeout(() => { if (mr.state !== "inactive") mr.stop() }, totalDuration * 1000 + 500)
    // 开始动画
    let start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      renderFrame(elapsed)
      setProgress(Math.min(99, Math.round(elapsed / (totalDuration * 1000) * 100)))
      if (elapsed < totalDuration * 1000) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
  }, [totalDuration, renderFrame, onRecordingComplete])

  if (shots.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
        <canvas ref={canvasRef} width={W} height={H} className="w-full max-h-[70vh] mx-auto" style={{ aspectRatio: `${W}/${H}` }} />
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-red-500/80 text-white text-[10px]">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />REC {progress}%
          </div>
        )}
      </div>
      {!loaded && !recording && (
        <div className="text-center text-[10px] text-white/30 animate-pulse">🖼️ 加载关键帧中...</div>
      )}
      {loaded && !recording ? (
        <div className="flex gap-2">
          <button onClick={handleRecord}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold hover:from-red-400 hover:to-red-500 transition-all">
            ⏺ 录制视频（{totalDuration}秒·{shots.length}镜头）
          </button>
        </div>
      ) : recording && (
        <div className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs text-center border border-red-500/20">
          ⏺ 录制中... {shots.length} 镜头，约 {totalDuration} 秒
        </div>
      )}
    </div>
  )
}
