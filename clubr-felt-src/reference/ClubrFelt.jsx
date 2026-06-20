import React, { useState, useEffect, createContext, useContext, useMemo } from "react";

/* ============================================================================
   CLUBR · "FELT" VARIANT
   Premium poker-luxe design treatment of the Clubr scorekeeper app.
   One coherent design language across all 14 canonical routes from manifest.json.

   PRODUCT INVARIANTS HONORED (from BUILD_INSTRUCTIONS.md + intent.md):
   · Single API surface — all data read from one mock store (MOCK below). No DB calls.
   · No business logic in browser — scores/ICM/payouts are pre-computed fields, displayed only.
   · Money shown as "Stakes", never "$". (Credit *purchase* prices stay real money — they buy credits.)
   · Role gating — /host-ft is host+admin only; /admin is admin only. Players are redirected.
   · Email-verify flow preserved on /me.
   · 4-item mobile bottom nav: Discover / Clubs / Games / Me (reordered to Discover/Clubs/Games/Me).
   · Touch-first, 390×844 primary; scales to desktop.

   Routing: hash-based (#/path) so it works as a static drop-in with no server.
   Role: switch via /me → "Switch demo account", drives gating + which clubs you host.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   DESIGN TOKENS  (the "Felt" skin — same key shape as tokens.json)
   --------------------------------------------------------------------------- */
const T = {
  bg: "#0B1410", bgDeep: "#070D0A", card: "#11201A", surface: "#16291F", raised: "#1E3A2C",
  line: "#23382C", lineLight: "#2C4636",
  gold: "#E9C46A", goldDeep: "#C99B3E", goldFaint: "#E9C46A22",
  ink: "#F3F6F2", inkSoft: "#AFC4B6", inkMute: "#6E8678",
  blue: "#5AA9E6", emerald: "#36C98B", purple: "#A98BE6", amber: "#E9A23B", red: "#E5604F", cyan: "#4FB8C9",
};
const FD = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const FB = "'Inter', system-ui, -apple-system, sans-serif";
const FM = "'IBM Plex Mono', ui-monospace, monospace";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("clubr-felt-fonts")) return;
    const l = document.createElement("link");
    l.id = "clubr-felt-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

/* ---------------------------------------------------------------------------
   MOCK STORE — the single read surface. Mirrors the data the screenshots show.
   "Stakes" values are plain numbers; the UI formats them with the Stakes word.
   --------------------------------------------------------------------------- */
const fmtStakes = (n) => (n == null ? "—" : Number(n).toLocaleString());

