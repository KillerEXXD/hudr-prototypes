import type { AccountRole, User } from '@/types'

export const ROLES: AccountRole[] = ['admin', 'host', 'player']

// App Admin "acting as" view. A REAL admin can view the app as Club Host or Player;
// everyone else is unaffected — a non-admin's actingRole is ignored, so this can NEVER
// escalate privileges. It's a client-side view only; the real app's backend derives
// the real role from the verified JWT.
export function applyActingRole(user: User | null, actingRole: AccountRole | null): User | null {
  if (user && user.role === 'admin' && actingRole && actingRole !== 'admin') {
    return { ...user, role: actingRole }
  }
  return user
}

export function isActingRole(value: string | null): value is AccountRole {
  return value === 'admin' || value === 'host' || value === 'player'
}
