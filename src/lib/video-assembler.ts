// ─── 客户端视频合成器 ────────────────────────────────
// Canvas 绘制图像帧 → MediaRecorder 录制 → Blob → 下载
// 支持多镜头 + 分段配音 + 字幕叠加
// 支持数字人口播：音频驱动的伪唇动 + 头部微晃

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

export interface TalkingHeadRequest {
  portraitUrl: string            // 人物照片
  audioBlob: Blob                // 音频文件
  width?: number                 // 默认 1080
  height?: number                // 默认 1920 (竖屏)
  fps?: number
  // 嘴部区域（占画面比例，0-1），默认值适配大多数半身照
  mouthY?: number                // 嘴部中心 Y 位置 (0=top, 1=bottom)，默认 0.62
  mouthScaleX?: number           // 嘴部水平范围，默认 0.35
  mouthScaleY?: number           // 嘴部垂直范围，默认 0.08
  headShakeAmplitude?: number    // 头部晃动幅度(px)，默认 3
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

// ═══════════════════════════════════════════════════
// 数字人口播 — 音频驱动的伪唇动 + 头部微晃
// 零 GPU，纯 Canvas 2D，浏览器内置 API
// ═══════════════════════════════════════════════════

// ── 分析音频，提取每帧音量 ──
async function analyzeAudioVolume(
  audioBlob: Blob,
  fps: number,
  totalDuration: number,
): Promise<Float32Array> {
  const totalFrames = Math.ceil(totalDuration * fps)
  const volume = new Float32Array(totalFrames)

  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioCtx = new OfflineAudioContext({
      numberOfChannels: 1,
      length: 44100 * totalDuration,
      sampleRate: 44100,
    })
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    const rawData = audioBuffer.getChannelData(0)

    // 每帧对应多少采样点
    const samplesPerFrame = Math.floor(rawData.length / totalFrames)
    for (let f = 0; f < totalFrames; f++) {
      let sum = 0
      const start = f * samplesPerFrame
      const end = Math.min(start + samplesPerFrame, rawData.length)
      for (let s = start; s < end; s++) {
        sum += Math.abs(rawData[s])
      }
      const avg = sum / (end - start)
      // 归一化到 0-1，加平滑
      volume[f] = Math.min(1, avg * 3.5)
    }

    // 平滑处理（3 帧滑动窗口，避免嘴部抖动）
    const smoothed = new Float32Array(totalFrames)
    for (let f = 0; f < totalFrames; f++) {
      let sum = 0, count = 0
      for (let w = Math.max(0, f - 1); w <= Math.min(totalFrames - 1, f + 1); w++) {
        sum += volume[w]; count++
      }
      smoothed[f] = sum / count
    }
    return smoothed
  } catch {
    // 静音分析失败 → 用正弦波模拟（至少有点动）
    for (let f = 0; f < totalFrames; f++) {
      volume[f] = 0.15 + 0.1 * Math.sin(f * 0.3)
    }
    return volume
  }
}

// ── 嘴部效果：提取嘴部区域，上下拉伸模拟张合 ──
// 比 clip+scale 更明显，因为直接修改了嘴部像素位置
function drawMouthEffect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number, height: number,
  mouthY: number, mouthH: number,
  volume: number,
) {
  const mh = mouthH * 0.5 // 嘴部区域半高
  const my = height * mouthY - mh  // 嘴部区域顶部
  const stretch = volume * 0.45   // 拉伸量 (0~0.45，音量最大时嘴张到1.45倍)

  // 嘴部以上 → 往上推（上唇提）
  const upperLipY = my - mh * 0.8
  ctx.drawImage(img, 0, upperLipY, width, my - upperLipY,   // source: 上唇以上区域
    0, upperLipY - mh * stretch * 0.5, width, my - upperLipY)

  // 嘴部以下 → 往下推（下唇降）
  const lowerLipEnd = my + mh * 1.6
  ctx.drawImage(img, 0, my, width, lowerLipEnd - my,        // source: 下唇以下区域
    0, my + mh * stretch * 0.5, width, lowerLipEnd - my)

  // 嘴部区域：上下同时拉伸
  ctx.drawImage(img,
    0, my, width, mh * 2,                                  // source: 嘴部
    0, my - mh * stretch * 0.3, width, mh * 2 * (1 + stretch)  // dest: 拉伸
  )
}

