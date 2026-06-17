import { useState } from 'react'
import { Send, ExternalLink, Link2, Plug } from 'lucide-react'
import { Card, Btn, Section, Sheet, Field } from '@/components/common/ui'
import { useClubTelegram, useConnectChannel, useDisconnectChannel, useLinkTelegram, useJoinChannel } from '@/hooks/telegram'

// Telegram is hidden for now (still being thought through). Flip to `true` to
// re-enable the mock UI — everything below stays wired. SPEC §22.
const TELEGRAM_ENABLED = false

// Member-facing: only shows for an APPROVED member of a club that has a channel.
// Gated flow: connect Telegram (if needed) → join (the bot admits approved members).
export function TelegramJoinCard({ clubId }: { clubId: string }) {
  const { data: st } = useClubTelegram(clubId)
  const link = useLinkTelegram(clubId)
  const join = useJoinChannel(clubId)
  if (!TELEGRAM_ENABLED || !st?.channel || !st.canJoin) return null

  return (
    <Card className="mt-3 border-accent-blue/30 bg-accent-blue/5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Send className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-primary">{st.channel.title}</p>
          <p className="truncate text-[11px] text-text-muted">{st.joined ? "You're in the channel" : 'Members-only Telegram announcements'}</p>
        </div>
        {st.joined ? (
          <a href={st.channel.link} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-bg-surface"><ExternalLink className="h-3.5 w-3.5" />Open</a>
        ) : !st.linked ? (
          <Btn size="sm" disabled={link.isPending} onClick={() => link.mutate('you')}><Link2 className="h-3.5 w-3.5" />Connect Telegram</Btn>
        ) : (
          <Btn size="sm" disabled={join.isPending} onClick={() => join.mutate()}><Send className="h-3.5 w-3.5" />Join channel</Btn>
        )}
      </div>
      {!st.joined && (
        <p className="mt-1.5 text-[10px] leading-snug text-text-muted">
          {!st.linked
            ? 'Connect your Telegram once — then ClubR admits you to the channel because you’re an approved member.'
            : 'Tap to request — the ClubR bot approves you instantly since you’re an approved member.'}
        </p>
      )}
    </Card>
  )
}

// Host-facing (Members tab): connect / manage the club's Telegram broadcast channel.
export function TelegramHostPanel({ clubId }: { clubId: string }) {
  const { data: st } = useClubTelegram(clubId)
  const connect = useConnectChannel(clubId)
  const disconnect = useDisconnectChannel(clubId)
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [title, setTitle] = useState('')
  if (!TELEGRAM_ENABLED) return null

  return (
    <Section title="Telegram channel">
      {st?.channel ? (
        <Card className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Send className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text-primary">{st.channel.title}</p>
            <a href={st.channel.link} target="_blank" rel="noreferrer" className="truncate text-[11px] text-accent-blue hover:underline">{st.channel.link}</a>
          </div>
          <Btn size="sm" variant="secondary" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect</Btn>
        </Card>
      ) : (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-[11px] leading-snug text-text-muted">Link a Telegram <b className="text-text-secondary">broadcast channel</b> — approved members can join it from here; ClubR keeps it in sync.</p>
          <Btn size="sm" onClick={() => setOpen(true)}><Plug className="h-3.5 w-3.5" />Connect</Btn>
        </Card>
      )}
      <p className="mt-1.5 text-[10px] text-text-muted">Approved members get a one-tap join; the bot removes them if they leave the club. (Prototype — real bot wired at launch.)</p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Connect a Telegram channel">
        <div className="flex flex-col gap-3">
          <ol className="flex flex-col gap-1.5 text-[11px] leading-snug text-text-secondary">
            <li><b className="text-text-primary">1.</b> In Telegram, create a <b>private broadcast channel</b> and turn on <b>“Approve new members.”</b></li>
            <li><b className="text-text-primary">2.</b> Add <b className="font-mono">@ClubRBot</b> as an <b>admin</b> (it manages who gets in).</li>
            <li><b className="text-text-primary">3.</b> Paste the channel’s invite link below.</li>
          </ol>
          <Field label="Channel invite link" value={link} onChange={setLink} placeholder="https://t.me/+…" mono />
          <Field label="Display name" value={title} onChange={setTitle} placeholder="e.g. Aces High — announcements" />
          <Btn className="w-full" disabled={!link.trim() || connect.isPending} onClick={async () => { await connect.mutateAsync({ link, title }); setOpen(false); setLink(''); setTitle('') }}>Connect channel</Btn>
        </div>
      </Sheet>
    </Section>
  )
}
