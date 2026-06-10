export type ObsAnswer = 'yes' | 'no' | 'not_sure'

export interface ParticipantObservations {
  rolesAssigned: ObsAnswer | null
  communicationClear: ObsAnswer | null
  responseSpeed: ObsAnswer | null
  escalationAppropriate: ObsAnswer | null
  teamworkEffective: ObsAnswer | null
}

export interface ParticipantResponse {
  id: string
  sessionId: string
  submittedAt: string
  observations: ParticipantObservations
  missedItems: string[]
  overallScore: number | null
}

export interface ObsSummary {
  yes: number
  no: number
  not_sure: number
  total: number
}

export interface FeedbackAggregation {
  sessionId: string
  count: number
  responses: ParticipantResponse[]
  averageScore: number | null
  observationSummary: Record<keyof ParticipantObservations, ObsSummary>
  topMissedItems: { item: string; count: number }[]
}
