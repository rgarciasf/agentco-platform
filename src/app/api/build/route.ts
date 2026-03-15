import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { DIVISIONS } from '@/lib/divisions'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { divisionId, prompt, prevOutput } = await req.json() as {
    divisionId: string
    prompt: string
    prevOutput?: string
  }

  const division = DIVISIONS.find(d => d.id === divisionId)
  if (!division) {
    return new Response('Division not found', { status: 404 })
  }

  const systemPrompt = division.systemPrompt(prompt, prevOutput)

  // Stream response back to the client
  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    stream: true,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Execute all agents for: "${prompt}". Output structured report.` }],
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
