import { apiClient } from '../client'
import { transformSuggestedQuestion } from '../transforms'
import type { ApiSuggestedQuestion } from '../types'
import type { SuggestedQuestion } from '../domain'

// Popular suggested questions for a chat context, sorted most-asked first.
// Live, this is backed by an analytics tally of canned-question usage.
export async function getSuggestedQuestions(context: 'tournament' | 'player'): Promise<SuggestedQuestion[]> {
  const res = await apiClient.get<ApiSuggestedQuestion[]>('/suggested-questions', { context })
  return (res.data ?? []).map(transformSuggestedQuestion).sort((a, b) => b.askedCount - a.askedCount)
}
