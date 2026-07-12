// Splits a notification body into plain + name segments so the UI can emphasize
// the names (club, host, person, game) without flashy color — the names render
// bright (text-text-primary) against the muted body, theme-correct in every skin.
//
// Notification bodies are generated server-side, e.g.
//   "Tilly S asked to join Ravee's Private Club."
//   "Player X asked to join Sunday Guindy Squares."
//   "You're now a member of Ravee's Ghetto."
//   "Your request to join Ravee's Private Club wasn't approved. You can browse…"
// The dynamic names are always proper-noun runs in otherwise-lowercase sentences,
// plus the structured actorName — so we highlight: (a) the actorName, and (b) any
// capitalized word-run that isn't sentence-initial or a common pronoun/article.

export interface BodySegment {
  text: string;
  /** true = a name to emphasize. */
  name: boolean;
}

// Sentence-initial / pronoun words that look capitalized but aren't names.
const STOP = new Set(['You', 'Your', "You're", 'I', 'A', 'An', 'The', 'New']);

export function splitNotificationName(body: string, actorName: string | null = null): BodySegment[] {
  if (!body) return [];
  const ranges: Array<[number, number]> = [];

  // (a) the structured actor name — exact first occurrence.
  const actor = actorName?.trim();
  if (actor) {
    const i = body.indexOf(actor);
    if (i >= 0) ranges.push([i, i + actor.length]);
  }

  // (b) capitalized proper-noun runs (allow possessive apostrophes), skipping
  // sentence starts and the stoplist.
  const re = /[A-Z][\w'’]*(?:\s+[A-Z][\w'’]*)*/g;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    const start = m.index;
    const firstWord = m[0].split(/\s+/)[0];
    const sentenceStart = start === 0 || /[.!?]\s+$/.test(body.slice(0, start));
    if (sentenceStart || STOP.has(firstWord)) continue;
    ranges.push([start, start + m[0].length]);
  }

  if (ranges.length === 0) return [{ text: body, name: false }];

  // Merge overlapping ranges.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }

  // Split into alternating plain / name segments.
  const out: BodySegment[] = [];
  let pos = 0;
  for (const [s, e] of merged) {
    if (s > pos) out.push({ text: body.slice(pos, s), name: false });
    out.push({ text: body.slice(s, e), name: true });
    pos = e;
  }
  if (pos < body.length) out.push({ text: body.slice(pos), name: false });
  return out;
}
