'use client'

import { useEffect, useRef } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import type { BuildState, DivisionStatus, LogEntry, View } from '@/app/page'

interface PipelineViewProps {
  buildState: BuildState
  statuses: Record<string, DivisionStatus>
  log: LogEntry[]
  product: string
  onNav: (id: View) => void
}

function dotColor(s: DivisionStatus | undefined) {
  if (s === 'active') return '#f59e0b'
  if (s === 'done') return '#34d399'
  if (s === 'error') return '#f87171'
  return '#353840'
}

export function PipelineView({ buildState, statuses, log, product, onNav }: PipelineViewProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const title = buildState === 'running'
    ? `Building — ${product || '...'}`
    : buildState === 'complete' ? 'Complete' : 'Pipeline'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: division list */}
      <div style={{
        width: 190, flexShrink: 0, borderRight: '1px solid #2a2d35',
        background: '#13151a', overflowY: 'auto', padding: '8px 0',
      }}>
        <div style={{ fontSize: 10, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 12px 7px' }}>
          {title}
        </div>
        {DIVISIONS.map(d => {
          const st = statuses[d.id]
          const isRun = st === 'active'
          const isDone = st === 'done'
          return (
            <div
              key={d.id}
              onClick={() => onNav(d.id as View)}
              style={{
                padding: '7px 10px',
                borderLeft: `2px solid ${isDone ? '#34d399' : isRun ? '#f59e0b' : 'transparent'}`,
                background: isRun ? '#2d1f08' : 'transparent',
                cursor: 'pointer',
                transition: 'background .1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(st), flexShrink: 0, marginLeft: 2 }} />
                <span style={{ fontSize: 11, color: st ? '#e8eaf0' : '#5a6070', flex: 1 }}>{d.label}</span>
                {isRun && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#2d1f08', color: '#fcd34d', border: '1px solid #f59e0b' }}>running</span>}
                {isDone && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#0d2d20', color: '#6ee7b7', border: '1px solid #34d399' }}>done</span>}
              </div>
              <div style={{ fontSize: 9, color: '#5a6070', paddingLeft: 11, marginTop: 1 }}>{d.agents.length} agents</div>
            </div>
          )
        })}
        {buildState === 'complete' && (
          <div style={{ margin: '8px 8px 0', padding: '9px 10px', background: '#0d2d20', border: '1px solid #34d399', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 500 }}>All 7 divisions complete</div>
            <div style={{ fontSize: 9, color: '#34d399', marginTop: 2 }}>
              {product.replace(/[^a-z0-9]/gi, '').toLowerCase()}.agentco.io
            </div>
          </div>
        )}
      </div>

      {/* Right: live log */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '9px 14px 7px', borderBottom: '1px solid #2a2d35', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#9ca3b0', letterSpacing: '.5px' }}>Live output</span>
          {buildState === 'running' && <ThinkingDots />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: "'DM Mono', monospace" }}>
          {log.length === 0 && (
            <div style={{ color: '#5a6070', fontSize: 10 }}>Waiting for build prompt...</div>
          )}
          {log.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 7, marginBottom: 2, fontSize: 10, lineHeight: 1.5, alignItems: 'flex-start' }}>
              <span style={{ color: '#5a6070', flexShrink: 0, paddingTop: 1 }}>{e.ts}</span>
              <Badge type={e.type === 'streaming' ? 'out' : e.type} label={e.type === 'streaming' ? '↓' : e.type} />
              <span style={{
                color: e.type === 'sys' ? '#93bbff' : e.type === 'done' ? '#6ee7b7' : e.type === 'div' ? '#fcd34d' : e.type === 'err' ? '#f87171' : '#9ca3b0',
                flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {e.text.slice(0, 300)}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}

function Badge({ type, label }: { type: string; label: string }) {
  const colors: Record<string, [string, string]> = {
    sys: ['#1a2d52', '#93bbff'],
    div: ['#2d1f08', '#fcd34d'],
    out: ['#22262f', '#5a6070'],
    done: ['#0d2d20', '#6ee7b7'],
    err: ['#2d1010', '#f87171'],
  }
  const [bg, color] = colors[type] ?? colors.out
  return (
    <span style={{
      fontSize: 8, padding: '1px 4px', borderRadius: 3,
      background: bg, color, flexShrink: 0, marginTop: 2,
    }}>{label}</span>
  )
}

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 5px', background: '#2d1f08', borderRadius: 4, border: '1px solid #f59e0b' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 3, height: 3, borderRadius: '50%', background: '#f59e0b', display: 'block',
          animation: `blink 0.9s ${i * 0.3}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
    </span>
  )
}
