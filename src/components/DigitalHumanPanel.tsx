"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export default function DigitalHumanPanel() {
  const [portrait, setPortrait] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [recording, setRecording] = useState(false)
  const [recordingSec, setRecordingSec] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handlePortrait = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setPortrait(reader.result as string); reader.readAsDataURL(file)
  }, [])

  const handleAudioFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
  }, [])

  const handleRecord = useCallback(async () => {
    // 正在录音 → 停止
    if (recording) {
      if (mrRef.current && mrRef.current.state !== "inactive") {
        mrRef.current.stop()
      }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setRecording(false)
      setRecordingSec(0)
      return
    }

    // 开始录音
    chunksRef.current = []
    setRecordingSec(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 选浏览器支持的 mime type
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find(m => MediaRecorder.isTypeSupported(m)) || ""

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mrRef.current = mr

      // 先绑定回调，再 start
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
          setAudioBlob(blob)
          setAudioUrl(URL.createObjectURL(blob))
        }
        // 释放麦克风
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        mrRef.current = null
      }

      mr.onerror = () => {
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setRecording(false)
        setRecordingSec(0)
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }

      mr.start()
      setRecording(true)

      // 计时器 + 最长 120 秒自动停止
      timerRef.current = setInterval(() => {
        setRecordingSec(s => {
          const next = s + 1
          if (next >= 120) {
            if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop()
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            setRecording(false)
            return 0
          }
          return next
        })
      }, 1000)
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("NotAllowed") || msg.includes("Permission denied")) {
        alert("麦克风权限被拒绝。请在浏览器地址栏左侧点🔒图标，开启麦克风权限后重试。")
      } else if (msg.includes("NotFound") || msg.includes("No device")) {
        alert("未检测到麦克风设备。请插入麦克风，或改用文件上传。")
      } else {
        alert(`无法录音（${msg.slice(0, 80)}）。请改用文件上传。`)
      }
    }
  }, [recording])

  const handleGenerate = useCallback(async () => {
    if (!portrait || !audioBlob) return
    setGenerating(true); setResultUrl(null); setProgress(0); setStatusMsg("正在上传素材...")

    try {
      // ── 1. 上传素材 ──
      let imageUrl = portrait
      if (portrait.startsWith("data:")) {
        const imgResp = await fetch(portrait)
        const imgBlob = await imgResp.blob()
        const fd = new FormData()
        fd.append("file", imgBlob, `portrait-${Date.now()}.png`)
        const upRes = await fetch("/api/upload", { method: "POST", body: fd })
        if (upRes.ok) { const upData = await upRes.json(); imageUrl = upData.url || portrait }
      }

      const audioFd = new FormData()
      audioFd.append("file", audioBlob, `audio-${Date.now()}.webm`)
      const audioUpRes = await fetch("/api/upload", { method: "POST", body: audioFd })
      let uploadedAudioUrl = ""
      if (audioUpRes.ok) { const audioUpData = await audioUpRes.json(); uploadedAudioUrl = audioUpData.url || "" }

      setProgress(10)

      // ── 2. 尝试 OmniHuman 真实数字人 ──
      let usedOmniHuman = false
      try {
        setStatusMsg("正在生成实时数字人视频...")
        const dhRes = await fetch("/api/video/digital-human", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: imageUrl.startsWith("http") ? imageUrl : portrait, audioUrl: uploadedAudioUrl || audioUrl || "" }),
        })
        const dhData = await dhRes.json()
        if (dhData.taskId) {
          setStatusMsg("数字人渲染中（约 30-60 秒）...")
          // 轮询等待
          for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise(r => setTimeout(r, 3000))
            const pollRes = await fetch(`/api/video/digital-human?task_id=${dhData.taskId}`)
            const pollData = await pollRes.json()
            setProgress(10 + Math.min(75, attempt * 2))
            if (pollData.status === "done" && pollData.videoUrl) {
              const videoResp = await fetch(pollData.videoUrl)
              const videoBlob = await videoResp.blob()
              setResultUrl(URL.createObjectURL(videoBlob))
              setStatusMsg("✅ 数字人视频已生成（OmniHuman 1.5 真唇同步）")
              setProgress(100)
              usedOmniHuman = true
              break
            }
            if (pollData.status === "failed" || pollData.status === "expired" || pollData.status === "not_found") break
          }
        }
      } catch {}

      // ── 3. OmniHuman 不可用时提示 ──
      if (!usedOmniHuman) {
        setStatusMsg("❌ 数字人服务暂时不可用，请稍后重试或联系管理员")
        setProgress(0)
      }
    } catch (err: any) {
      setStatusMsg(`❌ 生成失败: ${err?.message || "未知错误"}`)
    }
    setGenerating(false)
  }, [portrait, audioBlob])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `即影-口播-${Date.now()}.webm`
    a.click()
  }, [resultUrl])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-2xl border border-purple-700 p-8 text-center">
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-xl font-bold text-white mb-2">数字人口播</h2>
        <p className="text-sm text-purple-300 mb-1">一张照片 + 一段音频 → 会说话的数字人</p>
        <p className="text-xs text-purple-400">Canvas 合成 · 音频驱动唇动 + 头部微晃</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📷 上传照片</h4>
            <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer overflow-hidden transition-all bg-gray-50">
              {portrait
                ? <img src={portrait} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-sm">点击上传照片</span>
                  </div>
              }
              <input type="file" accept="image/*" onChange={handlePortrait} className="hidden" />
            </label>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🎙️ 上传音频</h4>
            <label className={`block w-full rounded-xl border-2 border-dashed p-4 text-center cursor-pointer hover:border-purple-300 transition-all min-h-[100px] flex flex-col items-center justify-center ${
              audioUrl ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-gray-50"
            }`}>
              {audioUrl
                ? <div className="w-full">
                    <span className="text-2xl">🎵</span>
                    <p className="text-xs text-purple-600 mt-1">音频已就绪，点击可更换</p>
                    <audio src={audioUrl} controls className="mt-2 mx-auto w-full max-w-[180px] h-8" />
                  </div>
                : <div className="text-gray-400">
                    <span className="text-4xl mb-2 block">🎙️</span>
                    <span className="text-sm">点击上传音频文件</span>
                    <span className="text-[10px] block mt-1 text-gray-300">建议用手机录音 App 先录好</span>
                  </div>
              }
              <input type="file" accept="audio/*" onChange={handleAudioFile} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300">或者</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button onClick={handleRecord}
              className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${
                recording
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}>
              {recording ? `🔴 录音中 ${recordingSec}s · 点击停止（最长120s）` : "🎤 直接录音"}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              点击开始录音，说完点停止，自动就绪
            </p>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={!portrait || !audioBlob || generating}
          className="w-full mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {generating
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> {statusMsg || "正在合成..."}
                {progress > 0 && <span className="text-xs opacity-70">({progress}%)</span>}
              </span>
            : "🎭 生成口播视频"
          }
        </button>

        {!portrait || !audioBlob ? (
          <div className="mt-3 text-[10px] text-gray-300 text-center">
            {!portrait && "👆 请先上传照片  "}
            {!portrait && !audioBlob && "·  "}
            {!audioBlob && "👆 请先上传音频"}
          </div>
        ) : null}
      </div>

      {resultUrl && (
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">✅ 生成结果</h3>
            <button onClick={handleDownload}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-xs font-medium">
              📥 下载视频
            </button>
          </div>
          <video src={resultUrl} controls className="w-full rounded-xl max-h-[500px]" />
        </div>
      )}
    </div>
  )
}
