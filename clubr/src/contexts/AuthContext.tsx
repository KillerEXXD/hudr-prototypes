import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AccountRole, User } from '@/types'
import { USERS, nextId } from '@/data/store'

// Mock auth. Three seeded accounts (one per role) + a "create a login" path
// for a brand-new player joining via an invite link. Persisted to
// localStorage so a refresh keeps you signed in. Swap for real auth later;
// the rest of the app only reads `user`.

const STORAGE_KEY = 'clubr-auth'
const ROLE_ACCOUNT: Record<AccountRole, string> = { admin: 'u_admin', host: 'u_host', player: 'u_player' }

interface AuthCtx {
  user: User | null
  loginAs: (role: AccountRole, userId?: string) => void
  signUp: (name: string, email: string, phone: string, location?: string) => User
  /** Update the signed-in user's name/email. Changing the email marks it unverified. */
  updateProfile: (patch: { name: string; email: string }) => void
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

  const persist = (u: User | null) => {
    try {
      if (u) localStorage.setItem(STORAGE_KEY, u.id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }

  const loginAs = useCallback((role: AccountRole, userId?: string) => {
    const u = USERS[userId ?? ROLE_ACCOUNT[role]]
    setUser(u); persist(u)
  }, [])

  const signUp = useCallback((name: string, email: string, phone: string, location?: string): User => {
    const id = nextId('u')
    const u: User = {
      id, name: name.trim() || 'New Player', handle: (name.trim().split(' ')[0] || 'player').toLowerCase(),
      email: email.trim(), phone: phone.trim(), location: location?.trim() || undefined, role: 'player', avatarColor: '#3b82f6',
      emailVerified: false,
    }
    USERS[id] = u
    setUser(u); persist(u)
    return u
  }, [])

  const updateProfile = useCallback((patch: { name: string; email: string }) => {
    setUser((prev) => {
      if (!prev) return prev
      const email = patch.email.trim()
      const emailChanged = email.toLowerCase() !== (prev.email ?? '').toLowerCase()
      const u: User = {
        ...prev,
        name: patch.name.trim() || prev.name,
        email,
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

  const logout = useCallback(() => { setUser(null); persist(null) }, [])

  return <Ctx.Provider value={{ user, loginAs, signUp, updateProfile, verifyEmail, refreshUser, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
