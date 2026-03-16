'use client'

import { useEffect, useRef } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import type { BuildState, DivisionStatus, LogEntry, View } from '@/app/page'

interface PipelineViewProps {
  buildState: BuildState
  statuses: Record<string, DivisionStatus>
  log: LogEntry[]
  product: string
  isCached: boolean
  onNav: (id: View) => void
  onClearCache: () => void
}

function dotColor(s: DivisionStatus | undefined) {
  if (s === 'active') return '#f59e0b'
  if (s === 'done') return '#34d399'
  if (s === 'error') return '#f87171'
  return '#353840'
}

export function PipelineView({ buildState, statuses, log, product, isCached, onNav, onClearCache }: PipelineViewProps) {
  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])

  const allDone = DIVISIONS.every(d => statuses[d.id] === 'done')
  const title = isCached ? 'Cached research' : buildState === 'running' ? `Researching — ${product}` : buildState === 'complete' ? 'Research complete' : 'Pipeline'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel — division status */}
      <div style={{ width: 190, flexShrink: 0, borderRight: '1px solid #2a2d35', background: '#13151a', overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ fontSize: 10, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 12px 7px' }}>{title}</div>

        {DIVISIONS.map(d => {
          const st = statuses[d.id]
          return (
            <div key={d.id} onClick={() => onNav(d.id as View)}
              style={{ padding: '7px 10px', borderLeft: `2px solid ${st === 'done' ? '#34d399' : st === 'active' ? '#f59e0b' : 'transparent'}`, background: st === 'active' ? '#2d1f08' : 'transparent', cursor: 'pointer', transition: 'background .1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(st), flexShrink: 0, marginLeft: 2 }} />
                <span style={{ fontSize: 11, color: st ? '#e8eaf0' : '#5a6070', flex: 1 }}>{d.label}</span>
                {st === 'active' && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#2d1f08', color: '#fcd34d', border: '1px solid #f59e0b' }}>running</span>}
                {st === 'done' && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#0d2d20', color: '#6ee7b7', border: '1px solid #34d399' }}>done</span>}
              </div>
              <div style={{ fontSize: 9, color: '#5a6070', paddingLeft: 11, marginTop: 1 }}>{d.agents.length} agents</div>
            </div>
          )
        })}

        {/* CTA after research done */}
        {allDone && (
          <div style={{ margin: '10px 8px 0' }}>
            {isCached && (
              <div style={{ fontSize: 9, color: '#5a6070', padding: '5px 8px', background: '#0d2d20', borderRadius: 5, border: '1px solid #34d39966', marginBottom: 6, textAlign: 'center' }}>
                ✓ From cache — no tokens used
              </div>
            )}
            <button onClick={() => onNav('codegen')} style={{ width: '100%', fontSize: 11, padding: '8px 0', background: '#0d2d20', border: '1px solid #34d399', borderRadius: 6, color: '#6ee7b7', cursor: 'pointer', fontFamily: 'inherit' }}>
              ⚡ Open Code Workspace →
            </button>
            {!isCached && (
              <button onClick={onClearCache} style={{ width: '100%', marginTop: 5, fontSize: 10, padding: '5px 0', background: 'transparent', border: '1px solid #353840', borderRadius: 6, color: '#5a6070', cursor: 'pointer', fontFamily: 'inherit' }}>
                ↺ Re-run research
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right panel — live log */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '9px 14px 7px', borderBottom: '1px solid #2a2d35', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#9ca3b0', letterSpacing: '.5px' }}>
            {isCached ? '📦 Research loaded from cache' : 'Live output'}
          </span>
          {buildState === 'running' && <ThinkingDots />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: "'DM Mono', monospace" }}>
          {isCached ? (
            <div style={{ color: '#5a6070', fontSize: 11, lineHeight: 1.8 }}>
              <div style={{ color: '#6ee7b7', marginBottom: 8 }}>✓ Research for &quot;{product}&quot; loaded from localStorage cache.</div>
              <div>No API calls were made — all 7 division outputs are available.</div>
              <div style={{ marginTop: 8 }}>Click <span style={{ color: '#6ee7b7' }}>⚡ Open Code Workspace</span> to generate code, or <span style={{ color: '#9ca3b0' }}>↺ Re-run research</span> to refresh.</div>
            </div>
          ) : (
            <>
              {log.length === 0 && <div style={{ color: '#5a6070', fontSize: 10 }}>Waiting...</div>}
              {log.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 7, marginBottom: 2, fontSize: 10, lineHeight: 1.5, alignItems: 'flex-start' }}>
                  <span style={{ color: '#5a6070', flexShrink: 0 }}>{e.ts}</span>
                  <Badge type={e.type === 'streaming' ? 'out' : e.type} label={e.type === 'streaming' ? '↓' : e.type} />
                  <span style={{ color: e.type === 'sys' ? '#93bbff' : e.type === 'done' ? '#6ee7b7' : e.type === 'div' ? '#fcd34d' : e.type === 'err' ? '#f87171' : '#9ca3b0', flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {e.text.slice(0, 300)}
                  </span>
                </div>
              ))}
            </>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}

function Badge({ type, label }: { type: string; label: string }) {
  const colors: Record<string, [string, string]> = { sys: ['#1a2d52','#93bbff'], div: ['#2d1f08','#fcd34d'], out: ['#22262f','#5a6070'], done: ['#0d2d20','#6ee7b7'], err: ['#2d1010','#f87171'] }
  const [bg, color] = colors[type] ?? colors.out
  return <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: bg, color, flexShrink: 0, marginTop: 2 }}>{label}</span>
}

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 5px', background: '#2d1f08', borderRadius: 4, border: '1px solid #f59e0b' }}>
      {[0,1,2].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#f59e0b', display: 'block', animation: `blink 0.9s ${i*0.3}s ease-in-out infinite` }} />)}
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
    </span>
  )
}
