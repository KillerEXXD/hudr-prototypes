import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// Minimal mock auth — mirrors the ClubR app's AuthContext shape (a current user
// with a role), so pages can gate on role exactly like the real app.
export type Role = 'player' | 'host' | 'admin'
export interface User { id: string; name: string; role: Role }

interface AuthCtx {
  user: User | null
  login: (role: Role) => void
  logout: () => void
}
const Ctx = createContext<AuthCtx | null>(null)

const NAMES: Record<Role, string> = { player: 'Ravee S', host: 'Ravee S', admin: 'Admin' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const login = useCallback((role: Role) => setUser({ id: 'u1', name: NAMES[role], role }), [])
  const logout = useCallback(() => setUser(null), [])
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
