// Scout Agent — Vercel serverless function (dependency-free).
//
// Runs a real LangGraph-style ReAct loop against the Anthropic API entirely
// server-side: the model decides which tools to call, we execute them here
// (returning MOCK hudr data that maps to api.hudr.ai), feed results back, and
// loop until the model answers. The API key never reaches the browser.
//
// GET  /api/scout-agent  -> { configured: boolean }   (health probe for the UI)
// POST /api/scout-agent  { question }
//        -> { ok:true, answer, toolCalls:[{name,input,output}], rounds }
//        -> { ok:false, reason:'no_key'|'api_error'|'bad_request', message }
//
// Requires env ANTHROPIC_API_KEY on the Vercel project. Optional SCOUT_MODEL
// (default 'claude-sonnet-5').

const MODEL = process.env.SCOUT_MODEL || 'claude-sonnet-5';
const MAX_ROUNDS = 5;

// ---- mock HUDR data (maps to api.hudr.ai; the real build would fetch, JWT-scoped) ----
const STATS_FULL = { vpip: 28, pfr: 24, threeBet: 11, foldToThreeBet: 38, cbetFlop: 72, foldToCbet: 31, steal_BTN: 46, riverBet: 29, tripleBarrel: 14, wtsd: 26, sample: '142 hands' };

function getOpponentStats(input) {
  const pos = String(input.pos || '').toUpperCase();
  const street = String(input.street || '').toLowerCase();
  if (pos === 'BTN') return { position: 'BTN', steal: 46, foldToThreeBet: 38, cbetFlop: 72, note: 'opens wide, folds to pressure' };
  if (street === 'river') return { street: 'river', riverBet: 29, tripleBarrel: 14, wtsd: 26, note: 'polarised: bets little, but barrels big' };
  return STATS_FULL;
}
function getMatchup(input) {
  const base = { handsTogether: 142, blindVsStealSpots: 14, spots3bet: 33 };
  if (/ev|3bet/i.test(String(input.metric || ''))) return Object.assign(base, { yourThreeBetEv: '+2.7bb/100 over 33 spots', edgeWhenResteal: '+3.1bb/hand' });
  return Object.assign(base, { edgeWhenResteal: '+3.1bb/hand', yourThreeBetEv: '+2.7bb/100' });
}
function getKeyHands(input) {
  const tag = String(input.tag || '').toLowerCase();
  const n = Math.max(1, Math.min(4, Number(input.n) || 3));
  const sets = {
    btn_steal: [{ id: '#0912', note: 'A5s resteal from BB -> he folds' }, { id: '#1104', note: 'KTo flat vs his open -> lost the turn' }],
    river_barrel: [{ id: '#0733', note: 'triple-barrel bluff, gave up river' }, { id: '#0981', note: 'river bluff, you called and won' }, { id: '#1150', note: 'river bluff' }, { id: '#0812', note: 'river value, he had the nuts' }],
    threebet: [{ id: '#0912', note: '3-bet A5s -> fold' }, { id: '#1077', note: '3-bet KQo -> fold' }],
  };
  const pick = sets[tag] || (/(river|barrel|bluff)/.test(tag) ? sets.river_barrel : /3|three|bet/.test(tag) ? sets.threebet : sets.btn_steal);
  return pick.slice(0, n);
}

const TOOLS = [
  {
    name: 'getOpponentStats',
    description: "Fetch this opponent's HUD stats. Optional args: pos (e.g. 'BTN') or street (e.g. 'river') to scope it; omit both for the full profile. Returns percentages like steal, foldToThreeBet, cbetFlop, riverBet.",
    input_schema: { type: 'object', properties: { pos: { type: 'string' }, street: { type: 'string' } } },
    run: getOpponentStats,
  },
  {
    name: 'getMatchup',
    description: "Fetch the viewer's own head-to-head history vs this opponent (hands together, 3-bet EV, edge when restealing). Optional arg: metric.",
    input_schema: { type: 'object', properties: { metric: { type: 'string' } } },
    run: getMatchup,
  },
  {
    name: 'getKeyHands',
    description: "Fetch a few specific real hands as evidence, each with an id like #0912 and a note. Args: tag ('btn_steal' | 'river_barrel' | 'threebet') and n (1-4). ALWAYS cite the returned ids in your answer.",
    input_schema: { type: 'object', properties: { tag: { type: 'string' }, n: { type: 'integer' } } },
    run: getKeyHands,
  },
];

const SYSTEM =
  'You are "Scout", a sharp, concise poker opponent-analysis coach inside the HUDR app. ' +
  'The viewer is studying ONE opponent: Marcus "The Vulture" V., an aggressive LAG regular with 142 hands of shared history. ' +
  'Answer the viewer\'s question using ONLY numbers you fetch with the tools - never invent or guess a stat. Fetch before you answer. ' +
  'Call getKeyHands and cite the exact hand ids it returns (written like #0912) as evidence. ' +
  'Reply in at most 2 short paragraphs of plain English, direct and actionable. Use **bold** for the key numbers and for your single main recommendation.';

async function callAnthropic(key, body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((json && json.error && json.error.message) || ('HTTP ' + r.status)); e.status = r.status; throw e; }
  return json;
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) { resolve(typeof req.body === 'string' ? safeParse(req.body) : req.body); return; }
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => resolve(safeParse(d)));
    req.on('error', () => resolve(null));
  });
}
function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method === 'GET') { res.status(200).json({ configured: !!key }); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, reason: 'bad_request', message: 'POST only' }); return; }
  if (!key) { res.status(200).json({ ok: false, reason: 'no_key', message: 'ANTHROPIC_API_KEY not set on this deployment' }); return; }

  const body = await readBody(req);
  const question = body && typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';
  if (!question) { res.status(400).json({ ok: false, reason: 'bad_request', message: 'question required' }); return; }

  const apiTools = TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
  const messages = [{ role: 'user', content: question }];
  const toolCalls = [];
  let rounds = 0;

  try {
    while (rounds < MAX_ROUNDS) {
      rounds++;
      const resp = await callAnthropic(key, { model: MODEL, max_tokens: 1024, system: SYSTEM, tools: apiTools, messages });
      messages.push({ role: 'assistant', content: resp.content });

      if (resp.stop_reason === 'tool_use') {
        const results = [];
        for (const block of resp.content) {
          if (block.type !== 'tool_use') continue;
          const tool = TOOLS.find((t) => t.name === block.name);
          let output;
          try { output = tool ? tool.run(block.input || {}) : { error: 'unknown tool' }; }
          catch (e) { output = { error: String(e && e.message || e) }; }
          toolCalls.push({ name: block.name, input: block.input || {}, output });
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) });
        }
        messages.push({ role: 'user', content: results });
        continue;
      }

      const answer = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      res.status(200).json({ ok: true, answer, toolCalls, rounds });
      return;
    }
    res.status(200).json({ ok: true, answer: 'Reached the tool-call limit before finishing — try a narrower question.', toolCalls, rounds });
  } catch (e) {
    res.status(200).json({ ok: false, reason: 'api_error', message: String(e && e.message || e) });
  }
};
