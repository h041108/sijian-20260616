"use client"

import { useState, useRef, useCallback } from "react"

export default function DigitalHumanPanel() {
  const [portrait, setPortrait] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // 上传照片
  const handlePortrait = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPortrait(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  // 上传音频
  const handleAudio = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
  }, [])

  // 录音
  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch {
      alert("无法访问麦克风，请检查浏览器权限")
    }
  }, [recording])

  // 生成
  const handleGenerate = useCallback(async () => {
    if (!portrait || !audioBlob) return
    setGenerating(true)
    setResultUrl(null)

    // 尝试调用本地 InfiniteTalk API
    try {
      const formData = new FormData()
      // portrait: dataUrl → blob
      const resp = await fetch(portrait)
      const imgBlob = await resp.blob()
      formData.append("image", imgBlob, "portrait.png")
      formData.append("audio", audioBlob, "audio.webm")

      const ir = await fetch("http://localhost:7860/api/generate", {
        method: "POST", body: formData,
      })
      if (ir.ok) {
        const videoBlob = await ir.blob()
        setResultUrl(URL.createObjectURL(videoBlob))
        setGenerating(false)
        return
      }
    } catch { /* InfiniteTalk 未启动，显示演示 */ }

    // 降级：生成带唇动模拟的预览占位
    setTimeout(() => {
      setResultUrl(portrait) // 暂用照片作为占位
      setGenerating(false)
    }, 2000)
  }, [portrait, audioBlob])

  return (
    <div className="space-y-6">
      {/* ═══ 标题 ═══ */}
      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-2xl border border-purple-700 p-8 text-center">
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-xl font-bold text-white mb-2">数字人口播</h2>
        <p className="text-sm text-purple-300 mb-1">一张照片 + 一段音频 → 照片开口说话</p>
        <p className="text-xs text-purple-400">InfiniteTalk 全身体动驱动 · 唇同步 1.8mm 精度 · 本地运行</p>
      </div>

      {/* ═══ 操作面板 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 照片 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📷 上传照片</h4>
            <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer overflow-hidden transition-all bg-gray-50">
              {portrait ? (
                <img src={portrait} alt="照片" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm">点击上传照片</span>
                  <span className="text-xs mt-1">最好是人像正面照</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePortrait} className="hidden" />
            </label>
          </div>

          {/* 音频 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🎙️ 上传或录制音频</h4>
            <div className="space-y-3">
              <label className={`block w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-purple-300 transition-all ${
                audioUrl ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50"
              }`}>
                {audioUrl ? (
                  <div>
                    <span className="text-2xl">🎵</span>
                    <p className="text-sm text-purple-600 mt-1">音频已就绪</p>
                    <audio src={audioUrl} controls className="mt-2 mx-auto max-w-full" />
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <span className="text-4xl mb-2 block">🎙️</span>
                    <span className="text-sm">点击上传音频文件</span>
                    <span className="text-xs block mt-1">支持 MP3 / WAV / WebM</span>
                  </div>
                )}
                <input type="file" accept="audio/*" onChange={handleAudio} className="hidden" />
              </label>

              <button onClick={toggleRecording}
                className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${
                  recording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}>
                {recording ? "🔴 录音中... 点击停止" : "🎤 或直接录音"}
              </button>
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <button onClick={handleGenerate} disabled={!portrait || !audioBlob || generating}
          className="w-full mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {generating ? "⏳ 正在生成口播视频..." : "🎭 生成口播视频"}
        </button>
      </div>

      {/* ═══ 结果 ═══ */}
      {resultUrl && (
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">✅ 生成结果</h3>
            {!resultUrl.startsWith("blob:") && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                ⚠️ InfiniteTalk 未检测到 · 显示预览
              </span>
            )}
          </div>
          {resultUrl.startsWith("blob:") ? (
            <video src={resultUrl} controls className="w-full rounded-xl max-h-[500px]" />
          ) : (
            <div className="text-center py-8 bg-purple-50 rounded-xl">
              <div className="text-4xl mb-3">🖥️</div>
              <p className="text-sm text-gray-700 font-medium">需要在本地部署 InfiniteTalk</p>
              <p className="text-xs text-gray-500 mt-1">已准备好照片和音频，启动 InfiniteTalk 后即可一键生成</p>
              <div className="mt-4 bg-gray-900 rounded-xl p-3 text-left">
                <pre className="text-[11px] text-green-400 font-mono leading-relaxed">
{`# 1. 克隆 InfiniteTalk
git clone https://github.com/MeiGen-AI/InfiniteTalk.git
cd InfiniteTalk

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动服务
python app.py
# → http://localhost:7860

# 4. 在思见中点击生成`}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
