'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import { Sidebar } from '@/components/Sidebar'
import { DiscoverView } from '@/components/DiscoverView'
import { PipelineView } from '@/components/PipelineView'
import { DivisionView } from '@/components/DivisionView'
import { CodeWorkspace } from '@/components/CodeWorkspace'
import styles from './page.module.css'

export type BuildState = 'idle' | 'running' | 'complete'
export type DivisionStatus = 'idle' | 'active' | 'done' | 'error'
export type View = 'discover' | 'pipeline' | 'codegen' | string

export interface LogEntry {
  id: string
  ts: string
  text: string
  type: 'sys' | 'div' | 'out' | 'done' | 'err' | 'streaming'
  divId?: string
}

// Cache key for localStorage
function cacheKey(prompt: string) {
  return `agentco_research_${btoa(prompt).slice(0, 32)}`
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
  const [isCached, setIsCached] = useState(false)
  const abortRef = useRef(false)

  // Load cached research on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('agentco_last_prompt')
    if (stored) {
      const cached = localStorage.getItem(cacheKey(stored))
      if (cached) {
        try {
          const data = JSON.parse(cached) as { outputs: Record<string, string>; product: string }
          setOutputs(data.outputs)
          setProduct(data.product)
          setPrompt(data.product)
          setIsCached(true)
          setBuildState('complete')
          setStatuses(Object.fromEntries(DIVISIONS.map(d => [d.id, 'done'])))
        } catch {}
      }
    }
  }, [])

  const addLog = useCallback((text: string, type: LogEntry['type'], divId?: string) => {
    setLog(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: ts(), text, type, divId }])
  }, [])

  const runBuild = useCallback(async (promptText: string) => {
    if (!promptText.trim() || buildState === 'running') return

    // Check cache first — skip research if we have fresh results
    const key = cacheKey(promptText)
    const cached = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (cached) {
      try {
        const data = JSON.parse(cached) as { outputs: Record<string, string>; product: string }
        setOutputs(data.outputs)
        setProduct(promptText)
        setIsCached(true)
        setBuildState('complete')
        setStatuses(Object.fromEntries(DIVISIONS.map(d => [d.id, 'done'])))
        setView('pipeline')
        return
      } catch {}
    }

    // Fresh research run
    abortRef.current = false
    setBuildState('running')
    setView('pipeline')
    setStatuses({})
    setLog([])
    setOutputs({})
    setProduct(promptText)
    setIsCached(false)

    addLog(`CEO → "${promptText}"`, 'sys')
    await delay(300)
    addLog('CPO, CTO, COO orchestrators activated', 'sys')
    await delay(400)
    addLog('7 divisions executing in sequence', 'sys')
    await delay(500)

    let prevOutput = ''
    const collectedOutputs: Record<string, string> = {}

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

        const summary = full.split('\n').filter(l => l.trim()).slice(0, 2).join(' · ').slice(0, 200)
        setLog(prev => prev.map(e => e.id === thinkId ? { ...e, text: summary, type: 'out' } : e))
        collectedOutputs[division.id] = full
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

    // Cache the research results
    if (!abortRef.current && typeof window !== 'undefined') {
      const cacheData = { outputs: collectedOutputs, product: promptText, cachedAt: Date.now() }
      localStorage.setItem(key, JSON.stringify(cacheData))
      localStorage.setItem('agentco_last_prompt', promptText)
    }

    setBuildState('complete')
    if (!abortRef.current) {
      addLog(`Research complete — ${DIVISIONS.length} divisions · results cached`, 'done')
    }
  }, [buildState, addLog])

  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return
    const key = cacheKey(prompt)
    localStorage.removeItem(key)
    localStorage.removeItem('agentco_last_prompt')
    setIsCached(false)
    setBuildState('idle')
    setStatuses({})
    setLog([])
    setOutputs({})
  }, [prompt])

  const cancel = useCallback(() => {
    abortRef.current = true
    setBuildState('idle')
    addLog('Build cancelled', 'err')
  }, [addLog])

  const handleNav = (id: View) => {
    if (id === 'pipeline' && buildState === 'idle' && !isCached) return
    setView(id)
  }

  const hasResearch = buildState === 'complete' || isCached

  return (
    <div className={styles.root}>
      <div className={styles.titlebar}>
        <div className={styles.traffic}>
          <span className={styles.red} />
          <span className={styles.yellow} />
          <span className={styles.green} />
        </div>
        <div className={styles.tbTitle}>AgentCo Platform — agent-native software company</div>
        {isCached && (
          <div style={{ fontSize: 10, color: '#6ee7b7', background: '#0d2d20', padding: '2px 8px', borderRadius: 4, border: '1px solid #34d399', marginLeft: 8 }}>
            ✓ Research cached
          </div>
        )}
      </div>

      <div className={styles.body}>
        <Sidebar
          view={view}
          buildState={buildState}
          statuses={statuses}
          hasResearch={hasResearch}
          onNav={handleNav}
        />

        <main className={styles.main}>
          {view === 'discover' && <DiscoverView onBuild={runBuild} cachedPrompt={isCached ? prompt : undefined} />}

          {view === 'pipeline' && (
            <PipelineView
              buildState={buildState}
              statuses={statuses}
              log={log}
              product={product}
              isCached={isCached}
              onNav={handleNav}
              onClearCache={clearCache}
            />
          )}

          {view === 'codegen' && (
            <CodeWorkspace
              prompt={product}
              agentOutputs={outputs}
              onBack={() => setView('pipeline')}
            />
          )}

          {DIVISIONS.some(d => d.id === view) && (
            <DivisionView divisionId={view} statuses={statuses} outputs={outputs} />
          )}
        </main>
      </div>

      <div className={styles.pbar}>
        {buildState === 'running' && (
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={cancel}>Stop</button>
        )}
        {isCached && (
          <button className={styles.btn} onClick={clearCache} title="Clear cached research and re-run">
            ↺ Re-research
          </button>
        )}
        <input
          className={styles.pInput}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runBuild(prompt)}
          placeholder='e.g. "Build a Zoom competitor for LATAM"'
          disabled={buildState === 'running'}
        />
        {hasResearch ? (
          <button
            className={`${styles.btn} ${styles.btnGreen}`}
            onClick={() => setView('codegen')}
          >
            ⚡ Generate Code →
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => runBuild(prompt)}
            disabled={buildState === 'running' || !prompt.trim()}
          >
            {buildState === 'running' ? '⏳ Researching…' : 'Research ↗'}
          </button>
        )}
      </div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
