import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AccountRole, User } from '@/types'
import { USERS, nextId } from '@/data/store'
import { applyActingRole, isActingRole } from '@/lib/auth/actingRole'

// Mock auth. Three seeded accounts (one per role) + a "create a login" path
// for a brand-new player joining via an invite link. Persisted to
// localStorage so a refresh keeps you signed in. Swap for real auth later;
// the rest of the app only reads `user`.

const STORAGE_KEY = 'clubr-auth'
const ACTING_KEY = 'clubr-acting-role'
const ROLE_ACCOUNT: Record<AccountRole, string> = { admin: 'u_admin', owner: 'u_host', member: 'u_player' }
const readActing = (): AccountRole | null => {
  try { const v = localStorage.getItem(ACTING_KEY); return isActingRole(v) ? v : null } catch { return null }
}

interface AuthCtx {
  user: User | null
  /** The caller's REAL role. Drives whether the App Admin "acting as" switcher shows. */
  realRole: AccountRole | null
  /** App Admin ONLY: view the app as App Admin / Owner / Member. No-op for non-admins. */
  actAs: (role: AccountRole) => void
  loginAs: (role: AccountRole, userId?: string) => void
  signUp: (name: string, email: string, phone: string, location?: string) => User
  /** Update the signed-in user's name/email. Changing the email marks it unverified. */
  updateProfile: (patch: { name: string; email: string; city?: string }) => void
  /** Mock email verification (the real app confirms via a magic link). */
  verifyEmail: () => void
  /** Re-read the signed-in user from the store (e.g. after creating a club promotes the role). */
  refreshUser: () => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function readStored(): User | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    if (id && USERS[id]) return USERS[id]
  } catch { /* ignore */ }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStored)
  const [actingRole, setActingRole] = useState<AccountRole | null>(readActing)

  const persist = (u: User | null) => {
    try {
      if (u) localStorage.setItem(STORAGE_KEY, u.id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }

  const loginAs = useCallback((role: AccountRole, userId?: string) => {
    const u = USERS[userId ?? ROLE_ACCOUNT[role]]
    setUser(u); persist(u)
    setActingRole(null); try { localStorage.removeItem(ACTING_KEY) } catch { /* ignore */ }
  }, [])

  const signUp = useCallback((name: string, email: string, phone: string, location?: string): User => {
    const id = nextId('u')
    const u: User = {
      id, name: name.trim() || 'New Player', handle: (name.trim().split(' ')[0] || 'player').toLowerCase(),
      email: email.trim(), phone: phone.trim(), location: location?.trim() || undefined, role: 'member', avatarColor: '#3b82f6',
      emailVerified: false,
    }
    USERS[id] = u
    setUser(u); persist(u)
    // Skin is remembered per browser and must survive signup/login — only a DB wipe
    // forces the default (via the SKIN_EPOCH lever in ThemeContext).
    return u
  }, [])

  const updateProfile = useCallback((patch: { name: string; email: string; city?: string }) => {
    setUser((prev) => {
      if (!prev) return prev
      const email = patch.email.trim()
      const emailChanged = email.toLowerCase() !== (prev.email ?? '').toLowerCase()
      const u: User = {
        ...prev,
        name: patch.name.trim() || prev.name,
        email,
        location: patch.city !== undefined ? patch.city.trim() : prev.location,
        // Changing the email un-verifies it until the user re-verifies.
        emailVerified: emailChanged ? false : prev.emailVerified,
      }
      USERS[u.id] = u; persist(u)
      return u
    })
  }, [])

  const verifyEmail = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev
      const u: User = { ...prev, emailVerified: true }
      USERS[u.id] = u; persist(u)
      return u
    })
  }, [])

  const refreshUser = useCallback(() => {
    setUser((prev) => (prev && USERS[prev.id] ? { ...USERS[prev.id] } : prev))
  }, [])

  const logout = useCallback(() => {
    setUser(null); persist(null)
    setActingRole(null); try { localStorage.removeItem(ACTING_KEY) } catch { /* ignore */ }
    // Do NOT reset the skin on logout — a returning user keeps their chosen skin.
  }, [])

  // App Admin "acting as": a real admin can view the app as Owner/Member. Client-side
  // view only — gated to real admins in the UI; non-admins are unaffected.
  const realRole = user?.role ?? null
  const effectiveUser = applyActingRole(user, actingRole)
  const actAs = useCallback((role: AccountRole) => {
    setActingRole(role)
    try { localStorage.setItem(ACTING_KEY, role) } catch { /* ignore */ }
  }, [])

  return <Ctx.Provider value={{ user: effectiveUser, realRole, actAs, loginAs, signUp, updateProfile, verifyEmail, refreshUser, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