const MOCK = {
  users: {
    u_player: { id: "u_player", name: "Sam Rivers", handle: "sam", city: "Houston, TX", email: "sam@example.com", emailVerified: false, role: "player", credits: 900, initial: "SR", color: "#5AA9E6", ftPlayed: 7, llPlayed: 4 },
    u_host:   { id: "u_host", name: "Harper Host", handle: "harper", city: "Houston, TX", email: "harper@acesclub.com", emailVerified: true, role: "host", credits: 600, initial: "HH", color: "#36C98B", ftPlayed: 12, llPlayed: 6, hostsClubs: ["c_aces"] },
    u_admin:  { id: "u_admin", name: "Avery Admin", handle: "avery", city: "Las Vegas, NV", email: "avery@clubr.app", emailVerified: true, role: "admin", credits: 9999, initial: "AA", color: "#A98BE6" },
  },
  clubs: [
    { id: "c_aces", name: "Aces High", emoji: "🂡", color: "#E5604F", city: "Houston, TX", members: 4, code: "ACES2K", host: "Harper Host", visibility: "Public", tagline: "Friday night home game crew. Final-table fantasy + our weekly Last Longer.", pending: 1 },
    { id: "c_grind", name: "The Grinders", emoji: "♠", color: "#36C98B", city: "Dallas, TX", members: 3, code: "GRIND7", host: "Gary Grind", visibility: "Public", tagline: "Serious players, serious volume.", pending: 0 },
    { id: "c_bayou", name: "Bayou City Poker Club", emoji: "🏆", color: "#A98BE6", city: "Houston, TX", members: 12, code: "BAYOU9", host: "Marcus Reyes", visibility: "Public", tagline: "Houston's biggest home-game network.", pending: 1 },
    { id: "c_gulf", name: "Gulf Coast Card Club", emoji: "🎴", color: "#E5604F", city: "Houston, TX", members: 12, code: "GULF42", host: "Diana Cole", visibility: "Public", tagline: "Coastal grinders welcome.", pending: 1 },
  ],
  discoverClubs: [
    { id: "c_green", name: "Green Felt Club", emoji: "🟢", color: "#36C98B", city: "Dallas, TX", members: 2 },
    { id: "c_rats", name: "River Rats", emoji: "🌊", color: "#4FB8C9", city: "Austin, TX", members: 2 },
  ],
  games: [
    { id: "g_sqsun", type: "squares", club: "Bayou City Poker Club", clubEmoji: "🏆", title: "Sunday Squares — Texans @ Colts", sub: "Texans vs Colts", status: "open", state: "Registration open", buyin: 50, pool: 450, capacity: "9/100 sq", closes: 2098, payouts: "Q1 · Q2 · Q3 · Final" },
    { id: "g_llsat", type: "last", club: "Aces High", clubEmoji: "🂡", title: "Saturday Deep Stack Last Longer", sub: "", status: "open", state: "Registration open", buyin: 100, pool: 300, standing: "3 in", closes: 38400 },
    { id: "g_ftdog", type: "ft", club: "Aces High", clubEmoji: "🂡", title: "DogHouse $150K H.W.M.S Main Event — FT", sub: "", status: "open", state: "Registration open", buyin: 100, pool: 300, entered: "3 entered", locks: 3904, winners: "3 winners · 50/30/20" },
    { id: "g_sqnight", type: "squares", club: "Aces High", clubEmoji: "🂡", title: "Sunday Night Squares", sub: "Ravens vs Bills", status: "playing", state: "Registration open", buyin: 50, pool: 550, capacity: "11/100", closes: 4740, payouts: "Q1 · Q2 · Q3 · Final" },
    { id: "g_llmid", type: "last", club: "The Grinders", clubEmoji: "♠", title: "Midweek Grind", sub: "", status: "running", state: "Running", buyin: 100, pool: 700, standing: "3 in" },
    { id: "g_llfri", type: "last", club: "Bayou City Poker Club", clubEmoji: "🏆", title: "Friday Night Last Longer", sub: "", status: "running", state: "Running", buyin: 100, pool: 500, standing: "5 in" },
    { id: "g_llthu", type: "last", club: "Gulf Coast Card Club", clubEmoji: "🎴", title: "Thursday Last Longer", sub: "", status: "running", state: "Running", buyin: 100, pool: 400, standing: "4 in" },
    { id: "g_ftroller", type: "ft", club: "The Grinders", clubEmoji: "♠", title: "Trailblazer Poker Tour — High Roller FT", sub: "", status: "running", state: "Running", buyin: 100, pool: 900, locks: 720, winners: "3 winners · 50/30/20" },
    { id: "g_sqcow", type: "squares", club: "The Grinders", clubEmoji: "♠", title: "Cowboys @ Niners Squares", sub: "Niners vs Cowboys", status: "done", state: "Completed", buyin: 25, pool: 2100, result: "You finished 3rd · 162 pts" },
    { id: "g_ftsfs", type: "ft", club: "Aces High", clubEmoji: "🂡", title: "DogHouse $100K SFS Main Event — FT", sub: "", status: "done", state: "Completed", buyin: 250, pool: 1500, result: "You finished 3rd · 165 pts" },
  ],
  contests: [
    { id: "ct_a", club: "Aces High", clubEmoji: "🂡", title: "DogHouse $150K H.W.M.S Main Event — FT", host: "Harper Host", status: "open", state: "Registration open", buyin: 100, pool: 300, entered: "3 joined", budget: 100000, handed: "9-handed", locks: 3898,
      replay: { label: "Watch on YouTube", note: "On demand · DogHouse Poker Club broadcast" },
      stats: { prizePool: 150000, buyin: 380, playersLeft: 9, avgStack: "41 BB", chipsInPlay: "36,800,000", level: "40k / 80k · 80k ante" },
      finalTable: [
        { seat: 1, country: "US", name: "Jacob Nguyen", bb: 95, chips: "9,500,000", price: 35000, pct: 0.95 },
        { seat: 2, country: "US", name: "Scott", bb: 72, chips: "7,200,000", price: 30000, pct: 0.72 },
        { seat: 3, country: "US", name: "Zachary Hammons", bb: 58, chips: "5,800,000", price: 27000, pct: 0.58 },
        { seat: 4, country: "US", name: "Benjamin Thomas", bb: 44, chips: "4,400,000", price: 24000, pct: 0.44 },
        { seat: 5, country: "US", name: "Roy Turner", bb: 35, chips: "3,500,000", price: 22000, pct: 0.35 },
        { seat: 6, country: "US", name: "Jeffery Fritz", bb: 26, chips: "2,600,000", price: 20000, pct: 0.26 },
        { seat: 7, country: "US", name: "Sang Ngo", bb: 19, chips: "1,900,000", price: 18000, pct: 0.19 },
        { seat: 8, country: "US", name: "Genc Govori", bb: 12, chips: "1,200,000", price: 16000, pct: 0.12 },
        { seat: 9, country: "US", name: "Corey", bb: 7, chips: "700,000", price: 13000, pct: 0.07 },
      ] },
  ],
  hostFinalTables: [
    { id: "ft1", club: "Champions Club", when: "Today · 8:00pm CT", title: "Winter Poker Open — 1,500 Main Event FT", prize: 1350000, buyin: 1500, eta: "in 2h 10m", finalists: 9 },
    { id: "ft2", club: "Texas Card House", when: "Today · 11:00pm CT", title: "Trailblazer Poker Tour — 1M Main Event FT", prize: 1360100, buyin: 1200, eta: "in 5h", finalists: 9 },
    { id: "ft3", club: "Champions Club", when: "Tomorrow · 6:00pm CT", title: "Fall Poker Open — Championship Main Event FT", prize: 1113600, buyin: 2700, eta: "in 21h", finalists: 9 },
    { id: "ft4", club: "Texas Card House", when: "Sat · 3:00pm CT", title: "Trailblazer Multi-Flight — 500K GTD FT", prize: 500000, buyin: 500, eta: "tomorrow", finalists: 9 },
  ],
  lastLongerGame: {
    id: "ll_demo", club: "Aces High", title: "Saturday Deep Stack Last Longer", status: "running", pot: 300, settlement: "Pays the last player standing",
    players: [
      { name: "Sam Rivers", initial: "SR", color: "#5AA9E6", alive: true },
      { name: "Gary Grind", initial: "GG", color: "#36C98B", alive: true },
      { name: "Mike Jones", initial: "MJ", color: "#E9A23B", alive: true },
      { name: "Lena Park", initial: "LP", color: "#A98BE6", alive: false },
      { name: "Tom Wilson", initial: "TW", color: "#E5604F", alive: false },
      { name: "Cody Banks", initial: "CB", color: "#4FB8C9", alive: false },
    ],
  },
  squaresGame: {
    id: "sq_demo", club: "Bayou City Poker Club", title: "Sunday Squares — Texans @ Colts", status: "open", pot: 450, teamX: "Texans", teamY: "Colts",
    locked: false, claimed: 9,
    owners: { "0-0": "SR", "1-3": "GG", "2-7": "MJ", "3-1": "SR", "4-4": "LP", "5-9": "TW", "6-2": "CB", "7-5": "GG", "9-8": "MJ" },
    ownerColors: { SR: "#5AA9E6", GG: "#36C98B", MJ: "#E9A23B", LP: "#A98BE6", TW: "#E5604F", CB: "#4FB8C9" },
  },
  wallet: {
    balance: 900,
    packages: [
      { cr: 500, label: "Starter", price: "$5", tag: "" },
      { cr: 1200, label: "Regular", price: "$10", tag: "Popular" },
      { cr: 2000, label: "Pro", price: "$15", tag: "Best value" },
      { cr: 5000, label: "Whale", price: "$30", tag: "" },
    ],
    tx: [
      { dir: "out", label: "Joined Cowboys @ Niners Squares", when: "now", amt: -100, bal: 900 },
      { dir: "in", label: "Welcome bonus", when: "on signup", amt: 1000, bal: 1000 },
    ],
  },
  member: {
    id: "u_player", name: "Sam Rivers", handle: "sam", city: "Houston, TX", initial: "SR", color: "#5AA9E6", role: "player",
    ftPlayed: 7, llPlayed: 4,
    clubs: [["🂡", "Aces High"], ["♠", "The Grinders"], ["🏆", "Bayou City Poker Club"], ["🎴", "Gulf Coast Card Club"]],
    history: [
      { type: "ft", title: "TCH Dallas — Deepstack Main FT", club: "The Grinders", state: "open", badge: "entered" },
      { type: "ft", title: "Trailblazer Poker Tour — High Roller FT", club: "The Grinders", state: "locked", badge: "locked" },
      { type: "ft", title: "Winter Poker Open — High Roller FT", club: "Aces High", state: "settled", badge: "2nd · 180 pts" },
      { type: "ft", title: "Summer Poker Open — $1M GTD Main FT", club: "Bayou City Poker Club", state: "open", badge: "entered" },
      { type: "ft", title: "$100K Fall Harvest Headliner — FT", club: "Gulf Coast Card Club", state: "open", badge: "entered" },
      { type: "last", title: "Midweek Grind", club: "The Grinders", state: "live", badge: "still in" },
      { type: "last", title: "Last Week's Grind", club: "The Grinders", state: "completed", badge: "2nd" },
      { type: "last", title: "Friday Night Last Longer", club: "Bayou City Poker Club", state: "live", badge: "still in" },
      { type: "last", title: "Thursday Last Longer", club: "Gulf Coast Card Club", state: "live", badge: "still in" },
    ],
  },
  admin: {
    stats: { clubs: 7, users: 31 },
    economy: { joinGame: 100, createClub: 200, hostGame: 100 },
    leaderboardFormula: "points = round(d × rk × draw × weight)",
    allClubs: [
      { emoji: "🂡", name: "Aces High", host: "Harper Host", code: "ACES2K", members: 4, pending: 2 },
      { emoji: "♠", name: "The Grinders", host: "Gary Grind", code: "GRIND7", members: 3, pending: 0 },
      { emoji: "🌊", name: "River Rats", host: "Rae Rivers", code: "RIVER1", members: 2, pending: 0 },
      { emoji: "🟢", name: "Green Felt Club", host: "Gary Grind", code: "FELT99", members: 2, pending: 0 },
      { emoji: "👑", name: "High Rollers", host: "Rae Rivers", code: "HIROLL", members: 2, pending: 0 },
      { emoji: "🏆", name: "Bayou City Poker Club", host: "Marcus Reyes", code: "CHAMP1", members: 12, pending: 1 },
      { emoji: "🎴", name: "Gulf Coast Card Club", host: "Diana Cole", code: "TCH777", members: 12, pending: 1 },
    ],
    allUsers: [
      { name: "Avery Admin", email: "avery@clubr.app", city: "Las Vegas, NV", role: "admin", color: "#A98BE6", initial: "AA" },
      { name: "Harper Host", email: "harper@acesclub.com", city: "Houston, TX", role: "host", color: "#36C98B", initial: "HH" },
      { name: "Sam Rivers", email: "sam@example.com", city: "Houston, TX", role: "player", color: "#5AA9E6", initial: "SR" },
      { name: "Gary Grind", email: "gary@grinders.club", city: "Dallas, TX", role: "host", color: "#E9A23B", initial: "GG" },
      { name: "Rae Rivers", email: "rae@rivers.club", city: "Austin, TX", role: "host", color: "#4FB8C9", initial: "RR" },
      { name: "Mike Jones", email: "mike@example.com", city: "Houston, TX", role: "player", color: "#E5604F", initial: "MJ" },
      { name: "Tom Wilson", email: "tom@example.com", city: "Dallas, TX", role: "player", color: "#A98BE6", initial: "TW" },
      { name: "Lena Park", email: "lena@example.com", city: "Austin, TX", role: "player", color: "#5AA9E6", initial: "LP" },
      { name: "Jordan Lee", email: "jordan@example.com", city: "Dallas, TX", role: "player", color: "#36C98B", initial: "JL" },
      { name: "Dustin Cole", email: "dustin@example.com", city: "Dallas, TX", role: "player", color: "#E9A23B", initial: "DC" },
    ],
  },
};

