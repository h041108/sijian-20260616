// ─── 思见核心引擎测试 ──────────────────────────────

import { detectThinkingLines } from "../src/lib/thinking-lines"
import { detectThinkingState, fullCognitionAnalysis } from "../src/lib/cognition"
import { classifyTask, route, loadRegistry } from "../src/lib/orchestrator"

// ─── 思维线路测试 ──────────────────────────────
function testThinkingLines() {
  const testCases = [
    { input: "A和B有什么不同？对比一下", expect: ["contrast"] },
    { input: "如果...会怎样？让我猜一下", expect: ["hypothesis"] },
    { input: "为什么会这样？原因是", expect: ["causality"] },
    { input: "总结一下关键点，分三层", expect: ["structured", "layers"] },
    { input: "帮我算一下这个方程", expect: ["deduction"] },
  ]

  let passed = 0
  for (const tc of testCases) {
    const result = detectThinkingLines(tc.input)
    const hit = tc.expect.some(e => result.some(r => r.lineId === e))
    if (hit) { passed++ }
    else { console.warn(`✗ thinking-line: "${tc.input}" → ${result.map(r => r.lineId).join(",")} (expected ${tc.expect})`) }
  }
  console.log(`✓ thinking-lines: ${passed}/${testCases.length}`)
}

// ─── 认知状态检测测试 ──────────────────────────
function testCognition() {
  const tests = [
    { input: "为什么天空是蓝色的？光线怎么传播的", expectedState: "curious" },
    { input: "好烦啊，今天什么都不想干", expectedState: "resting" },
    { input: "总结一下，框架分三层：第一...", expectedState: "building" },
  ]

  let passed = 0
  for (const t of tests) {
    const lines = detectThinkingLines(t.input)
    const result = fullCognitionAnalysis(t.input, lines)
    if (result.l1.state === t.expectedState) { passed++ }
    else { console.warn(`✗ cognition: "${t.input.slice(0, 20)}" → ${result.l1.state} (expected ${t.expectedState})`) }
  }
  console.log(`✓ cognition: ${passed}/${tests.length}`)
}

// ─── 任务分类测试 ──────────────────────────────
function testTaskClassification() {
  const tests = [
    { input: "帮我写一首关于秋天的诗", expected: "creative" },
    { input: "证明勾股定理", expected: "reasoning" },
    { input: "帮我分析一下这个数据趋势", expected: "analysis" },
    { input: "写一个快速排序的代码", expected: "coding" },
  ]

  let passed = 0
  for (const t of tests) {
    const result = classifyTask(t.input)
    if (result.category === t.expected) { passed++ }
    else { console.warn(`✗ classify: "${t.input.slice(0, 20)}" → ${result.category} (expected ${t.expected})`) }
  }
  console.log(`✓ task-classification: ${passed}/${tests.length}`)
}

// 运行
testThinkingLines()
testCognition()
testTaskClassification()
console.log("\n所有测试完成。")
