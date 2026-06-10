import { NextRequest, NextResponse } from 'next/server'
import {
  ParticipantResponse,
  FeedbackAggregation,
  ObsSummary,
  ParticipantObservations,
} from '@/types/feedback'

// In-memory store — works within a single serverless function instance (demo use).
const store = new Map<string, ParticipantResponse[]>()

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session param' }, { status: 400 })
  }
  const responses = store.get(sessionId) ?? []
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
  const existing = store.get(body.sessionId) ?? []
  store.set(body.sessionId, [...existing, response])
  return NextResponse.json({ success: true, id: response.id }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session param' }, { status: 400 })
  }
  store.delete(sessionId)
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