/* ---------------------------------------------------------------------------
   ROLE / ROUTER CONTEXT
   --------------------------------------------------------------------------- */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const on = () => setRoute(window.location.hash.replace(/^#/, "") || "/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const nav = (to) => { window.location.hash = to; };
  return [route, nav];
}

/* ============================================================================
   PRIMITIVES (the locked Felt component kit)
   ============================================================================ */
function Logo({ size = 32, showWord = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Clubr">
        <defs><linearGradient id="cflg" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0" stopColor={T.gold} /><stop offset="1" stopColor={T.goldDeep} />
        </linearGradient></defs>
        <circle cx="24" cy="24" r="21" stroke="url(#cflg)" strokeWidth="3.2" />
        {[0,60,120,180,240,300].map((a) => {
          const r=(a*Math.PI)/180, x=24+Math.cos(r)*21, y=24+Math.sin(r)*21;
          return <rect key={a} x={x-2.4} y={y-2.4} width="4.8" height="4.8" rx="1.4" transform={`rotate(${a} ${x} ${y})`} fill={T.bg} />;
        })}
        <circle cx="24" cy="24" r="14.5" fill={T.card} />
        <path d="M20 16.5 L33 24 L20 31.5 Z" fill="url(#cflg)" />
      </svg>
      {showWord && <span style={{ fontFamily: FD, fontWeight: 700, fontSize: size * 0.52, color: T.ink, letterSpacing: "-0.02em" }}>Clubr<span style={{ color: T.gold }}>Go</span></span>}
    </div>
  );
}

const TONE = {
  neutral: { bg: T.surface, c: T.inkSoft, b: T.line },
  gold:    { bg: T.goldFaint, c: T.gold, b: "#E9C46A44" },
  blue:    { bg: "#16314A", c: T.blue, b: "#5AA9E644" },
  emerald: { bg: "#0F3327", c: T.emerald, b: "#36C98B44" },
  purple:  { bg: "#2A2245", c: T.purple, b: "#A98BE644" },
  amber:   { bg: "#3A2C12", c: T.amber, b: "#E9A23B44" },
  red:     { bg: "#3A1C18", c: T.red, b: "#E5604F44" },
  cyan:    { bg: "#103138", c: T.cyan, b: "#4FB8C944" },
};
const Chip = ({ children, tone = "neutral", style }) => {
  const m = TONE[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FM, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", padding: "4px 9px", borderRadius: 999, color: m.c, background: m.bg, border: `1px solid ${m.b}`, ...style }}>{children}</span>;
};
const Live = ({ children = "LIVE" }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, fontWeight: 600, color: T.red, padding: "4px 9px", borderRadius: 999, background: "#3A1C18", border: "1px solid #E5604F44" }}>
    <span style={{ width: 6, height: 6, borderRadius: 999, background: T.red, animation: "cf-pulse 1.4s infinite" }} />{children}
  </span>
);

function Countdown({ seconds, label, prefix }) {
  const [s, setS] = useState(seconds);
  useEffect(() => { setS(seconds); const i = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000); return () => clearInterval(i); }, [seconds]);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const p = (n) => String(n).padStart(2, "0");
  const text = h > 0 ? `${h}h ${p(m)}m` : `${p(m)}:${p(sec)}`;
  return <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 600, color: T.emerald }}>{prefix || label} {text}</span>;
}

function Avatar({ name, initial, color, size = 36, gold }) {
  const ini = initial || name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: gold ? T.gold : (color || "linear-gradient(135deg,#1E3A2C,#11201A)"), border: `1px solid ${gold ? T.gold : "transparent"}`, display: "grid", placeItems: "center", fontFamily: FD, fontWeight: 700, fontSize: size * 0.36, color: gold ? T.bg : "#fff" }}>{ini}</div>;
}

function ClubBadge({ emoji, color, size = 44 }) {
  return <div style={{ width: size, height: size, borderRadius: size * 0.32, flexShrink: 0, background: color, display: "grid", placeItems: "center", fontSize: size * 0.46 }}>{emoji}</div>;
}

function IconBtn({ children, onClick, badge }) {
  return <button onClick={onClick} className="cf-tap" style={{ width: 36, height: 36, borderRadius: 12, background: T.surface, border: `1px solid ${T.line}`, cursor: "pointer", display: "grid", placeItems: "center", position: "relative" }}>{children}{badge && <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: T.red, color: "#fff", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: FB }}>{badge}</span>}</button>;
}

function Stakes({ value, size = 15, color = T.ink, label }) {
  return <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
    <span style={{ fontFamily: FD, fontWeight: 700, fontSize: size, color }}>{fmtStakes(value)}</span>
    <span style={{ fontFamily: FM, fontSize: size * 0.62, color: T.inkMute }}>{label || "Stakes"}</span>
  </span>;
}

const GAME_KIND = {
  ft:      { label: "FT FANTASY", icon: "♠", tone: "purple" },
  last:    { label: "LAST LONGER", icon: "◆", tone: "amber" },
  squares: { label: "SQUARES", icon: "▦", tone: "emerald" },
};
const STATUS_TONE = { open: "blue", playing: "blue", running: "emerald", done: "neutral" };

/* ============================================================================
   APP HEADER + BOTTOM NAV  (shared chrome)
   ============================================================================ */
function TopBar() {
  const { me, nav } = useApp();
  const roleChip = me.role === "admin" ? ["App Admin", "purple"] : me.role === "host" ? ["Club Host", "emerald"] : ["Player", "blue"];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(9,17,13,.86)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => nav("/")} className="cf-tap" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Logo size={30} /></button>
        <Chip tone={roleChip[1]}>{roleChip[0]}</Chip>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => nav("/wallet")} className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "transparent", border: `1px solid ${T.goldDeep}66`, cursor: "pointer" }}>
          <span style={{ fontSize: 13 }}>🪙</span><span style={{ fontFamily: FM, fontSize: 13, fontWeight: 600, color: T.gold }}>{me.credits.toLocaleString()}</span>
        </button>
        <IconBtn onClick={() => nav("/games")} badge={3}><BellIcon color={T.inkSoft} /></IconBtn>
        <button onClick={() => nav("/me")} className="cf-tap" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Avatar initial={me.initial} color={me.color} size={36} /></button>
      </div>
    </header>
  );
}

const NAV = [
  { id: "discover", label: "Discover", path: "/discover/clubs", Icon: CompassIcon, match: (r) => r.startsWith("/discover") },
  { id: "clubs", label: "Clubs", path: "/clubs", Icon: UsersIcon, match: (r) => r === "/clubs" || r.startsWith("/club/") },
  { id: "games", label: "Games", path: "/games", Icon: GamepadIcon, match: (r) => r === "/games" || r.startsWith("/fantasy") || r.startsWith("/lastlonger") || r.startsWith("/squares") || r === "/host-ft" },
  { id: "me", label: "Me", path: "/me", Icon: UserIcon, match: (r) => r === "/me" || r.startsWith("/member") || r === "/wallet" || r === "/admin" },
];
function BottomNav() {
  const { route, nav } = useApp();
  return (
    <nav style={{ position: "sticky", bottom: 0, zIndex: 30, display: "flex", alignItems: "center", height: 72, background: "rgba(9,17,13,.92)", backdropFilter: "blur(18px)", borderTop: `1px solid ${T.line}`, padding: "0 8px" }}>
      {NAV.map(({ id, label, path, Icon, match }) => {
        const on = match(route);
        return <button key={id} onClick={() => nav(path)} className="cf-tap" style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "8px 0" }}>
          <Icon color={on ? T.gold : T.inkMute} /><span style={{ fontSize: 11, fontWeight: 600, color: on ? T.gold : T.inkMute, fontFamily: FB }}>{label}</span>
        </button>;
      })}
    </nav>
  );
}

function Screen({ children, scroll = true }) {
  return <div style={{ flex: 1, overflowY: scroll ? "auto" : "hidden", WebkitOverflowScrolling: "touch" }}><div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 28px" }}>{children}</div></div>;
}
const H1 = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", margin: 0, color: T.ink }}>{children}</h1>
    {sub && <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: T.inkSoft }}>{sub}</p>}
  </div>
);
const Eyebrow = ({ children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 2px 12px" }}>
    <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T.inkMute }}>{children}</span>
    {action}
  </div>
);

/* ============================================================================
   SHARED: GAME CARD
   ============================================================================ */
