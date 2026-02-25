import React, { useEffect, useMemo, useState } from "react";

/* =============================================
   HUDR Prototype M — "The Insight Engine"
   Perplexity AI + StatMuse inspired
   Philosophy: Answer-first. The AI IS the product.
   ============================================= */

const D = () => window.HUDR_DATA || {};

function useHashRoute() {
  const parse = () => {
    const raw = (window.location.hash || "#/search").slice(2);
    const [path, qs] = raw.split("?");
    return { path: path || "search", params: new URLSearchParams(qs || "") };
  };
  const [r, setR] = useState(parse());
  useEffect(() => {
    const f = () => setR(parse());
    window.addEventListener("hashchange", f);
    if (!window.location.hash) window.location.hash = "/search";
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const go = (path, params = {}) => {
    const q = new URLSearchParams(params).toString();
    window.location.hash = `/${path}${q ? "?" + q : ""}`;
  };
  return [r, go];
}

// ===================== Helpers =====================

function getStatColor(value, stat) {
  const d = D();
  if (d.getStatColor) return d.getStatColor(value, stat);
  if (value > 60) return "#34d399";
  if (value > 35) return "#fbbf24";
  return "#f87171";
}

function fmtChips(n) {
  const d = D();
  if (d.formatChips) return d.formatChips(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

function fmtCard(c) {
  if (!c) return "";
  const suits = { s: "♠", h: "♥", d: "♦", c: "♣" };
  const rank = c.slice(0, -1);
  const suit = c.slice(-1);
  return rank + (suits[suit] || suit);
}

function isRed(c) { return c && (c.endsWith("h") || c.endsWith("d")); }

// ===================== Shared Components =====================

const SearchBar = ({ placeholder, onSubmit, className = "" }) => {
  const [v, setV] = useState("");
  return (
    <div className={`search-wrap ${className}`}>
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        placeholder={placeholder || "Ask about any player, hand, or strategy..."}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && v.trim() && onSubmit?.(v.trim())}
      />
    </div>
  );
};

const Chips = ({ items, onSelect }) => (
  <div className="chips">
    {items.map((q, i) => (
      <button key={i} className="chip" onClick={() => onSelect?.(q)}>
        {q}
      </button>
    ))}
  </div>
);

const Cite = ({ n, onClick }) => (
  <span className="citation-ref" onClick={onClick} title={`Source ${n}`}>
    {n}
  </span>
);

const ConfBadge = ({ level }) => (
  <span className={`confidence ${(level || "medium").toLowerCase()}`}>
    {level || "Medium"} confidence
  </span>
);

const StatCard = ({ label, value, color, pct }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color: color || "var(--text)" }}>
      {value}
    </div>
    {pct != null && (
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: color || "var(--accent)" }}
        />
      </div>
    )}
  </div>
);

// ===================== Main App =====================

