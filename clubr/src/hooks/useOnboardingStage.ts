import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { relationshipOf } from '@/games/gameRelationship'
import { captureOnboardingStage } from '@/lib/analytics'
import {
  resolveOnboarding, tabsForStage, maxStage, stageRank,
  type OnboardingResult, type OnboardingStage,
} from '@/lib/onboarding/resolveOnboarding'

const KEY = (uid: string) => `clubr-onb-maxstage:${uid}`

function readPersisted(uid: string): OnboardingStage {
  if (typeof window === 'undefined' || !uid) return 'fresh'
  const v = window.localStorage.getItem(KEY(uid))
  return v === 'connected' || v === 'playing' || v === 'settled' ? v : 'fresh'
}

/**
 * Progressive-onboarding stage + the unlocked bottom-nav tabs, derived from the
 * user's footprint (confirmed club membership, host role, a live game → Games tab, a
 * settled game) via the pure `resolveOnboarding`. The reveal is **monotonic**: once a user has reached a
 * stage we never drop below it (persisted per-user), so the nav never visibly
 * regresses and a returning user doesn't flicker from 1 tab up to 4 on load.
 *
 * **One deliberate exception — confirmed-empty resets to 'fresh'.** If the footprint
 * has fully LOADED and is *truly empty* (zero club records of any status — not even a
 * pending request — not a host, and no games), we drop back to 'fresh' so the user
 * sees the cold-start Get-Started hub and the nav hides, instead of a thin Discover
 * page. Gated on loaded data (`clubs.isSuccess && !games.isLoading`) so a transient
 * empty mid-fetch never flickers the nav away; a *partial* shrink (still has some
 * club/game) keeps the higher stage as before.
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
    // An approved, live entry (a pending game request stays 'available', so it won't
    // reveal the Games tab early; hosting alone is 'hosting', not 'playing').
    hasActiveGame: games.items.some((g) => relationshipOf(g) === 'playing'),
    hasSettledGame: games.items.some((g) => g.mine && g.finished),
  })

  // Truly empty = LOADED data with no club records of ANY status (member/pending/host
  // all own a club row) and no games. Gated on loaded flags so a mid-fetch empty never
  // counts. (`useUnifiedGames` exposes only `isLoading`, no `isSuccess`.)
  const trulyEmpty = !isAdmin
    && clubs.isSuccess && !games.isLoading
    && (clubs.data ?? []).length === 0
    && games.items.length === 0

  const [persisted, setPersisted] = useState<OnboardingStage>(() => readPersisted(uid))
  // Re-read when the account changes (e.g. the QA account switcher).
  useEffect(() => { setPersisted(readPersisted(uid)) }, [uid])
  // Advance + persist when the footprint moves the user forward — EXCEPT a confirmed-
  // empty footprint resets the stored max to 'fresh' (keeps localStorage truthful and
  // avoids a reverse-flicker Discover→hub on the next load).
  useEffect(() => {
    if (!uid) return
    if (trulyEmpty) {
      if (persisted !== 'fresh') { window.localStorage.setItem(KEY(uid), 'fresh'); setPersisted('fresh') }
      return
    }
    if (stageRank(current.stage) > stageRank(persisted)) {
      window.localStorage.setItem(KEY(uid), current.stage)
      setPersisted(current.stage)
      captureOnboardingStage(current.stage) // funnel event, once per forward step
    }
  }, [uid, current.stage, persisted, trulyEmpty])

  // Admins always get the full nav; everyone else gets the furthest stage reached,
  // unless they're confirmed-empty (→ back to the cold-start hub, nav hidden).
  if (isAdmin) return current
  if (trulyEmpty) return { stage: 'fresh', unlockedTabs: tabsForStage('fresh') }
  const stage = maxStage(current.stage, persisted)
  return { stage, unlockedTabs: tabsForStage(stage) }
}