function GameCard({ g, onOpen }) {
  const k = GAME_KIND[g.type];
  const live = g.status === "running";
  const meta = g.type === "ft"
    ? [["Buy-in", <Stakes value={g.buyin} size={14} label="" />], ["Pool", <Stakes value={g.pool} size={14} label="" />], ["Field", g.entered || "—"]]
    : g.type === "last"
    ? [["Buy-in", <Stakes value={g.buyin} size={14} label="" />], ["Pool", <Stakes value={g.pool} size={14} label="" />], ["Standing", g.standing || "—"]]
    : [["Buy-in", <Stakes value={g.buyin} size={14} label="" />], ["Pool", <Stakes value={g.pool} size={14} label="" />], ["Squares", g.capacity || "—"]];
  return (
    <button onClick={onOpen} className="cf-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", background: live ? "linear-gradient(150deg,#16291E,#11201A)" : T.card, border: `1px solid ${live ? "#36C98B33" : T.line}`, borderRadius: 18, padding: 16, position: "relative", overflow: "hidden", boxShadow: "0 6px 20px -14px rgba(0,0,0,.7)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Chip tone={k.tone}>{k.icon} {k.label}</Chip>
        {live ? <Live>RUNNING</Live> : g.state === "Completed" ? <Chip tone="neutral">✓ Completed</Chip> : <Chip tone="blue">Registration open</Chip>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15 }}>{g.clubEmoji}</span>
        <span style={{ fontSize: 13, color: T.inkMute }}>{g.club}</span>
      </div>
      <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: "-0.01em" }}>{g.title}</div>
      {g.sub && <div style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>{g.sub}</div>}
      <div style={{ display: "flex", marginTop: 14, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
        {meta.map(([key, val], i) => (
          <div key={key} style={{ flex: 1, borderLeft: i ? `1px solid ${T.line}` : "none", paddingLeft: i ? 12 : 0 }}>
            <div style={{ fontSize: 10, color: T.inkMute, fontFamily: FM, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>{key}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FD }}>{val}</div>
          </div>
        ))}
      </div>
      {(g.locks || g.closes || g.result) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          {g.result ? <span style={{ fontFamily: FM, fontSize: 12, color: T.gold }}>🏆 {g.result}</span>
            : <Countdown seconds={g.locks || g.closes} prefix={g.locks ? "🔒 Locks" : "⏳ Closes"} />}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: k.tone === "purple" ? T.purple : T.inkSoft }}>{g.status === "open" ? "Join" : "View"} <ArrowIcon color={k.tone === "purple" ? T.purple : T.inkSoft} /></span>
        </div>
      )}
    </button>
  );
}

/* ============================================================================
   ROUTE: / — HOME
   ============================================================================ */
function Home() {
  const { me, nav } = useApp();
  const [filter, setFilter] = useState("all");
  const open = MOCK.games.filter((g) => g.status === "open" || g.status === "playing");
  const shown = filter === "all" ? open : open.filter((g) => g.type === filter);
  return (
    <Screen>
      <Chip tone="gold" style={{ marginBottom: 12 }}>✦ Discover</Chip>
      <H1 sub="New clubs to join, and what's open in clubs you're in.">Hey {me.name.split(" ")[0]} 👋</H1>

      <Eyebrow action={<button onClick={() => nav("/discover/clubs")} className="cf-tap" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FB, fontSize: 13, fontWeight: 600, color: T.gold }}>See all →</button>}>Clubs to join</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK.discoverClubs.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 12 }}>
            <ClubBadge emoji={c.emoji} color={c.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 16 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: T.inkMute }}>📍 {c.city} · 👥 {c.members} members</div>
            </div>
            <button className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, background: T.surface, border: `1px solid ${T.line}`, color: T.ink, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13 }}>+ Request</button>
          </div>
        ))}
      </div>

      <Eyebrow action={<button onClick={() => nav("/games")} className="cf-tap" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FB, fontSize: 13, fontWeight: 600, color: T.gold }}>See all →</button>}>Open now in your clubs</Eyebrow>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
        {[["all","All"],["ft","FTF"],["last","LL"],["squares","Squares"]].map(([id, l]) => {
          const on = filter === id;
          return <button key={id} onClick={() => setFilter(id)} className="cf-tap" style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13, color: on ? T.bg : T.inkSoft, background: on ? T.gold : T.surface, border: `1px solid ${on ? T.gold : T.line}` }}>{l}</button>;
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {shown.map((g) => <GameCard key={g.id} g={g} onOpen={() => openGame(g, nav)} />)}
      </div>
    </Screen>
  );
}

function openGame(g, nav) {
  if (g.type === "ft") nav("/fantasy/ct_a");
  else if (g.type === "last") nav("/lastlonger/ll_demo");
  else nav("/squares/sq_demo");
}

/* ============================================================================
   ROUTE: /clubs — MY CLUBS
   ============================================================================ */
function Clubs() {
  const { me, nav } = useApp();
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", margin: 0 }}>My Clubs</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, background: T.surface, border: `1px solid ${T.line}`, color: T.ink, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13 }}>🎟 Join</button>
          <button className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, background: T.gold, border: "none", color: T.bg, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13 }}>+ Create</button>
        </div>
      </div>
      <Eyebrow>Clubs you're in</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK.clubs.map((c) => {
          const isHost = me.role !== "player" && (me.hostsClubs || []).includes(c.id);
          return (
            <button key={c.id} onClick={() => nav(`/club/${c.id}`)} className="cf-card" style={{ textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14, width: "100%" }}>
              <ClubBadge emoji={c.emoji} color={c.color} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: T.inkMute }}>📍 {c.city} · 👥 {c.members} members</div>
              </div>
              {isHost ? <Chip tone="gold">Manage</Chip> : <Chip tone="emerald">✓ Member</Chip>}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /discover/clubs — DISCOVER
   ============================================================================ */
function Discover() {
  const [q, setQ] = useState("");
  const list = MOCK.discoverClubs.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen>
      <H1 sub="Request to join — the host vets & admits you.">Clubs to join</H1>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "0 14px", marginBottom: 18 }}>
        <SearchIcon color={T.inkMute} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clubs or enter a code" style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "13px 0", fontFamily: FB, fontSize: 15, color: T.ink }} />
      </div>
      <Eyebrow>Clubs to join</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14 }}>
            <ClubBadge emoji={c.emoji} color={c.color} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: T.inkMute }}>📍 {c.city} · 👥 {c.members} members</div>
            </div>
            <button className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, background: T.surface, border: `1px solid ${T.line}`, color: T.ink, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13 }}>+ Request</button>
          </div>
        ))}
        {list.length === 0 && <Empty title="No clubs match" body="Try a different name, or paste an invite code to join directly." />}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /games — GAMES
   ============================================================================ */
