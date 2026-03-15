'use client'

import { DIVISIONS } from '@/lib/divisions'
import type { BuildState, DivisionStatus, View } from '@/app/page'

interface SidebarProps {
  view: View
  buildState: BuildState
  statuses: Record<string, DivisionStatus>
  onNav: (id: View) => void
}

function dotColor(status: DivisionStatus | undefined) {
  if (status === 'active') return '#f59e0b'
  if (status === 'done') return '#34d399'
  if (status === 'error') return '#f87171'
  return '#353840'
}

export function Sidebar({ view, buildState, statuses, onNav }: SidebarProps) {
  const navItem = (id: string, label: string, divId?: string, disabled?: boolean) => {
    const active = view === id
    return (
      <div
        key={id}
        onClick={() => !disabled && onNav(id as View)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px 5px 12px', margin: '1px 5px',
          borderRadius: 5, cursor: disabled ? 'default' : 'pointer',
          fontSize: 12, color: active ? '#93bbff' : '#9ca3b0',
          background: active ? '#1a2d52' : 'transparent',
          opacity: disabled ? 0.35 : 1,
          transition: 'all .15s',
        }}
      >
        {divId && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: dotColor(statuses[divId]),
            transition: 'background .3s',
          }} />
        )}
        <span>{label}</span>
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
        <div style={{ fontSize: 14, color: '#e8eaf0', fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          AgentCo
        </div>
        <div style={{ fontSize: 9, color: '#5a6070', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          7 divisions · 60+ agents
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <div style={{ padding: '10px 10px 2px', fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Company
        </div>
        {navItem('discover', 'Discover')}
        {navItem('pipeline', 'Build pipeline', undefined, buildState === 'idle')}

        <div style={{ padding: '10px 10px 2px', fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Divisions
        </div>
        {DIVISIONS.map(d => navItem(d.id, d.label, d.id))}
      </nav>

      <div style={{ padding: '8px 12px', borderTop: '1px solid #2a2d35', fontSize: 9, color: '#5a6070', letterSpacing: '.5px' }}>
        claude-sonnet-4-6 · LATAM
      </div>
    </aside>
  )
}
