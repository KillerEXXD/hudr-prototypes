
import React, { useEffect, useMemo, useState } from "react";

const BRAND = "RangePilot";
const STYLE = "Study Board";

const tournaments = [
  { id:"t1", name:"WSOP Monster Stack FT", series:"WSOP", buyin:"$1,500", stage:"Final Table", date:"2025-07-14", pool:"$10.2M", tags:["ICM","FT","YouTube"] },
  { id:"t2", name:"WPT Bay 101 Main Event FT", series:"WPT", buyin:"$5,300", stage:"Final Table", date:"2025-03-09", pool:"$5.8M", tags:["FT","Deep"] },
  { id:"t3", name:"Hustler Invitational Day 2", series:"HCL", buyin:"Cash Game", stage:"Session", date:"2025-09-02", pool:"-", tags:["Stream","Highlights"] }
];

const players = [
  {id:"p1", name:"Seth Davies", country:"US", exploit:78, conf:"High", hands:3842, fts:17, vpip:21, pfr:17, threebet:6, ftAgg:"Medium", style:"TAG / ICM cautious"},
  {id:"p2", name:"Alex Foxen", country:"US", exploit:55, conf:"Medium", hands:1620, fts:8, vpip:24, pfr:20, threebet:8, ftAgg:"High", style:"Balanced aggressive"},
  {id:"p3", name:"Chris Brewer", country:"US", exploit:69, conf:"Medium", hands:980, fts:6, vpip:27, pfr:22, threebet:9, ftAgg:"High", style:"LAG pressure"},
  {id:"p4", name:"J. Kenney", country:"US", exploit:61, conf:"Low", hands:540, fts:4, vpip:22, pfr:18, threebet:7, ftAgg:"Medium", style:"Adaptive"}
];

const hands = [
  {id:18, t:"t1", tag:"Turning Point", street:"Preflop", pot:"$2.75M", spot:"20bb jam/call", yt:"1:23:51", score:92, players:["p1","p4"]},
  {id:23, t:"t1", tag:"ICM Overfold", street:"Flop", pot:"$1.10M", spot:"BB vs BTN", yt:"1:41:07", score:88, players:["p1","p2"]},
  {id:31, t:"t1", tag:"River Bluff", street:"River", pot:"$850K", spot:"Polar jam", yt:"1:58:11", score:75, players:["p2","p3"]},
  {id:36, t:"t1", tag:"Thin Value", street:"River", pot:"$640K", spot:"Block bet raise", yt:"2:07:04", score:69, players:["p2","p4"]},
  {id:44, t:"t1", tag:"ICM Ladder", street:"Preflop", pot:"$500K", spot:"Fold vs reshove", yt:"2:23:42", score:81, players:["p1","p3"]}
];

const highlights = [
  {id:"h1", hand:18, title:"Biggest all-in collision", type:"Video+Animated", impact:"High"},
  {id:"h2", hand:23, title:"BB overfold under ICM pressure", type:"Animated+AI", impact:"High"},
  {id:"h3", hand:31, title:"River jam bluff sequence", type:"YouTube+AI", impact:"Medium"},
  {id:"h4", hand:44, title:"ICM ladder fold decision", type:"Animated", impact:"High"}
];

const evidenceByPlayer = {
  p1: [
    {hand:23, leak:"Overfolds BB vs BTN", evidence:"68% fold vs 52% population", sample:"421 nodes", conf:"High"},
    {hand:31, leak:"Under-bluffs river", evidence:"18% vs 31% population", sample:"97 nodes", conf:"Medium"},
    {hand:44, leak:"Reshove hesitation 15-22bb", evidence:"Under-jams in FT ICM spots", sample:"61 nodes", conf:"Medium"},
  ],
  p2: [
    {hand:36, leak:"Thin value over-extension", evidence:"Value density too high on paired boards", sample:"48 nodes", conf:"Low"},
  ],
  p3: [
    {hand:31, leak:"Pressure-heavy river frequencies", evidence:"Overpolarizes vs capped ranges", sample:"53 nodes", conf:"Medium"},
  ],
  p4: []
};

const reportTemplates = [
  {id:"r1", name:"Exploit Report", sections:["Executive Summary","Leak Table","Evidence Hands","Counter Strategy","ICM Notes","Action Checklist"]},
  {id:"r2", name:"Tournament Debrief", sections:["Turning Points","Player Map","Highlights","Replay Index","AI Summary"]},
  {id:"r3", name:"Opponent Prep Sheet", sections:["Preflop","Postflop","ICM","Do/Don't","Hand Examples"]}
];