const GAME_FILTERS = [["available","Available"],["playing","Playing"],["running","Running"],["done","Completed"]];
function Games() {
  const { nav } = useApp();
  const [f, setF] = useState("available");
  const [kind, setKind] = useState("all");
  const byStatus = (g) => f === "available" ? (g.status === "open") : f === "playing" ? (g.status === "playing") : f === "running" ? (g.status === "running") : (g.status === "done");
  const shown = MOCK.games.filter(byStatus).filter((g) => kind === "all" || g.type === kind);
  const count = (s) => MOCK.games.filter((g) => s === "available" ? g.status === "open" : s === "playing" ? g.status === "playing" : s === "running" ? g.status === "running" : g.status === "done").length;
  return (
    <Screen>
      <H1 sub="Everything happening across your clubs — all game types in one place.">Games</H1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto" }}>
        {[["all","All"],["ft","FTF"],["last","LL"],["squares","Squares"]].map(([id, l]) => {
          const on = kind === id;
          return <button key={id} onClick={() => setKind(id)} className="cf-tap" style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13, color: on ? T.bg : T.inkSoft, background: on ? T.gold : T.surface, border: `1px solid ${on ? T.gold : T.line}` }}>{l}</button>;
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {GAME_FILTERS.map(([id, l]) => {
          const on = f === id;
          return <button key={id} onClick={() => setF(id)} className="cf-tap" style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13, color: on ? T.emerald : T.inkSoft, background: on ? "#0F3327" : T.surface, border: `1px solid ${on ? "#36C98B44" : T.line}` }}>{l} <span style={{ opacity: .6, fontFamily: FM }}>{count(id)}</span></button>;
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {shown.map((g) => <GameCard key={g.id} g={g} onOpen={() => openGame(g, nav)} />)}
        {shown.length === 0 && <Empty title="Nothing here yet" body="When a club opens a game in this state, it'll show up here." />}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /club/:id — CLUB DETAIL
   ============================================================================ */
function ClubDetail({ id }) {
  const { me, nav } = useApp();
  const c = MOCK.clubs.find((x) => x.id === id) || MOCK.clubs[0];
  const [tab, setTab] = useState("games");
  const isHost = me.role !== "player" && (me.hostsClubs || []).includes(c.id);
  const clubGames = MOCK.games.filter((g) => g.club === c.name);
  return (
    <Screen>
      <BackLink onClick={() => nav("/clubs")} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, marginTop: 8 }}>
        <ClubBadge emoji={c.emoji} color={c.color} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, letterSpacing: "-0.01em", margin: 0 }}>{c.name}</h1>
            <Chip tone="neutral">🌐 {c.visibility}</Chip>
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>{c.members} members · hosted by <strong style={{ color: T.ink }}>{c.host}</strong></div>
          <div style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>📍 {c.city}</div>
        </div>
        <Chip tone="emerald">✓ Member</Chip>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: T.inkSoft, margin: "0 0 14px" }}>{c.tagline}</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <button className="cf-tap" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, background: "transparent", border: `1px solid ${T.blue}66`, color: T.blue, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 14 }}>✈ Join Telegram</button>
      </div>

      {isHost && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, border: "1px solid #E9C46A33", padding: 12, background: "linear-gradient(110deg,#1A3326,#13271C)", margin: "10px 0 16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, letterSpacing: "0.06em", textTransform: "uppercase" }}>Invite code</div>
            <div style={{ fontFamily: FM, fontSize: 18, fontWeight: 600, letterSpacing: "0.12em", color: T.gold }}>{c.code}</div>
          </div>
          {c.pending > 0 && <Chip tone="amber">{c.pending} pending</Chip>}
          <button className="cf-tap" style={{ borderRadius: 12, background: T.gold, border: "none", padding: "9px 14px", fontSize: 13, fontWeight: 600, color: T.bg, cursor: "pointer", fontFamily: FB }}>Manage</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, margin: "16px 0 14px", background: T.surface, padding: 4, borderRadius: 14, border: `1px solid ${T.line}` }}>
        {[["games","🎮 Games"],["leaderboard","🏆 Leaderboard"]].map(([id, l]) => {
          const on = tab === id;
          return <button key={id} onClick={() => setTab(id)} className="cf-tap" style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 14, color: on ? T.bg : T.inkSoft, background: on ? T.gold : "transparent", border: "none" }}>{l}</button>;
        })}
      </div>

      {tab === "games" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clubGames.length ? clubGames.map((g) => <GameCard key={g.id} g={g} onOpen={() => openGame(g, nav)} />)
            : <Empty title="No games yet" body="When a host opens a game in this club, it lands here." />}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK.member.history.slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${i === 0 ? T.gold : T.line}`, borderRadius: 14, padding: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: FD, fontWeight: 700, fontSize: 13, background: i < 3 ? T.gold : T.surface, color: i < 3 ? T.bg : T.inkSoft }}>{i + 1}</div>
              <Avatar name={MOCK.member.name} color={MOCK.member.color} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14 }}>{["Marco P", "Sam Rivers", "Anita K", "Deng L", "Sara V"][i]}</div>
                <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute }}>{[218, 195, 173, 140, 121][i]} pts</div>
              </div>
              {i === 0 && <span style={{ fontSize: 18 }}>🥇</span>}
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /fantasy — FANTASY CONTEST LIST
   ============================================================================ */
function Fantasy() {
  const { nav } = useApp();
  const fts = MOCK.games.filter((g) => g.type === "ft");
  return (
    <Screen>
      <Chip tone="purple" style={{ marginBottom: 12 }}>♠ FT FANTASY</Chip>
      <H1 sub="Draft a final table, score by where your picks finish.">Fantasy contests</H1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK.contests.map((ct) => (
          <button key={ct.id} onClick={() => nav(`/fantasy/${ct.id}`)} className="cf-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Chip tone="purple">♠ FT FANTASY</Chip><Chip tone="blue">{ct.state}</Chip>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span>{ct.clubEmoji}</span><span style={{ fontSize: 13, color: T.inkMute }}>{ct.club}</span></div>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{ct.title}</div>
            <div style={{ display: "flex", marginTop: 14, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
              {[["Buy-in", <Stakes value={ct.buyin} size={14} label="" />], ["Prize pool", <Stakes value={ct.stats.prizePool} size={14} label="" />], ["Field", ct.entered]].map(([k, v], i) => (
                <div key={k} style={{ flex: 1, borderLeft: i ? `1px solid ${T.line}` : "none", paddingLeft: i ? 12 : 0 }}>
                  <div style={{ fontSize: 10, color: T.inkMute, fontFamily: FM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Countdown seconds={ct.locks} prefix="🔒 Locks" />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: T.purple }}>Enter <ArrowIcon color={T.purple} /></span>
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /fantasy/:id — FANTASY CONTEST DETAIL (signature draft board)
   ============================================================================ */
function FantasyDetail({ id }) {
  const { me, nav } = useApp();
  const ct = MOCK.contests.find((x) => x.id === id) || MOCK.contests[0];
  const BUDGET = ct.budget;
  const [picks, setPicks] = useState([1, 6]);
  const spent = picks.reduce((s, seat) => s + ct.finalTable.find((f) => f.seat === seat).price, 0);
  const remaining = BUDGET - spent;
  const full = picks.length >= 4;
  const pct = Math.min(100, (spent / BUDGET) * 100);
  const toggle = (seat) => {
    if (picks.includes(seat)) return setPicks(picks.filter((p) => p !== seat));
    if (full) return;
    if (ct.finalTable.find((f) => f.seat === seat).price > remaining) return;
    setPicks([...picks, seat]);
  };
  return (
    <Screen>
      <BackLink onClick={() => nav("/fantasy")} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 }}>
        <span>{ct.clubEmoji}</span><span style={{ fontSize: 13, color: T.inkMute }}>{ct.club}</span><Chip tone="purple">Stack Draft</Chip>
      </div>
      <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em", margin: "0 0 4px" }}>{ct.title}</h1>
      <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 14 }}>👑 hosted by {ct.host}</div>

      {/* stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["🏆 Prize pool", <Stakes value={ct.stats.prizePool} size={16} />], ["🎟 Buy-in", <Stakes value={ct.stats.buyin} size={16} />], ["👥 Players left", ct.stats.playersLeft], ["▦ Avg stack", ct.stats.avgStack], ["🪙 Chips in play", ct.stats.chipsInPlay], ["🔥 Level", ct.stats.level]].map(([k, v]) => (
          <div key={k} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 15, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* closes banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(110deg,#0F3327,#11201A)", border: "1px solid #36C98B44", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FM, fontSize: 10, color: T.emerald, textTransform: "uppercase", letterSpacing: "0.06em" }}>Closes in</div>
          <div style={{ fontSize: 12, color: T.inkSoft }}>Draft locks when the clock hits zero</div>
        </div>
        <Countdown seconds={ct.locks} prefix="" />
      </div>

      {/* replay */}
      <button className="cf-tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "linear-gradient(110deg,#3A1C18,#11201A)", border: "1px solid #E5604F44", borderRadius: 14, padding: 12, marginBottom: 16, cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: T.red, display: "grid", placeItems: "center", flexShrink: 0 }}>▶</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase" }}>Replay · {ct.replay.label}</div>
          <div style={{ fontSize: 13, color: T.inkSoft }}>{ct.replay.note}</div>
        </div>
        <ArrowIcon color={T.inkMute} />
      </button>

      {/* budget meter */}
      <div style={{ position: "sticky", top: 8, zIndex: 5, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14, marginBottom: 14, boxShadow: "0 8px 24px -16px rgba(0,0,0,.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.06em" }}>Draft budget left</div>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, lineHeight: 1, color: remaining < BUDGET * 0.1 ? T.amber : T.gold }}>{fmtStakes(remaining)}<span style={{ fontSize: 12, color: T.inkMute, fontWeight: 500 }}> / {fmtStakes(BUDGET)}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.06em" }}>Picks</div>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, lineHeight: 1 }}>{picks.length}<span style={{ fontSize: 12, color: T.inkMute, fontWeight: 500 }}> / 4</span></div>
          </div>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "#0C1A13", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: `${pct}%`, borderRadius: 999, background: `linear-gradient(90deg,${T.goldDeep},${T.gold})`, transition: "width .35s cubic-bezier(.22,1,.36,1)", boxShadow: `0 0 12px ${T.goldFaint}` }} />
        </div>
      </div>

      <Eyebrow action={<Chip tone="purple">{ct.handed}</Chip>}>The final table</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ct.finalTable.map((f) => {
          const picked = picks.includes(f.seat);
          const blocked = !picked && (full || f.price > remaining);
          return (
            <button key={f.seat} onClick={() => toggle(f.seat)} disabled={blocked} className="cf-tap" style={{ textAlign: "left", cursor: blocked ? "not-allowed" : "pointer", width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: picked ? "linear-gradient(110deg,#2A2245,#14271C)" : T.card, border: `1px solid ${picked ? T.purple : T.line}`, opacity: blocked ? 0.45 : 1 }}>
              <div style={{ width: 36, fontFamily: FM, fontSize: 13, color: T.inkMute, textAlign: "center", flexShrink: 0 }}>{f.seat}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: FM, fontSize: 10, color: T.inkMute }}>{f.country}</span>
                  <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 15, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: "#0C1A13", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${f.pct * 100}%`, background: picked ? T.purple : T.blue, borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 14 }}>{f.bb} <span style={{ fontSize: 10, color: T.inkMute }}>BB</span></div>
                <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute }}>{f.chips}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 52 }}>
                <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 14, color: picked ? T.purple : T.gold }}>{fmtStakes(f.price)}</div>
                <div style={{ fontFamily: FM, fontSize: 9, color: T.inkMute }}>ICM price</div>
              </div>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: T.inkMute, marginTop: 12, lineHeight: 1.5 }}>Stacks & chip counts are live from the broadcast. Price is the ICM draft cost, set server-side.</p>

      {/* enter CTA */}
      <button className="cf-tap" style={{ width: "100%", marginTop: 14, padding: 16, borderRadius: 16, border: "none", cursor: "pointer", fontFamily: FD, fontWeight: 700, fontSize: 16, color: full ? T.bg : T.inkMute, background: full ? `linear-gradient(100deg,${T.gold},${T.goldDeep})` : T.surface, boxShadow: full ? "0 10px 30px -10px rgba(233,196,106,0.33)" : "none" }}>
        {full ? `Request to enter · ${ct.buyin} cr` : `Pick ${4 - picks.length} more to enter`}
      </button>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /host-ft — HOST FINAL TABLE  (host + admin only)
   ============================================================================ */
