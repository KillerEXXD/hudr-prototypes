import { apiClient } from '../client'
import { transformCurrentUser, transformSubscriptionPlan, transformTrendingQuery } from '../transforms'
import type { ApiCurrentUser, ApiSubscriptionPlan, ApiTrendingQuery } from '../types'
import type { CurrentUser, SubscriptionPlan, TrendingQuery } from '../domain'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await apiClient.get<ApiCurrentUser>('/me')
  return res.data ? transformCurrentUser(res.data) : null
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiClient.get<ApiSubscriptionPlan[]>('/subscription-plans')
  return (res.data ?? []).map(transformSubscriptionPlan)
}

export async function getTrendingQueries(): Promise<TrendingQuery[]> {
  const res = await apiClient.get<ApiTrendingQuery[]>('/trending-queries')
  return (res.data ?? []).map(transformTrendingQuery)
}
