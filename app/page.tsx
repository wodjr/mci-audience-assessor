'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { FeedbackAggregation, ParticipantObservations } from '@/types/feedback'

const SESSION_STORAGE_KEY = 'mci-audience-session'

const OBS_LABELS: Record<string, string> = {
  rolesAssigned: 'Roles assigned',
  communicationClear: 'Communication clear',
  responseSpeed: 'Response speed OK',
  escalationAppropriate: 'Escalation appropriate',
  teamworkEffective: 'Effective teamwork',
}

// ── Observation bar chart ─────────────────────────────────────────────────────

function ObsBar({
  label,
  s,
}: {
  label: string
  s: { yes: number; no: number; not_sure: number; total: number }
}) {
  if (s.total === 0) return null
  const pct = (n: number) => Math.round((n / s.total) * 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">
          {s.total} response{s.total !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex h-5 rounded-lg overflow-hidden gap-px bg-gray-100">
        {s.yes > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${pct(s.yes)}%` }}
            title={`Yes: ${s.yes}`}
          >
            {pct(s.yes) >= 15 ? `${pct(s.yes)}%` : ''}
          </div>
        )}
        {s.not_sure > 0 && (
          <div
            className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-900"
            style={{ width: `${pct(s.not_sure)}%` }}
            title={`Not Sure: ${s.not_sure}`}
          >
            {pct(s.not_sure) >= 15 ? `${pct(s.not_sure)}%` : ''}
          </div>
        )}
        {s.no > 0 && (
          <div
            className="bg-red-400 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${pct(s.no)}%` }}
            title={`No: ${s.no}`}
          >
            {pct(s.no) >= 15 ? `${pct(s.no)}%` : ''}
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-1">
        {s.yes > 0 && <span className="text-[10px] text-green-600">● Yes {s.yes}</span>}
        {s.not_sure > 0 && (
          <span className="text-[10px] text-amber-600">● Unsure {s.not_sure}</span>
        )}
        {s.no > 0 && <span className="text-[10px] text-red-500">● No {s.no}</span>}
      </div>
    </div>
  )
}

// ── QR Panel ──────────────────────────────────────────────────────────────────

function QRPanel({ sessionId }: { sessionId: string }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const assessUrl = origin
    ? `${origin}/assess?session=${encodeURIComponent(sessionId)}`
    : ''

  function copyUrl() {
    if (!assessUrl) return
    navigator.clipboard.writeText(assessUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Audience Assessor Challenge</h2>
          <p className="text-xs text-gray-400">
            Let the audience experience the assessor&apos;s job and record their observations.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0 bg-white border-2 border-gray-200 rounded-xl p-3">
          {assessUrl ? (
            <QRCodeSVG value={assessUrl} size={160} bgColor="#ffffff" fgColor="#1e293b" level="M" />
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            {[
              'Audience scans QR — they become the assessor',
              'They record what they observed (2 min)',
              'See all audience results in the panel below',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>

          {assessUrl && (
            <div className="flex items-center gap-2 mt-3">
              <input
                readOnly
                value={assessUrl}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-500 font-mono truncate"
              />
              <button
                type="button"
                onClick={copyUrl}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Results Panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<FeedbackAggregation | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/feedback?session=${encodeURIComponent(sessionId)}`)
      if (res.ok) setData(await res.json() as FeedbackAggregation)
    } catch { /* ignore */ }
  }, [sessionId])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchResponses().finally(() => setLoading(false))
    intervalRef.current = setInterval(fetchResponses, 10_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, fetchResponses])

  async function handleReset() {
    setResetting(true)
    try {
      await fetch(`/api/feedback?session=${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
      setData(null)
      setConfirmReset(false)
    } catch { /* ignore */ } finally {
      setResetting(false)
    }
  }

  const count = data?.count ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Audience Assessor Results</p>
            <p className="text-xs text-gray-400">
              {open
                ? loading
                  ? 'Loading…'
                  : count === 0
                  ? 'Waiting for audience responses… auto-refreshes every 10 s'
                  : `${count} audience assessor${count !== 1 ? 's' : ''} responded · auto-refreshes`
                : 'View audience observations and responses'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {count === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm font-medium">Waiting for audience to scan and assess…</p>
              <p className="text-xs text-gray-400 mt-1">
                Show the QR code above and ask the audience to be the assessor.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {/* Score summary */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{data?.averageScore ?? '—'}</p>
                  <p className="text-xs text-blue-500">Avg score</p>
                </div>
                <div className="h-10 border-l border-blue-200" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{count}</p>
                  <p className="text-xs text-indigo-500">Responses</p>
                </div>
              </div>

              {/* Observation bars */}
              {data?.observationSummary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Observation Polling
                  </p>
                  {Object.entries(data.observationSummary).map(([key, s]) => (
                    <ObsBar
                      key={key}
                      label={OBS_LABELS[key] ?? key}
                      s={s as { yes: number; no: number; not_sure: number; total: number }}
                    />
                  ))}
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-green-600">● Yes</span>
                    <span className="text-[10px] text-amber-600">● Not Sure</span>
                    <span className="text-[10px] text-red-500">● No</span>
                  </div>
                </div>
              )}

              {/* Top missed items */}
              {data?.topMissedItems && data.topMissedItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Most Flagged Gaps
                  </p>
                  <div className="space-y-2">
                    {data.topMissedItems.map((m) => (
                      <div key={m.item} className="flex items-center gap-3">
                        <div
                          className="h-2 bg-amber-400 rounded-full flex-shrink-0"
                          style={{
                            width: `${Math.round((m.count / count) * 100)}%`,
                            minWidth: '8px',
                            maxWidth: '60%',
                          }}
                        />
                        <span className="text-xs text-gray-700 flex-1">{m.item}</span>
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                          {m.count}/{count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset button */}
          {count > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              {confirmReset ? (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">
                    Clear all {count} response{count !== 1 ? 's' : ''}?
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={resetting}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold transition-colors"
                    >
                      {resetting ? 'Clearing…' : 'Yes, Clear All'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-xl py-2.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear / Reset Records
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Session setup ─────────────────────────────────────────────────────────────

interface SessionInfo {
  id: string
  name: string
}

function loadSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionInfo) : null
  } catch { return null }
}

function saveSession(s: SessionInfo) {
  try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_STORAGE_KEY) } catch { /* ignore */ }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FacilitatorPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    setSession(loadSession())
    setMounted(true)
  }, [])

  function startSession() {
    const name = nameInput.trim() || 'IBM Think Session'
    const id = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
    const s: SessionInfo = { id, name }
    saveSession(s)
    setSession(s)
    setNameInput('')
  }

  function endSession() {
    clearSession()
    setSession(null)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Start a Session</h1>
            <p className="text-sm text-gray-500 mb-6">
              Give this session a name — it will appear in the QR link and results view.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Session name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startSession()}
              placeholder="e.g. IBM Think MCI Demo"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 mb-4"
              autoFocus
            />
            <button
              type="button"
              onClick={startSession}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              Start Session
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Session header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-0.5">
            Active Session
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
        </div>
        <button
          type="button"
          onClick={endSession}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          New Session
        </button>
      </div>

      {/* QR code */}
      <div className="mb-5">
        <QRPanel sessionId={session.id} />
      </div>

      {/* Results */}
      <div className="mb-5">
        <ResultsPanel sessionId={session.id} />
      </div>
    </div>
  )
}