function HostFT() {
  const { nav } = useApp();
  return (
    <Screen>
      <BackLink onClick={() => nav("/")} />
      <div style={{ marginTop: 8 }}>
        <H1 sub="The operator's upcoming, ICM-priced final tables. Pick one to review the table, then host it in your club.">🎯 Choose a Final Table</H1>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK.hostFinalTables.map((ft) => (
          <div key={ft.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Chip tone="purple">{ft.club}</Chip>
              <span style={{ fontFamily: FM, fontSize: 12, color: T.inkMute }}>{ft.when}</span>
            </div>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{ft.title}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>🏆 <Stakes value={ft.prize} size={13} label="" /></span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>🎟 <Stakes value={ft.buyin} size={13} label="" /></span>
              </div>
              <span style={{ fontFamily: FM, fontSize: 12, color: T.inkMute }}>⏱ {ft.eta}</span>
            </div>
            <button className="cf-tap" style={{ width: "100%", marginTop: 14, padding: 12, borderRadius: 12, border: "none", cursor: "pointer", fontFamily: FD, fontWeight: 700, fontSize: 14, color: T.bg, background: `linear-gradient(100deg,${T.gold},${T.goldDeep})` }}>Review & host this table →</button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /lastlonger — LAST LONGER LIST
   ============================================================================ */
function LastLonger() {
  const { nav } = useApp();
  const lls = MOCK.games.filter((g) => g.type === "last");
  return (
    <Screen>
      <Chip tone="amber" style={{ marginBottom: 12 }}>◆ LAST LONGER</Chip>
      <H1 sub="Outlast the table. Last player standing takes the pool.">Last Longer games</H1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lls.map((g) => <GameCard key={g.id} g={g} onOpen={() => nav("/lastlonger/ll_demo")} />)}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /lastlonger/:id — LAST LONGER GAME DETAIL
   ============================================================================ */
function LastLongerGame() {
  const { nav } = useApp();
  const g = MOCK.lastLongerGame;
  const alive = g.players.filter((p) => p.alive);
  return (
    <Screen>
      <BackLink onClick={() => nav("/lastlonger")} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 }}>
        <Chip tone="amber">◆ LAST LONGER</Chip><Live>RUNNING</Live>
      </div>
      <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, margin: "0 0 4px" }}>{g.title}</h1>
      <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 16 }}>{g.club}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "linear-gradient(110deg,#3A2C12,#11201A)", border: "1px solid #E9A23B44", borderRadius: 16, padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: T.amber, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pot</div>
          <Stakes value={g.pot} size={26} color={T.gold} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.06em" }}>Still alive</div>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: T.emerald }}>{alive.length}<span style={{ fontSize: 13, color: T.inkMute }}> / {g.players.length}</span></div>
        </div>
      </div>

      <Eyebrow>Players</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {g.players.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: p.alive ? T.card : T.bgDeep, border: `1px solid ${p.alive ? "#36C98B33" : T.line}`, borderRadius: 14, padding: 12, opacity: p.alive ? 1 : 0.6 }}>
            <Avatar name={p.name} initial={p.initial} color={p.color} size={38} />
            <div style={{ flex: 1, fontFamily: FD, fontWeight: 600, fontSize: 15, textDecoration: p.alive ? "none" : "line-through", color: p.alive ? T.ink : T.inkMute }}>{p.name}</div>
            {p.alive ? <Chip tone="emerald">● Still in</Chip> : <Chip tone="neutral">Knocked out</Chip>}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.inkMute, marginTop: 14, textAlign: "center", lineHeight: 1.5, padding: 12, background: T.bgDeep, borderRadius: 12, border: `1px solid ${T.line}` }}>{g.settlement}. Settlement is server-side; players settle Stakes between themselves.</p>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /squares/:id — SQUARES GAME (10×10 grid)
   ============================================================================ */
