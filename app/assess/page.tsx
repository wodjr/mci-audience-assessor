'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ParticipantObservations, ObsAnswer } from '@/types/feedback'

const OBS_QUESTIONS: { key: keyof ParticipantObservations; label: string; hint: string }[] = [
  {
    key: 'rolesAssigned',
    label: 'Was it clear who was in charge?',
    hint: 'Could you tell who was leading the team and giving direction?',
  },
  {
    key: 'communicationClear',
    label: 'Was the team communicating well?',
    hint: 'Were they talking to each other clearly and staying coordinated?',
  },
  {
    key: 'responseSpeed',
    label: 'Did the team respond quickly enough?',
    hint: 'Did they act fast given the urgency of the situation?',
  },
  {
    key: 'escalationAppropriate',
    label: 'Did team members speak up when needed?',
    hint: 'Did anyone raise concerns or call for help at the right time?',
  },
  {
    key: 'teamworkEffective',
    label: 'Did the team work well together?',
    hint: 'Did they support each other and share the workload?',
  },
]

const MISSED_OPTIONS = [
  'A patient appeared to be overlooked or left unattended',
  'A worsening situation was not noticed in time',
  'The team seemed unsure which patient to prioritise first',
  'Some team members had little to do while others were overwhelmed',
  'The team focused too much on one patient and neglected others',
  'No one appeared to be tracking what had already been done',
  'Decisions were made without enough assessment or information',
  'There was no clear handover when tasks or roles changed',
]

function ObsButton({
  value,
  selected,
  onClick,
}: {
  value: ObsAnswer
  selected: boolean
  onClick: () => void
}) {
  const cfg = {
    yes: { label: 'Yes', active: 'bg-green-600 border-green-600 text-white' },
    no: { label: 'No', active: 'bg-red-500 border-red-500 text-white' },
    not_sure: { label: 'Not Sure', active: 'bg-amber-400 border-amber-400 text-gray-900' },
  }[value]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium border transition-colors ${
        selected ? cfg.active : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {cfg.label}
    </button>
  )
}

function AssessForm({ sessionId }: { sessionId: string }) {
  const [observations, setObservations] = useState<ParticipantObservations>({
    rolesAssigned: null,
    communicationClear: null,
    responseSpeed: null,
    escalationAppropriate: null,
    teamworkEffective: null,
  })
  const [missedItems, setMissedItems] = useState<string[]>([])
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function toggleMissed(item: string) {
    setMissedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, observations, missedItems, overallScore }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Could not submit — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment submitted!</h1>
          <p className="text-gray-700 text-sm leading-relaxed font-medium mb-2">
            That&apos;s what a traditional assessor had to do — by hand, from memory, for every simulation.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your observations have been added to the group results.
          </p>
          <p className="mt-5 text-xs text-gray-400">You can close this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 py-6">
        <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">IBM Think · MCI Audience Assessor</p>
        <h1 className="text-2xl font-bold mb-2">You are the Assessor.</h1>
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          You just watched an emergency team respond to a mass casualty incident.
        </p>
        <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed">
          Traditionally, one person had to sit through the entire simulation, take handwritten notes,
          and then write a full debrief report from memory — alone, under time pressure, trying not to miss anything.
          <span className="block mt-1 text-blue-300 font-medium">
            That was the assessor&apos;s job. Now it&apos;s yours.
          </span>
        </div>
        <p className="text-gray-400 text-xs mt-3">Fill in what you observed.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Observations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">What did you observe?</h2>
          <p className="text-xs text-gray-400 mb-4">
            Answer based on what you just watched — trust your instincts!
          </p>
          <div className="space-y-5">
            {OBS_QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-sm font-medium text-gray-900 mb-0.5">{q.label}</p>
                <p className="text-xs text-gray-400 mb-2">{q.hint}</p>
                <div className="flex gap-2">
                  {(['yes', 'no', 'not_sure'] as ObsAnswer[]).map((v) => (
                    <ObsButton
                      key={v}
                      value={v}
                      selected={observations[q.key] === v}
                      onClick={() => setObservations((o) => ({ ...o, [q.key]: v }))}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missed items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Did you notice any of these?</h2>
          <p className="text-xs text-gray-400 mb-4">Select anything that stood out to you as a viewer.</p>
          <div className="space-y-3">
            {MISSED_OPTIONS.map((item) => (
              <label key={item} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={missedItems.includes(item)}
                  onChange={() => toggleMissed(item)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Overall impression</h2>
          <p className="text-xs text-gray-400 mb-4">How well do you think the team handled the situation?</p>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setOverallScore(n)}
                className={`flex-1 h-12 rounded-xl text-base font-bold border transition-colors ${
                  overallScore === n
                    ? n <= 2
                      ? 'bg-red-500 border-red-500 text-white'
                      : n === 3
                      ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                      : n === 4
                      ? 'bg-lime-500 border-lime-500 text-gray-900'
                      : 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Poor</span>
            <span className="text-xs text-gray-400">Excellent</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors text-base"
        >
          {submitting ? 'Submitting…' : 'Submit Assessment'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">Takes about 2 minutes.</p>
      </form>
    </div>
  )
}

function AssessInner() {
  const params = useSearchParams()
  const sessionId = params.get('session') ?? ''

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
          <p className="text-gray-500 text-sm">
            Please scan the QR code displayed on the demo screen to open this form.
          </p>
        </div>
      </div>
    )
  }

  return <AssessForm sessionId={sessionId} />
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AssessInner />
    </Suspense>
  )
}
