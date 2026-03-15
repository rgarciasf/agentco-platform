'use client'

import { useState, useRef, useCallback } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import { Sidebar } from '@/components/Sidebar'
import { DiscoverView } from '@/components/DiscoverView'
import { PipelineView } from '@/components/PipelineView'
import { DivisionView } from '@/components/DivisionView'
import styles from './page.module.css'

export type BuildState = 'idle' | 'running' | 'complete'
export type DivisionStatus = 'idle' | 'active' | 'done' | 'error'
export type View = 'discover' | 'pipeline' | string // string = division id

export interface LogEntry {
  id: string
  ts: string
  text: string
  type: 'sys' | 'div' | 'out' | 'done' | 'err' | 'streaming'
  divId?: string
}

const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false })

export default function Platform() {
  const [view, setView] = useState<View>('discover')
  const [prompt, setPrompt] = useState('')
  const [buildState, setBuildState] = useState<BuildState>('idle')
  const [statuses, setStatuses] = useState<Record<string, DivisionStatus>>({})
  const [log, setLog] = useState<LogEntry[]>([])
  const [outputs, setOutputs] = useState<Record<string, string>>({})
  const [product, setProduct] = useState('')
  const abortRef = useRef(false)

  const addLog = useCallback((text: string, type: LogEntry['type'], divId?: string) => {
    setLog(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: ts(), text, type, divId }])
  }, [])

  const runBuild = useCallback(async (promptText: string) => {
    if (!promptText.trim() || buildState === 'running') return
    abortRef.current = false
    setBuildState('running')
    setView('pipeline')
    setStatuses({})
    setLog([])
    setOutputs({})
    setProduct(promptText)

    addLog(`CEO → "${promptText}"`, 'sys')
    await delay(300)
    addLog('CPO, CTO, COO orchestrators activated', 'sys')
    await delay(400)
    addLog('7 divisions executing in sequence', 'sys')
    await delay(500)

    let prevOutput = ''

    for (const division of DIVISIONS) {
      if (abortRef.current) break

      setStatuses(prev => ({ ...prev, [division.id]: 'active' }))
      addLog(`${division.label} — activated (${division.agents.length} agents)`, 'div', division.id)

      const thinkId = `think-${division.id}-${Date.now()}`
      setLog(prev => [...prev, { id: thinkId, ts: ts(), text: 'Calling Claude API...', type: 'streaming', divId: division.id }])

      try {
        const resp = await fetch('/api/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ divisionId: division.id, prompt: promptText, prevOutput }),
        })

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        if (!resp.body) throw new Error('No response body')

        const reader = resp.body.getReader()
        const dec = new TextDecoder()
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += dec.decode(value, { stream: true })
          const preview = full.slice(-140).replace(/\n/g, ' ')
          setLog(prev => prev.map(e => e.id === thinkId ? { ...e, text: preview } : e))
          setOutputs(prev => ({ ...prev, [division.id]: full }))
        }

        // Finalise log entry
        const summary = full.split('\n').filter(l => l.trim()).slice(0, 2).join(' · ').slice(0, 200)
        setLog(prev => prev.map(e => e.id === thinkId ? { ...e, text: summary, type: 'out' } : e))
        setOutputs(prev => ({ ...prev, [division.id]: full }))
        prevOutput = full.slice(0, 800)
        setStatuses(prev => ({ ...prev, [division.id]: 'done' }))
        addLog(`${division.label} — complete`, 'done', division.id)
        await delay(200)

      } catch (e) {
        setLog(prev => prev.filter(entry => entry.id !== thinkId))
        const msg = e instanceof Error ? e.message : 'Unknown error'
        addLog(`${division.label} — error: ${msg}`, 'err', division.id)
        setStatuses(prev => ({ ...prev, [division.id]: 'error' }))
        await delay(200)
      }
    }

    setBuildState('complete')
    if (!abortRef.current) {
      addLog(`${promptText} — all 7 divisions complete`, 'done')
    }
  }, [buildState, addLog])

  const cancel = useCallback(() => {
    abortRef.current = true
    setBuildState('idle')
    addLog('Build cancelled', 'err')
  }, [addLog])

  const reset = useCallback(() => {
    abortRef.current = true
    setBuildState('idle')
    setView('discover')
    setStatuses({})
    setLog([])
    setOutputs({})
    setProduct('')
    setPrompt('')
  }, [])

  const handleNav = (id: View) => {
    if (id === 'pipeline' && buildState === 'idle') return
    setView(id)
  }

  return (
    <div className={styles.root}>
      {/* Titlebar */}
      <div className={styles.titlebar}>
        <div className={styles.traffic}>
          <span className={styles.red} />
          <span className={styles.yellow} />
          <span className={styles.green} />
        </div>
        <div className={styles.tbTitle}>AgentCo Platform — agent-native software company</div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <Sidebar
          view={view}
          buildState={buildState}
          statuses={statuses}
          onNav={handleNav}
        />

        <main className={styles.main}>
          {view === 'discover' && (
            <DiscoverView onBuild={runBuild} />
          )}
          {view === 'pipeline' && (
            <PipelineView
              buildState={buildState}
              statuses={statuses}
              log={log}
              product={product}
              onNav={handleNav}
            />
          )}
          {DIVISIONS.some(d => d.id === view) && (
            <DivisionView
              divisionId={view}
              statuses={statuses}
              outputs={outputs}
            />
          )}
        </main>
      </div>

      {/* Prompt bar */}
      <div className={styles.pbar}>
        {buildState === 'complete' && (
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={reset}>Reset</button>
        )}
        {buildState === 'running' && (
          <button className={styles.btn} onClick={cancel}>Stop</button>
        )}
        <input
          className={styles.pInput}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runBuild(prompt)}
          placeholder='e.g. "Build a Zoom competitor for LATAM"'
          disabled={buildState === 'running'}
        />
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => runBuild(prompt)}
          disabled={buildState === 'running' || !prompt.trim()}
        >
          {buildState === 'running' ? '⏳ Building…' : 'Build ↗'}
        </button>
      </div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
