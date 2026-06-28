// ─── 思见 中间件 ────────────────────────────────────
// 多域名路由 + API 认证保护

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const HAS_SUPABASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").length > 0 &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 0

const PUBLIC_API_PATHS = ["/api/auth", "/api/upload", "/api/video/proxy-image", "/api/account", "/api/agent"]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname } = request.nextUrl

  // jiying.cc.cd → 即影自媒体工厂
  if (hostname === "jiying.cc.cd" || hostname.endsWith(".jiying.cc.cd")) {
    if (pathname === "/") return NextResponse.rewrite(new URL("/jiying", request.url))
    if (pathname.startsWith("/api/")) return NextResponse.next()
    if (pathname.startsWith("/_next/") || pathname.startsWith("/static/")) return NextResponse.next()
    if (pathname.startsWith("/jiying")) return NextResponse.next()
    return NextResponse.rewrite(new URL(`/jiying${pathname}`, request.url))
  }

  // API 认证保护（仅当 Supabase 已配置时生效）
  if (pathname.startsWith("/api/") && HAS_SUPABASE) {
    if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