export default function App() {
  const [route, go] = useHashRoute();
  const pid = route.params.get("player") || "p1";
  const qid = route.params.get("q") || "";

  const data = D();
  const tournament = data.TOURNAMENTS?.[0];
  const player = data.PLAYERS?.find((p) => p.id === pid) || data.PLAYERS?.[0];
  const stats = data.PLAYER_STATS?.[pid] || data.PLAYER_STATS?.p1;
  const hands = data.HANDS?.filter((h) => h.tournamentId === "wsop-me-2025") || [];
  const highlights = hands.filter((h) => h.highlightType);
  const insights = data.AI_CONTENT?.insights || [];
  const scouting = data.AI_CONTENT?.playerScouting || {};
  const chatResponses = data.AI_CONTENT?.chatResponses || [];

  const screens = {
    search: <SearchHome go={go} tournament={tournament} />,
    tournament: <TournamentOverview go={go} tournament={tournament} insights={insights} highlights={highlights} />,
    answer: <AIResponse go={go} player={player} qid={qid} chatResponses={chatResponses} hands={hands} />,
    player: <PlayerProfile go={go} player={player} stats={stats} scouting={scouting} />,
    report: <ExploitReport go={go} player={player} stats={stats} scouting={scouting} />,
    pricing: <Pricing go={go} />,
    players: <PlayersGrid go={go} players={data.PLAYERS} playerStats={data.PLAYER_STATS} />,
  };

  const body = screens[route.path] || <SearchHome go={go} tournament={tournament} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-row">
          <div className="logo" onClick={() => go("search")} style={{ cursor: "pointer" }}>
            H
          </div>
          <span className="brand-text">HUDR</span>
        </div>
        <div className="topbar-search">
          <SearchBar
            placeholder="Ask anything..."
            className=""
            onSubmit={(q) => go("answer", { q, player: pid })}
          />
        </div>
        <div className="topbar-actions">
          <button className="btn-ghost btn btn-sm" onClick={() => go("tournament")}>
            Tournament
          </button>
          <button className="btn-primary btn btn-sm" onClick={() => go("answer", { q: "Who is the most exploitable?" })}>
            Ask AI
          </button>
        </div>
      </header>
      <div className="main">{body}</div>
    </div>
  );
}

// ===================== Screen: Search/Home =====================

