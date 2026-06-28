import { createClient } from "@supabase/supabase-js"

let _supabase: any = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    if (!url || !key) return null
    _supabase = createClient(url, key)
  }
  return _supabase
}

const noopChain = () => new Proxy({} as any, { get: () => noopChain })
const noopResolve = () => Promise.resolve({ data: null, error: null })

const mockFrom = (table: string) => new Proxy({} as any, {
  get: (_: any, method: string) => {
    if (method === "then") return undefined
    if (["select", "insert", "update", "delete", "upsert"].includes(method)) {
      return (...args: any[]) => new Proxy({} as any, {
        get: (__: any, m2: string) => {
          if (m2 === "then") return undefined
          return (..._a: any[]) => Promise.resolve({ data: null, error: null })
        }
      })
    }
    return (..._a: any[]) => Promise.resolve({ data: null, error: null })
  }
})

export const supabase = new Proxy({} as any, {
  get(_: any, prop: string) {
    const client = getSupabase()
    if (!client) {
      if (prop === "auth") {
        return new Proxy({} as any, {
          get(__: any, method: string) {
            if (method === "getSession") return () => Promise.resolve({ data: { session: null }, error: null })
            if (method === "getUser") return () => Promise.resolve({ data: { user: null }, error: null })
            return () => Promise.resolve({ data: null, error: null })
          }
        })
      }
      if (prop === "from") return mockFrom
      return noopChain
    }
    const val = client[prop]
    return typeof val === "function" ? val.bind(client) : val
  }
})
