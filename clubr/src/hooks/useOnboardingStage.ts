import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import {
  resolveOnboarding, tabsForStage, maxStage, stageRank,
  type OnboardingResult, type OnboardingStage,
} from '@/lib/onboarding/resolveOnboarding'

const KEY = (uid: string) => `clubr-onb-maxstage:${uid}`

function readPersisted(uid: string): OnboardingStage {
  if (typeof window === 'undefined' || !uid) return 'fresh'
  const v = window.localStorage.getItem(KEY(uid))
  return v === 'connected' || v === 'settled' ? v : 'fresh'
}

/**
 * Progressive-onboarding stage + the unlocked bottom-nav tabs, derived from the
 * user's footprint (confirmed club membership, host role, a settled game) via the
 * pure `resolveOnboarding`. The reveal is **monotonic**: once a user has reached a
 * stage we never drop below it (persisted per-user), so the nav never visibly
 * regresses and a returning user doesn't flicker from 1 tab up to 4 on load.
 */
export function useOnboardingStage(): OnboardingResult {
  const { user } = useAuth()
  const clubs = useMyClubs()
  const games = useUnifiedGames()
  const uid = user?.id ?? ''
  const isAdmin = user?.role === 'admin'

  const current = resolveOnboarding({
    isAdmin,
    isMemberOfAnyClub: (clubs.data ?? []).some((c) => c.myStatus === 'member'),
    isHost: user?.role === 'host' || (clubs.data ?? []).some((c) => c.canManage),
    hasSettledGame: games.items.some((g) => g.mine && g.finished),
  })

  const [persisted, setPersisted] = useState<OnboardingStage>(() => readPersisted(uid))
  // Re-read when the account changes (e.g. the QA account switcher).
  useEffect(() => { setPersisted(readPersisted(uid)) }, [uid])
  // Advance + persist when the footprint moves the user forward.
  useEffect(() => {
    if (!uid) return
    if (stageRank(current.stage) > stageRank(persisted)) {
      window.localStorage.setItem(KEY(uid), current.stage)
      setPersisted(current.stage)
    }
  }, [uid, current.stage, persisted])

  // Admins always get the full nav; everyone else gets the furthest stage reached.
  if (isAdmin) return current
  const stage = maxStage(current.stage, persisted)
  return { stage, unlockedTabs: tabsForStage(stage) }
}