function useHashRoute() {
  const parse = () => {
    const raw = (window.location.hash || "#/onboarding").slice(2);
    const [path, qs] = raw.split("?");
    return { path: path || "onboarding", params: new URLSearchParams(qs || "") };
  };
  const [r, setR] = useState(parse());
  useEffect(() => {
    const fn = () => setR(parse());
    window.addEventListener("hashchange", fn);
    if (!window.location.hash) window.location.hash = "/onboarding";
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const go = (path, params={}) => {
    const q = new URLSearchParams(params).toString();
    window.location.hash = `/${path}${q ? "?" + q : ""}`;
  };
  return [r, go];
}

const routes = [
  ["onboarding","Onboarding"],
  ["search","Tournament Search"],
  ["tournament-home","Tournament Home"],
  ["tournament-overview","Overview"],
  ["timeline","Timeline"],
  ["hands-explorer","Hands Explorer"],
  ["hand-detail","Hand Detail"],
  ["replay-center","Replay Center"],
  ["players","Players"],
  ["player-detail","Player Detail"],
  ["player-compare","Compare"],
  ["ai-studio","AI Studio"],
  ["ai-answer","AI Answer"],
  ["evidence-chain","Evidence Chain"],
  ["highlights","Highlights"],
  ["report-builder","Report Builder"],
  ["exploit-report","Exploit Report"],
  ["watchlist","Watchlist"],
  ["notes","Notes"],
  ["settings","Settings"]
];

const tone = (n) => n >= 75 ? "danger" : n >= 60 ? "warn" : "good";
const selectedTournament = tournaments[0];

export default function App(){
  const [route, go] = useHashRoute();
  const [query, setQuery] = useState("");
  const [aiScope, setAiScope] = useState("tournament");
  const [replayMode, setReplayMode] = useState("animated");
  const [split, setSplit] = useState("insights");
  const handId = Number(route.params.get("hand") || 18);
  const playerId = route.params.get("player") || "p1";
  const qId = route.params.get("qid") || "q1";
  const hand = useMemo(()=>hands.find(h=>h.id===handId) || hands[0], [handId]);
  const player = useMemo(()=>players.find(p=>p.id===playerId) || players[0], [playerId]);
  const compareA = route.params.get("a") || "p1";
  const compareB = route.params.get("b") || "p3";
  const pA = players.find(p=>p.id===compareA) || players[0];
  const pB = players.find(p=>p.id===compareB) || players[2];

  return (
    <div className={`app ${STYLE.toLowerCase().replace(/\s+/g,'-')}`}>
      <TopBar go={go} />
      <div className="shell">
        <SideNav route={route.path} go={go} />
        <main className="main">
          {route.path === "onboarding" && <Onboarding go={go} />}
          {route.path === "search" && <SearchPage go={go} query={query} setQuery={setQuery} />}
          {route.path === "tournament-home" && <TournamentHome go={go} />}
          {route.path === "tournament-overview" && <TournamentOverview go={go} />}
          {route.path === "timeline" && <TimelinePage go={go} />}
          {route.path === "hands-explorer" && <HandsExplorer go={go} />}
          {route.path === "hand-detail" && <HandDetail go={go} hand={hand} replayMode={replayMode} setReplayMode={setReplayMode} split={split} setSplit={setSplit} />}
          {route.path === "replay-center" && <ReplayCenter go={go} hand={hand} replayMode={replayMode} setReplayMode={setReplayMode} />}
          {route.path === "players" && <PlayersPage go={go} />}
          {route.path === "player-detail" && <PlayerDetail go={go} player={player} />}
          {route.path === "player-compare" && <PlayerCompare go={go} a={pA} b={pB} />}
          {route.path === "ai-studio" && <AIStudio go={go} aiScope={aiScope} setAiScope={setAiScope} hand={hand} player={player} />}
          {route.path === "ai-answer" && <AIAnswer go={go} qId={qId} hand={hand} player={player} />}
          {route.path === "evidence-chain" && <EvidenceChain go={go} player={player} />}
          {route.path === "highlights" && <HighlightsPage go={go} />}
          {route.path === "report-builder" && <ReportBuilder go={go} />}
          {route.path === "exploit-report" && <ExploitReport go={go} player={player} />}
          {route.path === "watchlist" && <WatchlistPage go={go} />}
          {route.path === "notes" && <NotesPage go={go} />}
          {route.path === "settings" && <SettingsPage />}
          {!routes.find(r=>r[0]===route.path) && <Card title="Route not found"><button className="btn" onClick={()=>go("onboarding")}>Go home</button></Card>}
        </main>
        <RightRail go={go} player={player} hand={hand} />
      </div>
      <MobileNav go={go} />
    </div>
  );
}

function TopBar({go}) {
  return (
    <header className="topbar">
      <div className="brandBlock">
        <div className="logo">{BRAND[0]}</div>
        <div>
          <div className="brand">{BRAND}</div>
          <div className="subbrand">Full-Fledged Clickable UX Prototype · {STYLE}</div>
        </div>
      </div>
      <div className="topMeta">
        <span>{selectedTournament.name}</span>
        <span>{selectedTournament.stage}</span>
        <span>{selectedTournament.date}</span>
      </div>
      <div className="topActions">
        <button className="btn ghost" onClick={()=>go("search")}>Search</button>
        <button className="btn ghost" onClick={()=>go("tournament-home")}>Tournament</button>
        <button className="btn primary" onClick={()=>go("ai-studio")}>Ask AI</button>
      </div>
    </header>
  );
}

function SideNav({route,go}) {
  return (
    <aside className="left">
      <div className="panel">
        <div className="panelTitle">Flow</div>
        {routes.map(([id,label])=>(
          <button key={id} className={`navBtn ${route===id?'active':''}`} onClick={()=>go(id)}>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="panelTitle">Tournament Context Tabs</div>
        <div className="stack">
          <button className="linkRow" onClick={()=>go("tournament-overview")}><span>Overview</span><strong>Summary</strong></button>
          <button className="linkRow" onClick={()=>go("hands-explorer")}><span>Hands</span><strong>Index + filters</strong></button>
          <button className="linkRow" onClick={()=>go("players")}><span>Players</span><strong>HUD + exploit</strong></button>
          <button className="linkRow" onClick={()=>go("highlights")}><span>Highlights</span><strong>Replay + AI</strong></button>
          <button className="linkRow" onClick={()=>go("ai-studio")}><span>AI</span><strong>Q&A / analysis tabs</strong></button>
        </div>
      </div>
    </aside>
  );
}

function RightRail({go,player,hand}) {
  return (
    <aside className="right">
      <div className="panel">
        <div className="panelTitle">Quick Actions</div>
        <button className="linkRow" onClick={()=>go("hand-detail",{hand:18})}><span>Open key hand</span><strong>#18</strong></button>
        <button className="linkRow" onClick={()=>go("player-detail",{player:"p1"})}><span>Open player</span><strong>{player.name}</strong></button>
        <button className="linkRow" onClick={()=>go("exploit-report",{player:"p1"})}><span>Exploit report</span><strong>Build</strong></button>
        <button className="linkRow" onClick={()=>go("report-builder")}><span>Report builder</span><strong>Templates</strong></button>
      </div>
      <div className="panel">
        <div className="panelTitle">Current Selection</div>
        <div className="kpiGrid compact">
          <Kpi label="Hand" value={`#${hand.id}`} />
          <Kpi label="Tag" value={hand.tag} />
          <Kpi label="Player" value={player.name} />
          <Kpi label="Exploit" value={`${player.exploit}/100`} />
        </div>
      </div>
    </aside>
  );
}

function MobileNav({go}) {
  return (
    <footer className="mobileNav">
      <button onClick={()=>go("search")}>Search</button>
      <button onClick={()=>go("hands-explorer")}>Hands</button>
      <button onClick={()=>go("players")}>Players</button>
      <button onClick={()=>go("ai-studio")}>AI</button>
    </footer>
  );
}

function Card({title,right,children}) {
  return <section className="card"><div className="cardHead"><h3>{title}</h3>{right}</div><div className="cardBody">{children}</div></section>;
}
function Kpi({label,value}) { return <div className="kpi"><span>{label}</span><strong>{value}</strong></div>; }

function Onboarding({go}) {
  return (
    <div className="stack lg">
      <Card title="Welcome Flow" right={<span className="pill">Search → Select Tournament → Analyze</span>}>
        <div className="grid two">
          <div className="stack">
            <div className="callout"><strong>Step 1</strong><p>Search a tournament from historical database.</p></div>
            <div className="callout"><strong>Step 2</strong><p>Land on tournament analysis home focused on selected event.</p></div>
            <div className="callout"><strong>Step 3</strong><p>Explore hands, players, AI insights, highlights, YouTube and animated replays.</p></div>
          </div>
          <div className="stack">
            <button className="cta" onClick={()=>go("search")}>Start with Tournament Search</button>
            <button className="btn" onClick={()=>go("tournament-home")}>Jump into Example Tournament</button>
            <button className="btn ghost" onClick={()=>go("ai-studio")}>Try AI Studio</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SearchPage({go,query,setQuery}) {
  const list = tournaments.filter(t => (t.name + t.series).toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="stack lg">
      <Card title="Tournament Search" right={<span className="pill">Historical + weekly updates</span>}>
        <div className="toolbar">
          <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tournaments, series, player names, tags..." />
          <button className="btn">Filters</button>
          <button className="btn">Sort: Most relevant</button>
        </div>
        <div className="resultsGrid">
          {list.map(t=>(
            <div className="searchCard" key={t.id}>
              <div className="rowTitle">{t.name}</div>
              <div className="muted">{t.series} · {t.buyin} · {t.stage} · {t.date}</div>
              <div className="chips">{t.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
              <div className="searchActions">
                <button className="btn primary" onClick={()=>go("tournament-home",{tournament:t.id})}>Analyze Tournament</button>
                <button className="btn" onClick={()=>go("highlights")}>Highlights</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TournamentHome({go}) {
  return (
    <div className="stack lg">
      <Card title="Tournament Analysis Home" right={<span className="pill">Primary focus: selected tournament</span>}>
        <div className="grid two">
          <div>
            <div className="heroTile">
              <div className="heroTitle">{selectedTournament.name}</div>
              <div className="heroSub">Hands played • Players involved • AI features applicable • Highlights • Replays</div>
              <div className="heroMetrics">
                <Kpi label="Hands Indexed" value="184" />
                <Kpi label="Players" value="9" />
                <Kpi label="Highlights" value="14" />
                <Kpi label="AI Tabs" value="5" />
              </div>
            </div>
          </div>
          <div className="stack">
            <button className="linkRow" onClick={()=>go("tournament-overview")}><span>Overview</span><strong>Meta + story</strong></button>
            <button className="linkRow" onClick={()=>go("timeline")}><span>Timeline</span><strong>Turning points</strong></button>
            <button className="linkRow" onClick={()=>go("hands-explorer")}><span>Hands Explorer</span><strong>Filter + sort</strong></button>
            <button className="linkRow" onClick={()=>go("players")}><span>Players</span><strong>HUD + AI leaks</strong></button>
            <button className="linkRow" onClick={()=>go("highlights")}><span>Highlights</span><strong>Replay clips</strong></button>
            <button className="linkRow" onClick={()=>go("ai-studio")}><span>AI Studio</span><strong>Tournament / player / strategy</strong></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TournamentOverview({go}) {
  return (
    <div className="stack lg">
      <Card title="Overview" right={<button className="btn" onClick={()=>go("timeline")}>Open Timeline</button>}>
        <div className="kpiGrid">
          <Kpi label="Buy-in" value={selectedTournament.buyin} />
          <Kpi label="Prize Pool" value={selectedTournament.pool} />
          <Kpi label="Stage" value={selectedTournament.stage} />
          <Kpi label="AI Readiness" value="Strong" />
        </div>
        <div className="grid two mt">
          <div className="callout">
            <strong>Tournament Narrative Summary</strong>
            <p>AI-generated summary highlights three inflection zones: ICM tightening, aggression polarization on river, and stack-preservation behavior from conservative profiles.</p>
          </div>
          <div className="callout">
            <strong>Suggested Next Paths</strong>
            <ul>
              <li>Go to Hands Explorer for high-score spots</li>
              <li>Open Players tab for exploit map</li>
              <li>Ask AI for "biggest mistakes under ICM"</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TimelinePage({go}) {
  const steps = [
    ["Early FT setup","Stacks converge; fewer exploit signals yet."],
    ["Hand #18 turning point","Largest pot alters pressure distribution."],
    ["Hand #23 ICM overfold","Conservative blinds become more exploitable."],
    ["Hands #31/#36 river nodes","Polarization patterns show repeat tendencies."],
    ["Hand #44 ladder pressure","ICM adjustment opportunities intensify."]
  ];
  return (
    <Card title="Tournament Timeline / Storyline">
      <div className="timeline">
        {steps.map(([t,d],i)=>(
          <div className="timelineItem" key={t}>
            <div className="timelineDot">{i+1}</div>
            <div className="timelineBody">
              <div className="rowTitle">{t}</div>
              <div className="muted">{d}</div>
              <div className="rowActions">
                {i>0 && <button className="btn" onClick={()=>go("hand-detail",{hand:[18,23,31,36,44][i-1]})}>Open Hand</button>}
                <button className="btn ghost" onClick={()=>go("ai-answer",{qid:`timeline-${i+1}`})}>AI Explain</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HandsExplorer({go}) {
  const [street,setStreet] = useState("All");
  const [sort,setSort] = useState("Score");
  const filtered = hands.filter(h => street==="All" || h.street===street)
    .slice()
    .sort((a,b)=> sort==="Score" ? b.score-a.score : a.id-b.id);
  return (
    <div className="stack lg">
      <Card title="Hands Explorer" right={<span className="pill">YouTube + Animated Replay Ready</span>}>
        <div className="toolbar">
          <button className={`chipBtn ${street==="All"?"active":""}`} onClick={()=>setStreet("All")}>All</button>
          <button className={`chipBtn ${street==="Preflop"?"active":""}`} onClick={()=>setStreet("Preflop")}>Preflop</button>
          <button className={`chipBtn ${street==="Flop"?"active":""}`} onClick={()=>setStreet("Flop")}>Flop</button>
          <button className={`chipBtn ${street==="River"?"active":""}`} onClick={()=>setStreet("River")}>River</button>
          <div className="spacer" />
          <button className="btn" onClick={()=>setSort(sort==="Score"?"Hand #":"Score")}>Sort: {sort}</button>
        </div>
        <div className="tableLike">
          <div className="thead"><span>Hand</span><span>Street</span><span>Spot</span><span>Impact</span><span>Actions</span></div>
          {filtered.map(h=>(
            <div className="trow" key={h.id}>
              <span>#{h.id} · {h.tag}</span>
              <span>{h.street}</span>
              <span>{h.spot}</span>
              <span>{h.score}</span>
              <span className="rowActions">
                <button className="btn" onClick={()=>go("hand-detail",{hand:h.id})}>Detail</button>
                <button className="btn" onClick={()=>go("replay-center",{hand:h.id})}>Replay</button>
                <button className="btn ghost" onClick={()=>go("ai-answer",{qid:`hand-${h.id}`,hand:h.id})}>AI</button>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HandDetail({go,hand,replayMode,setReplayMode,split,setSplit}) {
  return (
    <div className="stack lg">
      <Card title={`Hand #${hand.id} · ${hand.tag}`} right={<button className="btn" onClick={()=>go("hands-explorer")}>Back to Hands</button>}>
        <div className="toolbar">
          <div className="seg">
            <button className={replayMode==="animated"?"active":""} onClick={()=>setReplayMode("animated")}>Animated</button>
            <button className={replayMode==="youtube"?"active yt":""} onClick={()=>setReplayMode("youtube")}>YouTube</button>
          </div>
          <div className="seg">
            <button className={split==="insights"?"active":""} onClick={()=>setSplit("insights")}>AI Insights</button>
            <button className={split==="actions"?"active":""} onClick={()=>setSplit("actions")}>Action Log</button>
            <button className={split==="ranges"?"active":""} onClick={()=>setSplit("ranges")}>Ranges</button>
          </div>
          <button className="btn primary" onClick={()=>go("ai-answer",{qid:`hand-${hand.id}`,hand:hand.id})}>Ask AI about this hand</button>
        </div>
        <div className="grid two">
          <div className="stage">
            <div className="center">
              <div className="rowTitle">{replayMode==="animated" ? "Animated Hand Replayer" : "YouTube Replay Surface"}</div>
              <div className="muted">{replayMode==="animated" ? "Chip movement · Pot progression · Street transitions" : `Broadcast timestamp ${hand.yt}`}</div>
            </div>
          </div>
          <div className="stack">
            {split==="insights" && <>
              <div className="callout danger"><strong>Potential mistake</strong><p>Player pool tendency suggests over-calling spot vs under-bluff node.</p></div>
              <div className="callout good"><strong>Counter line</strong><p>Tighter bluff-catching + thinner value betting against this profile.</p></div>
              <button className="linkRow" onClick={()=>go("evidence-chain",{player:"p1"})}><span>Open evidence chain</span><strong>Leak proof</strong></button>
            </>}
            {split==="actions" && <ActionLog />}
            {split==="ranges" && <RangePanel />}
            <div className="kpiGrid compact">
              <Kpi label="Street" value={hand.street} />
              <Kpi label="Pot" value={hand.pot} />
              <Kpi label="Spot" value={hand.spot} />
              <Kpi label="Impact" value={String(hand.score)} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ActionLog() {
  const rows = [
    "BTN opens 2.2x",
    "BB calls",
    "Flop K♠7♦2♣ · BB checks · BTN bets 33%",
    "BB calls",
    "Turn 4♥ · BB checks · BTN checks",
    "River 9♣ · BB checks · BTN jams 120% pot"
  ];
  return <div className="panel inset"><div className="panelTitle">Action Log</div>{rows.map(r=><div className="monoRow" key={r}>{r}</div>)}</div>;
}
function RangePanel() {
  return <div className="panel inset"><div className="panelTitle">Range Viewer Placeholder</div><div className="heatGrid">{Array.from({length:36}).map((_,i)=><div key={i} className="heatCell">{i+1}</div>)}</div></div>;
}

function ReplayCenter({go,hand,replayMode,setReplayMode}) {
  return (
    <Card title={`Replay Center · Hand #${hand.id}`} right={<button className="btn" onClick={()=>go("hand-detail",{hand:hand.id})}>Open Hand Detail</button>}>
      <div className="grid two">
        <div className="stack">
          <div className="toolbar">
            <button className={`chipBtn ${replayMode==="animated"?"active":""}`} onClick={()=>setReplayMode("animated")}>Animated Replay</button>
            <button className={`chipBtn ${replayMode==="youtube"?"active":""}`} onClick={()=>setReplayMode("youtube")}>YouTube Replay</button>
          </div>
          <div className="stage">{replayMode==="animated" ? "Animated Replay Canvas Area" : `YouTube Embed Area · ${hand.yt}`}</div>
        </div>
        <div className="stack">
          <div className="callout"><strong>Sync Panel</strong><p>Time-sync between animated replay and YouTube clip for side-by-side validation.</p></div>
          <div className="callout"><strong>Teaching Mode</strong><p>Pause at decision nodes and surface AI prompts, exploit notes, and HUD-based recommendations.</p></div>
          <button className="btn primary" onClick={()=>go("ai-answer",{qid:`replay-${hand.id}`, hand:hand.id})}>Generate AI Replay Notes</button>
        </div>
      </div>
    </Card>
  );
}

function PlayersPage({go}) {
  return (
    <div className="stack lg">
      <Card title="Players" right={<button className="btn" onClick={()=>go("player-compare",{a:"p1",b:"p3"})}>Compare Players</button>}>
        <div className="playerCards">
          {players.map(p=>(
            <div className="playerCard" key={p.id}>
              <div className="rowTitle">{p.name}</div>
              <div className="muted">{p.style} · {p.hands.toLocaleString()} hands · {p.conf}</div>
              <div className="kpiGrid compact">
                <Kpi label="Exploit" value={`${p.exploit}`} />
                <Kpi label="VPIP" value={`${p.vpip}%`} />
                <Kpi label="PFR" value={`${p.pfr}%`} />
                <Kpi label="3Bet" value={`${p.threebet}%`} />
              </div>
              <div className="rowActions">
                <button className="btn primary" onClick={()=>go("player-detail",{player:p.id})}>Open</button>
                <button className="btn" onClick={()=>go("exploit-report",{player:p.id})}>Report</button>
                <button className="btn ghost" onClick={()=>go("ai-answer",{qid:`player-${p.id}`,player:p.id})}>AI</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlayerDetail({go,player}) {
  const [tab,setTab] = useState("exploit");
  const evid = evidenceByPlayer[player.id] || [];
  return (
    <div className="stack lg">
      <Card title={player.name} right={<button className="btn primary" onClick={()=>go("exploit-report",{player:player.id})}>Open Exploit Report</button>}>
        <div className="meta">
          <span>{player.style}</span><span>{player.hands.toLocaleString()} hands</span><span>{player.fts} FTs</span><span>{player.conf} confidence</span>
        </div>
        <div className="tabStrip mt">
          {["exploit","hud","evidence","strategy","chat"].map(t=>(
            <button key={t} className={tab===t?"tabActive":""} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>
        {tab==="exploit" && <div className="stack mt">
          {(evid.length?evid:[{hand:"-", leak:"No strong leak yet", evidence:"Sample limited", sample:"-", conf:"Low"}]).map((e,i)=>(
            <div className="callout danger" key={i}>
              <strong>{e.leak}</strong>
              <p>{e.evidence} · Sample {e.sample} · {e.conf} confidence</p>
              {e.hand !== "-" && <button className="btn" onClick={()=>go("hand-detail",{hand:e.hand})}>Open Evidence Hand #{e.hand}</button>}
            </div>
          ))}
        </div>}
        {tab==="hud" && <div className="kpiGrid mt">
          <Kpi label="VPIP" value={`${player.vpip}%`} />
          <Kpi label="PFR" value={`${player.pfr}%`} />
          <Kpi label="3Bet" value={`${player.threebet}%`} />
          <Kpi label="Exploit Score" value={`${player.exploit}/100`} />
          <Kpi label="FT Aggression" value={player.ftAgg} />
          <Kpi label="Hands" value={player.hands.toLocaleString()} />
          <Kpi label="Final Tables" value={String(player.fts)} />
          <Kpi label="Confidence" value={player.conf} />
        </div>}
        {tab==="evidence" && <EvidenceMiniList go={go} player={player} />}
        {tab==="strategy" && <div className="grid two mt">
          <div className="callout good"><strong>How to play vs {player.name}</strong><ul><li>Steal wider if BB overfold confirmed</li><li>Reduce bluff-catch frequency on under-bluff rivers</li><li>Pressure risk-averse nodes under ICM</li></ul></div>
          <div className="callout"><strong>Where not to over-adjust</strong><ul><li>Low sample niche lines</li><li>Non-FT deep-stack contexts</li><li>Spots with weak evidence confidence</li></ul></div>
        </div>}
        {tab==="chat" && <div className="stack mt">
          <div className="promptGrid">
            {[
              `How to exploit ${player.name} preflop?`,
              `Top postflop leaks with evidence`,
              `What changes under ICM?`,
              `Show hand examples supporting each leak`
            ].map(q=><button key={q} className="promptBtn" onClick={()=>go("ai-answer",{qid:q,player:player.id})}>{q}</button>)}
          </div>
          <div className="toolbar"><input className="input" placeholder={`Ask about ${player.name}...`} /><button className="btn primary">Send</button></div>
        </div>}
      </Card>
    </div>
  );
}

function EvidenceMiniList({go,player}) {
  const evid = evidenceByPlayer[player.id] || [];
  return <div className="stack mt">
    {evid.length ? evid.map((e,i)=>(
      <div className="listRow" key={i}>
        <div><div className="rowTitle">{e.leak}</div><div className="muted">{e.evidence} · {e.conf}</div></div>
        <div className="rowActions">
          <button className="btn" onClick={()=>go("hand-detail",{hand:e.hand})}>Hand #{e.hand}</button>
          <button className="btn ghost" onClick={()=>go("evidence-chain",{player:player.id})}>Chain</button>
        </div>
      </div>
    )) : <div className="callout">No strong evidence chain yet.</div>}
  </div>;
}

function PlayerCompare({go,a,b}) {
  return (
    <Card title={`Player Compare · ${a.name} vs ${b.name}`}>
      <div className="compareGrid">
        <CompareColumn player={a} go={go} />
        <CompareColumn player={b} go={go} />
      </div>
      <div className="callout mt">
        <strong>AI Comparison Insight</strong>
        <p>{a.name} is more exploitable in high-confidence FT ICM blind defense nodes; {b.name} shows aggression-heavy pressure requiring trap/induce adjustments.</p>
      </div>
    </Card>
  );
}
function CompareColumn({player,go}) {
  return <div className="panel inset">
    <div className="rowTitle">{player.name}</div>
    <div className="muted">{player.style}</div>
    <div className="kpiGrid compact mt">
      <Kpi label="Exploit" value={String(player.exploit)} />
      <Kpi label="VPIP" value={`${player.vpip}%`} />
      <Kpi label="PFR" value={`${player.pfr}%`} />
      <Kpi label="3Bet" value={`${player.threebet}%`} />
    </div>
    <div className="rowActions mt">
      <button className="btn" onClick={()=>go("player-detail",{player:player.id})}>Open Profile</button>
      <button className="btn ghost" onClick={()=>go("exploit-report",{player:player.id})}>Report</button>
    </div>
  </div>;
}

function AIStudio({go,aiScope,setAiScope,hand,player}) {
  const prompts = {
    tournament: ["Who are the most exploitable players in this FT?", "What are the turning point hands?", "Summarize ICM mistakes"],
    player: [`How to exploit ${player.name}?`, `Show evidence-backed leaks for ${player.name}`, "How confident are these reads?"],
    hand: [`Explain Hand #${hand.id}`, "What is the likely mistake?", "How does villain profile change strategy?"],
    strategy: ["BB vs BTN exploit checklist", "ICM exploit framework", "River under-bluff counter strategy"]
  };
  return (
    <div className="stack lg">
      <Card title="AI Insights Studio" right={<span className="pill">Each tab is a different AI analysis mode</span>}>
        <div className="tabStrip">
          {Object.keys(prompts).map(k=>(
            <button key={k} className={aiScope===k?"tabActive":""} onClick={()=>setAiScope(k)}>{k}</button>
          ))}
        </div>
        <div className="grid two mt">
          <div className="stack">
            <div className="callout"><strong>How to make this easy to understand</strong><p>Start with guided prompts, then show answer cards with evidence and direct links to hands/replays/reports.</p></div>
            <div className="promptGrid">
              {prompts[aiScope].map(q=><button className="promptBtn" key={q} onClick={()=>go("ai-answer",{qid:q,hand:hand.id,player:player.id})}>{q}</button>)}
            </div>
          </div>
          <div className="stack">
            <div className="callout good"><strong>Guided Exploration Pattern</strong><ul><li>Question</li><li>Answer</li><li>Evidence chain</li><li>Replay links</li><li>Save to report</li></ul></div>
            <button className="linkRow" onClick={()=>go("ai-answer",{qid:"who-most-exploitable"})}><span>Try example answer</span><strong>Most exploitable player</strong></button>
            <button className="linkRow" onClick={()=>go("report-builder")}><span>Save outputs</span><strong>Report Builder</strong></button>
          </div>
        </div>
        <div className="toolbar mt">
          <input className="input" placeholder="Ask any question about tournament, players, strategy, or a hand..." />
          <button className="btn primary" onClick={()=>go("ai-answer",{qid:"custom-query"})}>Ask</button>
        </div>
      </Card>
    </div>
  );
}

function AIAnswer({go,qId,hand,player}) {
  return (
    <div className="stack lg">
      <Card title="AI Answer" right={<div className="rowActions"><button className="btn" onClick={()=>go("evidence-chain",{player:player.id})}>Evidence</button><button className="btn" onClick={()=>go("report-builder")}>Save to Report</button></div>}>
        <div className="callout">
          <strong>Question</strong>
          <p>{String(qId).replace(/-/g," ")}</p>
        </div>
        <div className="callout good">
          <strong>Answer Summary</strong>
          <p>Highest confidence exploit edge in this tournament is versus conservative blind defense and under-bluff river nodes. The strongest example is Player {player.name} with supporting evidence in Hand #{hand.id} and adjacent river spots.</p>
        </div>
        <div className="grid two">
          <div className="panel inset">
            <div className="panelTitle">Evidence Links</div>
            <button className="linkRow" onClick={()=>go("hand-detail",{hand:23})}><span>Hand #23</span><strong>BB overfold</strong></button>
            <button className="linkRow" onClick={()=>go("hand-detail",{hand:31})}><span>Hand #31</span><strong>River under-bluff node</strong></button>
            <button className="linkRow" onClick={()=>go("player-detail",{player:"p1"})}><span>Player profile</span><strong>{player.name}</strong></button>
          </div>
          <div className="panel inset">
            <div className="panelTitle">Next Exploration</div>
            <button className="linkRow" onClick={()=>go("replay-center",{hand:23})}><span>Replay hand</span><strong>Animated + YouTube</strong></button>
            <button className="linkRow" onClick={()=>go("exploit-report",{player:"p1"})}><span>Generate exploit report</span><strong>Player ready</strong></button>
            <button className="linkRow" onClick={()=>go("notes")}><span>Save note</span><strong>Study log</strong></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EvidenceChain({go,player}) {
  const evid = evidenceByPlayer[player.id] || [];
  return (
    <Card title={`Evidence Chain · ${player.name}`} right={<button className="btn" onClick={()=>go("player-detail",{player:player.id})}>Back to Player</button>}>
      <div className="stack">
        {evid.length ? evid.map((e,i)=>(
          <div className="evidenceRow" key={i}>
            <div className="evIndex">{i+1}</div>
            <div className="evBody">
              <div className="rowTitle">{e.leak}</div>
              <div className="muted">{e.evidence} · {e.sample} · {e.conf}</div>
              <div className="rowActions mt">
                <button className="btn" onClick={()=>go("hand-detail",{hand:e.hand})}>Open Hand #{e.hand}</button>
                <button className="btn" onClick={()=>go("replay-center",{hand:e.hand})}>Replay</button>
                <button className="btn ghost" onClick={()=>go("ai-answer",{qid:`evidence-${i+1}`, player:player.id, hand:e.hand})}>AI Explain</button>
              </div>
            </div>
          </div>
        )) : <div className="callout">No evidence chain available yet.</div>}
      </div>
    </Card>
  );
}

function HighlightsPage({go}) {
  return (
    <Card title="Highlights" right={<span className="pill">Fast path for casual-to-serious users</span>}>
      <div className="stack">
        {highlights.map(h=>{
          const hand = hands.find(x=>x.id===h.hand);
          return (
            <div className="listRow" key={h.id}>
              <div>
                <div className="rowTitle">{h.title}</div>
                <div className="muted">Hand #{h.hand} · {h.type} · Impact {h.impact}</div>
              </div>
              <div className="rowActions">
                <button className="btn" onClick={()=>go("replay-center",{hand:h.hand})}>Replay</button>
                <button className="btn" onClick={()=>go("hand-detail",{hand:h.hand})}>Detail</button>
                <button className="btn ghost" onClick={()=>go("ai-answer",{qid:`highlight-${h.id}`,hand:h.hand})}>AI</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ReportBuilder({go}) {
  const [template, setTemplate] = useState("r1");
  const t = reportTemplates.find(x=>x.id===template);
  const [selectedSections, setSelectedSections] = useState(t.sections);
  useEffect(()=> setSelectedSections(t.sections), [template]);

  const toggle = (s) => setSelectedSections(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);

  return (
    <div className="stack lg">
      <Card title="Report Builder" right={<button className="btn primary" onClick={()=>go("exploit-report",{player:"p1"})}>Generate Example</button>}>
        <div className="grid two">
          <div className="panel inset">
            <div className="panelTitle">Templates</div>
            {reportTemplates.map(rt=>(
              <button key={rt.id} className={`navBtn ${template===rt.id?'active':''}`} onClick={()=>setTemplate(rt.id)}>{rt.name}</button>
            ))}
            <div className="mt callout">
              <strong>Output Paths</strong>
              <p>Save AI answers and evidence into one structured report. Later export as PDF / share.</p>
            </div>
          </div>
          <div className="panel inset">
            <div className="panelTitle">Sections ({selectedSections.length})</div>
            <div className="checkList">
              {t.sections.map(s=>(
                <label key={s} className="checkItem">
                  <input type="checkbox" checked={selectedSections.includes(s)} onChange={()=>toggle(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <div className="rowActions mt">
              <button className="btn">Save Draft</button>
              <button className="btn">Preview</button>
              <button className="btn primary" onClick={()=>go("exploit-report",{player:"p1"})}>Build</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExploitReport({go,player}) {
  const evid = evidenceByPlayer[player.id] || [];
  return (
    <div className="stack lg">
      <Card title={`Exploit Report · ${player.name}`} right={<div className="rowActions"><button className="btn" onClick={()=>go("report-builder")}>Builder</button><button className="btn primary">Export PDF (UI)</button></div>}>
        <div className="kpiGrid">
          <Kpi label="Exploit Score" value={`${player.exploit}/100`} />
          <Kpi label="Confidence" value={player.conf} />
          <Kpi label="Hands" value={player.hands.toLocaleString()} />
          <Kpi label="Final Tables" value={String(player.fts)} />
        </div>
        <div className="grid two mt">
          <div className="stack">
            <div className="callout good">
              <strong>Executive Summary</strong>
              <p>{player.name} shows the strongest actionable edge in FT ICM blind defense and selective under-bluff river patterns. Recommended approach: pressure wider preflop, tighten bluff-catches, and prioritize evidence-backed adjustments.</p>
            </div>
            <div className="panel inset">
              <div className="panelTitle">Leak Table</div>
              {(evid.length ? evid : [{hand:"-", leak:"No strong leak", evidence:"Sample limited", sample:"-", conf:"Low"}]).map((e,i)=>(
                <div className="tableMiniRow" key={i}>
                  <div>{e.leak}</div>
                  <div className="muted">{e.evidence}</div>
                  <div>{e.conf}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="stack">
            <div className="panel inset">
              <div className="panelTitle">Evidence Hands</div>
              {evid.map((e,i)=>(
                <button key={i} className="linkRow" onClick={()=>go("hand-detail",{hand:e.hand})}>
                  <span>Hand #{e.hand}</span>
                  <strong>{e.leak}</strong>
                </button>
              ))}
            </div>
            <div className="callout">
              <strong>Action Checklist</strong>
              <ul>
                <li>Review evidence hands in replay center</li>
                <li>Validate confidence and sample thresholds</li>
                <li>Save AI answer + exploit notes to study notebook</li>
                <li>Create opponent prep sheet before next tournament</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function WatchlistPage({go}) {
  return (
    <Card title="Watchlist / Opponent Prep Queue" right={<button className="btn" onClick={()=>go("report-builder")}>Build Prep Sheet</button>}>
      <div className="stack">
        {["Seth Davies","Chris Brewer","Alex Foxen"].map((n,i)=>(
          <div className="listRow" key={n}>
            <div><div className="rowTitle">{n}</div><div className="muted">Saved from AI answer / exploit report</div></div>
            <div className="rowActions">
              <button className="btn" onClick={()=>go("player-detail",{player:`p${i+1}`})}>Profile</button>
              <button className="btn ghost" onClick={()=>go("exploit-report",{player:`p${i+1}`})}>Report</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotesPage({go}) {
  return (
    <Card title="Study Notes / Notebook" right={<button className="btn" onClick={()=>go("ai-answer",{qid:"notes-followup"})}>Add from AI</button>}>
      <div className="grid two">
        <div className="panel inset">
          <div className="panelTitle">Saved Notes</div>
          <div className="noteCard"><div className="rowTitle">ICM exploit trend</div><div className="muted">Conservative BB defenders become more exploitable after Hand #18 turning point.</div></div>
          <div className="noteCard"><div className="rowTitle">River adjustment</div><div className="muted">Reduce bluff-catch frequency against under-bluff profile in capped nodes.</div></div>
        </div>
        <div className="panel inset">
          <div className="panelTitle">New Note</div>
          <textarea className="textarea" defaultValue="Observation..." />
          <div className="rowActions mt">
            <button className="btn">Save</button>
            <button className="btn">Tag</button>
            <button className="btn primary" onClick={()=>go("report-builder")}>Send to Report</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SettingsPage() {
  return (
    <Card title="Prototype Settings / System Notes">
      <div className="grid two">
        <div className="stack">
          <div className="metric"><span>Prototype Depth</span><strong>20+ clickable pages/flows</strong></div>
          <div className="metric"><span>Routing</span><strong>Hash-based (works static/local)</strong></div>
          <div className="metric"><span>Data</span><strong>Mock data placeholders for HUDR integration</strong></div>
        </div>
        <div className="stack">
          <div className="metric"><span>Next Dev Step</span><strong>Split into real route files + API clients</strong></div>
          <div className="metric"><span>Add</span><strong>Auth, persisted state, charts, real replay widgets</strong></div>
          <div className="metric"><span>Focus</span><strong>Tournament-first IA + guided AI exploration</strong></div>
        </div>
      </div>
    </Card>
  );
}
