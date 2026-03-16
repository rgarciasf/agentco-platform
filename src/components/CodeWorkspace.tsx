'use client'

import { useState, useCallback } from 'react'

interface FileEntry { path: string; content: string }
interface GeneratedApp { productName: string; productSlug: string; description: string; files: FileEntry[] }
interface DeployResult { repoUrl: string; repoName: string; commitSha: string; filesCommitted: number; vercelDeployUrl: string }

type GenState = 'idle' | 'generating' | 'committing' | 'done' | 'error'

interface CodeWorkspaceProps {
  prompt: string
  agentOutputs: Record<string, string>
  onBack: () => void
}

const INSTRUCTIONS = [
  { icon: '🔬', label: 'Research done', desc: 'All 7 divisions complete — no re-run needed' },
  { icon: '⚡', label: 'Generate code', desc: 'Claude writes 10 real files from research' },
  { icon: '📦', label: 'Push to GitHub', desc: 'Fresh repo created, all files committed' },
  { icon: '▲', label: 'Deploy to Vercel', desc: 'One-click deploy from the repo link' },
]

export function CodeWorkspace({ prompt, agentOutputs, onBack }: CodeWorkspaceProps) {
  const [state, setState] = useState<GenState>('idle')
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null)
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null)
  const [error, setError] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [githubToken, setGithubToken] = useState('')
  const [githubUsername, setGithubUsername] = useState('rgarciasf')
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [tokenSaved, setTokenSaved] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('agentco_gh_token')
  })

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const loadToken = useCallback(() => {
    if (typeof window === 'undefined') return ''
    const saved = localStorage.getItem('agentco_gh_token')
    if (saved) { setGithubToken(saved); setTokenSaved(true); return saved }
    return githubToken
  }, [githubToken])

  const saveToken = useCallback((t: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('agentco_gh_token', t)
    setGithubToken(t)
    setTokenSaved(true)
  }, [])

  const divisionCount = Object.keys(agentOutputs).length

  async function generate() {
    const token = loadToken() || githubToken
    if (!token.trim()) { setError('GitHub token required'); return }

    setState('generating')
    setError('')
    setLog([])
    setGeneratedApp(null)
    setDeployResult(null)
    setSelectedFile(null)

    addLog(`🤖 Code Generator — synthesizing ${divisionCount} division outputs...`)

    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agentOutputs }),
      })
      if (!genRes.ok) throw new Error(`Generation failed: HTTP ${genRes.status}`)
      const genData = await genRes.json() as GeneratedApp & { error?: string }
      if (genData.error) throw new Error(genData.error)

      setGeneratedApp(genData)
      addLog(`✅ ${genData.files.length} files generated for ${genData.productName}`)
      genData.files.forEach(f => addLog(`   📄 ${f.path}`))

      setState('committing')
      addLog(`🚀 Creating GitHub repo: ${githubUsername}/${genData.productSlug}...`)

      const ghRes = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: genData.productName, productSlug: genData.productSlug, description: genData.description, files: genData.files, githubUsername, githubToken: token }),
      })
      if (!ghRes.ok) { const e = await ghRes.json(); throw new Error(e.error || 'GitHub commit failed') }

      const ghData = await ghRes.json() as DeployResult
      setDeployResult(ghData)
      addLog(`✅ Committed ${ghData.filesCommitted} files → ${ghData.repoUrl}`)
      addLog(`🎉 ${genData.productName} is ready to deploy!`)
      setState('done')

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      addLog(`❌ ${msg}`)
      setState('error')
    }
  }

  const isRunning = state === 'generating' || state === 'committing'
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('agentco_gh_token') : ''

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: "'DM Mono', monospace" }}>

      {/* Left panel — controls */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #2a2d35', background: '#13151a', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #2a2d35' }}>
          <button onClick={onBack} style={{ fontSize: 10, color: '#5a6070', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 8 }}>← Back to research</button>
          <div style={{ fontSize: 14, color: '#e8eaf0', fontFamily: "'Fraunces', serif", fontWeight: 300 }}>Code Workspace</div>
          <div style={{ fontSize: 10, color: '#5a6070', marginTop: 3 }}>{prompt.slice(0, 40)}{prompt.length > 40 ? '…' : ''}</div>
        </div>

        {/* Research status */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2d35' }}>
          <div style={{ fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Research status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6ee7b7' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
            {divisionCount}/7 divisions cached
          </div>
          <div style={{ fontSize: 10, color: '#5a6070', marginTop: 4 }}>No re-research needed to retry code generation</div>
        </div>

        {/* How it works */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2d35' }}>
          <div style={{ fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>How it works</div>
          {INSTRUCTIONS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{step.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: '#e8eaf0' }}>{step.label}</div>
                <div style={{ fontSize: 9, color: '#5a6070', marginTop: 1 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* GitHub token */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2d35' }}>
          <div style={{ fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>GitHub credentials</div>
          <input type="text" value={githubUsername} onChange={e => setGithubUsername(e.target.value)} placeholder="Username" style={{ width: '100%', fontSize: 11, padding: '5px 8px', background: '#0e0f11', border: '1px solid #2a2d35', borderRadius: 5, color: '#e8eaf0', fontFamily: 'inherit', outline: 'none', marginBottom: 5 }} />
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              value={githubToken || savedToken || ''}
              onChange={e => setGithubToken(e.target.value)}
              placeholder={tokenSaved ? '••••••••••••••• (saved)' : 'ghp_...'}
              style={{ width: '100%', fontSize: 11, padding: '5px 8px', background: '#0e0f11', border: `1px solid ${tokenSaved ? '#34d39966' : '#2a2d35'}`, borderRadius: 5, color: '#e8eaf0', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          {!tokenSaved && githubToken && (
            <button onClick={() => saveToken(githubToken)} style={{ width: '100%', marginTop: 4, fontSize: 10, padding: '4px 0', background: 'transparent', border: '1px solid #353840', borderRadius: 5, color: '#9ca3b0', cursor: 'pointer', fontFamily: 'inherit' }}>
              Save token for next time
            </button>
          )}
          {tokenSaved && (
            <div style={{ fontSize: 9, color: '#34d399', marginTop: 4 }}>✓ Token saved in browser</div>
          )}
        </div>

        {/* Generate button */}
        <div style={{ padding: '10px 14px' }}>
          {state === 'done' ? (
            <button onClick={generate} style={{ width: '100%', fontSize: 11, padding: '9px 0', background: 'transparent', border: '1px solid #353840', borderRadius: 6, color: '#9ca3b0', cursor: 'pointer', fontFamily: 'inherit' }}>
              ↺ Regenerate
            </button>
          ) : (
            <button onClick={generate} disabled={isRunning} style={{ width: '100%', fontSize: 12, padding: '10px 0', background: isRunning ? '#2d1f08' : '#0d2d20', border: `1px solid ${isRunning ? '#f59e0b' : '#34d399'}`, borderRadius: 6, color: isRunning ? '#fcd34d' : '#6ee7b7', cursor: isRunning ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {state === 'generating' ? '🤖 Generating files...' : state === 'committing' ? '🚀 Pushing to GitHub...' : state === 'error' ? '↺ Retry generation' : '⚡ Generate & Push to GitHub'}
            </button>
          )}
          {error && <div style={{ marginTop: 6, fontSize: 10, color: '#f87171', padding: '6px 8px', background: '#2d1010', borderRadius: 5 }}>{error}</div>}
        </div>

        {/* Deploy result */}
        {state === 'done' && deployResult && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href={deployResult.repoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#1a1d24', border: '1px solid #34d399', borderRadius: 6, color: '#6ee7b7', fontSize: 11, textDecoration: 'none' }}>
              <span>📦 {deployResult.repoName}</span>
              <span style={{ fontSize: 9 }}>{deployResult.filesCommitted} files →</span>
            </a>
            <a href={deployResult.vercelDeployUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: '#0e0f11', border: '1px solid #4f8ef7', borderRadius: 6, color: '#93bbff', fontSize: 11, textDecoration: 'none' }}>
              ▲ Deploy to Vercel →
            </a>
          </div>
        )}
      </div>

      {/* Right panel — file browser + log */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Log */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid #2a2d35', maxHeight: 130, overflowY: 'auto', padding: '8px 14px', background: '#0e0f11' }}>
          {log.length === 0 ? (
            <div style={{ fontSize: 10, color: '#5a6070' }}>Ready — click Generate to start.</div>
          ) : (
            log.map((line, i) => (
              <div key={i} style={{ fontSize: 10, color: line.startsWith('❌') ? '#f87171' : line.startsWith('✅') || line.startsWith('🎉') ? '#6ee7b7' : '#9ca3b0', lineHeight: 1.7 }}>{line}</div>
            ))
          )}
        </div>

        {/* File list */}
        {generatedApp && generatedApp.files.length > 0 && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* File tree */}
            <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #2a2d35', overflowY: 'auto', padding: '8px 0', background: '#13151a' }}>
              <div style={{ padding: '4px 12px 6px', fontSize: 9, color: '#5a6070', textTransform: 'uppercase', letterSpacing: '.8px' }}>Generated files ({generatedApp.files.length})</div>
              {generatedApp.files.map(f => (
                <div key={f.path} onClick={() => setSelectedFile(f)}
                  style={{ padding: '4px 12px', fontSize: 10, cursor: 'pointer', color: selectedFile?.path === f.path ? '#e8eaf0' : '#9ca3b0', background: selectedFile?.path === f.path ? '#1a2d52' : 'transparent', borderLeft: `2px solid ${selectedFile?.path === f.path ? '#4f8ef7' : 'transparent'}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all .1s' }}>
                  {f.path}
                </div>
              ))}
            </div>

            {/* File content viewer */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#0e0f11' }}>
              {selectedFile ? (
                <>
                  <div style={{ fontSize: 10, color: '#5a6070', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #2a2d35' }}>{selectedFile.path}</div>
                  <pre style={{ fontSize: 10, color: '#9ca3b0', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{selectedFile.content}</pre>
                </>
              ) : (
                <div style={{ color: '#5a6070', fontSize: 11, paddingTop: 20 }}>
                  ← Select a file to preview its contents
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!generatedApp || generatedApp.files.length === 0) && log.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a6070', fontSize: 12 }}>
            No files generated yet — click Generate ↗
          </div>
        )}
      </div>
    </div>
  )
}
