'use client'

import { DIVISIONS } from '@/lib/divisions'
import type { DivisionStatus } from '@/app/page'

interface DivisionViewProps {
  divisionId: string
  statuses: Record<string, DivisionStatus>
  outputs: Record<string, string>
}

export function DivisionView({ divisionId, statuses, outputs }: DivisionViewProps) {
  const division = DIVISIONS.find(d => d.id === divisionId)
  if (!division) return null

  const status = statuses[divisionId]
  const output = outputs[divisionId]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #2a2d35', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>
          {division.sub} · Division {division.order} of 7
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, color: '#e8eaf0', marginBottom: 6 }}>
          {division.label}
        </h2>
        <p style={{ fontSize: 12, color: '#9ca3b0', lineHeight: 1.7 }}>{division.desc}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        <div style={{ fontSize: 10, color: '#9ca3b0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.8px' }}>
          {division.agents.length} agents
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 7 }}>
          {division.agents.map(agent => (
            <div
              key={agent}
              style={{
                background: status === 'active' ? '#2d1f08' : '#1a1d24',
                border: `1px solid ${status === 'active' ? '#f59e0b' : status === 'done' ? '#34d399' : '#2a2d35'}`,
                borderRadius: 7, padding: 10, position: 'relative',
                transition: 'all .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 9, right: 9,
                width: 5, height: 5, borderRadius: '50%',
                background: status === 'active' ? '#f59e0b' : status === 'done' ? '#34d399' : '#353840',
              }} />
              <div style={{ fontSize: 11, color: '#e8eaf0', paddingRight: 12 }}>{agent}</div>
              {status === 'active' && <div style={{ fontSize: 9, marginTop: 3, color: '#fcd34d' }}>Working...</div>}
              {status === 'done' && <div style={{ fontSize: 9, marginTop: 3, color: '#6ee7b7' }}>Done</div>}
            </div>
          ))}
        </div>

        {output && (
          <div style={{ background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 7, padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>
              Agent output
            </div>
            <div style={{ fontSize: 11, color: '#9ca3b0', lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
