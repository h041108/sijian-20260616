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
  const renderFrameRef = useRef<(timeMs: number) => void>(() => {})
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [doneBlob, setDoneBlob] = useState<Blob | null>(null)

  const W = 1080, H = 1920
  const PER_SHOT = genre === "ad" ? 4 : 5
  const totalDuration = shots.length * PER_SHOT
  const imgLoadCount = useRef(0)

  // 预加载关键帧
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
      img.onload = () => { imgLoadCount.current++; if (imgLoadCount.current >= total) setLoaded(true) }
      img.onerror = () => { imgLoadCount.current++; if (imgLoadCount.current >= total) setLoaded(true) }
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

  const renderFrame = useCallback((timeMs: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const shotIdx = Math.min(Math.floor(timeMs / (PER_SHOT * 1000)), shots.length - 1)
    const shot = shots[shotIdx]
    if (!shot) return
    const progressInShot = (timeMs % (PER_SHOT * 1000)) / (PER_SHOT * 1000)

    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H)

    const img = imagesRef.current[shotIdx]
    if (img && shot.keyframeUrl) {
      try {
        const scale = W / img.width; const imgH = img.height * scale
        ctx.drawImage(img, 0, (H - imgH) / 2, W, imgH)
        ctx.fillStyle = `${colors.bg}AA`; ctx.fillRect(0, 0, W, H)
      } catch {}
    }

    const infoY = H - 240
    ctx.fillStyle = "#00000088"; ctx.fillRect(0, infoY, W, 240)
    ctx.fillStyle = colors.primary
    ctx.font = "bold 22px system-ui"; ctx.textAlign = "left"
    ctx.fillText(`🎬 镜头 ${shot.shotNumber} / ${shots.length}`, 40, infoY + 40)
    ctx.fillStyle = "#ffffff20"; ctx.fillRect(40, infoY + 50, W - 80, 4)
    ctx.fillStyle = colors.primary; ctx.fillRect(40, infoY + 50, (W - 80) * progressInShot, 4)

    const maxWidth = W - 80
    ctx.fillStyle = "#E2E8F0"; ctx.font = "20px system-ui"; ctx.textAlign = "left"
    let line = "", lineY = infoY + 95
    for (const ch of (shot.description || "")) {
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth) { ctx.fillText(line, 40, lineY); line = ch; lineY += 28 }
      else line = test
    }
    if (line) ctx.fillText(line, 40, lineY)

    if (shot.dialogue) {
      ctx.fillStyle = colors.primary; ctx.font = "18px system-ui"
      ctx.fillText(`💬 ${shot.dialogue.slice(0, 60)}`, 40, lineY + 36)
    }

    ctx.textAlign = "right"; ctx.fillStyle = "#ffffff60"; ctx.font = "16px system-ui"
    let rightY = 50
    if (shot.cameraAngle) { ctx.fillText(`📷 ${shot.cameraAngle}`, W - 40, rightY); rightY += 30 }
    if (shot.cameraMovement) { ctx.fillText(`🎥 ${shot.cameraMovement}`, W - 40, rightY); rightY += 30 }

    ctx.textAlign = "center"; ctx.fillStyle = "#ffffff40"; ctx.font = "14px system-ui"
    ctx.fillText(title.slice(0, 30), W / 2, 30)
    ctx.textAlign = "left"
    const gl: Record<string, string> = { short_drama: "🎭 微短剧", comic: "📚 漫剧", ad: "📢 广告", tutorial: "📖 知识" }
    ctx.fillStyle = colors.primary; ctx.font = "bold 14px system-ui"
    ctx.fillText(gl[genre] || genre, 40, 30)
  }, [shots, genre, title, colors])

  renderFrameRef.current = renderFrame

  useEffect(() => {
    if (!loaded || recording) { if (!loaded) setProgress(0); return }
    let start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      renderFrameRef.current(elapsed)
      setProgress(Math.min(99, Math.round(elapsed / (totalDuration * 1000) * 100)))
      if (elapsed < totalDuration * 1000) animRef.current = requestAnimationFrame(animate)
      else setProgress(100)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [loaded, totalDuration, recording])

  // 录制视频
  const handleRecord = useCallback(() => {
    if (!canvasRef.current) return
    cancelAnimationFrame(animRef.current)
    setRecording(true); setDoneBlob(null)
    const canvas = canvasRef.current
    const stream = canvas.captureStream(30)
    // 添加静音音频轨道（防止录制无音轨导致播放异常）
    try {
      const audioCtx = new AudioContext()
      const dst = audioCtx.createMediaStreamDestination()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      gain.gain.value = 0.001 // 近乎静音
      osc.connect(gain)
      gain.connect(dst)
      osc.start()
      stream.addTrack(dst.stream.getAudioTracks()[0])
      // 录制结束后关闭 AudioContext
      setTimeout(() => { try { audioCtx.close() } catch {} }, (totalDuration + 2) * 1000)
    } catch {}
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
    const chunks: Blob[] = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: "video/webm" })
        setDoneBlob(blob)
        onRecordingComplete?.(blob)
      }
      setRecording(false)
    }
    mr.start()
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      renderFrameRef.current(elapsed)
      setProgress(Math.min(99, Math.round(elapsed / (totalDuration * 1000) * 100)))
      if (elapsed < totalDuration * 1000) animRef.current = requestAnimationFrame(animate)
      else {
        setProgress(100)
        setTimeout(() => { if (mr.state !== "inactive") mr.stop() }, 500)
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }, [totalDuration, onRecordingComplete])

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

      {loaded && !recording && !doneBlob && (
        <button onClick={handleRecord}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold hover:from-red-400 hover:to-red-500 transition-all">
          ⏺ 录制视频（{totalDuration}秒·{shots.length}镜头）
        </button>
      )}

      {recording && (
        <div className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs text-center border border-red-500/20">
          ⏺ 录制中... {shots.length} 镜头，约 {totalDuration} 秒
        </div>
      )}

      {doneBlob && (
        <div className="flex gap-2">
          <a href={URL.createObjectURL(doneBlob)} download={`视频_${Date.now()}.webm`}
            className="flex-1 py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-medium text-center hover:bg-green-500/25">
            📥 下载视频 (.webm)
          </a>
          <button onClick={() => { setDoneBlob(null); setProgress(0) }}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-white/40 text-xs border border-white/[0.06] hover:bg-white/[0.08]">
            重新录制
          </button>
        </div>
      )}
    </div>
  )
}
