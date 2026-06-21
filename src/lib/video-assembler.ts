// ─── 客户端视频合成器 ────────────────────────────────
// Canvas 绘制图像帧 → MediaRecorder 录制 → Blob → 下载
// 支持多镜头 + 分段配音 + 字幕叠加

export interface FrameClip {
  url: string
  startTime: number
  endTime: number
  index: number
  dialogue?: string
}

export interface AudioClip {
  startTime: number
  audioUrl: string
  dialogue?: string
}

export interface AssembleRequest {
  frames: FrameClip[]
  audioUrl?: string
  audioClips?: AudioClip[]
  width: number
  height: number
  fps?: number
}

export async function assembleVideoClientSide(
  req: AssembleRequest,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const { frames, audioUrl, width, height, fps = 24 } = req
  if (frames.length === 0) throw new Error("No frames to assemble")

  const totalDuration = frames[frames.length - 1].endTime
  const totalFrames = Math.ceil(totalDuration * fps)

  // 图片代理 — 解决跨域问题（火山引擎 OSS 图片 CORS 受限）
  function proxyUrl(originalUrl: string): string {
    if (originalUrl.includes("placehold.co") || originalUrl.startsWith("data:") || originalUrl.startsWith("blob:")) {
      return originalUrl
    }
    // 火山引擎 OSS / 外部 URL → 通过服务端代理
    if (originalUrl.includes("volces.com") || originalUrl.startsWith("http")) {
      return `/api/video/proxy-image?url=${encodeURIComponent(originalUrl)}`
    }
    return originalUrl
  }

  // 1. 加载所有图片
  onProgress?.(5)
  const images = await Promise.all(
    frames.map(async (f, i) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      const src = proxyUrl(f.url)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load frame ${i}: ${f.url.slice(0, 80)}`))
        img.src = src
      })
      return img
    }),
  )

  // 2. 创建 Canvas + MediaRecorder
  onProgress?.(20)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  // 如果有音频，加载它
  let audioEl: HTMLAudioElement | null = null
  if (audioUrl) {
    audioEl = new Audio(audioUrl)
    audioEl.crossOrigin = "anonymous"
    await new Promise<void>((resolve) => {
      audioEl!.addEventListener("loadedmetadata", () => resolve())
      audioEl!.load()
    })
  }

  // 3. 使用 MediaRecorder 录制 Canvas
  const stream = (canvas as any).captureStream(fps)
  // 如果有音频，合并音轨（简化版：用 MediaStream 合并）
  if (audioEl) {
    try {
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaElementSource(audioEl)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      source.connect(audioCtx.destination) // also play audio
      const audioTrack = dest.stream.getAudioTracks()[0]
      if (audioTrack) stream.addTrack(audioTrack)
    } catch {}
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      resolve(blob)
    }
    recorder.onerror = (e) => reject(e)

    recorder.start()

    // 4. 逐帧绘制
    let currentFrame = 0
    const frameInterval = 1000 / fps

    const drawFrame = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop()
        return
      }

      const currentTime = currentFrame / fps

      // 找到当前应该显示哪张图片
      const frame = frames.find(f => currentTime >= f.startTime && currentTime < f.endTime)
      const idx = frame ? frame.index : frames.length - 1
      const img = images[Math.min(idx, images.length - 1)]

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // ── 字幕叠加 ──
      // 当前帧所属的镜头
      const currentFrameClip = frames.find(f => currentTime >= f.startTime && currentTime < f.endTime)
      const clipDialogue = (currentFrameClip as any)?.dialogue
      if (clipDialogue && clipDialogue !== "无" && clipDialogue.length > 1) {
        // 半透明黑底
        const fontSize = Math.round(height * 0.04)
        ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", system-ui`
        const textWidth = ctx.measureText(clipDialogue).width
        const tx = (width - textWidth) / 2
        const ty = height - fontSize * 2.5
        ctx.fillStyle = "rgba(0,0,0,0.65)"
        ctx.fillRect(tx - 16, ty - fontSize - 4, textWidth + 32, fontSize + 12)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(clipDialogue, tx, ty)
      }

      // 帧序号水印
      ctx.fillStyle = "rgba(0,0,0,0.4)"
      ctx.fillRect(16, height - 36, 100, 24)
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px system-ui"
      ctx.fillText(`镜头 ${idx + 1}/${frames.length}`, 24, height - 20)

      currentFrame++
      const pct = 20 + Math.round((currentFrame / totalFrames) * 75)
      onProgress?.(pct)

      setTimeout(drawFrame, frameInterval)
    }

    if (audioEl) audioEl.play()
    drawFrame()
  })
}

export function downloadVideo(blob: Blob, filename: string = "sijian-video.webm"): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
