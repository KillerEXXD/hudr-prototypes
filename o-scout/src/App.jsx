import React, { useEffect, useMemo, useState } from "react";

/* =============================================
   HUDR Prototype O — "The Scout"
   FotMob + DraftKings + The Athletic inspired
   Philosophy: Engaging sports app experience.
   ============================================= */

const D = () => window.HUDR_DATA || {};

function useHashRoute() {
  const parse = () => {
    const raw = (window.location.hash || "#/home").slice(2);
    const [path, qs] = raw.split("?");
    return { path: path || "home", params: new URLSearchParams(qs || "") };
  };
  const [r, setR] = useState(parse());
  useEffect(() => {
    const f = () => setR(parse());
    window.addEventListener("hashchange", f);
    if (!window.location.hash) window.location.hash = "/home";
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const go = (path, params = {}) => {
    const q = new URLSearchParams(params).toString();
    window.location.hash = `/${path}${q ? "?" + q : ""}`;
    window.scrollTo(0, 0);
  };
  return [r, go];
}

function fmtChips(n) {
  if (n == null) return "—";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}

function calcExploit(s) {
  if (!s) return 50;
  return Math.min(99, Math.round(40 + Math.max(0, s.foldToSteal - 55) * 1.5 + Math.max(0, (s.afFlop || 3) - (s.afRiver || 2)) * 8 + Math.max(0, 8 - s.checkRaiseFlop) * 3));
}

function getStatColor(v) {
  if (v >= 55) return "var(--green)";
  if (v >= 30) return "var(--gold)";
  return "var(--red)";
}

function highlightColor(type) {
  const m = { biggest_pot: "#ffd740", bluff: "#ff3d3d", elimination: "#ff3d3d", hero_call: "#00c853", cooler: "#2196f3", bad_beat: "#ffd740" };
  return m[type] || "var(--orange)";
}

// ===================== Main App =====================

export default function App() {
  const [route, go] = useHashRoute();
  const pid = route.params.get("player") || "p1";
  const d = D();
  const tournaments = d.TOURNAMENTS || [];
  const players = d.PLAYERS || [];
  const stats = d.PLAYER_STATS || {};
  const hands = d.HANDS?.filter((h) => h.tournamentId === "wsop-me-2025") || [];
  const highlights = hands.filter((h) => h.highlightType);
  const insights = d.AI_CONTENT?.insights || [];
  const scouting = d.AI_CONTENT?.playerScouting || {};
  const player = players.find((p) => p.id === pid) || players[0];
  const playerStats = stats[pid] || stats.p1;

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "search", icon: "🔍", label: "Search" },
    { id: "ai", icon: "✨", label: "AI" },
    { id: "favorites", icon: "⭐", label: "Saved" },
    { id: "pricing", icon: "👤", label: "Profile" },
  ];

  const activePath = route.path;

  const screens = {
    home: <HomeScreen go={go} tournaments={tournaments} players={players} highlights={highlights} insights={insights} />,
    search: <SearchScreen go={go} players={players} stats={stats} />,
    tournament: <TournamentScreen go={go} tournament={tournaments[0]} players={players} highlights={highlights} hands={hands} insights={insights} stats={stats} />,
    ai: <AIScreen go={go} player={player} />,
    player: <PlayerScreen go={go} player={player} stats={playerStats} scouting={scouting} />,
    report: <ExploitReport go={go} player={player} stats={playerStats} />,
    pricing: <PricingScreen go={go} />,
    favorites: <FavoritesScreen go={go} players={players} />,
  };

  return (
    <div className="app">
      <div className="top-bar">
        <div className="row">
          <div className="logo" onClick={() => go("home")}>H</div>
          <span className="top-bar-title">HUDR</span>
        </div>
        <button className="search-btn" onClick={() => go("search")}>🔍</button>
      </div>

      {screens[activePath] || <HomeScreen go={go} tournaments={tournaments} players={players} highlights={highlights} insights={insights} />}

      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-item ${activePath === t.id ? "active" : ""}`}
            onClick={() => go(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===================== Home Screen =====================

function HomeScreen({ go, tournaments, players, highlights, insights }) {
  const featured = tournaments[0];

  return (
    <div className="stagger">
      {/* Hero Card */}
      <div className="content">
        <div
          className="hero-card"
          style={{ background: featured?.imageGradient }}
          onClick={() => go("tournament")}
        >
          <div className="hero-label">{featured?.event}</div>
          <div className="hero-title">{featured?.name}</div>
          <div className="hero-sub">{featured?.venue} · {featured?.date}</div>
          <div className="kpi-row">
            <span className="kpi-pill">{featured?.playerCount} Players</span>
            <span className="kpi-pill">{featured?.handCount} Hands</span>
            <span className="kpi-pill">{fmtChips(featured?.prizePool)}</span>
            {featured?.aiFunEnabled && <span className="kpi-pill">✨ AI Ready</span>}
          </div>
        </div>
      </div>

      {/* Top Tournaments */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Tournaments</div>
          <button className="section-link" onClick={() => go("search")}>See All</button>
        </div>
        <div className="h-scroll">
          {tournaments.filter((t) => t.status !== "upcoming").map((t) => (
            <div key={t.id} className="mini-card" onClick={() => go("tournament")}>
              <div className="mini-gradient" style={{ background: t.imageGradient }} />
              <div className="mini-body">
                <div className="mini-name">{t.name}</div>
                <div className="mini-meta">{t.event} · {t.date}</div>
                <div className="mini-badges">
                  <span className="mini-badge" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>{t.handCount} hands</span>
                  {t.liveStatus === "live" && <span className="live-badge">LIVE</span>}
                  {t.aiFunEnabled && <span className="mini-badge" style={{ background: "var(--orange-dim)", color: "var(--orange)" }}>AI</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Trending AI Insights</div>
          <button className="section-link" onClick={() => go("ai")}>Ask AI</button>
        </div>
        <div className="content stagger">
          {insights.slice(0, 3).map((ins) => (
            <div
              key={ins.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                cursor: "pointer",
                marginBottom: 8,
              }}
              onClick={() => go("ai", { q: ins.title })}
            >
              <span style={{ fontSize: 24 }}>{ins.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{ins.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{ins.text}</div>
                <span className="text-orange" style={{ fontSize: 13, fontWeight: 600 }}>Read more →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Players */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Top Players</div>
          <button className="section-link" onClick={() => go("search")}>All</button>
        </div>
        <div className="h-scroll">
          {players.slice(0, 9).map((p) => (
            <div key={p.id} className="player-mini" onClick={() => go("player", { player: p.id })}>
              <div className="player-avatar avatar-md" style={{ background: p.color }}>{p.initials}</div>
              <div className="player-mini-name">{p.name.split(" ")[1]}</div>
              <div className="player-mini-stat">#{p.finishPosition}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Moments */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Key Moments</div>
        </div>
        <div className="h-scroll">
          {highlights.slice(0, 6).map((h) => (
            <div key={h.id} className="moment-card" onClick={() => go("ai", { q: `Tell me about hand #${h.handNumber}` })}>
              <div className="moment-accent" style={{ background: highlightColor(h.highlightType) }} />
              <div className="moment-body">
                <div className="moment-type" style={{ color: highlightColor(h.highlightType) }}>
                  {(h.highlightType || "").replace("_", " ")}
                </div>
                <div className="moment-text">{h.preview}</div>
                <div className="moment-meta">Hand #{h.handNumber} · {fmtChips(h.potTotal)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== Search Screen =====================

function SearchScreen({ go, players, stats }) {
  const [cat, setCat] = useState("Tournament");
  const cats = ["Tournament", "Player", "Hand", "Strategy"];
  const suggestions = {
    Tournament: ["Who is the most exploitable?", "Show the biggest turning points", "Tell me the tournament story"],
    Player: ["How should I play against Negreanu?", "Who bluffs the most?", "Compare Ivey and Hellmuth"],
    Hand: ["Show me the final hand", "Biggest bluff?", "Most dramatic elimination"],
    Strategy: ["ICM exploit checklist", "BB defense strategy", "River bluff frequencies"],
  };

  return (
    <div className="search-screen stagger">
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Ask HUDR AI</h2>
      <p className="text-muted mb-md">Ask anything about the tournament</p>

      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Ask about players, hands, strategy..."
          onKeyDown={(e) => e.key === "Enter" && e.target.value.trim() && go("ai", { q: e.target.value })}
        />
      </div>

      <div className="category-pills">
        {cats.map((c) => (
          <button key={c} className={`cat-pill ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="stack">
        {(suggestions[cat] || []).map((q) => (
          <div key={q} className="suggestion-bubble" onClick={() => go("ai", { q })}>
            {q}
          </div>
        ))}
      </div>

      {/* Players quick list */}
      <div className="mt-lg">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Players</div>
        {players.slice(0, 6).map((p) => (
          <div key={p.id} className="standing-row" onClick={() => go("player", { player: p.id })}>
            <div className={`standing-rank ${p.finishPosition === 1 ? "gold" : p.finishPosition === 2 ? "silver" : p.finishPosition === 3 ? "bronze" : ""}`}>
              {p.finishPosition}
            </div>
            <div className="player-avatar avatar-sm" style={{ background: p.color }}>{p.initials}</div>
            <div className="standing-info">
              <div className="standing-name">{p.countryFlag} {p.name}</div>
              <div className="standing-meta">{p.handsPlayed} hands · {p.status}</div>
            </div>
            <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); go("report", { player: p.id }); }}>
              Scout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Tournament Screen =====================

function TournamentScreen({ go, tournament, players, highlights, hands, insights, stats }) {
  const [tab, setTab] = useState("overview");
  if (!tournament) return null;

  return (
    <div>
      {/* Hero */}
      <div className="content">
        <div className="hero-card" style={{ background: tournament.imageGradient }}>
          <div className="hero-label">{tournament.event}</div>
          <div className="hero-title">{tournament.name}</div>
          <div className="hero-sub">{tournament.venue} · {tournament.date}</div>
          <div className="kpi-row">
            <span className="kpi-pill">{tournament.playerCount} Players</span>
            <span className="kpi-pill">{tournament.handCount} Hands</span>
            <span className="kpi-pill">{fmtChips(tournament.prizePool)}</span>
          </div>
        </div>
      </div>

      {/* Tab Strip */}
      <div className="tab-strip">
        {["overview", "players", "hands", "highlights", "ai"].map((t) => (
          <button key={t} className={`strip-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="content stagger">
          <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
            {insights[0]?.text}
            <span className="text-orange" style={{ cursor: "pointer" }} onClick={() => go("ai", { q: "Tell me the full story" })}> Read full story →</span>
          </div>

          {/* Quick AI */}
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Quick AI</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {["Who played best?", "Biggest bluff?", "Tournament story"].map((q) => (
              <button key={q} className="btn btn-ghost btn-sm" onClick={() => go("ai", { q })}>{q}</button>
            ))}
          </div>

          {/* Standings */}
          <div className="mt-lg">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Final Standings</div>
            {players.sort((a, b) => a.finishPosition - b.finishPosition).slice(0, 6).map((p) => (
              <div key={p.id} className="standing-row" onClick={() => go("player", { player: p.id })}>
                <div className={`standing-rank ${p.finishPosition === 1 ? "gold" : p.finishPosition === 2 ? "silver" : p.finishPosition === 3 ? "bronze" : ""}`}>
                  {p.finishPosition}
                </div>
                <div className="player-avatar avatar-sm" style={{ background: p.color }}>{p.initials}</div>
                <div className="standing-info">
                  <div className="standing-name">{p.countryFlag} {p.name}</div>
                  <div className="standing-meta">{fmtChips(p.startingStack)} → {p.endingStack > 0 ? fmtChips(p.endingStack) : "Out"}</div>
                </div>
                <div className="standing-result" style={{ color: p.status === "winner" ? "var(--green)" : "var(--red)" }}>
                  {p.status === "winner" ? "🏆" : `${p.finishPosition}${["st","nd","rd"][p.finishPosition-1]||"th"}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "players" && (
        <div className="content stagger">
          {players.sort((a, b) => a.finishPosition - b.finishPosition).map((p) => {
            const s = stats[p.id];
            return (
              <div key={p.id} className="standing-row" onClick={() => go("player", { player: p.id })}>
                <div className="player-avatar avatar-sm" style={{ background: p.color }}>{p.initials}</div>
                <div className="standing-info">
                  <div className="standing-name">{p.countryFlag} {p.name}</div>
                  <div className="standing-meta">VPIP {s?.vpip}% · PFR {s?.pfr}% · AF {s?.af}</div>
                </div>
                <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); go("report", { player: p.id }); }}>
                  Scout
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "hands" && (
        <div className="content stagger">
          {hands.slice(0, 15).map((h) => {
            const ps = (h.playersInvolved || []).map((id) => players.find((p) => p.id === id)?.name?.split(" ").pop() || id).join(" vs ");
            return (
              <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                onClick={() => go("ai", { q: `Tell me about hand #${h.handNumber}` })}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>#{h.handNumber}</span>
                    <span className="text-muted" style={{ marginLeft: 8 }}>{ps}</span>
                  </div>
                  <span className="fw-700 text-gold">{fmtChips(h.potTotal)}</span>
                </div>
                {h.preview && <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{h.preview}</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === "highlights" && (
        <div className="h-scroll" style={{ flexWrap: "wrap", padding: 16, gap: 12 }}>
          {highlights.map((h) => (
            <div key={h.id} className="moment-card" style={{ width: "100%", maxWidth: 400 }} onClick={() => go("ai", { q: `Tell me about hand #${h.handNumber}` })}>
              <div className="moment-accent" style={{ background: highlightColor(h.highlightType) }} />
              <div className="moment-body">
                <div className="moment-type" style={{ color: highlightColor(h.highlightType) }}>{(h.highlightType || "").replace("_", " ")}</div>
                <div className="moment-text">{h.preview}</div>
                <div className="moment-meta">Hand #{h.handNumber} · {fmtChips(h.potTotal)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ai" && (
        <div className="content">
          <div className="mt-md">
            <div className="search-input-wrap">
              <span className="search-icon">✨</span>
              <input className="search-input" placeholder="Ask anything about this tournament..." onKeyDown={(e) => e.key === "Enter" && e.target.value.trim() && go("ai", { q: e.target.value })} />
            </div>
            <div className="stack mt-md">
              {["Who is the most exploitable?", "Tell me the full story", "Compare top 3 players"].map((q) => (
                <div key={q} className="suggestion-bubble" onClick={() => go("ai", { q })}>{q}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== AI Screen =====================

function AIScreen({ go, player }) {
  const q = new URLSearchParams(window.location.hash.split("?")[1] || "").get("q") || "";
  const d = D();
  const chatResp = d.AI_CONTENT?.chatResponses || [];
  const match = chatResp.find((c) => q.toLowerCase().includes(c.query.toLowerCase().slice(0, 12)));

  if (!q) {
    return (
      <div className="search-screen stagger">
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Ask HUDR AI</h2>
        <p className="text-muted mb-md">Ask anything about the tournament, players, or strategy</p>
        <div className="search-input-wrap">
          <span className="search-icon">✨</span>
          <input className="search-input" placeholder="Ask anything..." onKeyDown={(e) => e.key === "Enter" && e.target.value.trim() && go("ai", { q: e.target.value })} />
        </div>
        <div className="stack mt-lg">
          {["Who is the most exploitable player?", "Show me the biggest bluff", "How should I play against Negreanu?", "Tell me the tournament story"].map((q) => (
            <div key={q} className="suggestion-bubble" onClick={() => go("ai", { q })}>{q}</div>
          ))}
        </div>
      </div>
    );
  }

  const answer = match?.response || `Based on analysis of ${d.TOURNAMENTS?.[0]?.handCount || 87} hands from the WSOP Main Event Final Table, **Daniel Negreanu** shows the most balanced game with a VPIP/PFR of 28/22. His river AF drops to 2.1, suggesting potential exploitation on later streets. **Phil Hellmuth**'s low 3-bet frequency (7%) creates opportunities to steal wider against him. The most dramatic moment was Hand #87 where Negreanu rivered two pair to crack Ivey's pocket kings.`;

  return (
    <div className="content stagger">
      <button className="text-orange fw-700" style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", marginBottom: 12 }} onClick={() => go("ai")}>← New Question</button>

      {/* User message */}
      <div className="chat-user">
        <div className="chat-user-bubble">{q}</div>
      </div>

      {/* AI Response */}
      <div className="chat-ai">
        <div className="chat-ai-avatar">✨</div>
        <div>
          <div className="chat-ai-bubble">
            {answer.split("**").map((part, i) =>
              i % 2 === 1 ? <strong key={i} style={{ cursor: "pointer" }} onClick={() => {
                const p = d.PLAYERS?.find((pl) => part.includes(pl.name.split(" ").pop()));
                if (p) go("player", { player: p.id });
              }}>{part}</strong> : <span key={i}>{part}</span>
            )}

            {/* Embedded hand card */}
            <div className="embed-card" onClick={() => go("ai", { q: "Tell me about the final hand" })}>
              <div className="embed-title">🃏 Hand #87 — Final Hand</div>
              <div className="embed-meta">Negreanu vs Ivey · {fmtChips(89400000)} pot</div>
            </div>

            {/* Embedded player card */}
            <div className="embed-card" onClick={() => go("player", { player: "p1" })}>
              <div className="embed-title">👤 Daniel Negreanu — HUD Stats</div>
              <div className="embed-meta">VPIP 28% · PFR 22% · AF 2.8 · 87 hands</div>
            </div>
          </div>

          {/* Follow-ups */}
          <div className="h-scroll mt-sm" style={{ padding: 0, margin: 0, gap: 8 }}>
            {["How do I exploit this?", "Show evidence hands", "Generate exploit report"].map((fq) => (
              <button key={fq} className="cat-pill" onClick={() => {
                if (fq.includes("report")) go("report", { player: player?.id || "p1" });
                else go("ai", { q: fq });
              }}>
                {fq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Share */}
      <div className="row mt-md">
        <button className="btn btn-ghost btn-sm" onClick={() => go("report", { player: player?.id || "p1" })}>📄 Exploit Report</button>
        <button className="btn btn-ghost btn-sm" onClick={() => go("player", { player: player?.id || "p1" })}>👤 Player Profile</button>
      </div>
    </div>
  );
}

// ===================== Player Screen =====================

function PlayerScreen({ go, player, stats, scouting }) {
  if (!player || !stats) return null;
  const exploit = calcExploit(stats);

  const statBubbles = [
    { label: "VPIP", value: stats.vpip, color: getStatColor(stats.vpip) },
    { label: "PFR", value: stats.pfr, color: getStatColor(stats.pfr) },
    { label: "3-Bet", value: stats.threeBet, color: getStatColor(stats.threeBet * 3) },
    { label: "AF", value: stats.af, color: "var(--orange)" },
    { label: "WTSD", value: stats.wtsd, color: getStatColor(stats.wtsd) },
    { label: "WSD", value: stats.wsd, color: getStatColor(stats.wsd) },
  ];

  const strengths = [];
  const weaknesses = [];
  if (stats.wsd > 52) strengths.push("Strong WSD");
  if (stats.steal > 40) strengths.push("Good Steal Rate");
  if (stats.cbetFlop > 65) strengths.push("High CBet");
  if (stats.foldToSteal > 58) weaknesses.push("Low BB Defense");
  if (stats.afRiver < 2.2) weaknesses.push("River Giveup");
  if (stats.checkRaiseFlop < 7) weaknesses.push("Passive Check");

  return (
    <div className="content stagger">
      <button className="text-orange fw-700" style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", marginBottom: 12 }} onClick={() => go("tournament")}>← Tournament</button>

      {/* Scouting Card */}
      <div className="scout-card">
        <div className="scout-header">
          <div className="player-avatar avatar-lg" style={{ background: player.color }}>{player.initials}</div>
          <div>
            <div className="scout-label">Scouting Report</div>
            <div className="scout-name">{player.countryFlag} {player.name}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>#{player.finishPosition} · {player.handsPlayed} hands · {player.status}</div>
          </div>
        </div>
        <div className="scout-stat-row">
          {statBubbles.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div className="stat-bubble" style={{ borderColor: s.color, color: s.color, background: `${s.color}15` }}>
                {typeof s.value === "number" && s.value > 10 ? s.value + "%" : s.value}
              </div>
              <div className="stat-bubble-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Style Badge */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>{stats.vpip > 30 ? "🔥" : stats.pfr > 18 ? "🎯" : "🧊"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{stats.vpip > 30 ? "LAG" : stats.pfr > 18 ? "TAG" : "Nit"}</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {stats.vpip > 30 ? "Loose-Aggressive — wide ranges, high aggression" : stats.pfr > 18 ? "Tight-Aggressive — selective but assertive" : "Very tight — folds most hands, plays premium only"}
          </div>
        </div>
      </div>

      {/* Strengths / Weaknesses Badges */}
      {strengths.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--green)" }}>Strengths</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {strengths.map((s) => (
              <span key={s} style={{ padding: "5px 12px", borderRadius: "var(--radius-full)", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--red)" }}>Weaknesses</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {weaknesses.map((w) => (
              <span key={w} style={{ padding: "5px 12px", borderRadius: "var(--radius-full)", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, fontWeight: 600 }}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Scouting Text */}
      {scouting[player.id] && (
        <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
          {scouting[player.id]}
        </div>
      )}

      {/* Ask AI + Exploit Report */}
      <div className="search-input-wrap mt-md">
        <span className="search-icon">✨</span>
        <input className="search-input" placeholder={`Ask about ${player.name}...`} onKeyDown={(e) => e.key === "Enter" && e.target.value.trim() && go("ai", { q: e.target.value, player: player.id })} />
      </div>

      <button className="btn btn-orange full mt-sm" onClick={() => go("report", { player: player.id })}>
        Generate Exploit Report →
      </button>
    </div>
  );
}

// ===================== Exploit Report =====================

function ExploitReport({ go, player, stats }) {
  if (!player || !stats) return null;
  const exploit = calcExploit(stats);
  const ringOffset = 251 - (251 * exploit) / 100;
  const ringColor = exploit >= 70 ? "var(--green)" : exploit >= 45 ? "var(--gold)" : "var(--red)";

  const leaks = [
    { name: "Overfolds BB Defense", severity: "high", pVal: stats.foldToSteal + "%", pop: "52%", desc: `Folds ${stats.foldToSteal}% to steals. Steal wider from late position.` },
    { name: "River Aggression Drop", severity: "medium", pVal: (stats.afRiver || 2.1).toFixed(1), pop: "2.5", desc: `AF drops from ${stats.afFlop || 3.2} (flop) to ${stats.afRiver || 2.1} (river). Value bet thinner on rivers.` },
    { name: "Low Check-Raise Frequency", severity: stats.checkRaiseFlop < 5 ? "high" : "medium", pVal: stats.checkRaiseFlop + "%", pop: "8%", desc: `Only ${stats.checkRaiseFlop}% check-raise means safe to barrel on most textures.` },
    { name: "C-Bet Continuation Decline", severity: "low", pVal: `${stats.cbetFlop}%→${stats.cbetRiver}%`, pop: "65%→35%", desc: "Float flop bets profitably knowing they abandon many turns." },
  ];

  return (
    <div className="content stagger">
      <button className="text-orange fw-700" style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", marginBottom: 12 }} onClick={() => go("player", { player: player.id })}>← {player.name}</button>

      {/* Report Header */}
      <div className="scout-card" style={{ textAlign: "center" }}>
        <div className="scout-label">Exploit Report</div>
        <div className="scout-name">{player.countryFlag} {player.name}</div>

        {/* Grade Ring */}
        <div className="grade-ring-wrap mt-md" style={{ margin: "16px auto", width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={ringColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray="251"
              strokeDashoffset={ringOffset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", animation: "fillRing 1.2s ease-out forwards" }}
            />
          </svg>
          <div className="grade-ring-value" style={{ color: ringColor }}>{exploit}</div>
        </div>

        <div className="text-muted" style={{ fontSize: 12 }}>
          Based on {stats.totalHands} hands · High confidence
        </div>
      </div>

      {/* Leak Cards */}
      {leaks.slice(0, 2).map((l, i) => (
        <div key={i} className="leak-card">
          <div className={`leak-severity-bar ${l.severity}`}>{l.severity} priority</div>
          <div className="leak-body">
            <div className="leak-title">{l.name}</div>
            <div className="leak-compare">
              <div className="leak-val-group">
                <span className="leak-val-label">Their Value</span>
                <span className="leak-val text-red">{l.pVal}</span>
              </div>
              <div className="leak-val-group">
                <span className="leak-val-label">Population</span>
                <span className="leak-val text-muted">{l.pop}</span>
              </div>
            </div>
            <div className="leak-desc">{l.desc}</div>
            <button className="btn btn-ghost btn-sm mt-sm" onClick={() => go("ai", { q: `Evidence for ${l.name} leak` })}>
              View Evidence →
            </button>
          </div>
        </div>
      ))}

      {/* Paywall */}
      <div className="paywall">
        <div className="paywall-blur">
          {leaks.slice(2).map((l, i) => (
            <div key={i} className="leak-card">
              <div className={`leak-severity-bar ${l.severity}`}>{l.severity} priority</div>
              <div className="leak-body">
                <div className="leak-title">{l.name}</div>
                <div className="leak-desc">{l.desc}</div>
              </div>
            </div>
          ))}
          <div className="checklist">
            <div className="checklist-title">Opponent Prep Checklist</div>
            {["Steal wider from BTN/CO", "Float flop bets more liberally", "Value bet rivers thinner", "Tighten call range vs their 3-bets"].map((item, i) => (
              <div key={i} className="check-item">
                <div className="check-box" />
                <span className="check-num">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="paywall-cta">
          <div className="paywall-text">Unlock Full Scout Report</div>
          <button className="btn btn-orange" onClick={() => go("pricing")}>Go Shark — $10/mo</button>
          <button className="text-orange fw-700" style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer" }} onClick={() => go("pricing")}>See all features →</button>
        </div>
      </div>
    </div>
  );
}

// ===================== Favorites =====================

function FavoritesScreen({ go, players }) {
  return (
    <div className="content stagger">
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "16px 0 8px" }}>Saved</h2>
      <p className="text-muted mb-md">Your saved players and tournaments</p>
      {players.slice(0, 3).map((p) => (
        <div key={p.id} className="standing-row" onClick={() => go("player", { player: p.id })}>
          <div className="player-avatar avatar-sm" style={{ background: p.color }}>{p.initials}</div>
          <div className="standing-info">
            <div className="standing-name">{p.name}</div>
            <div className="standing-meta">Saved from WSOP Main Event</div>
          </div>
          <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); go("report", { player: p.id }); }}>
            Scout
          </button>
        </div>
      ))}
    </div>
  );
}

// ===================== Pricing Screen =====================

function PricingScreen({ go }) {
  return (
    <div className="stagger">
      <div className="pricing-hero">
        <div className="pricing-title">Level Up Your Game</div>
        <p className="text-muted">Unlock the full HUDR intelligence platform</p>
      </div>
      <div className="plan-grid">
        <div className="plan-card">
          <div className="plan-icon">🏈</div>
          <div className="plan-name">Rookie</div>
          <div className="plan-price">$0</div>
          <ul className="plan-features">
            <li>3 AI queries per day</li>
            <li>Tournament overviews</li>
            <li>Basic player stats</li>
            <li>Key moments</li>
          </ul>
          <button className="btn btn-ghost full mt-md" style={{ opacity: 0.6 }}>Current Plan</button>
        </div>
        <div className="plan-card featured">
          <div className="plan-icon">🦈</div>
          <div className="plan-name text-orange">Shark</div>
          <div className="plan-price">$10<span>/mo</span></div>
          <ul className="plan-features">
            <li>Unlimited AI Queries</li>
            <li>Full Exploit Reports</li>
            <li>Evidence-backed Insights</li>
            <li>Player Scouting Cards</li>
            <li>Export & Share</li>
            <li>Priority Updates</li>
          </ul>
          <button className="btn btn-orange full mt-md">Go Shark — $10/mo</button>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div className="text-muted" style={{ fontSize: 13 }}>Join 1,200+ players using HUDR Pro</div>
      </div>
    </div>
  );
}
