import type { ClubView } from '@/types'

/**
 * Whether the current user *hosts* this club — i.e. their own membership role is
 * `owner`. This drives the "Hosting" vs "Member" split on the My Clubs page.
 *
 * Deliberately NOT `canManage`: `canManage` is `isAdmin || owner`, so an
 * App Admin (or any admin/override) returns `true` for EVERY club — which
 * wrongly files clubs the user merely belongs to under "Hosting" (with a
 * "Member" badge). Grouping must reflect the user's actual role (matching the
 * row's MembershipBadge), while `canManage` still governs management
 * *permissions* everywhere else.
 */
export function hostsClub(myRole: ClubView['myRole']): boolean {
  return myRole === 'owner'
}
