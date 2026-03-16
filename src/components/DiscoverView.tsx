'use client'

import { DIVISIONS } from '@/lib/divisions'

const SUGGESTIONS = [
  'Build a Zoom competitor for LATAM',
  'Build a Lattice competitor for LATAM',
  'Build an LMS platform for LATAM SMBs',
  'Build a BambooHR alternative for LATAM',
]

interface DiscoverViewProps {
  onBuild: (prompt: string) => void
  cachedPrompt?: string
}

export function DiscoverView({ onBuild, cachedPrompt }: DiscoverViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid #2a2d35', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: '#5a6070', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>March 2026</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, color: '#e8eaf0', marginBottom: 10, lineHeight: 1.1 }}>Hello, AgentCo</h1>
        <p style={{ fontSize: 12, color: '#9ca3b0', lineHeight: 1.75, maxWidth: 440 }}>
          60+ specialized AI agents across 7 divisions. Research runs once and is cached — retry code generation as many times as needed without re-running the pipeline.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
          {['Venezuela','Colombia','Chile','Brazil','Argentina'].map(c => (
            <span key={c} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: '#22262f', color: '#5a6070', border: '1px solid #2a2d35' }}>{c}</span>
          ))}
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: '#0d2d20', color: '#6ee7b7', border: '1px solid #34d39966' }}>research cached</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Cached prompt CTA */}
        {cachedPrompt && (
          <div style={{ marginBottom: 20, padding: '12px 14px', background: '#0d2d20', border: '1px solid #34d399', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: '#34d399', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Cached research ready</div>
            <div style={{ fontSize: 12, color: '#6ee7b7', marginBottom: 8 }}>{cachedPrompt}</div>
            <button onClick={() => onBuild(cachedPrompt)} style={{ fontSize: 11, padding: '6px 14px', background: '#34d399', border: 'none', borderRadius: 5, color: '#0a1a12', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              ⚡ Open Code Workspace →
            </button>
          </div>
        )}

        <div style={{ fontSize: 10, color: '#9ca3b0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.8px' }}>Start new research</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => onBuild(s)}
              style={{ background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Mono', monospace", transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d35')}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: '#e8eaf0', marginBottom: 3, fontWeight: 300 }}>{s}</div>
              <div style={{ fontSize: 9, color: '#5a6070' }}>7 divisions · cached after first run</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, color: '#9ca3b0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.8px' }}>Divisions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
          {DIVISIONS.map(d => (
            <div key={d.id} style={{ background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#e8eaf0', marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 9, color: '#5a6070' }}>{d.sub} · {d.agents.length} agents</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
