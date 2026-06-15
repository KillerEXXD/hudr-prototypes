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
  loginAs: (role: AccountRole) => void
  signUp: (name: string, email?: string) => User
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

  const loginAs = useCallback((role: AccountRole) => {
    const u = USERS[ROLE_ACCOUNT[role]]
    setUser(u); persist(u)
  }, [])

  const signUp = useCallback((name: string, email?: string): User => {
    const id = nextId('u')
    const u: User = {
      id, name: name.trim() || 'New Player', handle: (name.trim().split(' ')[0] || 'player').toLowerCase(),
      email: email?.trim() || `${id}@clubr.app`, role: 'player', avatarColor: '#3b82f6',
    }
    USERS[id] = u
    setUser(u); persist(u)
    return u
  }, [])

  const logout = useCallback(() => { setUser(null); persist(null) }, [])

  return <Ctx.Provider value={{ user, loginAs, signUp, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
