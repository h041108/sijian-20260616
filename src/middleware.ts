import { NextResponse, NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname } = request.nextUrl

  // jiying.cc.cd → 只显示即影自媒体工厂
  if (hostname.includes("jiying.cc.cd") || hostname.includes("jiying")) {
    // 根路径 → 展示即影首页
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/jiying", request.url))
    }
    // API路由 → 保持不动（共享后端）
    if (pathname.startsWith("/api/")) {
      return NextResponse.next()
    }
    // 静态资源 → 保持不动
    if (pathname.startsWith("/_next/") || pathname.startsWith("/static/")) {
      return NextResponse.next()
    }
    // 已经访问 /jiying/* → 保持不动
    if (pathname.startsWith("/jiying")) {
      return NextResponse.next()
    }
    // 其他路径 → 重写到即影对应页面
    // 如 jiying.cc.cd/studio → 实际访问 /jiying/studio
    return NextResponse.rewrite(new URL(`/jiying${pathname}`, request.url))
  }

  // sijian.cc.cd → 正常显示思见
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
}