function SearchHome({ go, tournament }) {
  const suggestions = [
    "Who is the most exploitable player?",
    "Show me the biggest turning points",
    "Tell me the tournament story",
    "How should I play against Negreanu?",
    "Compare Ivey and Hellmuth",
    "Who bluffs the most?",
  ];
  const tournaments = D().TOURNAMENTS || [];

  return (
    <div className="center" style={{ paddingTop: "12vh" }}>
      <div className="logo" style={{ width: 48, height: 48, fontSize: 22, marginBottom: 24 }}>
        H
      </div>
      <h1 className="heading-lg fade-in" style={{ maxWidth: 520 }}>
        What do you want to know about this tournament?
      </h1>
      <p className="text-muted fade-in-d1" style={{ marginBottom: 24, fontSize: 15 }}>
        Ask about any player, hand, or strategy. Get AI-powered answers with evidence.
      </p>
      <div className="fade-in-d2" style={{ width: "100%", maxWidth: 640 }}>
        <SearchBar
          placeholder="Ask about any player, hand, or strategy..."
          onSubmit={(q) => go("answer", { q })}
        />
      </div>
      <div className="fade-in-d3 mt-lg" style={{ maxWidth: 640 }}>
        <Chips items={suggestions} onSelect={(q) => go("answer", { q })} />
      </div>
      <div className="fade-in-d4 mt-lg">
        <div className="section-label">Available Tournaments</div>
        <div className="tournament-pills">
          {tournaments.filter((t) => t.status !== "upcoming").map((t) => (
            <button
              key={t.id}
              className={`t-pill ${t.id === "wsop-me-2025" ? "active" : ""}`}
              onClick={() => go("tournament")}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="powered">Powered by HUDR AI</div>
    </div>
  );
}

// ===================== Screen: Tournament Overview =====================

function TournamentOverview({ go, tournament, insights, highlights }) {
  if (!tournament) return null;
  const d = D();

  return (
    <div className="stack-lg fade-in">
      <button className="link" onClick={() => go("search")}>
        ← Back to search
      </button>

      <div className="tournament-hero" style={{ background: tournament.imageGradient }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{tournament.event}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{tournament.name}</h2>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
          {tournament.venue} · {tournament.date}
        </div>
        <div className="kpi-row">
          <div className="kpi"><div className="kpi-label">Players</div><div className="kpi-value">{tournament.playerCount}</div></div>
          <div className="kpi"><div className="kpi-label">Hands</div><div className="kpi-value">{tournament.handCount}</div></div>
          <div className="kpi"><div className="kpi-label">Prize Pool</div><div className="kpi-value">{d.formatChips ? d.formatChips(tournament.prizePool) : "$93.5M"}</div></div>
          <div className="kpi"><div className="kpi-label">Buy-in</div><div className="kpi-value">${tournament.buyIn?.toLocaleString()}</div></div>
        </div>
      </div>

      <div>
        <div className="section-label">Quick Insights</div>
        <div className="stack">
          {insights.slice(0, 4).map((ins) => (
            <div
              key={ins.id}
              className="insight-card"
              onClick={() => go("answer", { q: ins.title })}
            >
              <span className="insight-icon">{ins.icon}</span>
              <div>
                <div className="insight-title">{ins.title}</div>
                <div className="insight-text">{ins.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="between">
          <div className="section-label">Key Moments</div>
          <button className="link" onClick={() => go("answer", { q: "Show me all key moments" })}>
            Ask AI about moments →
          </button>
        </div>
        <div className="card">
          {highlights.slice(0, 6).map((h) => (
            <div
              key={h.id}
              className="moment-row"
              onClick={() => go("answer", { q: `Tell me about hand #${h.handNumber}` })}
            >
              <span className="hand-badge">#{h.handNumber}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{h.preview}</div>
              </div>
              <span className={`highlight-pill ${h.highlightType}`}>
                {h.highlightLabel || h.highlightType}
              </span>
              <span className="pot-value">{fmtChips(h.potTotal)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="section-label">Ask about this tournament</div>
        <SearchBar
          placeholder="What do you want to know?"
          onSubmit={(q) => go("answer", { q })}
        />
        <div className="mt-sm">
          <Chips
            items={["What were the ICM mistakes?", "Who got eliminated first?", "Show me all the bluffs"]}
            onSelect={(q) => go("answer", { q })}
          />
        </div>
      </div>

      <div className="between mt-md">
        <button className="btn btn-ghost" onClick={() => go("players")}>
          Browse All Players →
        </button>
        <button className="btn btn-primary" onClick={() => go("answer", { q: "Who is the most exploitable player?" })}>
          Ask AI
        </button>
      </div>
    </div>
  );
}

// ===================== Screen: Players Grid =====================

function PlayersGrid({ go, players, playerStats }) {
  if (!players) return null;
  return (
    <div className="stack-lg fade-in">
      <button className="link" onClick={() => go("tournament")}>← Back to tournament</button>
      <h2 className="heading-md">Players — WSOP Main Event Final Table</h2>
      <div className="stack">
        {players.map((p) => {
          const s = playerStats?.[p.id];
          return (
            <div key={p.id} className="card" style={{ cursor: "pointer" }} onClick={() => go("player", { player: p.id })}>
              <div className="row">
                <div className="avatar" style={{ background: p.color, width: 44, height: 44, fontSize: 16 }}>
                  {p.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {p.countryFlag} {p.name}
                    <span className="text-muted" style={{ fontWeight: 500, marginLeft: 8 }}>
                      #{p.finishPosition}
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {p.handsPlayed} hands · {p.status === "winner" ? "Winner" : `Eliminated ${p.finishPosition}${["st","nd","rd"][p.finishPosition-1]||"th"}`}
                  </div>
                </div>
                {s && (
                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ textAlign: "center" }}><div className="stat-label">VPIP</div><div className="text-mono" style={{ fontWeight: 700 }}>{s.vpip}%</div></div>
                    <div style={{ textAlign: "center" }}><div className="stat-label">PFR</div><div className="text-mono" style={{ fontWeight: 700 }}>{s.pfr}%</div></div>
                    <div style={{ textAlign: "center" }}><div className="stat-label">AF</div><div className="text-mono" style={{ fontWeight: 700 }}>{s.af}</div></div>
                  </div>
                )}
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); go("report", { player: p.id }); }}>
                  Exploit Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== Screen: AI Response =====================

function AIResponse({ go, player, qid, chatResponses, hands }) {
  const query = qid || "Who is the most exploitable player?";
  const d = D();
  const players = d.PLAYERS || [];
  const stats = d.PLAYER_STATS || {};

  // Find a matching chat response or generate one
  const match = chatResponses.find((c) =>
    query.toLowerCase().includes(c.query.toLowerCase().slice(0, 15))
  );

  // Build a rich AI response
  const answerText = match
    ? match.response
    : `Based on analysis of ${d.TOURNAMENTS?.[0]?.handCount || 87} hands from the WSOP Main Event Final Table, the most exploitable player is **Daniel Negreanu** with a VPIP/PFR gap suggesting speculative calling tendencies. His river aggression factor drops significantly (2.1 vs 3.2 on the flop), indicating he may be giving up value on later streets. Phil Hellmuth's tight 3-bet frequency (7%) also presents opportunities to steal wider against him in late position. The evidence from Hand #87 (final hand) and Hand #82 (Hellmuth elimination) shows clear pattern tendencies that can be exploited with proper preparation.`;

  // Build source references
  const sources = [
    { type: "🃏", title: `Hand #87 — Final Hand`, preview: "Negreanu rivers two pair vs Ivey's pocket kings", id: "h1" },
    { type: "👤", title: `${player?.name || "Negreanu"} — HUD Stats`, preview: `VPIP ${stats[player?.id || "p1"]?.vpip || 28}% · PFR ${stats[player?.id || "p1"]?.pfr || 22}% · AF ${stats[player?.id || "p1"]?.af || 2.8}`, id: player?.id || "p1" },
    { type: "📊", title: "Tournament Insights", preview: "Aggression patterns and ICM tendencies", id: "insights" },
  ];

  const followUps = [
    "How do I exploit this?",
    "Show me the evidence hands",
    "Compare to population baseline",
    "Generate exploit report",
  ];

  return (
    <div className="stack-lg fade-in">
      <button className="link" onClick={() => go("tournament")}>← Back to tournament</button>

      <div className="query-echo">
        <div className="query-avatar">👤</div>
        <div className="query-text">{query}</div>
      </div>

      <div className="ai-prose fade-in-d1">
        {renderAIText(answerText, go, player)}
      </div>

      <div className="fade-in-d2">
        <div className="section-label">Sources</div>
        <div className="sources-grid">
          {sources.map((s, i) => (
            <div
              key={i}
              className="source-card"
              onClick={() => {
                if (s.id.startsWith("h")) go("answer", { q: `Tell me about hand #87` });
                else if (s.id === "insights") go("tournament");
                else go("player", { player: s.id });
              }}
            >
              <div className="source-type">{s.type}</div>
              <div className="source-title">{s.title}</div>
              <div className="source-preview">{s.preview}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="fade-in-d3">
        <div className="section-label">Follow-up questions</div>
        <Chips
          items={followUps}
          onSelect={(q) => {
            if (q.includes("exploit report")) go("report", { player: player?.id || "p1" });
            else go("answer", { q, player: player?.id || "p1" });
          }}
        />
      </div>

      <div className="fade-in-d4 actions-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => go("report", { player: player?.id || "p1" })}>
          📄 Generate Exploit Report
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => go("player", { player: player?.id || "p1" })}>
          👤 View Player Profile
        </button>
        <button className="btn btn-ghost btn-sm">💾 Save to Notes</button>
      </div>

      <div className="between" style={{ padding: "8px 0" }}>
        <ConfBadge level="High" />
        <span className="text-muted" style={{ fontSize: 12 }}>
          87 hands analyzed · Last updated 3 days ago
        </span>
      </div>
    </div>
  );
}

function renderAIText(text, go, player) {
  // Split into sentences and inject citations
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let citeNum = 0;

  return (
    <p>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const name = part.slice(2, -2);
          const isPlayer = name.includes("Negreanu") || name.includes("Hellmuth") || name.includes("Ivey");
          if (isPlayer) {
            return (
              <span key={i}>
                <strong
                  className="player-link"
                  onClick={() => {
                    const d = D();
                    const p = d.PLAYERS?.find((pl) => name.includes(pl.name.split(" ").pop()));
                    go("player", { player: p?.id || "p1" });
                  }}
                >
                  {name}
                </strong>
                <Cite n={++citeNum} onClick={() => go("player", { player: player?.id || "p1" })} />
              </span>
            );
          }
          return <strong key={i}>{name}</strong>;
        }
        // Add citations near the end of long segments
        if (part.length > 100 && i === parts.length - 1) {
          return (
            <span key={i}>
              {part}
              <Cite n={++citeNum} onClick={() => go("tournament")} />
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ===================== Screen: Player Profile =====================

function PlayerProfile({ go, player, stats, scouting }) {
  if (!player || !stats) return null;

  const statGroups = [
    { label: "VPIP", value: `${stats.vpip}%`, pct: stats.vpip, color: getStatColor(stats.vpip, "vpip") },
    { label: "PFR", value: `${stats.pfr}%`, pct: stats.pfr, color: getStatColor(stats.pfr, "pfr") },
    { label: "3-Bet", value: `${stats.threeBet}%`, pct: stats.threeBet * 3, color: getStatColor(stats.threeBet * 3, "3bet") },
    { label: "4-Bet", value: `${stats.fourBet}%`, pct: stats.fourBet * 5 },
    { label: "Steal", value: `${stats.steal}%`, pct: stats.steal },
    { label: "Fold to Steal", value: `${stats.foldToSteal}%`, pct: stats.foldToSteal },
    { label: "BB Defense", value: `${stats.bbDefense}%`, pct: stats.bbDefense },
    { label: "CBet Flop", value: `${stats.cbetFlop}%`, pct: stats.cbetFlop },
    { label: "CBet Turn", value: `${stats.cbetTurn}%`, pct: stats.cbetTurn },
    { label: "CBet River", value: `${stats.cbetRiver}%`, pct: stats.cbetRiver },
    { label: "Check-Raise", value: `${stats.checkRaiseFlop}%`, pct: stats.checkRaiseFlop * 3 },
    { label: "AF", value: stats.af.toFixed(1), pct: stats.af * 15, color: "var(--accent-light)" },
    { label: "WTSD", value: `${stats.wtsd}%`, pct: stats.wtsd },
    { label: "WSD", value: `${stats.wsd}%`, pct: stats.wsd },
    { label: "WWSF", value: `${stats.wwsf}%`, pct: stats.wwsf },
    { label: "W/O SD", value: `${stats.wonWithoutShowdown}%`, pct: stats.wonWithoutShowdown },
  ];

  return (
    <div className="stack-lg fade-in">
      <button className="link" onClick={() => go("players")}>← All players</button>

      <div className="player-header">
        <div className="avatar" style={{ background: player.color }}>{player.initials}</div>
        <div>
          <div className="player-name">{player.countryFlag} {player.name}</div>
          <div className="player-meta">
            <span className="meta-pill">#{player.finishPosition} — {player.status === "winner" ? "Winner" : "Eliminated"}</span>
            <span className="meta-pill">{player.handsPlayed} hands</span>
            <span className="meta-pill">Stack: {fmtChips(player.startingStack)} → {fmtChips(player.endingStack)}</span>
          </div>
        </div>
      </div>

      {scouting[player.id] && (
        <div>
          <div className="section-label">AI Scouting Report</div>
          <div className="ai-prose">
            <p>
              {scouting[player.id]}
              <Cite n={1} onClick={() => go("report", { player: player.id })} />
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="section-label">HUD Statistics</div>
        <div className="stats-grid">
          {statGroups.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} pct={s.pct} />
          ))}
        </div>
      </div>

      <div>
        <div className="section-label">Ask about this player</div>
        <SearchBar
          placeholder={`Ask about ${player.name}...`}
          onSubmit={(q) => go("answer", { q, player: player.id })}
        />
        <div className="mt-sm">
          <Chips
            items={[`Top leaks for ${player.name.split(" ")[1]}?`, "How to exploit?", "Compare to population"]}
            onSelect={(q) => go("answer", { q, player: player.id })}
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => go("report", { player: player.id })}>
        Generate Full Exploit Report →
      </button>
    </div>
  );
}

// ===================== Screen: Exploit Report =====================

function ExploitReport({ go, player, stats, scouting }) {
  if (!player || !stats) return null;

  // Generate exploit data from stats
  const leaks = [
    {
      name: "Overfolds in BB Defense",
      playerVal: `${stats.foldToSteal}%`,
      popVal: "52%",
      delta: stats.foldToSteal - 52,
      confidence: "High",
      evidence: `Observed ${stats.foldToSteal}% fold to steal vs 52% population baseline across ${stats.totalHands} hands. This creates a clear steal-wider opportunity from late position.`,
      hands: ["h1", "h5"],
    },
    {
      name: "River Aggression Drop",
      playerVal: stats.afRiver?.toFixed(1) || "2.1",
      popVal: "2.8",
      delta: -0.7,
      confidence: "Medium",
      evidence: `River AF of ${stats.afRiver || 2.1} vs ${stats.afFlop || 3.2} on the flop represents a significant aggression decline. They may be giving up value on river bets and checks back exploitable spots.`,
      hands: ["h8", "h13"],
    },
    {
      name: "Low Check-Raise Frequency",
      playerVal: `${stats.checkRaiseFlop}%`,
      popVal: "8%",
      delta: stats.checkRaiseFlop - 8,
      confidence: stats.totalHands > 50 ? "Medium" : "Low",
      evidence: `Check-raise frequency of ${stats.checkRaiseFlop}% allows aggressive players to barrel freely on most board textures without fear of raises.`,
      hands: ["h3"],
    },
    {
      name: "C-Bet Frequency Decline",
      playerVal: `${stats.cbetFlop}% → ${stats.cbetTurn}% → ${stats.cbetRiver}%`,
      popVal: "65% → 50% → 35%",
      delta: null,
      confidence: "Medium",
      evidence: `C-bet frequency drops from ${stats.cbetFlop}% on flop to ${stats.cbetRiver}% on river. This pattern allows floating the flop profitably, knowing they abandon many turns.`,
      hands: ["h4"],
    },
  ];

  return (
    <div className="stack-lg fade-in">
      <button className="link" onClick={() => go("player", { player: player.id })}>
        ← Back to {player.name}
      </button>

      <div className="between">
        <div>
          <h2 className="heading-md">{player.name} — Exploit Report</h2>
          <div className="row" style={{ gap: 12 }}>
            <ConfBadge level={leaks[0].confidence} />
            <span className="text-muted" style={{ fontSize: 12 }}>
              Generated from {stats.totalHands} hands · Last updated 3 days ago
            </span>
          </div>
        </div>
        <div className="actions-bar">
          <button className="btn btn-ghost btn-sm">📄 Export PDF</button>
          <button className="btn btn-ghost btn-sm">🔗 Share</button>
        </div>
      </div>

      <div className="card card-accent">
        <div className="section-label">Executive Summary</div>
        <div className="ai-prose">
          <p>
            <strong>{player.name}</strong> shows actionable edges in blind defense and river play
            <Cite n={1} onClick={() => {}} />.
            {" "}Their tendency to overfold in BB spots ({stats.foldToSteal}% vs 52% population)
            creates a clear steal-wider opportunity
            <Cite n={2} onClick={() => {}} />.
            {" "}Combined with a significant aggression drop on the river (AF {stats.afRiver || 2.1} vs {stats.afFlop || 3.2} on flop),
            this player gives up value on later streets and can be pressured into folding marginal holdings
            <Cite n={3} onClick={() => {}} />.
          </p>
        </div>
      </div>

      {leaks.slice(0, 2).map((leak, i) => (
        <div key={i} className="card">
          <div className="between mb-md">
            <div className="ev-title" style={{ fontSize: 16 }}>{leak.name}</div>
            <ConfBadge level={leak.confidence} />
          </div>
          <div className="ai-prose">
            <p>
              {leak.evidence}
              <Cite n={i + 1} onClick={() => go("answer", { q: `Tell me about ${leak.name}`, player: player.id })} />
            </p>
          </div>
          <div className="row mt-md" style={{ gap: 24 }}>
            <div>
              <div className="stat-label">Player</div>
              <div className="text-mono" style={{ fontWeight: 700, fontSize: 18, color: "var(--red)" }}>
                {leak.playerVal}
              </div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 20 }}>vs</div>
            <div>
              <div className="stat-label">Population</div>
              <div className="text-mono" style={{ fontWeight: 700, fontSize: 18, color: "var(--muted)" }}>
                {leak.popVal}
              </div>
            </div>
          </div>
          <div className="mt-md">
            <div className="section-label">Evidence Hands</div>
            <div className="row" style={{ gap: 8 }}>
              {leak.hands.map((hid) => (
                <button
                  key={hid}
                  className="chip"
                  onClick={() => go("answer", { q: `Explain hand ${hid}`, player: player.id })}
                >
                  🃏 Hand {hid.replace("h", "#")}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Paywall after first 2 leaks */}
      <div className="paywall">
        <div className="paywall-content">
          {leaks.slice(2).map((leak, i) => (
            <div key={i} className="card" style={{ marginBottom: 16 }}>
              <div className="ev-title" style={{ fontSize: 16 }}>{leak.name}</div>
              <div className="ai-prose"><p>{leak.evidence}</p></div>
            </div>
          ))}
          <div className="card">
            <div className="section-label">Actionable Exploit Plan</div>
            <div className="ai-prose">
              <p><strong>Preflop:</strong> Steal wider from late position. Their 62% fold-to-steal creates immediate profit.</p>
              <p><strong>Postflop:</strong> Float flop bets more often. Their c-bet continuation rate drops sharply on turns.</p>
              <p><strong>River:</strong> Value bet thinner. Their low river AF means they check back marginal holdings.</p>
            </div>
          </div>
        </div>
        <div className="paywall-overlay">
          <div className="paywall-text">Unlock full exploit report with HUDR Pro</div>
          <button className="btn btn-primary" onClick={() => go("pricing")}>
            Upgrade to HUDR Pro — $10/mo
          </button>
          <button className="link" onClick={() => go("pricing")}>
            See all Pro features →
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== Screen: Pricing =====================

function Pricing({ go }) {
  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="center mt-lg mb-md">
        <h2 className="heading-lg">Unlock the full intelligence engine</h2>
        <p className="text-muted" style={{ fontSize: 15, maxWidth: 440 }}>
          Get AI-powered answers with evidence chains, full exploit reports, and unlimited queries
        </p>
      </div>

      <div className="pricing-grid mt-lg">
        <div className="price-card">
          <div className="plan-name">Free</div>
          <div className="plan-price">$0</div>
          <ul className="plan-features">
            <li>3 AI queries per day</li>
            <li>Tournament overviews</li>
            <li>Basic player stats</li>
            <li>Key moments</li>
          </ul>
        </div>
        <div className="price-card featured">
          <div className="plan-name text-accent">HUDR Pro</div>
          <div className="plan-price">
            $10<span>/mo</span>
          </div>
          <ul className="plan-features">
            <li>Unlimited AI queries</li>
            <li>Full exploit reports with evidence</li>
            <li>Player scouting reports</li>
            <li>Evidence chain deep-dives</li>
            <li>Export reports to PDF</li>
            <li>Priority support</li>
          </ul>
          <button className="btn btn-primary full mt-lg">Start HUDR Pro</button>
        </div>
      </div>

      <div className="center mt-lg">
        <button className="link" onClick={() => go("search")}>
          Try 3 free queries first →
        </button>
      </div>
    </div>
  );
}
