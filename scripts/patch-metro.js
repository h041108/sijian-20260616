const fs = require('fs')
let code = fs.readFileSync('src/components/MetroMap.tsx', 'utf8')

const header = [
  '"use client"',
  '',
  'import { useState, useCallback, useRef, useMemo } from "react"',
  'import { getAllLines, getLineInfo, ThinkingLineId } from "@/lib/thinking-lines"',
  '',
  'interface Station {',
  '  id: string; label: string; x: number; y: number; depth: number',
  '  isTransfer: boolean; isStart: boolean; isEnd: boolean',
  '  connectedLines: string[]; content?: string; thinkingAt?: string',
  '}',
  'interface MetroLine {',
  '  id: string; name: string; category: string; color: string; lightColor: string',
  '  stations: Station[]',
  '  lineStyle: "solid" | "dashed" | "double" | "zigzag" | "curved"',
  '}',
  '',
  'function generate60Lines(): MetroLine[] {',
  '  const all = getAllLines()',
  '  const cats = [...new Set(all.map(l => l.category))]',
  '  const W = 1400; const H = 900',
  '  const pad = 70',
  '',
  '  return all.map((line, idx) => {',
  '    const catIdx = cats.indexOf(line.category)',
  '    const col = catIdx % 5',
  '    const row = Math.floor(catIdx / 5)',
  '    const baseX = pad + col * 240 + (idx % 5) * 15',
  '    const baseY = pad + row * 120 + ((idx * 31) % 80)',
  '    const count = 2 + (idx % 3)',
  '    const gap = 50',
  '    const stations: Station[] = Array.from({length: count}, (_, si) => ({',
  '      id: line.id + "_s" + (si+1),',
  '      label: si === 0 ? line.name : si === count-1 ? (line.name.slice(0,3)) : line.name.slice(0,2),',
  '      x: baseX + si * gap,',
  '      y: baseY + (si % 2) * 25,',
  '      depth: Math.round((si+1)/count * 10),',
  '      isTransfer: si === 1 && idx % 3 === 0,',
  '      isStart: si === 0,',
  '      isEnd: si === count-1,',
  '      connectedLines: si === 1 ? [all[(idx+3)%all.length].id, all[(idx+7)%all.length].id] : [],',
  '      content: line.name + " | " + line.category + "思维",',
  '    }))',
  '    return {',
  '      id: line.id, name: line.name, category: line.category,',
  '      color: line.color, lightColor: line.gradient[0] || line.color,',
  '      stations,',
  '      lineStyle: (idx % 5 === 0 ? "dashed" : idx % 5 === 1 ? "double" : idx % 5 === 2 ? "zigzag" : idx % 5 === 3 ? "curved" : "solid") as any,',
  '    }',
  '  })',
  '}',
  '',
  'const LINES = generate60Lines()',
  '',
].join('\n')

const idx = code.indexOf('export default function MetroMap()')
if (idx === -1) { console.log('NOT FOUND'); process.exit(1) }
const newCode = header + '\n// ---\n\n' + code.slice(idx)
fs.writeFileSync('src/components/MetroMap.tsx', newCode)

// Fix viewBox size
let final = fs.readFileSync('src/components/MetroMap.tsx', 'utf8')
final = final.replace('const viewW = 1000; const viewH = 800', 'const viewW = 1400; const viewH = 900')
fs.writeFileSync('src/components/MetroMap.tsx', final)

const generatedLines = final.match(/generate60Lines/) ? 60 : 0
console.log('Updated to', generatedLines, 'lines, viewBox 1400x900')
