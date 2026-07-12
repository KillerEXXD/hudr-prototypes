import { useState } from 'react'
import { Crown, Plus, X, Lock } from 'lucide-react'
import { Avatar, Btn, Card } from '@/components/common/ui'
import { useAddOwner, useRemoveOwner } from '@/hooks'
import type { Club } from '@/types'

/**
 * Creator-only section inside ClubSettingsSheet. Lists current Owners with a
 * one-tap × demote button (Creator row is locked), plus a "+ Add Owner"
 * affordance that opens an inline picker sourced from the club's member
 * list.
 *
 * "Not all Owners can choose another Owner" — only the Creator can add or
 * remove Owners. Other Owners can leave the role themselves (by leaving the
 * club) but can't reshape the executive team.
 */
export function OwnersManager({ club, callerUserId }: { club: Club; callerUserId: string }) {
  const addOwner = useAddOwner()
  const removeOwner = useRemoveOwner()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [err, setErr] = useState('')

  const owners = club.members.filter((m) => m.role === 'owner')
  const eligibleMembers = club.members.filter((m) => m.role === 'member' && m.status === 'member')

  async function onDemote(userId: string) {
    setErr('')
    const r = await removeOwner.mutateAsync({ clubId: club.id, userId, callerUserId })
    if (!r.ok && r.reason === 'cannot_demote_creator') setErr("The Creator can't be demoted. The only way they 'leave' is by Dissolving the club.")
    else if (!r.ok && r.reason === 'creator_only') setErr('Only the Creator can change Owners.')
  }

  async function onAdd(userId: string) {
    setErr('')
    const r = await addOwner.mutateAsync({ clubId: club.id, userId, callerUserId })
    if (r.ok) setPickerOpen(false)
    else if (r.reason === 'creator_only') setErr('Only the Creator can add Owners.')
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-accent-amber" />
        <h3 className="flex-1 text-sm font-bold text-text-primary">Owners</h3>
        <span className="rounded-full bg-bg-surface px-2 py-0.5 text-[10px] font-bold text-text-muted">{owners.length}</span>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">
        Only the <b className="text-text-primary">Creator</b> can add or remove Owners. Owners can manage members, edit settings, and run games — but they can't reshape the executive roster.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {owners.map((m) => {
          const isCreator = club.creatorId === m.userId
          return (
            <li key={m.userId} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-surface/40 p-2">
              <Avatar name={m.name} color={m.avatarColor} size={26} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-text-primary">{m.name}</p>
                <p className="text-[10px] text-text-muted">{isCreator ? 'Creator · permanent' : 'Owner'}</p>
              </div>
              {isCreator ? (
                <Lock className="h-3.5 w-3.5 text-text-muted" aria-label="Creator can't be demoted" />
              ) : (
                <button
                  type="button"
                  onClick={() => onDemote(m.userId)}
                  disabled={removeOwner.isPending}
                  className="rounded-md p-1 text-text-muted hover:bg-bg-card hover:text-accent-red cursor-pointer disabled:opacity-40"
                  aria-label={`Demote ${m.name} to member`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {!pickerOpen ? (
        <Btn variant="secondary" className="mt-3 w-full" onClick={() => setPickerOpen(true)} disabled={eligibleMembers.length === 0}>
          <Plus className="h-4 w-4" />Add Owner{eligibleMembers.length === 0 && ' (no eligible members)'}
        </Btn>
      ) : (
        <div className="mt-3 rounded-lg border border-accent-blue/30 bg-accent-blue/5 p-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-accent-blue">Pick a member to promote</p>
          <ul className="flex flex-col gap-1.5">
            {eligibleMembers.map((m) => (
              <li key={m.userId}>
                <button
                  type="button"
                  onClick={() => onAdd(m.userId)}
                  disabled={addOwner.isPending}
                  className="flex w-full items-center gap-2.5 rounded-md border border-border bg-bg-surface p-2 text-left hover:border-accent-blue cursor-pointer disabled:opacity-40"
                >
                  <Avatar name={m.name} color={m.avatarColor} size={24} />
                  <span className="flex-1 truncate text-xs font-bold text-text-primary">{m.name}</span>
                  <Plus className="h-3.5 w-3.5 text-accent-blue" />
                </button>
              </li>
            ))}
          </ul>
          <Btn variant="secondary" size="sm" className="mt-2 w-full" onClick={() => setPickerOpen(false)}>Cancel</Btn>
        </div>
      )}

      {err && <p className="mt-2 text-xs font-semibold text-accent-red">{err}</p>}
    </Card>
  )
}
