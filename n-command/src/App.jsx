import React, { useEffect, useMemo, useState } from "react";

/* =============================================
   HUDR Prototype N — "The Command Center"
   Bloomberg Terminal + PFF + Tableau inspired
   Philosophy: Maximum intelligence density.
   ============================================= */

const D = () => window.HUDR_DATA || {};

function useHashRoute() {
  const parse = () => {
    const raw = (window.location.hash || "#/dashboard").slice(2);
    const [path, qs] = raw.split("?");
    return { path: path || "dashboard", params: new URLSearchParams(qs || "") };
  };
  const [r, setR] = useState(parse());
  useEffect(() => {
    const f = () => setR(parse());
    window.addEventListener("hashchange", f);
    if (!window.location.hash) window.location.hash = "/dashboard";
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const go = (path, params = {}) => {
    const q = new URLSearchParams(params).toString();
    window.location.hash = `/${path}${q ? "?" + q : ""}`;
  };
  return [r, go];
}

function fmtChips(n) {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

function gradeClass(v) {
  if (v >= 70) return "grade-high";
  if (v >= 45) return "grade-mid";
  return "grade-low";
}

function calcExploit(s) {
  if (!s) return 50;
  const foldPenalty = Math.max(0, s.foldToSteal - 55) * 1.5;
  const afDrop = Math.max(0, (s.afFlop || 3) - (s.afRiver || 2)) * 8;
  const crLow = Math.max(0, 8 - s.checkRaiseFlop) * 3;
  return Math.min(99, Math.round(40 + foldPenalty + afDrop + crLow));
}

function severityStars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

// ===================== Main App =====================

export default function App() {
  const [route, go] = useHashRoute();
  const [selected, setSelected] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const pid = route.params.get("player") || "p1";
  const d = D();
  const tournament = d.TOURNAMENTS?.[0];
  const players = d.PLAYERS || [];
  const stats = d.PLAYER_STATS || {};
  const hands = d.HANDS?.filter((h) => h.tournamentId === "wsop-me-2025") || [];
  const highlights = hands.filter((h) => h.highlightType);
  const insights = d.AI_CONTENT?.insights || [];
  const player = players.find((p) => p.id === pid) || players[0];
  const playerStats = stats[pid] || stats.p1;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredHands = filter === "All" ? hands : hands.filter((h) => {
    if (filter === "Highlights") return h.highlightType;
    return h.highlightType === filter.toLowerCase();
  });

  return (
    <div className="app">
      {/* Command Bar */}
      <div className="command-bar-wrap">
        <div className="logo" onClick={() => go("dashboard")}>H</div>
        <span className="brand">HUDR TERMINAL</span>
        <div className="command-wrap">
          <span className="command-icon">⌘</span>
          <input
            className="command-input"
            placeholder="Search tournaments, players, or commands..."
            value={cmdQuery}
            onChange={(e) => setCmdQuery(e.target.value)}
            onFocus={() => setCmdOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cmdQuery.trim()) {
                go("intel", { q: cmdQuery });
                setCmdOpen(false);
                setCmdQuery("");
              }
            }}
          />
        </div>
        <span className="shortcut-badge">Ctrl+K</span>
        <div className="topbar-pills">
          {["dashboard", "intel", "player", "report", "pricing"].map((p) => (
            <button
              key={p}
              className={`top-pill ${route.path === p ? "active" : ""}`}
              onClick={() => go(p, p === "player" ? { player: pid } : p === "report" ? { player: pid } : {})}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Command Palette Overlay */}
      {cmdOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setCmdOpen(false)}>
          <div
            style={{
              position: "absolute",
              top: 44,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: 600,
              background: "var(--panel)",
              border: "1px solid var(--gold)",
              borderTop: "2px solid var(--gold)",
              borderRadius: "0 0 6px 6px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 12 }}>
              <div className="ctx-label">Suggested Queries</div>
              {["Who is the most exploitable?", "Show ICM mistakes", "Compare Negreanu vs Ivey", "Tournament turning points"].map((q) => (
                <button
                  key={q}
                  className="tree-item"
                  style={{ width: "100%" }}
                  onClick={() => { go("intel", { q }); setCmdOpen(false); setCmdQuery(""); }}
                >
                  <span className="tree-icon">⌘</span> {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workspace */}
      <div className="workspace">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">Tournament</div>
            <button className={`tree-item ${route.path === "dashboard" ? "active" : ""}`} onClick={() => go("dashboard")}>
              <span className="tree-icon">📊</span> Dashboard
            </button>
            <button className={`tree-item ${route.path === "intel" ? "active" : ""}`} onClick={() => go("intel", { q: "Who is the most exploitable?" })}>
              <span className="tree-icon">🧠</span> AI Intelligence
            </button>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">Players</div>
            {players.slice(0, 9).map((p) => (
              <button
                key={p.id}
                className={`tree-item tree-indent ${route.path === "player" && pid === p.id ? "active" : ""}`}
                onClick={() => go("player", { player: p.id })}
              >
                <span className="tree-icon" style={{ color: p.color }}>●</span>
                {p.name.split(" ").pop()} <span className="text-muted" style={{ marginLeft: "auto", fontSize: 11 }}>#{p.finishPosition}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">Highlights</div>
            {["biggest_pot", "bluff", "elimination", "hero_call", "cooler"].map((type) => (
              <button
                key={type}
                className="tree-item tree-indent"
                onClick={() => { setFilter(type === filter.toLowerCase() ? "All" : type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")); go("dashboard"); }}
              >
                <span className="tree-icon">{type === "biggest_pot" ? "💰" : type === "bluff" ? "🎭" : type === "elimination" ? "💀" : type === "hero_call" ? "🦸" : "❄️"}</span>
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">Reports</div>
            <button className={`tree-item ${route.path === "report" ? "active" : ""}`} onClick={() => go("report", { player: pid })}>
              <span className="tree-icon">📄</span> Exploit Report
            </button>
            <button className={`tree-item ${route.path === "pricing" ? "active" : ""}`} onClick={() => go("pricing")}>
              <span className="tree-icon">💳</span> Pricing
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="main-area">
          {route.path === "dashboard" && <Dashboard go={go} tournament={tournament} hands={filteredHands} highlights={highlights} filter={filter} setFilter={setFilter} selected={selected} setSelected={setSelected} players={players} stats={stats} insights={insights} />}
          {route.path === "intel" && <IntelBrief go={go} query={route.params.get("q")} player={player} stats={stats} />}
          {route.path === "player" && <PlayerDossier go={go} player={player} stats={playerStats} />}
          {route.path === "report" && <ExploitDossier go={go} player={player} stats={playerStats} />}
          {route.path === "pricing" && <Pricing go={go} />}
        </div>

        {/* Right Context Panel */}
        <div className="context-panel">
          <div className="ctx-section">
            <div className="ctx-label">Selected Context</div>
            <div className="ctx-row"><span>Player</span><span style={{ color: player?.color }}>{player?.name?.split(" ").pop()}</span></div>
            <div className="ctx-row"><span>Exploit</span><span className="text-gold">{calcExploit(playerStats)}/100</span></div>
            <div className="ctx-row"><span>Hands</span><span>{playerStats?.totalHands}</span></div>
            <div className="ctx-row"><span>Finish</span><span>#{player?.finishPosition}</span></div>
          </div>
          <div className="ctx-section">
            <div className="ctx-label">Quick Stats</div>
            <div className="ctx-row"><span>VPIP</span><span>{playerStats?.vpip}%</span></div>
            <div className="ctx-row"><span>PFR</span><span>{playerStats?.pfr}%</span></div>
            <div className="ctx-row"><span>3-Bet</span><span>{playerStats?.threeBet}%</span></div>
            <div className="ctx-row"><span>AF</span><span>{playerStats?.af}</span></div>
            <div className="ctx-row"><span>WTSD</span><span>{playerStats?.wtsd}%</span></div>
            <div className="ctx-row"><span>WSD</span><span>{playerStats?.wsd}%</span></div>
          </div>
          <div className="ctx-section">
            <div className="ctx-label">AI Insights</div>
            {insights.slice(0, 3).map((ins) => (
              <div key={ins.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--muted)", lineHeight: 1.5, cursor: "pointer" }}
                onClick={() => go("intel", { q: ins.title })}>
                <span style={{ marginRight: 6 }}>{ins.icon}</span>{ins.title}
              </div>
            ))}
          </div>
          <div className="ctx-section">
            <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => go("report", { player: pid })}>
              Generate Exploit Report
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span><span className="status-dot" /> Connected to HUDR API</span>
        <span>{d.TOURNAMENTS?.length || 5} tournaments indexed</span>
        <span>{hands.length} hands loaded</span>
        <span style={{ marginLeft: "auto" }}>Last sync: 2m ago</span>
      </div>
    </div>
  );
}

// ===================== Dashboard =====================

function Dashboard({ go, tournament, hands, highlights, filter, setFilter, selected, setSelected, players, stats, insights }) {
  if (!tournament) return null;
  const filters = ["All", "Highlights", "Bluff", "Elimination", "Biggest pot", "Hero call", "Cooler"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* KPI Row */}
      <div style={{ padding: "8px 12px" }}>
        <div className="kpi-row">
          <div className="kpi"><div className="kpi-label">Players</div><div className="kpi-value">{tournament.playerCount}</div></div>
          <div className="kpi"><div className="kpi-label">Hands</div><div className="kpi-value">{tournament.handCount}</div></div>
          <div className="kpi"><div className="kpi-label">Prize Pool</div><div className="kpi-value">{fmtChips(tournament.prizePool)}</div></div>
          <div className="kpi"><div className="kpi-label">Buy-in</div><div className="kpi-value">${tournament.buyIn?.toLocaleString()}</div></div>
          <div className="kpi"><div className="kpi-label">Biggest Pot</div><div className="kpi-value">{fmtChips(Math.max(...hands.map((h) => h.potTotal || 0)))}</div></div>
          <div className="kpi"><div className="kpi-label">Bluffs</div><div className="kpi-value">{hands.filter((h) => h.highlightType === "bluff").length}</div></div>
          <div className="kpi"><div className="kpi-label">Avg VPIP</div><div className="kpi-value">{Math.round(Object.values(stats).reduce((a, s) => a + s.vpip, 0) / Object.keys(stats).length)}%</div></div>
          <div className="kpi"><div className="kpi-label">Avg AF</div><div className="kpi-value">{(Object.values(stats).reduce((a, s) => a + s.af, 0) / Object.keys(stats).length).toFixed(1)}</div></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {filters.map((f) => (
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Hands Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Players</th>
              <th>Pot</th>
              <th>Type</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hands.slice(0, 20).map((h) => {
              const ps = (h.playersInvolved || []).map((id) => {
                const p = players.find((pl) => pl.id === id);
                return p ? p.name.split(" ").pop() : id;
              }).join(" vs ");
              return (
                <tr
                  key={h.id}
                  className={selected === h.id ? "selected" : ""}
                  onClick={() => setSelected(h.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{h.handNumber}</td>
                  <td style={{ fontFamily: "Inter, sans-serif" }}>{ps}</td>
                  <td style={{ color: "var(--gold)" }}>{fmtChips(h.potTotal)}</td>
                  <td>
                    {h.highlightType ? (
                      <span className={`badge badge-${h.highlightType === "bluff" || h.highlightType === "elimination" ? "red" : h.highlightType === "biggest_pot" ? "gold" : "green"}`}>
                        {h.highlightType.replace("_", " ")}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ fontFamily: "Inter, sans-serif", color: "var(--muted)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.preview}
                  </td>
                  <td>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); go("intel", { q: `Explain hand #${h.handNumber}` }); }}>
                      AI
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== Intelligence Brief =====================

function IntelBrief({ go, query, player, stats }) {
  const q = query || "Who is the most exploitable player?";
  const d = D();

  const findings = [
    { title: "Negreanu's BB Defense is Exploitable", detail: "Fold to steal at 62% vs 52% population baseline. Clear steal-wider opportunity from late position across all stack depths.", conf: "High", sample: "87 hands" },
    { title: "River Aggression Drop Across Field", detail: "Average river AF 2.1 vs 3.2 on flop — consistent pattern of giving up value on river. Most pronounced in Konnikova (AF River 1.0) and Kenney (1.4).", conf: "Medium", sample: "478 actions" },
    { title: "Low 3-Bet Frequency from Hellmuth", detail: "Phil Hellmuth's 7% 3-bet rate is lowest among regulars. Exploitable by opening wider in his blind and calling his 3-bets tighter (value-heavy range).", conf: "High", sample: "72 hands" },
    { title: "Seidel's Extreme Tightness Creates Opportunities", detail: "Erik Seidel with 18/14 VPIP/PFR is the tightest player. Auto-fold equity in most pots — steal relentlessly when he's in the blinds.", conf: "Medium", sample: "22 hands" },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 800 }}>
      <div className="intel-header">⬡ INTELLIGENCE BRIEF</div>
      <div className="intel-query">{q}</div>

      <div className="intel-summary">
        Highest confidence exploit path targets <strong style={{ color: "var(--gold)" }}>Daniel Negreanu</strong>'s blind defense tendencies and river aggression decline.
        Secondary targets include Hellmuth's low 3-bet frequency and Seidel's extreme tightness. All findings backed by {d.TOURNAMENTS?.[0]?.handCount || 87} hands of observed data.
      </div>

      <div className="panel-header" style={{ padding: "8px 0" }}>KEY FINDINGS</div>
      {findings.map((f, i) => (
        <div key={i} className="finding">
          <div className="finding-num">{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div className="finding-title">{f.title}</div>
            <div className="finding-detail">{f.detail}</div>
            <div className="finding-meta">
              <span className={`badge ${f.conf === "High" ? "badge-green" : "badge-gold"}`}>{f.conf}</span>
              <span className="badge badge-blue">{f.sample}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-md row" style={{ gap: 8 }}>
        <button className="btn" onClick={() => go("report", { player: "p1" })}>📄 Generate Report</button>
        <button className="btn" onClick={() => go("player", { player: "p1" })}>👤 View Negreanu</button>
        <button className="btn" onClick={() => go("dashboard")}>📊 Back to Dashboard</button>
      </div>
    </div>
  );
}

// ===================== Player Dossier =====================

function PlayerDossier({ go, player, stats }) {
  if (!player || !stats) return null;
  const exploit = calcExploit(stats);
  const style = stats.vpip > 30 ? "LAG" : stats.vpip > 24 ? "TAG-Agg" : stats.pfr > 16 ? "TAG" : "Nit";

  const statRows = [
    ["VPIP", stats.vpip + "%"], ["PFR", stats.pfr + "%"], ["3-Bet", stats.threeBet + "%"], ["4-Bet", stats.fourBet + "%"],
    ["Steal", stats.steal + "%"], ["Fold to Steal", stats.foldToSteal + "%"], ["BB Defense", stats.bbDefense + "%"],
    ["CBet Flop", stats.cbetFlop + "%"], ["CBet Turn", stats.cbetTurn + "%"], ["CBet River", stats.cbetRiver + "%"],
    ["Check-Raise F", stats.checkRaiseFlop + "%"], ["Donk Bet", stats.donkBetFlop + "%"],
    ["AF", stats.af.toFixed(1)], ["AF Flop", stats.afFlop.toFixed(1)], ["AF Turn", stats.afTurn.toFixed(1)], ["AF River", stats.afRiver.toFixed(1)],
    ["WTSD", stats.wtsd + "%"], ["WSD", stats.wsd + "%"], ["WWSF", stats.wwsf + "%"], ["W/O SD", stats.wonWithoutShowdown + "%"],
  ];

  const strengths = [];
  const weaknesses = [];
  if (stats.wsd > 52) strengths.push({ stat: "WSD", val: stats.wsd + "%", pop: "50%" });
  if (stats.steal > 40) strengths.push({ stat: "Steal", val: stats.steal + "%", pop: "38%" });
  if (stats.cbetFlop > 65) strengths.push({ stat: "CBet Flop", val: stats.cbetFlop + "%", pop: "62%" });
  if (stats.foldToSteal > 58) weaknesses.push({ stat: "Fold to Steal", val: stats.foldToSteal + "%", pop: "52%" });
  if (stats.afRiver < 2.2) weaknesses.push({ stat: "AF River", val: stats.afRiver.toFixed(1), pop: "2.5" });
  if (stats.checkRaiseFlop < 7) weaknesses.push({ stat: "Check-Raise", val: stats.checkRaiseFlop + "%", pop: "8%" });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 8, height: "100%", overflow: "auto" }}>
      {/* Identity + Grade */}
      <div className="panel">
        <div className="panel-header">PLAYER IDENTITY</div>
        <div className="panel-body" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className={`grade-circle ${gradeClass(exploit)}`}>{exploit}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{player.countryFlag} {player.name}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>#{player.finishPosition} · {player.status} · {player.handsPlayed} hands</div>
            <div className="mt-sm row">
              <span className="badge badge-gold">{style}</span>
              <span className="badge badge-blue">{stats.totalHands} hands</span>
            </div>
          </div>
        </div>
      </div>

      {/* HUD Stats Table */}
      <div className="panel" style={{ gridRow: "1 / 3" }}>
        <div className="panel-header">HUD STATISTICS</div>
        <div style={{ overflow: "auto", maxHeight: 400 }}>
          <table className="data-table">
            <thead><tr><th>Stat</th><th>Value</th><th>Range</th></tr></thead>
            <tbody>
              {statRows.map(([label, val]) => {
                const num = parseFloat(val);
                return (
                  <tr key={label}>
                    <td style={{ fontFamily: "Inter, sans-serif", color: "var(--muted)" }}>{label}</td>
                    <td style={{ fontWeight: 700 }}>{val}</td>
                    <td>
                      <div className="spark-bar">
                        <div className="spark-fill" style={{ width: `${Math.min(isNaN(num) ? 50 : num > 10 ? num : num * 15, 100)}%`, background: num > 50 ? "var(--green)" : num > 25 ? "var(--gold)" : "var(--red)" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strengths */}
      <div className="panel">
        <div className="panel-header" style={{ color: "var(--green)" }}>STRENGTHS</div>
        <div className="panel-body">
          {strengths.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>No significant strengths detected</div>}
          {strengths.map((s, i) => (
            <div key={i} className="ctx-row" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{s.stat}</span>
              <span><span className="text-green fw-700">{s.val}</span> <span className="text-muted">vs {s.pop}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="panel" style={{ gridColumn: 1 }}>
        <div className="panel-header" style={{ color: "var(--red)" }}>WEAKNESSES</div>
        <div className="panel-body">
          {weaknesses.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>No significant weaknesses detected</div>}
          {weaknesses.map((w, i) => (
            <div key={i} className="ctx-row" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{w.stat}</span>
              <span><span className="text-red fw-700">{w.val}</span> <span className="text-muted">vs {w.pop}</span></span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", padding: 8 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-gold" onClick={() => go("report", { player: player.id })}>Generate Exploit Report</button>
          <button className="btn" onClick={() => go("intel", { q: `How to exploit ${player.name}?` })}>Ask AI</button>
        </div>
      </div>
    </div>
  );
}

// ===================== Exploit Dossier =====================

function ExploitDossier({ go, player, stats }) {
  if (!player || !stats) return null;
  const exploit = calcExploit(stats);

  const leaks = [
    { name: "Overfolds BB Defense", pVal: stats.foldToSteal + "%", pop: "52%", delta: stats.foldToSteal - 52, conf: "High", severity: stats.foldToSteal > 60 ? 5 : 3, sample: stats.totalHands },
    { name: "River Aggression Drop", pVal: (stats.afRiver || 2.1).toFixed(1), pop: "2.5", delta: (stats.afRiver || 2.1) - 2.5, conf: "Medium", severity: stats.afRiver < 2 ? 4 : 3, sample: stats.totalHands },
    { name: "Low Check-Raise Freq", pVal: stats.checkRaiseFlop + "%", pop: "8%", delta: stats.checkRaiseFlop - 8, conf: stats.totalHands > 50 ? "Medium" : "Low", severity: stats.checkRaiseFlop < 6 ? 4 : 2, sample: stats.totalHands },
    { name: "C-Bet Continuation Decline", pVal: `${stats.cbetFlop}→${stats.cbetTurn}→${stats.cbetRiver}`, pop: "65→50→35", delta: null, conf: "Medium", severity: 3, sample: stats.totalHands },
    { name: "Cold Call Frequency", pVal: stats.coldCall + "%", pop: "7%", delta: stats.coldCall - 7, conf: "Low", severity: stats.coldCall > 9 ? 3 : 1, sample: stats.totalHands },
  ];

  return (
    <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
      <div className="between">
        <div>
          <div className="intel-header">◉ EXPLOIT INTELLIGENCE REPORT — {player.name.toUpperCase()}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Generated {new Date().toLocaleDateString()} · {stats.totalHands} hands analyzed</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn">Export JSON</button>
          <button className="btn">Export CSV</button>
          <button className="btn">Print</button>
        </div>
      </div>

      {/* Grade + Identity */}
      <div className="row mt-md" style={{ gap: 20 }}>
        <div className={`grade-circle ${gradeClass(exploit)}`} style={{ width: 80, height: 80, fontSize: 28 }}>{exploit}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Exploitability Index</div>
          <div className="row mt-sm" style={{ gap: 16 }}>
            <div><span className="text-muted" style={{ fontSize: 11 }}>Confidence</span><br /><span className={`badge badge-${leaks[0].conf === "High" ? "green" : "gold"}`}>{leaks[0].conf}</span></div>
            <div><span className="text-muted" style={{ fontSize: 11 }}>Sample</span><br /><span className="text-mono fw-700">{stats.totalHands}</span></div>
            <div><span className="text-muted" style={{ fontSize: 11 }}>Freshness</span><br /><span className="text-mono">3d ago</span></div>
          </div>
        </div>
      </div>

      {/* Leak Matrix */}
      <div className="panel mt-md">
        <div className="panel-header">LEAK MATRIX</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Leak</th>
              <th>Player</th>
              <th>Population</th>
              <th>Delta</th>
              <th>Confidence</th>
              <th>Severity</th>
              <th>Sample</th>
            </tr>
          </thead>
          <tbody>
            {leaks.map((l, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{l.name}</td>
                <td style={{ color: "var(--text)" }}>{l.pVal}</td>
                <td style={{ color: "var(--muted)" }}>{l.pop}</td>
                <td className={l.delta != null ? (l.delta > 0 ? "delta-pos" : "delta-neg") : ""}>
                  {l.delta != null ? (l.delta > 0 ? "+" : "") + l.delta.toFixed(1) : "—"}
                </td>
                <td><span className={`badge ${l.conf === "High" ? "badge-green" : l.conf === "Medium" ? "badge-gold" : "badge-red"}`}>{l.conf}</span></td>
                <td><span className="severity-stars">{severityStars(l.severity)}</span></td>
                <td>{l.sample}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exploit Action Plan */}
      <div className="mt-md">
        <div className="panel-header" style={{ padding: "8px 0" }}>EXPLOIT ACTION PLAN</div>
        <div className="plan-grid">
          <div className="plan-card preflop">
            <h4 style={{ color: "var(--green)" }}>Preflop Adjustments</h4>
            <div className="plan-item">Steal wider from BTN/CO when target is in BB ({stats.foldToSteal}% fold rate)</div>
            <div className="plan-item">Increase 3-bet sizing against loose openers (VPIP {stats.vpip}%+)</div>
            <div className="plan-item">Tighten call range vs their 3-bets (they under-bluff preflop)</div>
          </div>
          <div className="plan-card postflop">
            <h4 style={{ color: "var(--blue)" }}>Postflop Adjustments</h4>
            <div className="plan-item">Float flop c-bets more liberally ({stats.cbetFlop}%→{stats.cbetTurn}% drop-off)</div>
            <div className="plan-item">Barrel turns after their flop check (low check-raise {stats.checkRaiseFlop}%)</div>
            <div className="plan-item">Value bet rivers thinner (their AF drops to {stats.afRiver})</div>
          </div>
          <div className="plan-card icm">
            <h4 style={{ color: "var(--gold)" }}>ICM Adjustments</h4>
            <div className="plan-item">Apply maximum pressure in blind defense spots near pay jumps</div>
            <div className="plan-item">Reduce bluff frequency vs them on rivers (they call too much)</div>
            <div className="plan-item">Size up value bets with deeper effective stacks (&gt;30bb)</div>
          </div>
        </div>
      </div>

      {/* Confidence Footer */}
      <div className="kpi-row mt-md" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi"><div className="kpi-label">Hands Analyzed</div><div className="kpi-value">{stats.totalHands}</div></div>
        <div className="kpi"><div className="kpi-label">Leak Count</div><div className="kpi-value">{leaks.length}</div></div>
        <div className="kpi"><div className="kpi-label">Significance</div><div className="kpi-value">{stats.totalHands > 50 ? "Valid" : "Low"}</div></div>
        <div className="kpi"><div className="kpi-label">Last Updated</div><div className="kpi-value">3d ago</div></div>
      </div>
    </div>
  );
}

// ===================== Pricing =====================

function Pricing({ go }) {
  return (
    <div style={{ padding: 20 }}>
      <div className="intel-header">PRICING</div>
      <div className="text-muted mb-md">Select your HUDR Terminal access level</div>
      <div className="terminal-price">
        <div className="term-card">
          <h3 className="text-muted">Terminal Basic</h3>
          <div className="term-price">$0</div>
          <ul className="term-features">
            <li>3 intelligence queries / day</li>
            <li>Dashboard view</li>
            <li>Basic player stats</li>
            <li>Key moments only</li>
          </ul>
        </div>
        <div className="term-card featured">
          <h3 className="text-gold">Terminal Pro</h3>
          <div className="term-price text-gold">$10<span>/mo</span></div>
          <ul className="term-features">
            <li>Unlimited intelligence queries</li>
            <li>Full exploit dossiers</li>
            <li>Leak matrix with severity</li>
            <li>Evidence chain analysis</li>
            <li>Export JSON / CSV / PDF</li>
            <li>Priority data access</li>
          </ul>
          <button className="btn btn-gold mt-md" style={{ width: "100%" }}>UPGRADE</button>
        </div>
      </div>
    </div>
  );
}
