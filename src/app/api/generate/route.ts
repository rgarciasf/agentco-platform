import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CODEGEN_SYSTEM = `You are a senior full-stack engineer generating a production-ready Next.js application scaffold.

You will receive research outputs from 7 specialized AI agents (Product, Engineering, Infrastructure, QA, Data, CX, Growth).

Your job: generate REAL, RUNNABLE code files for the product described.

OUTPUT FORMAT — respond with a JSON object (no markdown, no backticks):
{
  "productName": "ConnectHUB",
  "productSlug": "connecthub",
  "description": "one sentence",
  "files": [
    {
      "path": "package.json",
      "content": "...(actual file content)..."
    },
    {
      "path": "src/app/page.tsx",
      "content": "...(actual file content)..."
    }
  ]
}

Generate these files (minimum):
1. package.json — Next.js 15, Supabase, TailwindCSS, shadcn/ui dependencies
2. tsconfig.json — strict TypeScript config
3. next.config.ts — basic Next.js config
4. tailwind.config.ts — brand colors from the product design
5. src/app/layout.tsx — root layout with metadata
6. src/app/globals.css — global styles + CSS variables
7. src/app/page.tsx — landing/marketing page for the product
8. src/app/(auth)/login/page.tsx — login page with Supabase Auth
9. src/app/(dashboard)/layout.tsx — dashboard layout with sidebar
10. src/app/(dashboard)/page.tsx — main dashboard page
11. src/app/(dashboard)/[main-feature]/page.tsx — the core product feature page
12. src/app/api/[main-feature]/route.ts — main API endpoint
13. supabase/migrations/001_init.sql — database schema from the engineering plan
14. src/lib/supabase/client.ts — Supabase browser client
15. src/lib/supabase/server.ts — Supabase server client
16. .env.example — all required environment variables
17. README.md — setup instructions in Spanish and English
18. CLAUDE.md — Claude Code contract for this product

Make all code REAL and FUNCTIONAL — not stubs or placeholders.
Use the Engineering agent output for actual table names, endpoint names, and data models.
Use the Product agent output for the actual feature set and user personas.
Use the Growth agent output for the actual pricing tiers.
Output ONLY valid JSON — no prose, no markdown fences.`

export async function POST(req: NextRequest) {
  const { prompt, agentOutputs } = await req.json() as {
    prompt: string
    agentOutputs: Record<string, string>
  }

  const combined = Object.entries(agentOutputs)
    .map(([id, output]) => `=== ${id.toUpperCase()} DIVISION ===\n${output}`)
    .join('\n\n')

  const userMessage = `Product prompt: "${prompt}"

AGENT RESEARCH OUTPUTS:
${combined}

Generate the complete application scaffold as JSON.`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: CODEGEN_SYSTEM,
          messages: [{ role: 'user', content: userMessage }],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''

        // Parse the JSON response
        let parsed
        try {
          // Strip any accidental markdown fences
          const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
          parsed = JSON.parse(clean)
        } catch {
          // Try to extract JSON from the response
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('Could not parse JSON from response')
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify(parsed)))
        controller.close()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'application/json' },
  })
}
