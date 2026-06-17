// 图片分析：读取为 base64，直接传给 AI 视觉模型
// DeepSeek 支持多模态输入，无需本地 OCR

export async function analyzeImageInBrowser(file: File): Promise<{ dataUrl: string; name: string; size: number }> {
  const dataUrl = await new Promise<string>(resolve => {
    const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(file)
  })
  return { dataUrl, name: file.name, size: file.size }
}
