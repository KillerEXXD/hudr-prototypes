import { Link2, Trophy, CheckCircle2 } from 'lucide-react'
import { useAdminSlate } from '@/hooks/ft'
import { Badge, Card, Section, Spinner } from '@/components/common/ui'

// App Admin view (read-only) — the final tables TournamentPro has published into
// ClubrGo. TournamentPro now owns the whole lifecycle (designate → price ICM →
// publish → unpublish); ClubrGo just mirrors what's published so hosts can run
// contests on it. To change anything, use TournamentPro's "ClubrGo FTs" admin.
export function ClubrGoAdmin() {
  const slate = useAdminSlate()
  const fts = (slate.data ?? []).filter((f) => f.source === 'tpro')

  return (
    <Section title="ClubrGo · TournamentPro final tables">
      <p className="mb-2 text-[11px] text-text-muted">
        Designated, priced and published in <span className="text-text-secondary">TournamentPro</span> — this view is read-only. To add, re-price, publish or unpublish a final table, use TournamentPro's <span className="text-text-secondary">ClubrGo FTs</span> admin.
      </p>

      {slate.isLoading ? <Spinner /> : fts.length === 0 ? (
        <p className="text-xs text-text-muted">No final tables published from TournamentPro yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fts.map((f) => (
            <Card key={f.id} className="p-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{f.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-accent-amber" />{f.prizePool}</span>
                    <span>· {f.players.length} finalists</span>
                    {f.players.length > 0 && f.players.every((p) => p.icmPrice > 0) && (
                      <span className="flex items-center gap-1 text-accent-emerald"><CheckCircle2 className="h-3 w-3" />ICM priced</span>
                    )}
                  </p>
                </div>
                <Badge tone={f.published ? 'green' : 'amber'}>{f.published ? 'Published' : 'Staged'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}