function SquaresGame() {
  const { me, nav } = useApp();
  const g = MOCK.squaresGame;
  const nums = [3, 0, 7, 4, 1, 8, 5, 2, 9, 6]; // assigned-at-lock digits (display only)
  return (
    <Screen>
      <BackLink onClick={() => nav("/games")} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 }}>
        <Chip tone="emerald">▦ SQUARES</Chip><Chip tone="blue">Registration open</Chip>
      </div>
      <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, margin: "0 0 4px" }}>{g.title}</h1>
      <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 14 }}>{g.club} · {g.claimed}/100 squares claimed</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(110deg,#0F3327,#11201A)", border: "1px solid #36C98B44", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <div><div style={{ fontFamily: FM, fontSize: 10, color: T.emerald, textTransform: "uppercase" }}>Pool</div><Stakes value={g.pot} size={22} color={T.gold} /></div>
        <Chip tone="emerald">Payouts: Q1 · Q2 · Q3 · Final</Chip>
      </div>

      {/* grid */}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "inline-block", minWidth: 360 }}>
          {/* top axis (teamX) */}
          <div style={{ display: "flex", marginBottom: 4 }}>
            <div style={{ width: 28, flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "center", fontFamily: FD, fontWeight: 700, fontSize: 12, color: T.emerald, paddingLeft: 4 }}>← {g.teamX} →</div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: 28, flexShrink: 0 }} />
            <div style={{ display: "flex", flex: 1, gap: 3, marginBottom: 3, paddingLeft: 4 }}>
              {nums.map((n, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: FM, fontSize: 11, fontWeight: 600, color: T.inkMute }}>{n}</div>)}
            </div>
          </div>
          {/* rows */}
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 28, flexShrink: 0 }}>
              <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 12, color: T.blue, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>← {g.teamY} →</span>
            </div>
            <div style={{ flex: 1, paddingLeft: 4 }}>
              {nums.map((rowNum, r) => (
                <div key={r} style={{ display: "flex", gap: 3, marginBottom: 3, alignItems: "center" }}>
                  <div style={{ width: 14, fontFamily: FM, fontSize: 11, fontWeight: 600, color: T.inkMute, textAlign: "center", flexShrink: 0 }}>{rowNum}</div>
                  {nums.map((_, c) => {
                    const key = `${r}-${c}`;
                    const owner = g.owners[key];
                    const oc = owner && g.ownerColors[owner];
                    const mine = owner === me.initial;
                    return (
                      <div key={c} style={{ flex: 1, aspectRatio: "1", minWidth: 26, borderRadius: 6, display: "grid", placeItems: "center", fontFamily: FM, fontSize: 9, fontWeight: 700, background: owner ? oc : T.surface, border: `1px solid ${mine ? T.gold : owner ? "transparent" : T.line}`, color: owner ? "#fff" : T.inkMute, cursor: owner ? "default" : "pointer" }} className={owner ? "" : "cf-tap"}>
                        {owner || ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: T.inkMute, marginTop: 8, lineHeight: 1.5 }}>Row & column digits are assigned at lock, server-side. Tap an open square to claim it (costs {g.pot ? "buy-in" : "—"} Stakes). Gold border = your squares.</p>
      <button className="cf-tap" style={{ width: "100%", marginTop: 12, padding: 16, borderRadius: 16, border: "none", cursor: "pointer", fontFamily: FD, fontWeight: 700, fontSize: 16, color: T.bg, background: `linear-gradient(100deg,${T.gold},${T.goldDeep})` }}>Claim a square · 50 cr</button>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /me — PROFILE
   ============================================================================ */
const SKINS = [["engine","Midnight","Dark & focused","#5AA9E6","#11201A"],["clarivue","Clarivue","Calm analytical SaaS","#2563EB","#fff"],["terminal","Terminal","Pro data-tool, light","#7C5CFC","#fff"],["felt","Felt","Premium poker, mod…","#36C98B","#11201A"],["pulse","Pulse","Friendly, rec-player-fi…","#A98BE6","#fff"],["edge","Edge","High-contrast, one ac…","#E5604F","#fff"]];
const DEMO_ACCOUNTS = [["u_player","Player","👤"],["u_host","Aces High Host","👑"],["u_admin","App Admin","🛡"]];
function Me() {
  const { me, setRole, nav } = useApp();
  const [skin, setSkin] = useState("felt");
  return (
    <Screen>
      <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", margin: "0 0 16px" }}>Me</h1>
      {/* profile card */}
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 16, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initial={me.initial} color={me.color} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 19 }}>{me.name}</div>
            <div style={{ fontSize: 13, color: T.inkMute }}>📍 {me.city}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button className="cf-tap" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: T.blue, fontFamily: FB, fontWeight: 600, fontSize: 13 }}>✎ Edit</button>
            <Chip tone={me.role === "admin" ? "purple" : me.role === "host" ? "emerald" : "blue"}>{me.role}</Chip>
          </div>
        </div>
        {/* email verify row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.inkSoft, overflow: "hidden", textOverflow: "ellipsis" }}>{me.email}</div>
            {me.emailVerified
              ? <Chip tone="emerald" style={{ marginTop: 6 }}>✓ Verified</Chip>
              : <Chip tone="amber" style={{ marginTop: 6 }}>⚠ Unverified</Chip>}
          </div>
          {!me.emailVerified && <button className="cf-tap" style={{ padding: "9px 14px", borderRadius: 12, background: T.gold, border: "none", color: T.bg, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 13 }}>Verify email</button>}
        </div>
      </div>

      <Eyebrow>Wallet</Eyebrow>
      <button onClick={() => nav("/wallet")} className="cf-card" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14, cursor: "pointer" }}>
        <span style={{ fontSize: 22 }}>🪙</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 16 }}>Credits</div>
          <div style={{ fontSize: 13, color: T.inkMute }}>Buy credits · transaction history</div>
        </div>
        <span style={{ fontFamily: FM, fontWeight: 600, color: T.gold }}>{me.credits.toLocaleString()}</span>
        <ArrowIcon color={T.inkMute} />
      </button>

      <Eyebrow>Appearance</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {SKINS.map(([id, name, desc, dot, sw]) => {
          const on = skin === id;
          return <button key={id} onClick={() => setSkin(id)} className="cf-tap" style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: 12, borderRadius: 14, cursor: "pointer", background: T.card, border: `1px solid ${on ? T.gold : T.line}` }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: sw, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", flexShrink: 0 }}><div style={{ width: 10, height: 10, borderRadius: 999, background: dot }} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>{name}{on && <span style={{ color: T.gold }}>✓</span>}</div>
              <div style={{ fontSize: 11, color: T.inkMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
            </div>
          </button>;
        })}
      </div>

      <Eyebrow>Switch demo account</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {DEMO_ACCOUNTS.map(([id, label, icon]) => {
          const on = me.id === id;
          return <button key={id} onClick={() => setRole(id)} className="cf-tap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 12px", borderRadius: 14, cursor: "pointer", background: T.card, border: `1px solid ${on ? T.gold : T.line}` }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 13, color: on ? T.gold : T.ink }}>{label}</span>
          </button>;
        })}
        {me.role === "admin" && <div style={{ gridColumn: "1 / -1", fontSize: 11, color: T.inkMute, textAlign: "center", padding: 4 }}>Admin can act as any role to preview gating.</div>}
      </div>

      <button className="cf-tap" style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 14, cursor: "pointer", background: "linear-gradient(110deg,#3A1C18,#11201A)", border: "1px solid #E5604F44", color: T.red, fontFamily: FD, fontWeight: 700, fontSize: 15 }}>⤴ Sign out</button>
      <p style={{ textAlign: "center", fontSize: 11, color: T.inkMute, marginTop: 14 }}>Clubr prototype · "Felt" skin · mock data behind a swappable API.</p>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /wallet — WALLET
   ============================================================================ */
function Wallet() {
  const { nav } = useApp();
  const w = MOCK.wallet;
  return (
    <Screen>
      <BackLink onClick={() => nav("/me")} />
      <div style={{ marginTop: 8 }}><h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", margin: "0 0 16px" }}>🪙 Wallet</h1></div>

      <div style={{ background: "linear-gradient(135deg,#1A3326,#11201A)", border: "1px solid #E9C46A44", borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your credits</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 26 }}>🪙</span>
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 40, color: T.ink, lineHeight: 1 }}>{w.balance.toLocaleString()}</span>
        </div>
        <p style={{ fontSize: 13, color: T.inkSoft, margin: "12px 0 0", lineHeight: 1.5 }}>Credits cover joining, creating & hosting. They're a facilitation fee — never a prize, and never cash.</p>
      </div>

      <Eyebrow>Buy credits</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {w.packages.map((p) => (
          <div key={p.cr} style={{ background: T.card, border: `1px solid ${p.tag === "Best value" ? T.gold : T.line}`, borderRadius: 16, padding: 14, position: "relative" }}>
            {p.tag && <div style={{ position: "absolute", top: 12, right: 12 }}><Chip tone={p.tag === "Best value" ? "gold" : "amber"}>{p.tag}</Chip></div>}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>🪙</span><span style={{ fontFamily: FD, fontWeight: 700, fontSize: 20 }}>{p.cr.toLocaleString()}</span></div>
            <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 12 }}>{p.label}</div>
            <button className="cf-tap" style={{ width: "100%", padding: 10, borderRadius: 10, cursor: "pointer", background: "#3A2C12", border: "1px solid #E9A23B44", color: T.gold, fontFamily: FD, fontWeight: 700, fontSize: 15 }}>{p.price}</button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: T.inkMute, margin: "10px 0 0" }}>Packages are set by the app operator. Purchases are mock in this prototype.</p>

      <Eyebrow>History</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {w.tx.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0, background: t.dir === "in" ? "#0F3327" : T.surface, color: t.dir === "in" ? T.emerald : T.inkMute }}>{t.dir === "in" ? "↗" : "↘"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14 }}>{t.label}</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute }}>{t.when}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FM, fontSize: 14, fontWeight: 600, color: t.amt >= 0 ? T.emerald : T.ink }}>{t.amt >= 0 ? "+" : ""}{t.amt.toLocaleString()}</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute }}>{t.bal.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /admin — ADMIN CONSOLE  (admin only)
   ============================================================================ */
function Admin() {
  const a = MOCK.admin;
  const [tab, setTab] = useState("clubs");
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ color: T.purple, fontSize: 20 }}>🛡</span><h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, margin: 0 }}>Admin console</h1></div>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 16px" }}>Everything on the platform — all clubs and all users.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}><div style={{ fontFamily: FD, fontWeight: 700, fontSize: 26 }}>🏠 {a.stats.clubs}</div><div style={{ fontSize: 13, color: T.inkMute }}>Clubs</div></div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}><div style={{ fontFamily: FD, fontWeight: 700, fontSize: 26 }}>👥 {a.stats.users}</div><div style={{ fontSize: 13, color: T.inkMute }}>Users</div></div>
      </div>

      <Eyebrow action={<button className="cf-tap" style={{ padding: "6px 12px", borderRadius: 10, background: T.surface, border: `1px solid ${T.line}`, color: T.inkSoft, fontFamily: FB, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Save costs</button>}>Economy · credits per action</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["Join game", a.economy.joinGame], ["Create club", a.economy.createClub], ["Host game", a.economy.hostGame]].map(([k, v]) => (
          <div key={k} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 20, color: T.gold }}>{v}</div>
            <div style={{ fontSize: 11, color: T.inkMute }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, background: T.bgDeep, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12 }}>
        <div style={{ fontFamily: FM, fontSize: 10, color: T.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Leaderboard formula</div>
        <code style={{ fontFamily: FM, fontSize: 13, color: T.emerald }}>{a.leaderboardFormula}</code>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "20px 0 14px", background: T.surface, padding: 4, borderRadius: 14, border: `1px solid ${T.line}` }}>
        {[["clubs","All clubs"],["users","All users"]].map(([id, l]) => {
          const on = tab === id;
          return <button key={id} onClick={() => setTab(id)} className="cf-tap" style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: FB, fontWeight: 600, fontSize: 14, color: on ? T.bg : T.inkSoft, background: on ? T.gold : "transparent", border: "none" }}>{l}</button>;
        })}
      </div>

      {tab === "clubs" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {a.allClubs.map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: T.surface, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute }}>{c.host} · code {c.code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FM, fontSize: 12, color: T.inkSoft }}>{c.members} members</div>
                {c.pending > 0 && <Chip tone="amber" style={{ marginTop: 4 }}>{c.pending} pending</Chip>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {a.allUsers.map((u) => (
            <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}>
              <Avatar name={u.name} initial={u.initial} color={u.color} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontFamily: FM, fontSize: 11, color: T.inkMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email} · {u.city}</div>
              </div>
              <Chip tone={u.role === "admin" ? "purple" : u.role === "host" ? "emerald" : "blue"}>{u.role}</Chip>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* ============================================================================
   ROUTE: /member/:id — MEMBER PROFILE
   ============================================================================ */
function Member() {
  const { nav } = useApp();
  const m = MOCK.member;
  const stateTone = { open: "blue", locked: "amber", settled: "neutral", live: "emerald", completed: "neutral" };
  return (
    <Screen>
      <BackLink onClick={() => nav("/")} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, marginBottom: 16 }}>
        <Avatar name={m.name} initial={m.initial} color={m.color} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, margin: 0 }}>{m.name}</h1>
          <div style={{ fontSize: 13, color: T.inkMute }}>@{m.handle} · 📍 {m.city}</div>
        </div>
        <Chip tone="blue">{m.role}</Chip>
      </div>
      <div style={{ fontSize: 12, color: T.inkMute, background: T.bgDeep, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, marginBottom: 18, lineHeight: 1.5 }}>🔒 Contact details are visible only to the host/admin of a club this member is in.</div>

      <Eyebrow>Track record</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: T.purple }}>♠</span><span style={{ fontFamily: FD, fontWeight: 700, fontSize: 24 }}>{m.ftPlayed}</span></div>
          <div style={{ fontSize: 13, color: T.inkMute }}>FT Fantasy played</div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: T.amber }}>◆</span><span style={{ fontFamily: FD, fontWeight: 700, fontSize: 24 }}>{m.llPlayed}</span></div>
          <div style={{ fontSize: 13, color: T.inkMute }}>Last Longers played</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.inkMute, margin: "10px 2px 0", lineHeight: 1.5 }}>Lifetime totals. The games below are only those you can see (your clubs).</p>

      <Eyebrow>Clubs</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {m.clubs.map(([emoji, name]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 18 }}>{emoji}</span><span style={{ fontFamily: FD, fontWeight: 600, fontSize: 15 }}>{name}</span>
          </div>
        ))}
      </div>

      <Eyebrow>History</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {m.history.map((h, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}>
            <span style={{ color: h.type === "ft" ? T.purple : T.amber, fontSize: 16, flexShrink: 0 }}>{h.type === "ft" ? "♠" : "◆"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
              <div style={{ fontSize: 12, color: T.inkMute }}>{h.club} · {h.state}</div>
            </div>
            <Chip tone={stateTone[h.state] || "neutral"}>{h.badge}</Chip>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ============================================================================
   SHARED BITS
   ============================================================================ */
function BackLink({ onClick }) {
  return <button onClick={onClick} className="cf-tap" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: T.inkSoft, fontFamily: FB, fontWeight: 600, fontSize: 15, padding: 0 }}><BackIcon color={T.inkSoft} /> Back</button>;
}
function Empty({ title, body }) {
  return <div style={{ borderRadius: 18, border: `1px dashed ${T.line}`, background: T.card, padding: "32px 20px", textAlign: "center" }}>
    <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 16 }}>{title}</div>
    <p style={{ fontSize: 13, color: T.inkMute, margin: "6px auto 0", maxWidth: 280, lineHeight: 1.5 }}>{body}</p>
  </div>;
}
function Gate({ children }) {
  return <Screen><div style={{ marginTop: 40, borderRadius: 18, border: `1px dashed ${T.line}`, background: T.card, padding: "40px 20px", textAlign: "center" }}>
    <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
    <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 18 }}>{children}</div>
    <p style={{ fontSize: 13, color: T.inkMute, margin: "8px auto 0", maxWidth: 300, lineHeight: 1.5 }}>This area is role-gated. Switch demo account in Me to preview it.</p>
  </div></Screen>;
}

