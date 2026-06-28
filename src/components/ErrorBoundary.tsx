"use client"
import { Component, type ReactNode } from "react"

interface Props { children: ReactNode; fallback?: ReactNode; name?: string }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error) { console.error(`[ErrorBoundary ${this.props.name || ""}]`, error) }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full p-8 text-gray-400 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <p>加载失败，请刷新重试</p>
            <button onClick={() => this.setState({ hasError: false })}
              className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 underline">重试</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
