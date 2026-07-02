"use client"
// 只负责触发登录弹窗 - 弹窗渲染在 layout 层，避免 backdrop-blur 导致 fixed 定位失效
export default function JiyingAuth({ onUserChange }: { onUserChange?: (u: any) => void }) {
  return null
}