// ── 头部微晃 ──
function drawWithHeadShake(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number, height: number,
  frameIndex: number, amplitude: number, volume: number,
) {
  const xShake = Math.sin(frameIndex * 0.05) * amplitude * 0.3
  const yShake = Math.cos(frameIndex * 0.07) * amplitude * 0.4 + volume * amplitude * 0.2
  ctx.setTransform(1, 0, 0, 1, xShake, yShake)
  ctx.drawImage(img, 0, 0, width, height)
  ctx.setTransform(1, 0, 0, 1, 0, 0) // 重置变换
}

export async function assembleTalkingHead(
  req: TalkingHeadRequest,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const {
    portraitUrl,
    audioBlob,
    width = 1080,
    height = 1920,
    fps = 24,
    mouthY = 0.60,
    mouthScaleY = 0.07,   // 嘴部区域高度比例
    headShakeAmplitude = 4,
  } = req

  // 1. 加载肖像
  onProgress?.(5)
  const img = new Image()
  img.crossOrigin = "anonymous"
  const src = portraitUrl.startsWith("data:") || portraitUrl.startsWith("blob:")
    ? portraitUrl
    : `/api/video/proxy-image?url=${encodeURIComponent(portraitUrl)}`
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Failed to load portrait"))
    img.src = src
  })

  // 2. 加载音频 → 获取时长 + 分析音量
  onProgress?.(10)
  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)
  await new Promise<void>((resolve) => {
    audio.addEventListener("loadedmetadata", () => resolve())
    audio.load()
  })
  const totalDuration = Math.max(audio.duration || 3, 3)
  const totalFrames = Math.ceil(totalDuration * fps)

  onProgress?.(15)
  const volumeData = await analyzeAudioVolume(audioBlob, fps, totalDuration)

  // 3. Canvas + MediaRecorder
  onProgress?.(25)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const stream = (canvas as any).captureStream(fps)

  // 合并音频轨道
  try {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(audio)
    const dest = audioCtx.createMediaStreamDestination()
    source.connect(dest)
    source.connect(audioCtx.destination)
    const audioTrack = dest.stream.getAudioTracks()[0]
    if (audioTrack) stream.addTrack(audioTrack)
  } catch {}

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      URL.revokeObjectURL(audioUrl)
      resolve(blob)
    }
    recorder.onerror = (e) => reject(e)

    recorder.start()

    let currentFrame = 0
    const frameInterval = 1000 / fps

    const drawFrame = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop()
        return
      }

      const vol = volumeData[currentFrame] || 0

      // ── 清除 ──
      ctx.clearRect(0, 0, width, height)

      // ── 1. 画带头部微晃的底图 ──
      drawWithHeadShake(ctx, img, width, height, currentFrame, headShakeAmplitude, vol)

      // ── 2. 在底图上叠加嘴部效果 ──
      const mouthH = height * mouthScaleY
      drawMouthEffect(ctx, img, width, height, mouthY, mouthH, vol)

      // ── 3. 音量指示器 ──
      ctx.fillStyle = "rgba(255,255,255,0.12)"
      ctx.fillRect(width - 52, height - 22, 44, 8)
      ctx.fillStyle = vol > 0.15 ? "#4ade80" : "#64748b"
      ctx.fillRect(width - 50, height - 20, Math.round(40 * vol), 4)

      currentFrame++
      const pct = 25 + Math.round((currentFrame / totalFrames) * 70)
      onProgress?.(pct)

      setTimeout(drawFrame, frameInterval)
    }

    audio.play()
    drawFrame()
  })
}