/* ============================================================================
   ROOT — router + role state
   ============================================================================ */
export default function ClubrFelt() {
  useFonts();
  const [route, nav] = useHashRoute();
  const [roleId, setRoleId] = useState("u_player");
  const me = MOCK.users[roleId];
  const setRole = (id) => setRoleId(id);

  // role gating
  const guarded = useMemo(() => {
    if (route === "/host-ft" && me.role === "player") return "host";
    if (route === "/admin" && me.role !== "admin") return "admin";
    return null;
  }, [route, me.role]);

  let page;
  if (guarded === "host") page = <Gate>Hosts only</Gate>;
  else if (guarded === "admin") page = <Gate>Admins only</Gate>;
  else if (route === "/") page = <Home />;
  else if (route === "/clubs") page = <Clubs />;
  else if (route.startsWith("/discover")) page = <Discover />;
  else if (route === "/games") page = <Games />;
  else if (route.startsWith("/club/")) page = <ClubDetail id={route.split("/")[2]} />;
  else if (route === "/fantasy") page = <Fantasy />;
  else if (route.startsWith("/fantasy/")) page = <FantasyDetail id={route.split("/")[2]} />;
  else if (route === "/host-ft") page = <HostFT />;
  else if (route === "/lastlonger") page = <LastLonger />;
  else if (route.startsWith("/lastlonger/")) page = <LastLongerGame />;
  else if (route.startsWith("/squares/")) page = <SquaresGame />;
  else if (route === "/me") page = <Me />;
  else if (route === "/wallet") page = <Wallet />;
  else if (route === "/admin") page = <Admin />;
  else if (route.startsWith("/member")) page = <Member />;
  else page = <Home />;

  return (
    <AppCtx.Provider value={{ me, role: me.role, setRole, route, nav }}>
      <div style={{ minHeight: "100vh", background: T.bgDeep, display: "flex", justifyContent: "center", fontFamily: FB, color: T.ink }}>
        <style>{`
          @keyframes cf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
          .cf-tap{transition:transform .12s ease, background .15s ease, box-shadow .15s ease, border-color .2s ease}
          .cf-tap:active{transform:scale(.97)}
          .cf-card{transition:transform .15s ease, border-color .2s ease, box-shadow .2s ease}
          .cf-card:active{transform:scale(.99)}
          *{box-sizing:border-box}
          ::-webkit-scrollbar{width:0;height:0}
          *{-webkit-tap-highlight-color:transparent}
          input::placeholder{color:${T.inkMute}}
          @media (prefers-reduced-motion: reduce){.cf-tap,.cf-card{transition:none}.cf-pulse{animation:none}}
        `}</style>
        <div style={{ width: 440, maxWidth: "100%", minHeight: "100vh", background: T.bg, position: "relative", display: "flex", flexDirection: "column", boxShadow: "0 0 80px rgba(0,0,0,.6)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, top: 0, height: 200, pointerEvents: "none", background: `radial-gradient(120% 60% at 50% -20%, #1A332644 0%, transparent 70%)` }} />
          <TopBar />
          {page}
          <BottomNav />
        </div>
      </div>
    </AppCtx.Provider>
  );
}

/* ============================================================================
   ICONS
   ============================================================================ */
const ic = { width: 22, height: 22, fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
function CompassIcon({ color }) { return <svg {...ic} viewBox="0 0 24 24" stroke={color}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>; }
function UsersIcon({ color }) { return <svg {...ic} viewBox="0 0 24 24" stroke={color}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a5 5 0 0 0-3.5-4.8"/></svg>; }
function GamepadIcon({ color }) { return <svg {...ic} viewBox="0 0 24 24" stroke={color}><path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="10.5" r="0.6" fill={color}/><circle cx="17.5" cy="12.5" r="0.6" fill={color}/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>; }
function UserIcon({ color }) { return <svg {...ic} viewBox="0 0 24 24" stroke={color}><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>; }
function BellIcon({ color }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>; }
function ArrowIcon({ color }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
function BackIcon({ color }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>; }
function SearchIcon({ color }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>; }
