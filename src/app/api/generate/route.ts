import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CODEGEN_SYSTEM = `You are a senior full-stack engineer generating a Next.js application scaffold.

You will receive research from 7 AI agents. Generate REAL, RUNNABLE code files.

CRITICAL: Output ONLY a valid JSON object. No markdown, no backticks, no prose before or after.
Keep each file's content concise but functional. Do NOT truncate — every string must be properly closed.

Output format:
{
  "productName": "ConnectHUB",
  "productSlug": "connecthub",
  "description": "one sentence description",
  "files": [
    { "path": "package.json", "content": "..." },
    { "path": "src/app/page.tsx", "content": "..." }
  ]
}

Generate exactly these 10 files (keep each file under 150 lines):
1. package.json — Next.js 15, Supabase, Tailwind dependencies
2. tsconfig.json — strict TypeScript
3. next.config.ts — minimal config
4. src/app/globals.css — CSS variables using brand colors from design plan
5. src/app/layout.tsx — root layout with metadata in Spanish
6. src/app/page.tsx — landing page for the product (hero, features, pricing from growth plan)
7. src/app/(dashboard)/page.tsx — main dashboard showing core feature
8. src/app/api/[core-feature]/route.ts — main API endpoint (use actual feature from engineering plan)
9. supabase/migrations/001_init.sql — tables from engineering plan (3-4 tables with RLS)
10. README.md — setup in English + Spanish, includes the pricing from growth plan

Use REAL names from the agent outputs (actual table names, feature names, price points).
Every JSON string must be properly escaped. No raw newlines inside strings — use \\n.
Output ONLY the JSON object.`

export async function POST(req: NextRequest) {
  const { prompt, agentOutputs } = await req.json() as {
    prompt: string
    agentOutputs: Record<string, string>
  }

  // Use most relevant divisions to keep context tight
  const relevantOutputs = ['product', 'engineering', 'growth', 'data']
    .filter(id => agentOutputs[id])
    .map(id => `=== ${id.toUpperCase()} ===\n${agentOutputs[id]?.slice(0, 800)}`)
    .join('\n\n')

  const userMessage = `Product: "${prompt}"\n\nAGENT OUTPUTS:\n${relevantOutputs}\n\nGenerate the 10-file scaffold as JSON now.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: CODEGEN_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON — strip any accidental fences
    const clean = text
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      // Try extracting JSON object if there's surrounding text
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error(`JSON parse failed. Response length: ${clean.length}. Preview: ${clean.slice(0, 200)}`)
      }
    }

    return Response.json(parsed)

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
