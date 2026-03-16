'use client'

import { DIVISIONS } from '@/lib/divisions'
import type { BuildState, DivisionStatus, View } from '@/app/page'

interface SidebarProps {
  view: View
  buildState: BuildState
  statuses: Record<string, DivisionStatus>
  hasResearch: boolean
  onNav: (id: View) => void
}

function dotColor(status: DivisionStatus | undefined) {
  if (status === 'active') return '#f59e0b'
  if (status === 'done') return '#34d399'
  if (status === 'error') return '#f87171'
  return '#353840'
}

export function Sidebar({ view, buildState, statuses, hasResearch, onNav }: SidebarProps) {
  const navItem = (id: string, label: string, opts: { divId?: string; disabled?: boolean; accent?: string } = {}) => {
    const active = view === id
    return (
      <div
        key={id}
        onClick={() => !opts.disabled && onNav(id as View)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px 5px 12px', margin: '1px 5px',
          borderRadius: 5, cursor: opts.disabled ? 'default' : 'pointer',
          fontSize: 12,
          color: active ? (opts.accent || '#93bbff') : '#9ca3b0',
          background: active ? (opts.accent ? '#0d2d20' : '#1a2d52') : 'transparent',
          opacity: opts.disabled ? 0.35 : 1,
          transition: 'all .15s',
        }}
      >
        {opts.divId && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: dotColor(statuses[opts.divId]),
            transition: 'background .3s',
          }} />
        )}
        <span style={{ flex: 1 }}>{label}</span>
      </div>
    )
  }

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: '#13151a',
      borderRight: '1px solid #2a2d35',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Mono', monospace",
    }}>
      <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #2a2d35' }}>
        <div style={{ fontSize: 14, color: '#e8eaf0', fontFamily: "'Fraunces', serif", fontWeight: 300 }}>AgentCo</div>
        <div style={{ fontSize: 9, color: '#5a6070', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.5px' }}>7 divisions · 60+ agents</div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <div style={{ padding: '10px 10px 2px', fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '1px' }}>Workspace</div>
        {navItem('discover', 'Discover')}
        {navItem('pipeline', 'Research pipeline', { disabled: !hasResearch && buildState === 'idle' })}
        {navItem('codegen', '⚡ Code Workspace', { disabled: !hasResearch, accent: '#34d399' })}

        <div style={{ padding: '10px 10px 2px', fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '1px' }}>Divisions</div>
        {DIVISIONS.map(d => navItem(d.id, d.label, { divId: d.id }))}
      </nav>

      <div style={{ padding: '8px 12px', borderTop: '1px solid #2a2d35', fontSize: 9, color: '#5a6070', letterSpacing: '.5px' }}>
        claude-sonnet-4-6 · LATAM
      </div>
    </aside>
  )
}
