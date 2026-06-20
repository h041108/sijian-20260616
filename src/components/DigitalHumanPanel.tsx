"use client"

import { useState, useRef, useCallback } from "react"
import { assembleTalkingHead, downloadVideo } from "@/lib/video-assembler"

export default function DigitalHumanPanel() {
  const [portrait, setPortrait] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handlePortrait = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setPortrait(reader.result as string); reader.readAsDataURL(file)
  }, [])

  const handleAudio = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAudioBlob(file); setAudioUrl(URL.createObjectURL(file))
  }, [])

  const toggleRecording = useCallback(async () => {
    if (recording) { mediaRecorderRef.current?.stop(); setRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr; chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start(); setRecording(true)
    } catch { alert("无法访问麦克风，请检查浏览器权限") }
  }, [recording])

  const handleGenerate = useCallback(async () => {
    if (!portrait || !audioBlob) return
    setGenerating(true); setResultUrl(null); setProgress(0)

    try {
      const blob = await assembleTalkingHead({
        portraitUrl: portrait,
        audioBlob,
        width: 1080,
        height: 1920,
        fps: 24,
      }, (pct: number) => setProgress(pct))
      setResultUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      alert(`视频合成失败: ${err?.message || "未知错误"}`)
    }
    setGenerating(false)
  }, [portrait, audioBlob])

  const handleDownload = useCallback(() => {
    if (!resultUrl || resultUrl.startsWith("data:")) return
    fetch(resultUrl).then(r => r.blob()).then(b => downloadVideo(b, `即影-口播-${Date.now()}.webm`))
  }, [resultUrl])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-2xl border border-purple-700 p-8 text-center">
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-xl font-bold text-white mb-2">数字人口播</h2>
        <p className="text-sm text-purple-300 mb-1">一张照片 + 一段音频 → 下载口播视频</p>
        <p className="text-xs text-purple-400">Canvas 合成 · 支持直接下载 · 本地 InfiniteTalk 可选补充唇同步</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📷 上传照片</h4>
            <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer overflow-hidden transition-all bg-gray-50">
              {portrait ? <img src={portrait} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><span className="text-4xl mb-2">📷</span><span className="text-sm">点击上传照片</span></div>}
              <input type="file" accept="image/*" onChange={handlePortrait} className="hidden" />
            </label>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🎙️ 上传或录制音频</h4>
            <div className="space-y-3">
              <label className={`block w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-purple-300 transition-all ${audioUrl ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
                {audioUrl ? <div><span className="text-2xl">🎵</span><p className="text-sm text-purple-600 mt-1">音频已就绪</p><audio src={audioUrl} controls className="mt-2 mx-auto max-w-full" /></div> : <div className="text-gray-400"><span className="text-4xl mb-2 block">🎙️</span><span className="text-sm">点击上传音频文件</span></div>}
                <input type="file" accept="audio/*" onChange={handleAudio} className="hidden" />
              </label>
              <button onClick={toggleRecording} className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${recording ? "bg-red-600 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                {recording ? "🔴 录音中... 点击停止" : "🎤 或直接录音"}
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={!portrait || !audioBlob || generating}
          className="w-full mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {generating ? "⏳ 正在合成视频..." : "🎭 生成口播视频"}
        </button>
      </div>

      {resultUrl && (
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">✅ 生成结果</h3>
            <button onClick={handleDownload} className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-xs font-medium">📥 下载视频</button>
          </div>
          {resultUrl.startsWith("blob:") ? (
            <video src={resultUrl} controls className="w-full rounded-xl max-h-[500px]" />
          ) : <p className="text-xs text-gray-400">视频已生成，点击下载按钮保存到本地</p>}
        </div>
      )}
    </div>
  )
}
