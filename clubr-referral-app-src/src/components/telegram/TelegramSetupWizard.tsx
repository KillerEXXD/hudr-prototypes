import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Send, Check, Copy, Pencil, Lock, Shield, Search, ExternalLink, Loader2 } from 'lucide-react'
import { Btn } from '@/components/common/ui'
import { useClubTelegram, useConnectChannel } from '@/hooks/telegram'

// Beginner-friendly, step-by-step Telegram channel setup (prototype mirror of the
// live app). One screen at a time (Back/Next + progress) with a small illustration
// per step, a one-tap copy for the bot handle, and the connect code on the last step.
// In the prototype the bot isn't real, so step 3 has an explicit "connect" action
// standing in for the bot auto-detecting the posted code.

export const TELEGRAM_BOT_HANDLE = '@ClubrAdminBot'
export const TELEGRAM_BOT_LINK = 'https://t.me/ClubrAdminBot'

const TOTAL = 3

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  return (
    <button type="button" onClick={copy} aria-label={label}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-surface px-2 py-1 text-[11px] font-semibold text-text-secondary hover:bg-bg-card cursor-pointer">
      {copied ? <><Check className="h-3.5 w-3.5 text-accent-emerald" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
    </button>
  )
}

function Art({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-xl border border-border bg-bg-surface/60 p-3">{children}</div>
}

function CreateChannelArt() {
  return (
    <Art>
      <div className="flex items-center justify-between rounded-lg bg-bg-card px-2.5 py-1.5">
        <span className="text-xs font-bold text-text-primary">Telegram</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue ring-2 ring-accent-blue/40"><Pencil className="h-3.5 w-3.5" /></span>
      </div>
      <div className="ml-auto mt-1.5 w-40 overflow-hidden rounded-lg border border-border bg-bg-card text-[11px]">
        <div className="px-2.5 py-1.5 text-text-muted">New Group</div>
        <div className="flex items-center gap-1.5 border-t border-border bg-accent-blue/10 px-2.5 py-1.5 font-bold text-accent-blue">New Channel <ChevronRight className="ml-auto h-3 w-3" /></div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span className="rounded-md border border-border px-2 py-0.5 text-text-muted">Public</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-accent-blue bg-accent-blue/10 px-2 py-0.5 font-bold text-accent-blue"><Lock className="h-3 w-3" />Private</span>
      </div>
    </Art>
  )
}

function AddAdminArt() {
  return (
    <Art>
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Administrators</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-bg-card px-2.5 py-2">
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-mono text-xs text-text-primary">@ClubrAdminBot</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue"><Shield className="h-3 w-3" />Admin</span>
      </div>
      <p className="mt-1.5 text-[10px] text-text-muted">Add Admin → search the bot → give it admin rights.</p>
    </Art>
  )
}

function PostCodeArt({ code }: { code: string | null }) {
  return (
    <Art>
      <div className="flex items-center justify-end">
        <span className="rounded-2xl rounded-br-sm bg-accent-blue px-3 py-1.5 font-mono text-xs font-bold text-white">/link {code ?? '1F668D'}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 rounded-full border border-border bg-bg-card px-2.5 py-1.5">
        <span className="flex-1 text-[11px] text-text-muted">Message your channel…</span>
        <Send className="h-4 w-4 text-accent-blue" />
      </div>
    </Art>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xs font-extrabold text-white">{n}</span>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-text-secondary">{children}</div>
    </div>
  )
}

// Prototype-only: a stable-ish fake code (no crypto/bot here).
function fakeCode(clubId: string): string {
  let h = 0
  for (let i = 0; i < clubId.length; i++) h = (h * 31 + clubId.charCodeAt(i)) >>> 0
  return h.toString(16).toUpperCase().padStart(6, '0').slice(0, 6)
}

export function TelegramSetupWizard({ open, onClose, clubId, clubName }: { open: boolean; onClose: () => void; clubId: string; clubName?: string }) {
  // Suggest a channel name close to the club so members recognize it in Telegram.
  const channelNameHint = `${(clubName ?? '').trim() || 'Aces High'} Alerts`
  const [step, setStep] = useState(0)
  const [code, setCode] = useState<string | null>(null)
  const { data: st } = useClubTelegram(clubId)
  const connect = useConnectChannel(clubId)
  const connected = !!st?.channel

  if (!open) return null
  const pct = Math.round(((step + 1) / TOTAL) * 100)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="animate-fade-up flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-bg-card shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl">
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-blue">
                <Send className="h-3.5 w-3.5" /> Telegram setup
              </div>
              <div className="mt-0.5 text-[11px] text-text-muted">{connected ? 'Connected' : `Step ${step + 1} of ${TOTAL}`}</div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-surface">
            <div className="h-full rounded-full bg-accent-blue transition-all duration-300" style={{ width: `${connected ? 100 : pct}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {step === 0 && (
            <Step n={1} title="Create a private channel">
              In Telegram, tap the <b className="text-text-primary">pencil ✎</b> (top-right) → <b className="text-text-primary">New Channel</b>. Name it <b className="text-text-primary">close to your club</b> — e.g. <b className="text-text-primary">"{channelNameHint}"</b> — so members recognize it, then set the type to <b className="text-text-primary">Private</b>. A channel is a one-way broadcast for club alerts.
              <CreateChannelArt />
            </Step>
          )}

          {step === 1 && (
            <Step n={2} title="Add the ClubrGO bot as an admin">
              Open your new channel → <b className="text-text-primary">Administrators</b> → <b className="text-text-primary">Add Admin</b>, then search for the bot and add it. It needs admin so it can post games &amp; manage the member invite link.
              <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-2">
                <span className="flex-1 font-mono text-sm font-bold text-text-primary">{TELEGRAM_BOT_HANDLE}</span>
                <CopyBtn text={TELEGRAM_BOT_HANDLE} label="Copy bot handle" />
                <a href={TELEGRAM_BOT_LINK} target="_blank" rel="noopener noreferrer" aria-label="Open the bot in Telegram"
                  className="inline-flex items-center gap-1 rounded-md border border-accent-blue/30 bg-accent-blue/10 px-2 py-1 text-[11px] font-semibold text-accent-blue hover:bg-accent-blue/20 cursor-pointer">
                  <ExternalLink className="h-3.5 w-3.5" />Open
                </a>
              </div>
              <AddAdminArt />
            </Step>
          )}

          {step === 2 && (
            <Step n={3} title="Post your connect code">
              {connected ? (
                <div className="mt-1 flex flex-col items-center gap-2 py-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald/15 text-accent-emerald"><Check className="h-7 w-7" /></span>
                  <p className="text-sm font-bold text-text-primary">Channel connected! 🎉</p>
                  <p className="text-xs text-text-muted">Members can now join from the club page and get game alerts.</p>
                </div>
              ) : (
                <>
                  Generate a code, then <b className="text-text-primary">send it as a message inside your channel</b>. The bot reads it and links the channel automatically.
                  <PostCodeArt code={code} />
                  {code ? (
                    <div className="mt-2.5 rounded-lg border border-border bg-bg-surface px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">Post this in your channel</p>
                      <div className="mt-0.5 flex items-center justify-center gap-2">
                        <span className="font-mono text-base font-extrabold text-text-primary">/link {code}</span>
                        <CopyBtn text={`/link ${code}`} label="Copy connect command" />
                      </div>
                      <Btn size="sm" className="mt-2.5 w-full" loading={connect.isPending} onClick={async () => { await connect.mutateAsync({ link: `https://t.me/+clubr_${clubId}`, title: '' }) }}>
                        {connect.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Detecting…</> : "I've posted it — connect"}
                      </Btn>
                      <p className="mt-1.5 text-[10px] leading-snug text-text-muted"><i>Prototype — the real bot detects the posted code automatically.</i></p>
                    </div>
                  ) : (
                    <Btn size="sm" className="mt-2.5 w-full" onClick={() => setCode(fakeCode(clubId))}>
                      Generate connect code
                    </Btn>
                  )}
                </>
              )}
            </Step>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-1 rounded-lg border border-border bg-bg-surface/60 px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < TOTAL - 1 ? (
              <button type="button" onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent-blue px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 cursor-pointer">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={onClose}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-blue px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90 cursor-pointer">
                {connected ? <><Check className="h-4 w-4" />Done</> : 'Done'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
