import type { AccountRole, User } from '@/types'

export const ROLES: AccountRole[] = ['admin', 'host', 'player']

// App Admin "acting as" view. A REAL admin views the app as Club Host BY DEFAULT
// (the day-to-day surface); they opt up to the App Admin console via the switcher.
// Everyone else is unaffected — a non-admin's actingRole is ignored, so this can NEVER
// escalate privileges. It's a client-side view only; the real app's backend derives
// the real role from the verified JWT.
export function applyActingRole(user: User | null, actingRole: AccountRole | null): User | null {
  if (!user || user.role !== 'admin') return user
  const view: AccountRole = actingRole ?? 'host' // admins default to the Club Host view
  return view === 'admin' ? user : { ...user, role: view }
}

export function isActingRole(value: string | null): value is AccountRole {
  return value === 'admin' || value === 'host' || value === 'player'
}
