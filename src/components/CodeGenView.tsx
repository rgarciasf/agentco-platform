'use client'

import { useState } from 'react'

interface FileEntry {
  path: string
  content: string
}

interface GeneratedApp {
  productName: string
  productSlug: string
  description: string
  files: FileEntry[]
}

interface DeployResult {
  repoUrl: string
  repoName: string
  commitSha: string
  filesCommitted: number
  vercelDeployUrl: string
}

interface CodeGenViewProps {
  prompt: string
  agentOutputs: Record<string, string>
}

type GenState = 'idle' | 'generating' | 'committing' | 'done' | 'error'

export function CodeGenView({ prompt, agentOutputs }: CodeGenViewProps) {
  const [state, setState] = useState<GenState>('idle')
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null)
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null)
  const [error, setError] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubUsername, setGithubUsername] = useState('rgarciasf')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  async function generate() {
    if (!githubToken.trim()) {
      setShowTokenInput(true)
      return
    }

    setState('generating')
    setError('')
    setLog([])
    addLog('🤖 Code Generator activated — synthesizing agent outputs...')
    addLog(`📋 Processing outputs from ${Object.keys(agentOutputs).length} divisions...`)

    try {
      // Step 1: Generate code
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agentOutputs }),
      })

      if (!genRes.ok) throw new Error(`Generation failed: HTTP ${genRes.status}`)

      const genData = await genRes.json() as GeneratedApp & { error?: string }
      if (genData.error) throw new Error(genData.error)

      setGeneratedApp(genData)
      addLog(`✅ Generated ${genData.files.length} files for ${genData.productName}`)
      genData.files.forEach(f => addLog(`   📄 ${f.path}`))

      // Step 2: Commit to GitHub
      setState('committing')
      addLog(`🚀 Creating GitHub repo: ${githubUsername}/${genData.productSlug}...`)

      const ghRes = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: genData.productName,
          productSlug: genData.productSlug,
          description: genData.description,
          files: genData.files,
          githubUsername,
          githubToken,
        }),
      })

      if (!ghRes.ok) {
        const err = await ghRes.json()
        throw new Error(err.error || 'GitHub commit failed')
      }

      const ghData = await ghRes.json() as DeployResult
      setDeployResult(ghData)
      addLog(`✅ Committed ${ghData.filesCommitted} files to ${ghData.repoUrl}`)
      addLog(`🎉 ${genData.productName} is ready to deploy!`)

      setState('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      addLog(`❌ Error: ${msg}`)
      setState('error')
    }
  }

  const hasOutputs = Object.keys(agentOutputs).length > 0

  return (
    <div style={{
      background: '#13151a', border: '1px solid #34d399', borderRadius: 10,
      padding: 20, marginTop: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#34d399', fontWeight: 500, marginBottom: 2 }}>
            ⚡ Code Generator
          </div>
          <div style={{ fontSize: 11, color: '#5a6070' }}>
            Turn agent research into a real GitHub repository
          </div>
        </div>
        {state === 'done' ? (
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d2d20', color: '#6ee7b7', border: '1px solid #34d399' }}>
            Complete
          </span>
        ) : (
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#22262f', color: '#9ca3b0' }}>
            {Object.keys(agentOutputs).length}/7 divisions
          </span>
        )}
      </div>

      {/* Token input (shown when needed) */}
      {showTokenInput && state === 'idle' && (
        <div style={{ marginBottom: 14, padding: 14, background: '#0e0f11', borderRadius: 7, border: '1px solid #353840' }}>
          <div style={{ fontSize: 11, color: '#9ca3b0', marginBottom: 8 }}>
            GitHub token needed to create repos. Get one at github.com/settings/tokens
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="password"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              style={{
                flex: 1, fontSize: 11, padding: '6px 10px',
                background: '#1a1d24', border: '1px solid #353840',
                borderRadius: 6, color: '#e8eaf0', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <input
              type="text"
              value={githubUsername}
              onChange={e => setGithubUsername(e.target.value)}
              placeholder="GitHub username"
              style={{
                width: 140, fontSize: 11, padding: '6px 10px',
                background: '#1a1d24', border: '1px solid #353840',
                borderRadius: 6, color: '#e8eaf0', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <button
            onClick={generate}
            disabled={!githubToken.trim()}
            style={{
              width: '100%', fontSize: 12, padding: '8px 0',
              background: '#1a2d52', border: '1px solid #4f8ef7',
              borderRadius: 7, color: '#93bbff', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Generate & Commit →
          </button>
        </div>
      )}

      {/* Log output */}
      {log.length > 0 && (
        <div style={{
          background: '#0e0f11', borderRadius: 7, padding: 12,
          marginBottom: 14, maxHeight: 220, overflowY: 'auto',
          fontFamily: "'DM Mono', monospace",
        }}>
          {log.map((line, i) => (
            <div key={i} style={{ fontSize: 10, color: '#9ca3b0', lineHeight: 1.8 }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Done state — show repo link + deploy button */}
      {state === 'done' && deployResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a
            href={deployResult.repoUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: '#1a1d24',
              border: '1px solid #34d399', borderRadius: 7,
              color: '#6ee7b7', fontSize: 12, textDecoration: 'none',
            }}
          >
            <span>📦 {deployResult.repoUrl.replace('https://github.com/', '')}</span>
            <span style={{ fontSize: 10, color: '#34d399' }}>{deployResult.filesCommitted} files →</span>
          </a>
          <a
            href={deployResult.vercelDeployUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 14px', background: '#0e0f11',
              border: '1px solid #4f8ef7', borderRadius: 7,
              color: '#93bbff', fontSize: 12, textDecoration: 'none',
            }}
          >
            ▲ Deploy to Vercel →
          </a>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div style={{ fontSize: 11, color: '#f87171', padding: '8px 12px', background: '#2d1010', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {/* Idle state — main button */}
      {(state === 'idle' || state === 'error') && !showTokenInput && (
        <button
          onClick={generate}
          disabled={!hasOutputs}
          style={{
            width: '100%', fontSize: 12, padding: '10px 0',
            background: hasOutputs ? '#0d2d20' : '#1a1d24',
            border: `1px solid ${hasOutputs ? '#34d399' : '#2a2d35'}`,
            borderRadius: 7,
            color: hasOutputs ? '#6ee7b7' : '#5a6070',
            cursor: hasOutputs ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'all .15s',
          }}
        >
          {hasOutputs
            ? '⚡ Generate Code & Push to GitHub →'
            : 'Run build first to generate code'}
        </button>
      )}

      {/* Running states */}
      {(state === 'generating' || state === 'committing') && (
        <div style={{
          width: '100%', fontSize: 12, padding: '10px 0', textAlign: 'center',
          background: '#2d1f08', border: '1px solid #f59e0b',
          borderRadius: 7, color: '#fcd34d', fontFamily: 'inherit',
        }}>
          {state === 'generating' ? '🤖 Generating code files...' : '🚀 Pushing to GitHub...'}
        </div>
      )}
    </div>
  )
}
