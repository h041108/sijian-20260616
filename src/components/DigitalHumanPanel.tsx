"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { assembleTalkingHead, downloadVideo } from "@/lib/video-assembler"

export default function DigitalHumanPanel() {
  const [portrait, setPortrait] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current) }
  }, [])

  const handlePortrait = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setPortrait(reader.result as string); reader.readAsDataURL(file)
  }, [])

  const handleAudio = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAudioBlob(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!portrait || !audioBlob) return
    setGenerating(true); setResultUrl(null); setProgress(0); setStatusMsg("正在合成...")

    try {
      setStatusMsg("正在用 Canvas 引擎合成...（纯浏览器，零GPU）")
      setProgress(5)
      const blob = await assembleTalkingHead({
        portraitUrl: portrait,
        audioBlob,
        width: 1080,
        height: 1920,
        fps: 24,
      }, (pct: number) => setProgress(5 + Math.round(pct * 0.9)))
      setResultUrl(URL.createObjectURL(blob))
      setStatusMsg("✅ 视频已生成")
    } catch (err: any) {
      alert(`视频合成失败: ${err?.message || "未知错误"}`)
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
              <input type="file" accept="audio/*" onChange={handleAudio} className="hidden" />
            </label>

            {!audioUrl && (
              <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
                没有音频文件？<br />
                打开手机自带「录音机」App 录一段话，<br />
                然后回到这里点上方框上传。
              </p>
            )}
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
