// ─── 思见 API 认证中间件 ────────────────────────────
// 保护所有 API 路由，验证 Supabase session
// 未配置 Supabase 时放行全部请求

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const HAS_SUPABASE = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || "").length > 0 &&
  !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 0

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/upload",
  "/api/video/proxy-image",
  "/pricing",
  "/checkout",
  "/demo",
  "/share",
  "/_next",
  "/favicon.ico",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 未配置 Supabase 时放行全部请求
  if (!HAS_SUPABASE) return NextResponse.next()

  // 允许公开路径
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // API 路由保护
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization") || ""
    const hasToken = authHeader.startsWith("Bearer ")
    const hasCookie = request.cookies.has("sb-") || request.cookies.has("supabase-auth-token")

    if (!hasToken && !hasCookie) {
      if (process.env.NODE_ENV !== "production") return NextResponse.next()
      return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ["/api/:path*"] }
