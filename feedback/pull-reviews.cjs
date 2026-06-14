#!/usr/bin/env node
/**
 * Pull all guided-review submissions (`prototype_review_submitted`) from PostHog
 * and write a consolidated, per-prototype markdown report you can read offline.
 *
 *   node feedback/pull-reviews.cjs
 *
 * Uses the PostHog HogQL query API (same pattern as the /posthog command). Set the
 * READ-ONLY personal key via env (it is a secret — never hardcode/commit it):
 *
 *   POSTHOG_PERSONAL_KEY=phx_...  node feedback/pull-reviews.cjs
 *
 * The key is the PostHog "Query Read" personal key (the same one the /posthog
 * command uses). Optional overrides: POSTHOG_HOST, POSTHOG_PROJECT_ID.
 */
const fs = require('fs')
const path = require('path')

const HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com'
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '316669'
const KEY = process.env.POSTHOG_PERSONAL_KEY
if (!KEY) {
  console.error('Set POSTHOG_PERSONAL_KEY (read-only PostHog personal "Query Read" key) and re-run, e.g.:')
  console.error('  POSTHOG_PERSONAL_KEY=phx_xxx node feedback/pull-reviews.cjs')
  process.exit(1)
}

const SECTION_LABELS = {
  first_impression: 'First impression',
  discover: 'Finding tournaments & players',
  tournament: 'Tournament overview',
  highlights: 'Highlights',
  stats: 'Stats & the hands behind them',
  ai: 'Asking the AI',
  replays: 'Watching hands / replays',
  player_report: 'Player scouting report',
  navigation: 'Finding your way around',
  design: 'Look & feel (UI)',
  trust: 'Trustworthiness of the reads',
}
const SECTION_ORDER = Object.keys(SECTION_LABELS)
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const fmt = (n) => (n == null ? '—' : n.toFixed(2))

async function main() {
  const hogql =
    "select properties from events where event = 'prototype_review_submitted' " +
    "and timestamp > now() - interval 180 day order by timestamp desc limit 2000"
  const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
  })
  if (!res.ok) {
    console.error('PostHog query failed:', res.status, await res.text())
    process.exit(1)
  }
  const json = await res.json()
  const props = (json.results || []).map((row) => {
    const p = row[0]
    return typeof p === 'string' ? JSON.parse(p) : p
  })
  console.log(`Fetched ${props.length} review submissions.`)

  // group by prototype
  const byProto = {}
  for (const p of props) {
    const proto = p.prototype || 'unknown'
    ;(byProto[proto] ||= []).push(p)
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  let md = `# Scout prototype reviews — ${new Date().toISOString().slice(0, 10)}\n\n`
  md += `Source: PostHog \`prototype_review_submitted\` (last 180 days). ${props.length} total submissions.\n`

  for (const proto of Object.keys(byProto).sort()) {
    const rows = byProto[proto]
    md += `\n---\n\n## ${proto}  (${rows.length} review${rows.length === 1 ? '' : 's'})\n\n`

    // per-feature average score
    md += `### Average score per feature (1–5)\n\n| Feature | Avg | n |\n|---|---|---|\n`
    for (const key of SECTION_ORDER) {
      const scores = rows.map((r) => r[`score_${key}`]).filter((v) => typeof v === 'number')
      md += `| ${SECTION_LABELS[key]} | ${fmt(avg(scores))} | ${scores.length} |\n`
    }

    // overall
    const use = rows.map((r) => r.would_use).filter((v) => typeof v === 'number' && v > 0)
    const npsVals = rows.map((r) => r.nps).filter((v) => typeof v === 'number' && v >= 0)
    const promoters = npsVals.filter((v) => v >= 9).length
    const detractors = npsVals.filter((v) => v <= 6).length
    const nps = npsVals.length ? Math.round(((promoters - detractors) / npsVals.length) * 100) : null
    const pay = { yes: 0, maybe: 0, no: 0 }
    rows.forEach((r) => { if (pay[r.would_pay] != null) pay[r.would_pay]++ })
    md += `\n### Overall\n\n`
    md += `- **Would use** (1–5): ${fmt(avg(use))}  (n=${use.length})\n`
    md += `- **NPS**: ${nps == null ? '—' : nps}  (promoters ${promoters} / detractors ${detractors} / n ${npsVals.length})\n`
    md += `- **Would pay**: yes ${pay.yes} · maybe ${pay.maybe} · no ${pay.no}\n`
    const amounts = rows.map((r) => r.would_pay_amount).filter(Boolean)
    if (amounts.length) md += `- **Pay amounts**: ${amounts.join(' · ')}\n`

    // verbatim text per feature
    md += `\n### What testers said\n`
    for (const key of SECTION_ORDER) {
      const liked = rows.map((r) => r[`liked_${key}`]).filter(Boolean)
      const disliked = rows.map((r) => r[`disliked_${key}`]).filter(Boolean)
      if (!liked.length && !disliked.length) continue
      md += `\n**${SECTION_LABELS[key]}**\n`
      liked.forEach((t) => { md += `- 👍 ${t}\n` })
      disliked.forEach((t) => { md += `- 👎 ${t}\n` })
    }
    const notes = rows.map((r) => r.overall_note).filter(Boolean)
    if (notes.length) {
      md += `\n**Anything else / change first**\n`
      notes.forEach((t) => { md += `- ${t}\n` })
    }
  }

  const out = path.join(__dirname, `reviews-${stamp}.md`)
  fs.writeFileSync(out, md, 'utf8')
  console.log(`Wrote ${out}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
