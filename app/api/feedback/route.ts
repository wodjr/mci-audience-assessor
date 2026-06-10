import { NextRequest, NextResponse } from 'next/server'
import { put, del, head, getDownloadUrl } from '@vercel/blob'
import {
  ParticipantResponse,
  FeedbackAggregation,
  ObsSummary,
  ParticipantObservations,
} from '@/types/feedback'

function blobPath(sessionId: string) {
  return `sessions/${encodeURIComponent(sessionId)}.json`
}

async function readResponses(sessionId: string): Promise<ParticipantResponse[]> {
  try {
    const pathname = blobPath(sessionId)
    const info = await head(pathname).catch(() => null)
    if (!info) return []
    const url = await getDownloadUrl(pathname)
    const res = await fetch(url)
    if (!res.ok) return []
    return await res.json() as ParticipantResponse[]
  } catch {
    return []
  }
}

async function writeResponses(sessionId: string, responses: ParticipantResponse[]) {
  await put(blobPath(sessionId), JSON.stringify(responses), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session param' }, { status: 400 })
  }
  const responses = await readResponses(sessionId)
  return NextResponse.json(aggregate(sessionId, responses))
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<ParticipantResponse, 'id' | 'submittedAt'>
  if (!body.sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }
  const response: ParticipantResponse = {
    ...body,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  }
  const existing = await readResponses(body.sessionId)
  await writeResponses(body.sessionId, [...existing, response])
  return NextResponse.json({ success: true, id: response.id }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session param' }, { status: 400 })
  }
  await del(blobPath(sessionId)).catch(() => null)
  return NextResponse.json({ success: true })
}

function aggregate(sessionId: string, responses: ParticipantResponse[]): FeedbackAggregation {
  const obsKeys: (keyof ParticipantObservations)[] = [
    'rolesAssigned',
    'communicationClear',
    'responseSpeed',
    'escalationAppropriate',
    'teamworkEffective',
  ]

  const observationSummary = {} as Record<keyof ParticipantObservations, ObsSummary>
  for (const key of obsKeys) {
    const s: ObsSummary = { yes: 0, no: 0, not_sure: 0, total: responses.length }
    for (const r of responses) {
      const v = r.observations[key]
      if (v === 'yes') s.yes++
      else if (v === 'no') s.no++
      else if (v === 'not_sure') s.not_sure++
    }
    observationSummary[key] = s
  }

  const scored = responses.filter((r) => r.overallScore !== null)
  const averageScore =
    scored.length > 0
      ? Math.round((scored.reduce((s, r) => s + (r.overallScore ?? 0), 0) / scored.length) * 10) / 10
      : null

  const missedCounts: Record<string, number> = {}
  for (const r of responses) {
    for (const item of r.missedItems) {
      missedCounts[item] = (missedCounts[item] ?? 0) + 1
    }
  }
  const topMissedItems = Object.entries(missedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([item, count]) => ({ item, count }))

  return { sessionId, count: responses.length, responses, averageScore, observationSummary, topMissedItems }
}
