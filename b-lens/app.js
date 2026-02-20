/**
 * HUDR — The Lens — Context-First PWA Prototype
 * All state, routing, rendering, and interaction logic.
 */

(function () {
  'use strict';

  // =====================
  // Shared Data Aliases
  // =====================
  const D = window.HUDR_DATA;
  const {
    TOURNAMENTS, PLAYERS, PLAYER_STATS, HANDS, HIGHLIGHTS, HIGHLIGHT_LABELS,
    HAND_REPLAYS, STAT_HANDS, AI_CONTENT, WISDOM, USER_PROFILE, CHIP_TIMELINE,
    getPlayer, getTournament, getHand, getHandsForTournament,
    formatChips, formatNumber, getStatColor, formatCard, isRedSuit,
    getCardRank, getCardSuit,
  } = D;

  // =====================
  // Application State
  // =====================
  const state = {
    currentScreen: 'home',
    currentTournament: null,
    currentPanel: 0,
    sidebarOpen: false,
    playerOverlay: null,
    favorites: {
      tournaments: new Set(USER_PROFILE.favorites.tournaments),
      players: new Set(USER_PROFILE.favorites.players),
      hands: new Set(USER_PROFILE.favorites.hands),
    },
    searchQuery: '',
    searchTab: 'tournaments',
    handFilter: 'all',
    playerSort: 'position',
    replayState: null,
    previousScreen: null,
    expandedScouting: new Set(),
    quizAnswers: {},
    chatMessages: [],
    handSearch: '',
  };

  // =====================
  // DOM References
  // =====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    contextHeader: $('#context-header'),
    headerTitle: $('#header-title'),
    headerFavBtn: $('#header-fav-btn'),
    panelDots: $('#panel-dots'),
    mainContent: $('#main-content'),
    screenHome: $('#screen-home'),
    screenTournament: $('#screen-tournament'),
    screenHand: $('#screen-hand'),
    screenPlayer: $('#screen-player'),
    screenSearch: $('#screen-search'),
    screenFavorites: $('#screen-favorites'),
    panelsWrapper: $('#panels-wrapper'),
    panelOverview: $('#panel-overview'),
    panelPlayers: $('#panel-players'),
    panelHands: $('#panel-hands'),
    panelAi: $('#panel-ai'),
    playerOverlay: $('#player-overlay'),
    overlayContent: $('#overlay-content'),
    overlaySheet: $('#overlay-sheet'),
    sidebar: $('#sidebar'),
    sidebarNav: $('#sidebar-nav'),
    sidebarContent: $('#sidebar-content'),
    bottomNav: $('#bottom-nav'),
  };

  // =====================
  // Hash Router
  // =====================
  function navigate(hash, pushHistory = true) {
    if (pushHistory && window.location.hash !== hash) {
      window.location.hash = hash;
      return; // hashchange event will call handleRoute
    }
    handleRoute(hash);
  }

  function handleRoute(hash) {
    hash = hash || '#home';
    if (hash.startsWith('#tournament/')) {
      const parts = hash.replace('#tournament/', '').split('/');
      const tId = parts[0];
      const panel = parts[1] || 'overview';
      const panelIdx = { overview: 0, players: 1, hands: 2, ai: 3 }[panel] || 0;
      showTournamentContext(tId, panelIdx);
    } else if (hash.startsWith('#hand/')) {
      const hId = hash.replace('#hand/', '');
      showHandReplay(hId);
    } else if (hash.startsWith('#player/')) {
      const pId = hash.replace('#player/', '');
      showPlayerProfile(pId);
    } else if (hash === '#search') {
      showScreen('search');
    } else if (hash === '#favorites') {
      showScreen('favorites');
    } else {
      showScreen('home');
    }
  }

  window.addEventListener('hashchange', () => handleRoute(window.location.hash));

  // =====================
  // Screen Management
  // =====================
  function hideAllScreens() {
    [els.screenHome, els.screenTournament, els.screenHand, els.screenPlayer,
      els.screenSearch, els.screenFavorites].forEach(s => s.classList.add('hidden'));
  }

  function showScreen(name) {
    hideAllScreens();
    state.currentScreen = name;

    // Header & dots visibility
    const inTournament = name === 'tournament';
    els.contextHeader.classList.toggle('hidden', !inTournament);
    els.panelDots.classList.toggle('hidden', !inTournament);

    // Active bottom nav
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === name));

    switch (name) {
      case 'home':
        els.screenHome.classList.remove('hidden');
        renderHome();
        break;
      case 'tournament':
        els.screenTournament.classList.remove('hidden');
        break;
      case 'hand':
        els.screenHand.classList.remove('hidden');
        break;
      case 'player':
        els.screenPlayer.classList.remove('hidden');
        break;
      case 'search':
        els.screenSearch.classList.remove('hidden');
        renderSearch();
        break;
      case 'favorites':
        els.screenFavorites.classList.remove('hidden');
        renderFavorites();
        break;
    }
  }

  // =====================
  // Home Screen
  // =====================
  function renderHome() {
    const liveTournament = TOURNAMENTS.find(t => t.liveStatus === 'live');
    const followed = TOURNAMENTS.filter(t => state.favorites.tournaments.has(t.id));
    const recent = TOURNAMENTS.filter(t => t.status === 'completed').slice(0, 4);

    let html = `
      <div class="home-header">
        <div class="home-logo">HUDR</div>
        <div class="home-subtitle">Pick a Tournament</div>
      </div>
    `;

    // Hero card (live tournament)
    if (liveTournament) {
      html += `
        <div class="hero-card" data-action="open-tournament" data-id="${liveTournament.id}">
          <div class="hero-gradient" style="background: ${liveTournament.imageGradient}">
            <div class="hero-live-badge">LIVE</div>
            <div class="hero-event">${liveTournament.event}</div>
            <div class="hero-name">${liveTournament.name}</div>
            <div class="hero-sub">${liveTournament.subtitle}</div>
            <div class="hero-meta">
              <div class="hero-meta-item">
                <span>${liveTournament.venue.split(',')[0]}</span>
              </div>
              <div class="hero-meta-item">
                <span class="hero-meta-value">${liveTournament.handCount}</span> hands
              </div>
              <div class="hero-meta-item">
                <span class="hero-meta-value">${liveTournament.playerCount}</span> players
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Followed tournaments
    if (followed.length > 0) {
      html += `
        <div class="section-header">
          <span class="section-title">Your Tournaments</span>
        </div>
        <div class="tournament-list">
      `;
      followed.forEach(t => {
        html += `
          <div class="tournament-list-item" data-action="open-tournament" data-id="${t.id}">
            <div class="tournament-thumb" style="background: ${t.imageGradient}">
              ${t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div class="tournament-info">
              <div class="tournament-info-name">${t.name}</div>
              <div class="tournament-info-meta">${t.event} &middot; ${t.handCount} hands</div>
            </div>
            <div class="tournament-chevron">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Recent tournaments
    html += `
      <div class="section-header" style="margin-top: 20px;">
        <span class="section-title">Recent</span>
      </div>
      <div class="tournament-grid">
    `;
    recent.forEach(t => {
      html += `
        <div class="tournament-grid-card" data-action="open-tournament" data-id="${t.id}">
          <div class="tournament-grid-inner" style="background: ${t.imageGradient}">
            <div class="tournament-grid-name">${t.name}</div>
            <div class="tournament-grid-sub">${t.subtitle}</div>
            <div class="tournament-grid-hands">${t.handCount} hands</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    // Wisdom quote
    const quote = WISDOM[Math.floor(Math.random() * WISDOM.length)];
    html += `
      <div style="padding: 16px; margin-top: 8px;">
        <div class="info-card" style="text-align: center; border-color: var(--border-light);">
          <div style="font-size: 13px; color: var(--text-secondary); font-style: italic; line-height: 1.6;">
            "${quote.quote}"
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
            -- ${quote.author}
          </div>
        </div>
      </div>
    `;

    els.screenHome.innerHTML = html;
  }

  // =====================
  // Tournament Context
  // =====================
  function showTournamentContext(tournamentId, panelIndex = 0) {
    const t = getTournament(tournamentId);
    if (!t) return;

    state.currentTournament = tournamentId;
    state.currentPanel = panelIndex;

    showScreen('tournament');

    // Update header
    els.headerTitle.textContent = t.name;
    updateFavButton();

    // Render all panels
    renderOverviewPanel(t);
    renderPlayersPanel(t);
    renderHandsPanel(t);
    renderAiPanel(t);

    // Set panel position
    updatePanelPosition(panelIndex, false);
    updateDots(panelIndex);
  }

  function updateFavButton() {
    const isFav = state.favorites.tournaments.has(state.currentTournament);
    els.headerFavBtn.classList.toggle('favorited', isFav);
  }

  // Panel Navigation
  function updatePanelPosition(index, animate = true) {
    state.currentPanel = index;
    const offset = -(index * 25);
    els.panelsWrapper.style.transition = animate ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
    els.panelsWrapper.style.transform = `translateX(${offset}%)`;
    updateDots(index);
  }

  function updateDots(index) {
    $$('.panel-dots .dot').forEach((d, i) => d.classList.toggle('active', i === index));
    $$('.dot-label').forEach((l, i) => l.classList.toggle('active', i === index));
  }

  function nextPanel() {
    if (state.currentPanel < 3) updatePanelPosition(state.currentPanel + 1);
  }

  function prevPanel() {
    if (state.currentPanel > 0) updatePanelPosition(state.currentPanel - 1);
  }

  // =====================
  // Overview Panel
  // =====================
  function renderOverviewPanel(t) {
    const hands = getHandsForTournament(t.id);
    const avgVpip = t.playerCount > 0
      ? Math.round(Object.values(PLAYER_STATS).reduce((s, p) => s + p.vpip, 0) / Object.keys(PLAYER_STATS).length)
      : 0;
    const biggestPot = hands.length > 0 ? Math.max(...hands.map(h => h.potTotal)) : 0;

    let html = `
      <div class="info-card">
        <div class="info-card-title">Tournament Info</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Venue</span>
            <span class="info-value">${t.venue.split(',')[0]}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date</span>
            <span class="info-value">${formatDate(t.date)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Buy-In</span>
            <span class="info-value">${formatChips(t.buyIn)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Prize Pool</span>
            <span class="info-value">${t.prizePool ? formatChips(t.prizePool) : 'TBD'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Entrants</span>
            <span class="info-value">${t.totalEntrants ? formatNumber(t.totalEntrants) : 'TBD'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Hands</span>
            <span class="info-value">${t.handCount}</span>
          </div>
        </div>
      </div>

      <div class="info-card-title" style="padding: 0; margin-bottom: 8px;">Key Stats</div>
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-card-value" style="color: var(--green);">${avgVpip}%</div>
          <div class="stat-card-label">Avg VPIP</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value" style="color: var(--yellow);">${formatChips(biggestPot)}</div>
          <div class="stat-card-label">Biggest Pot</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value" style="color: var(--accent);">${t.handCount}</div>
          <div class="stat-card-label">Total Hands</div>
        </div>
      </div>

      <div class="info-card-title" style="padding: 0; margin-bottom: 8px;">Top Highlights</div>
      <div class="highlight-grid">
    `;

    Object.entries(HIGHLIGHT_LABELS).forEach(([type, hl]) => {
      const count = (HIGHLIGHTS[type] || []).filter(h => h.tournamentId === t.id).length;
      html += `
        <div class="highlight-card" data-action="filter-highlight" data-type="${type}">
          <div class="highlight-icon">${hl.icon}</div>
          <div class="highlight-count" style="color: ${hl.color};">${count}</div>
          <div class="highlight-label">${hl.label}</div>
        </div>
      `;
    });

    html += `</div>`;

    // AI Summary
    if (t.aiFunEnabled && AI_CONTENT.story) {
      const storyPreview = AI_CONTENT.story.split('\n\n')[0];
      html += `
        <div class="ai-summary-card" data-action="goto-ai">
          <div class="ai-summary-header">
            <span class="ai-summary-badge">AI STORY</span>
          </div>
          <div class="ai-summary-text">${storyPreview}</div>
          <span class="ai-summary-link">Read Full Story &rarr;</span>
        </div>
      `;
    }

    // Player strip
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div class="info-card-title" style="padding: 0; margin: 0;">Players</div>
        <button class="section-link" data-action="goto-players">View all &rarr;</button>
      </div>
      <div class="player-strip">
    `;

    const sortedPlayers = [...PLAYERS].filter(p => p.finishPosition > 0).sort((a, b) => a.finishPosition - b.finishPosition);
    sortedPlayers.slice(0, 7).forEach(p => {
      html += `
        <div class="player-strip-avatar" style="background: ${p.color};" data-action="open-player-overlay" data-id="${p.id}">
          ${p.initials}
        </div>
      `;
    });
    if (sortedPlayers.length > 7) {
      html += `<div class="player-strip-more" data-action="goto-players">+${sortedPlayers.length - 7}</div>`;
    }

    html += `</div>`;

    els.panelOverview.innerHTML = html;
  }

  // =====================
  // Players Panel
  // =====================
  function renderPlayersPanel(t) {
    let html = `
      <div class="players-sort-bar">
        <button class="sort-chip ${state.playerSort === 'position' ? 'active' : ''}" data-action="sort-players" data-sort="position">Position</button>
        <button class="sort-chip ${state.playerSort === 'vpip' ? 'active' : ''}" data-action="sort-players" data-sort="vpip">VPIP</button>
        <button class="sort-chip ${state.playerSort === 'af' ? 'active' : ''}" data-action="sort-players" data-sort="af">AF</button>
      </div>
      <div class="player-grid">
    `;

    let sorted = [...PLAYERS];
    if (state.playerSort === 'vpip') {
      sorted.sort((a, b) => (PLAYER_STATS[b.id]?.vpip || 0) - (PLAYER_STATS[a.id]?.vpip || 0));
    } else if (state.playerSort === 'af') {
      sorted.sort((a, b) => (PLAYER_STATS[b.id]?.af || 0) - (PLAYER_STATS[a.id]?.af || 0));
    } else {
      sorted.sort((a, b) => a.finishPosition - b.finishPosition);
    }

    sorted.forEach(p => {
      const stats = PLAYER_STATS[p.id];
      const posLabel = p.finishPosition === 1
        ? '<span class="winner">1st</span>'
        : `${ordinal(p.finishPosition)} place`;

      html += `
        <div class="player-card" data-action="open-player-overlay" data-id="${p.id}">
          <div class="player-card-avatar" style="background: ${p.color};">
            ${p.initials}
            <span class="player-card-flag">${p.countryFlag}</span>
          </div>
          <div class="player-card-name">${p.name.split(' ').pop()}</div>
          <div class="player-card-position">${posLabel}</div>
          <div class="player-card-stats">
            <span class="player-mini-stat" style="color: ${stats ? getStatColor('vpip', stats.vpip) : 'inherit'};">
              ${stats ? stats.vpip : '-'}
            </span>
            <span class="player-mini-stat" style="color: ${stats ? getStatColor('af', stats.af) : 'inherit'};">
              ${stats ? stats.af.toFixed(1) : '-'}
            </span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    els.panelPlayers.innerHTML = html;
  }

  // =====================
  // Hands Panel
  // =====================
  function renderHandsPanel(t) {
    const allHands = getHandsForTournament(t.id);
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'biggest_pot', label: 'Big Pots' },
      { key: 'bluff', label: 'Bluffs' },
      { key: 'elimination', label: 'Eliminations' },
      { key: 'hero_call', label: 'Hero Calls' },
      { key: 'cooler', label: 'Coolers' },
      { key: 'bad_beat', label: 'Bad Beats' },
    ];

    let html = `
      <input type="text" class="mini-search" placeholder="Search hands..." data-action="search-hands" value="${state.handSearch}">
      <div class="filter-bar">
    `;

    filters.forEach(f => {
      html += `<button class="filter-chip ${state.handFilter === f.key ? 'active' : ''}" data-action="filter-hands" data-filter="${f.key}">${f.label}</button>`;
    });

    html += `</div><div class="hand-list">`;

    let filtered = allHands;
    if (state.handFilter !== 'all') {
      filtered = allHands.filter(h => h.highlightType === state.handFilter);
    }
    if (state.handSearch) {
      const q = state.handSearch.toLowerCase();
      filtered = filtered.filter(h =>
        h.preview.toLowerCase().includes(q) ||
        h.handNumber.toString().includes(q) ||
        h.playersInvolved.some(pid => {
          const pl = getPlayer(pid);
          return pl && pl.name.toLowerCase().includes(q);
        })
      );
    }

    if (filtered.length === 0) {
      html += `<div class="search-empty">No hands match this filter.</div>`;
    }

    filtered.forEach(h => {
      const badge = h.highlightType && HIGHLIGHT_LABELS[h.highlightType]
        ? `<span class="hand-badge" style="background: ${HIGHLIGHT_LABELS[h.highlightType].color}22; color: ${HIGHLIGHT_LABELS[h.highlightType].color};">${HIGHLIGHT_LABELS[h.highlightType].icon} ${HIGHLIGHT_LABELS[h.highlightType].label}</span>`
        : '';

      let avatarsHtml = '<div class="hand-players-avatars">';
      h.playersInvolved.slice(0, 3).forEach(pid => {
        const pl = getPlayer(pid);
        if (pl) {
          avatarsHtml += `<div class="hand-avatar" style="background: ${pl.color};">${pl.initials}</div>`;
        }
      });
      avatarsHtml += '</div>';

      html += `
        <div class="hand-row" data-action="open-hand" data-id="${h.id}">
          <div class="hand-number">#${h.handNumber}</div>
          ${avatarsHtml}
          <div class="hand-details">
            <div class="hand-preview">${h.preview}</div>
          </div>
          <div class="hand-pot">${formatChips(h.potTotal)}</div>
        </div>
      `;
    });

    html += `</div>`;
    els.panelHands.innerHTML = html;
  }

  // =====================
  // AI Panel
  // =====================
  function renderAiPanel(t) {
    let html = '<div class="ai-feed">';

    // Insights
    html += `<div class="ai-section-title">Insights</div><div class="ai-insight-grid">`;
    AI_CONTENT.insights.forEach(ins => {
      html += `
        <div class="ai-insight-card">
          <div class="ai-insight-icon">${ins.icon}</div>
          <div class="ai-insight-title">${ins.title}</div>
          <div class="ai-insight-text">${ins.text}</div>
        </div>
      `;
    });
    html += `</div>`;

    // Player Scouting
    html += `<div class="ai-section-title" style="margin-top: 20px;">Player Scouting</div>`;
    PLAYERS.sort((a, b) => a.finishPosition - b.finishPosition).forEach(p => {
      const report = AI_CONTENT.playerScouting[p.id];
      if (!report) return;
      const isOpen = state.expandedScouting.has(p.id);
      html += `
        <div class="ai-scouting-card" data-action="toggle-scouting" data-id="${p.id}">
          <div class="ai-scouting-header">
            <div class="ai-scouting-avatar" style="background: ${p.color};">${p.initials}</div>
            <div class="ai-scouting-name">${p.name}</div>
            <div class="ai-scouting-expand ${isOpen ? 'open' : ''}">&#9660;</div>
          </div>
          <div class="ai-scouting-body ${isOpen ? 'open' : ''}">${report}</div>
        </div>
      `;
    });

    // Story
    html += `
      <div class="ai-section-title" style="margin-top: 20px;">The Story</div>
      <div class="ai-story-card">
        <div class="ai-story-text">${AI_CONTENT.story}</div>
      </div>
    `;

    // Quiz
    html += `<div class="ai-section-title" style="margin-top: 20px;">Quiz</div>`;
    AI_CONTENT.quiz.forEach(q => {
      const answered = state.quizAnswers[q.id];
      html += `
        <div class="ai-quiz-card" data-quiz-id="${q.id}">
          <div class="ai-quiz-question">${q.question}</div>
      `;
      q.options.forEach((opt, idx) => {
        let cls = 'ai-quiz-option';
        if (answered !== undefined) {
          if (idx === q.correctIndex) cls += ' correct';
          else if (idx === answered && answered !== q.correctIndex) cls += ' wrong';
          if (idx !== answered && idx !== q.correctIndex) cls += ' disabled';
        }
        html += `<button class="${cls}" data-action="answer-quiz" data-quiz="${q.id}" data-index="${idx}" ${answered !== undefined ? 'disabled' : ''}>${opt}</button>`;
      });
      html += `
          <div class="ai-quiz-explanation ${answered !== undefined ? 'show' : ''}">${q.explanation}</div>
        </div>
      `;
    });

    // Commentary
    html += `<div class="ai-section-title" style="margin-top: 20px;">Commentary</div>`;
    AI_CONTENT.commentary.forEach(c => {
      const hand = getHand(c.handId);
      html += `
        <div class="ai-commentary-card" data-action="open-hand" data-id="${c.handId}">
          <div class="ai-commentary-hand">Hand #${hand ? hand.handNumber : c.handId}</div>
          <div class="ai-commentary-text">${c.text}</div>
        </div>
      `;
    });

    // Chat Responses
    if (state.chatMessages.length > 0) {
      html += `<div class="ai-section-title" style="margin-top: 20px;">Chat</div>`;
      state.chatMessages.forEach(msg => {
        html += `
          <div class="ai-chat-response">
            <div class="ai-chat-response-label">You asked: "${msg.query}"</div>
            <div class="ai-chat-response-text">${msg.response}</div>
          </div>
        `;
      });
    }

    html += `</div>`;

    // Chat input (fixed at bottom — rendered separately)
    html += `
      <div class="ai-chat-container" id="ai-chat-container" style="display: none;">
        <div class="ai-chat-input-wrapper">
          <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ask about this tournament...">
          <button class="ai-chat-send" data-action="send-chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    els.panelAi.innerHTML = html;
  }

  // Show/hide AI chat container based on current panel
  function updateAiChat() {
    const chatContainer = document.getElementById('ai-chat-container');
    if (chatContainer) {
      chatContainer.style.display = (state.currentScreen === 'tournament' && state.currentPanel === 3) ? 'block' : 'none';
    }
  }

  // =====================
  // Hand Replay Screen
  // =====================
  function showHandReplay(handId) {
    const hand = getHand(handId);
    if (!hand) return;

    state.previousScreen = state.currentScreen === 'tournament' ? `#tournament/${state.currentTournament}/hands` : '#home';
    showScreen('hand');

    const replay = HAND_REPLAYS[handId];
    const players = hand.playersInvolved.map(pid => getPlayer(pid)).filter(Boolean);

    // Initialize replay state
    state.replayState = {
      handId,
      phaseIndex: 0,
      stepIndex: -1,
      playing: false,
    };

    renderHandReplayScreen(hand, replay, players);
  }

  function renderHandReplayScreen(hand, replay, players) {
    const rs = state.replayState;
    const currentPhase = replay ? replay.phases[rs.phaseIndex] : null;
    const phaseName = currentPhase ? currentPhase.name.toUpperCase() : 'PREFLOP';

    // Determine which community cards to show
    let visibleCards = [];
    if (currentPhase) {
      visibleCards = currentPhase.communityCards || [];
    }

    // Current pot
    let currentPot = 0;
    if (currentPhase && rs.stepIndex >= 0 && currentPhase.steps[rs.stepIndex]) {
      currentPot = currentPhase.steps[rs.stepIndex].pot || currentPhase.pot || 0;
    } else if (currentPhase) {
      currentPot = currentPhase.pot || 0;
    }

    // Player positions around the elliptical table
    const positions = getTablePositions(players.length);

    let html = `
      <div class="replay-header">
        <button class="replay-back" data-action="replay-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div class="replay-title">Hand #${hand.handNumber}</div>
          <div class="replay-subtitle">${hand.blinds} &middot; ${hand.preview.substring(0, 40)}...</div>
        </div>
      </div>

      <div class="poker-table-container">
        <div class="poker-table">
          <div class="table-community">
    `;

    // Community cards
    for (let i = 0; i < 5; i++) {
      if (i < visibleCards.length) {
        const card = visibleCards[i];
        const red = isRedSuit(card);
        html += `
          <div class="table-card ${red ? 'red' : 'black'}">
            <span class="table-card-rank">${getCardRank(card)}</span>
            <span class="table-card-suit">${getCardSuit(card)}</span>
          </div>
        `;
      } else {
        html += `<div class="table-card face-down"></div>`;
      }
    }

    html += `
          </div>
          <div class="table-pot">
            <div class="table-pot-label">POT</div>
            <div class="table-pot-value">${formatChips(currentPot)}</div>
          </div>
    `;

    // Players around the table
    players.forEach((p, i) => {
      const pos = positions[i] || { top: '50%', left: '50%' };
      const cards = hand.holeCards[p.id];
      const isWinner = p.id === hand.winnerId;

      // Check if folded
      let folded = false;
      if (replay && rs.stepIndex >= 0) {
        for (let pi = 0; pi <= rs.phaseIndex; pi++) {
          const phase = replay.phases[pi];
          if (!phase) continue;
          const maxStep = pi < rs.phaseIndex ? phase.steps.length - 1 : rs.stepIndex;
          for (let si = 0; si <= Math.min(maxStep, phase.steps.length - 1); si++) {
            const step = phase.steps[si];
            if (step && step.player === p.id && step.action === 'fold') folded = true;
          }
        }
      }

      html += `
        <div class="table-player" style="top: ${pos.top}; left: ${pos.left};">
          <div class="table-player-avatar ${isWinner && phaseName === 'SHOWDOWN' ? 'winner' : ''} ${folded ? 'folded' : ''}" style="background: ${p.color};">
            ${p.initials}
          </div>
          <div class="table-player-name">${p.name.split(' ').pop()}</div>
          <div class="table-player-cards">
      `;

      if (cards && !folded) {
        cards.forEach(c => {
          const red = isRedSuit(c);
          html += `
            <div class="table-player-card ${red ? 'red' : 'black'}">
              <span style="font-size: 8px;">${getCardRank(c)}</span>
              <span style="font-size: 7px;">${getCardSuit(c)}</span>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>

      <div class="replay-phase">
        <div class="replay-phase-label">${phaseName}</div>
      </div>

      <div class="replay-controls">
        <button class="replay-btn" data-action="replay-prev">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button class="replay-btn play-btn" data-action="replay-play">
          ${rs.playing ? '&#9646;&#9646;' : '&#9654;'}
        </button>
        <button class="replay-btn" data-action="replay-next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    `;

    // Action log
    html += `<div class="replay-log"><div class="replay-log-title">Hand History</div>`;

    if (replay) {
      for (let pi = 0; pi <= Math.min(rs.phaseIndex, replay.phases.length - 1); pi++) {
        const phase = replay.phases[pi];
        html += `<div class="replay-log-entry highlight">--- ${phase.name.toUpperCase()} ---</div>`;
        const maxStep = pi < rs.phaseIndex ? phase.steps.length : (rs.stepIndex + 1);
        for (let si = 0; si < Math.min(maxStep, phase.steps.length); si++) {
          const step = phase.steps[si];
          if (!step) continue;
          if (step.winner) {
            const w = getPlayer(step.winner);
            html += `<div class="replay-log-entry"><span class="player-name">${w ? w.name : 'Unknown'}</span> <span class="action-text">wins</span> <span class="amount-text">${formatChips(step.amount)}</span></div>`;
          } else if (step.action === 'show') {
            const pl = getPlayer(step.player);
            html += `<div class="replay-log-entry"><span class="player-name">${pl ? pl.name : 'Unknown'}</span> <span class="action-text">shows</span> [${step.cards.map(formatCard).join(' ')}] - ${step.handRank}</div>`;
          } else {
            const pl = getPlayer(step.player);
            const actionStr = step.action === 'allin' ? 'all-in' : step.action;
            const amtStr = step.amount > 0 ? ` <span class="amount-text">${formatChips(step.amount)}</span>` : '';
            html += `<div class="replay-log-entry"><span class="player-name">${pl ? pl.name : 'Unknown'}</span> <span class="action-text">${actionStr}</span>${amtStr}</div>`;
          }
        }
      }
    } else {
      // No replay data — just show actions from hand
      hand.actions.forEach(a => {
        const pl = getPlayer(a.player);
        const actionStr = a.action === 'allin' ? 'all-in' : a.action;
        const amtStr = a.amount > 0 ? ` <span class="amount-text">${formatChips(a.amount)}</span>` : '';
        html += `<div class="replay-log-entry"><span class="player-name">${pl ? pl.name : 'Unknown'}</span> <span class="action-text">${actionStr}</span>${amtStr}</div>`;
      });
    }

    html += `</div>`;

    els.screenHand.innerHTML = html;
  }

  function replayNext() {
    if (!state.replayState) return;
    const rs = state.replayState;
    const hand = getHand(rs.handId);
    const replay = HAND_REPLAYS[rs.handId];
    if (!replay) return;

    const phase = replay.phases[rs.phaseIndex];
    if (!phase) return;

    if (rs.stepIndex < phase.steps.length - 1) {
      rs.stepIndex++;
    } else if (rs.phaseIndex < replay.phases.length - 1) {
      rs.phaseIndex++;
      rs.stepIndex = -1;
    }

    const players = hand.playersInvolved.map(pid => getPlayer(pid)).filter(Boolean);
    renderHandReplayScreen(hand, replay, players);
  }

  function replayPrev() {
    if (!state.replayState) return;
    const rs = state.replayState;
    const hand = getHand(rs.handId);
    const replay = HAND_REPLAYS[rs.handId];
    if (!replay) return;

    if (rs.stepIndex > -1) {
      rs.stepIndex--;
    } else if (rs.phaseIndex > 0) {
      rs.phaseIndex--;
      const prevPhase = replay.phases[rs.phaseIndex];
      rs.stepIndex = prevPhase.steps.length - 1;
    }

    const players = hand.playersInvolved.map(pid => getPlayer(pid)).filter(Boolean);
    renderHandReplayScreen(hand, replay, players);
  }

  let autoPlayInterval = null;
  function toggleAutoPlay() {
    if (!state.replayState) return;
    state.replayState.playing = !state.replayState.playing;
    if (state.replayState.playing) {
      autoPlayInterval = setInterval(() => {
        const rs = state.replayState;
        if (!rs) { clearInterval(autoPlayInterval); return; }
        const replay = HAND_REPLAYS[rs.handId];
        if (!replay) { clearInterval(autoPlayInterval); return; }
        const phase = replay.phases[rs.phaseIndex];
        const isLast = rs.phaseIndex === replay.phases.length - 1 && rs.stepIndex >= (phase ? phase.steps.length - 1 : 0);
        if (isLast) {
          clearInterval(autoPlayInterval);
          rs.playing = false;
          const hand = getHand(rs.handId);
          const players = hand.playersInvolved.map(pid => getPlayer(pid)).filter(Boolean);
          renderHandReplayScreen(hand, replay, players);
        } else {
          replayNext();
        }
      }, 1200);
    } else {
      clearInterval(autoPlayInterval);
      const hand = getHand(state.replayState.handId);
      const replay = HAND_REPLAYS[state.replayState.handId];
      const players = hand.playersInvolved.map(pid => getPlayer(pid)).filter(Boolean);
      renderHandReplayScreen(hand, replay, players);
    }
  }

  function getTablePositions(count) {
    // Positions for players around an elliptical table
    const positions = {
      2: [
        { top: '85%', left: '30%' },
        { top: '85%', left: '70%' },
      ],
      3: [
        { top: '85%', left: '50%' },
        { top: '20%', left: '20%' },
        { top: '20%', left: '80%' },
      ],
      4: [
        { top: '85%', left: '30%' },
        { top: '85%', left: '70%' },
        { top: '15%', left: '70%' },
        { top: '15%', left: '30%' },
      ],
      5: [
        { top: '85%', left: '50%' },
        { top: '70%', left: '10%' },
        { top: '15%', left: '20%' },
        { top: '15%', left: '80%' },
        { top: '70%', left: '90%' },
      ],
      6: [
        { top: '85%', left: '30%' },
        { top: '85%', left: '70%' },
        { top: '50%', left: '95%' },
        { top: '15%', left: '70%' },
        { top: '15%', left: '30%' },
        { top: '50%', left: '5%' },
      ],
    };
    return positions[count] || positions[2];
  }

  // =====================
  // Player Profile Screen
  // =====================
  function showPlayerProfile(playerId) {
    const player = getPlayer(playerId);
    if (!player) return;
    const stats = PLAYER_STATS[playerId];

    state.previousScreen = state.currentScreen === 'tournament' ? `#tournament/${state.currentTournament}/players` : '#home';
    showScreen('player');

    // Hide tournament header
    els.contextHeader.classList.add('hidden');
    els.panelDots.classList.add('hidden');

    const isFav = state.favorites.players.has(playerId);

    let html = `
      <div class="profile-header">
        <button class="profile-back" data-action="profile-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style="flex: 1; font-size: 16px; font-weight: 700;">Player Profile</div>
        <button class="header-btn ${isFav ? 'favorited' : ''}" data-action="toggle-fav-player" data-id="${playerId}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="${isFav ? 'var(--red)' : 'none'}" stroke="${isFav ? 'var(--red)' : 'currentColor'}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="profile-content">
        <div class="profile-hero">
          <div class="profile-avatar" style="background: ${player.color};">${player.initials}</div>
          <div class="profile-name">${player.name}</div>
          <div class="profile-meta">${player.countryFlag} ${player.country} &middot; ${ordinal(player.finishPosition)} place</div>
        </div>
    `;

    // Stats grid
    if (stats) {
      const statList = [
        { key: 'vpip', label: 'VPIP', value: stats.vpip, suffix: '%' },
        { key: 'pfr', label: 'PFR', value: stats.pfr, suffix: '%' },
        { key: 'threeBet', label: '3-Bet', value: stats.threeBet, suffix: '%' },
        { key: 'af', label: 'AF', value: stats.af, suffix: '' },
        { key: 'cbetFlop', label: 'C-Bet', value: stats.cbetFlop, suffix: '%' },
        { key: 'wtsd', label: 'WTSD', value: stats.wtsd, suffix: '%' },
        { key: 'wsd', label: 'W$SD', value: stats.wsd, suffix: '%' },
        { key: 'wwsf', label: 'WWSF', value: stats.wwsf, suffix: '%' },
        { key: 'steal', label: 'Steal', value: stats.steal, suffix: '%' },
        { key: 'foldToSteal', label: 'Fld Steal', value: stats.foldToSteal, suffix: '%' },
        { key: 'checkRaiseFlop', label: 'XR Flop', value: stats.checkRaiseFlop, suffix: '%' },
        { key: 'afq', label: 'AFq', value: stats.afq, suffix: '%' },
      ];

      html += `
        <div class="profile-section-title">HUD Stats</div>
        <div class="profile-stats-grid">
      `;
      statList.forEach(s => {
        html += `
          <div class="profile-stat">
            <div class="profile-stat-value" style="color: ${getStatColor(s.key, s.value)};">
              ${s.key === 'af' ? s.value.toFixed(1) : s.value}${s.suffix}
            </div>
            <div class="profile-stat-label">${s.label}</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Tournaments
    const playerTournaments = TOURNAMENTS.filter(t =>
      t.id === 'wsop-me-2025' // All players in our data are from this tournament
    );

    html += `<div class="profile-section-title">Tournaments</div><div class="profile-tournaments-list">`;
    playerTournaments.forEach(t => {
      html += `
        <div class="profile-tournament-item" data-action="open-tournament" data-id="${t.id}">
          <div class="tournament-thumb" style="background: ${t.imageGradient}; width: 40px; height: 40px; font-size: 14px; border-radius: 8px;">
            ${t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: 600;">${t.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${ordinal(player.finishPosition)} place &middot; ${player.handsPlayed} hands</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    // Notes
    html += `
      <div class="profile-section-title">Notes</div>
      <div class="profile-notes">
        <textarea class="profile-notes-textarea" placeholder="Add your notes about this player..."></textarea>
      </div>
    `;

    html += `</div>`;
    els.screenPlayer.innerHTML = html;
  }

  // =====================
  // Player Overlay
  // =====================
  function showPlayerOverlay(playerId) {
    const player = getPlayer(playerId);
    if (!player) return;
    const stats = PLAYER_STATS[playerId];

    state.playerOverlay = playerId;
    els.playerOverlay.classList.remove('hidden');

    let html = `
      <div class="overlay-player-hero">
        <div class="overlay-player-avatar" style="background: ${player.color};">${player.initials}</div>
        <div class="overlay-player-name">${player.name}</div>
        <div class="overlay-player-meta">${player.countryFlag} ${player.country} &middot; ${ordinal(player.finishPosition)} place</div>
      </div>
    `;

    if (stats) {
      const ringStats = [
        { key: 'vpip', label: 'VPIP', value: stats.vpip, max: 50 },
        { key: 'pfr', label: 'PFR', value: stats.pfr, max: 40 },
        { key: 'threeBet', label: '3-Bet', value: stats.threeBet, max: 20 },
        { key: 'af', label: 'AF', value: stats.af, max: 6, format: v => v.toFixed(1) },
        { key: 'cbetFlop', label: 'C-Bet', value: stats.cbetFlop, max: 100 },
        { key: 'wtsd', label: 'WTSD', value: stats.wtsd, max: 50 },
        { key: 'wsd', label: 'W$SD', value: stats.wsd, max: 70 },
        { key: 'wwsf', label: 'WWSF', value: stats.wwsf, max: 70 },
      ];

      html += `<div class="overlay-stats-grid">`;
      ringStats.forEach(s => {
        const pct = Math.min(s.value / s.max, 1);
        const circumference = 2 * Math.PI * 22;
        const dashoffset = circumference * (1 - pct);
        const color = getStatColor(s.key, s.value);

        html += `
          <div class="overlay-stat">
            <div class="overlay-stat-ring">
              <svg viewBox="0 0 48 48">
                <circle class="ring-bg" cx="24" cy="24" r="22"/>
                <circle class="ring-value" cx="24" cy="24" r="22"
                  stroke="${color}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${dashoffset}"/>
              </svg>
              <div class="overlay-stat-value" style="color: ${color};">
                ${s.format ? s.format(s.value) : s.value}
              </div>
            </div>
            <div class="overlay-stat-label">${s.label}</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `
      <button class="overlay-view-profile" data-action="view-full-profile" data-id="${playerId}">
        View Full Profile &rarr;
      </button>
    `;

    els.overlayContent.innerHTML = html;
  }

  function hidePlayerOverlay() {
    state.playerOverlay = null;
    els.playerOverlay.classList.add('hidden');
  }

  // =====================
  // Sidebar
  // =====================
  function showSidebar() {
    state.sidebarOpen = true;
    els.sidebar.classList.remove('hidden');
    renderSidebar();
  }

  function hideSidebar() {
    state.sidebarOpen = false;
    els.sidebar.classList.add('hidden');
  }

  function renderSidebar() {
    const followed = TOURNAMENTS.filter(t => state.favorites.tournaments.has(t.id));
    const recent = TOURNAMENTS.filter(t => t.status !== 'upcoming').slice(0, 5);

    let html = `<div class="sidebar-section-title">Your Tournaments</div>`;

    if (followed.length === 0) {
      html += `<div style="font-size: 13px; color: var(--text-muted); padding: 8px 12px;">No favorites yet</div>`;
    }

    followed.forEach(t => {
      const isCurrent = t.id === state.currentTournament;
      html += `
        <div class="sidebar-item ${isCurrent ? 'active' : ''}" data-action="sidebar-switch" data-id="${t.id}">
          <div class="sidebar-item-dot" style="background: ${t.imageGradient};"></div>
          <div class="sidebar-item-name">${t.name}</div>
          ${isCurrent ? '<span class="sidebar-item-check">&#10003;</span>' : ''}
        </div>
      `;
    });

    html += `<div class="sidebar-section-title">Recent Tournaments</div>`;
    recent.forEach(t => {
      const isCurrent = t.id === state.currentTournament;
      html += `
        <div class="sidebar-item ${isCurrent ? 'active' : ''}" data-action="sidebar-switch" data-id="${t.id}">
          <div class="sidebar-item-dot" style="background: ${t.imageGradient};"></div>
          <div class="sidebar-item-name">${t.name}</div>
          ${isCurrent ? '<span class="sidebar-item-check">&#10003;</span>' : ''}
        </div>
      `;
    });

    html += `<div class="sidebar-search-link" data-action="sidebar-search">Search All Tournaments</div>`;

    els.sidebarContent.innerHTML = html;
  }

  // =====================
  // Search Screen
  // =====================
  function renderSearch() {
    const tabs = ['tournaments', 'players', 'hands'];

    let html = `
      <div class="search-header">
        <div class="search-input-wrapper">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" class="search-input" id="search-main-input" placeholder="Search tournaments, players, hands..." value="${state.searchQuery}">
        </div>
      </div>
      <div class="search-tabs">
    `;

    tabs.forEach(tab => {
      html += `<button class="search-tab ${state.searchTab === tab ? 'active' : ''}" data-action="search-tab" data-tab="${tab}">${tab.charAt(0).toUpperCase() + tab.slice(1)}</button>`;
    });

    html += `</div><div class="search-results" id="search-results">`;
    html += renderSearchResults();
    html += `</div>`;

    els.screenSearch.innerHTML = html;

    // Auto-focus
    setTimeout(() => {
      const input = document.getElementById('search-main-input');
      if (input) input.focus();
    }, 100);
  }

  function renderSearchResults() {
    const q = state.searchQuery.toLowerCase().trim();
    let html = '';

    if (!q) {
      html = `<div class="search-empty">Start typing to search...</div>`;
      return html;
    }

    if (state.searchTab === 'tournaments') {
      const results = TOURNAMENTS.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.event.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q)
      );
      if (results.length === 0) {
        html = `<div class="search-empty">No tournaments found</div>`;
      } else {
        results.forEach(t => {
          html += `
            <div class="fav-card" data-action="open-tournament" data-id="${t.id}">
              <div class="tournament-thumb" style="background: ${t.imageGradient}; width: 40px; height: 40px; font-size: 14px;">
                ${t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div class="fav-card-info">
                <div class="fav-card-name">${t.name}</div>
                <div class="fav-card-meta">${t.event} &middot; ${t.handCount} hands</div>
              </div>
            </div>
          `;
        });
      }
    } else if (state.searchTab === 'players') {
      const results = PLAYERS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
      );
      if (results.length === 0) {
        html = `<div class="search-empty">No players found</div>`;
      } else {
        results.forEach(p => {
          html += `
            <div class="fav-card" data-action="open-player-overlay" data-id="${p.id}">
              <div class="player-strip-avatar" style="background: ${p.color}; width: 40px; height: 40px; font-size: 14px; border: none;">
                ${p.initials}
              </div>
              <div class="fav-card-info">
                <div class="fav-card-name">${p.name}</div>
                <div class="fav-card-meta">${p.countryFlag} ${p.country} &middot; ${ordinal(p.finishPosition)} place</div>
              </div>
            </div>
          `;
        });
      }
    } else if (state.searchTab === 'hands') {
      const results = HANDS.filter(h =>
        h.preview.toLowerCase().includes(q) ||
        h.handNumber.toString().includes(q) ||
        (h.highlightLabel && h.highlightLabel.toLowerCase().includes(q))
      );
      if (results.length === 0) {
        html = `<div class="search-empty">No hands found</div>`;
      } else {
        results.forEach(h => {
          html += `
            <div class="fav-card" data-action="open-hand" data-id="${h.id}">
              <div style="min-width: 40px; text-align: center; font-weight: 700; color: var(--text-muted);">#${h.handNumber}</div>
              <div class="fav-card-info">
                <div class="fav-card-name">${h.preview.substring(0, 50)}...</div>
                <div class="fav-card-meta">Pot: ${formatChips(h.potTotal)}</div>
              </div>
            </div>
          `;
        });
      }
    }

    return html;
  }

  // =====================
  // Favorites Screen
  // =====================
  function renderFavorites() {
    let html = `
      <div class="favorites-header">
        <div class="favorites-title">Favorites</div>
      </div>
    `;

    // Favorite Tournaments
    html += `<div class="favorites-section"><div class="favorites-section-title">Tournaments</div>`;
    const favTournaments = TOURNAMENTS.filter(t => state.favorites.tournaments.has(t.id));
    if (favTournaments.length === 0) {
      html += `<div class="favorites-empty">No favorite tournaments yet</div>`;
    } else {
      favTournaments.forEach(t => {
        html += `
          <div class="fav-card" data-action="open-tournament" data-id="${t.id}">
            <div class="tournament-thumb" style="background: ${t.imageGradient}; width: 40px; height: 40px; font-size: 14px;">
              ${t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div class="fav-card-info">
              <div class="fav-card-name">${t.name}</div>
              <div class="fav-card-meta">${t.event} &middot; ${t.handCount} hands</div>
            </div>
            <button class="fav-remove-btn" data-action="remove-fav-tournament" data-id="${t.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `;
      });
    }
    html += `</div>`;

    // Favorite Players
    html += `<div class="favorites-section"><div class="favorites-section-title">Players</div>`;
    const favPlayers = PLAYERS.filter(p => state.favorites.players.has(p.id));
    if (favPlayers.length === 0) {
      html += `<div class="favorites-empty">No favorite players yet</div>`;
    } else {
      favPlayers.forEach(p => {
        html += `
          <div class="fav-card" data-action="goto-player" data-id="${p.id}">
            <div class="player-strip-avatar" style="background: ${p.color}; width: 40px; height: 40px; font-size: 14px; border: none;">
              ${p.initials}
            </div>
            <div class="fav-card-info">
              <div class="fav-card-name">${p.name}</div>
              <div class="fav-card-meta">${p.countryFlag} ${ordinal(p.finishPosition)} place</div>
            </div>
            <button class="fav-remove-btn" data-action="remove-fav-player" data-id="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `;
      });
    }
    html += `</div>`;

    // Favorite Hands
    html += `<div class="favorites-section"><div class="favorites-section-title">Hands</div>`;
    const favHands = HANDS.filter(h => state.favorites.hands.has(h.id));
    if (favHands.length === 0) {
      html += `<div class="favorites-empty">No favorite hands yet</div>`;
    } else {
      favHands.forEach(h => {
        html += `
          <div class="fav-card" data-action="open-hand" data-id="${h.id}">
            <div style="min-width: 40px; text-align: center; font-weight: 700; color: var(--text-muted);">#${h.handNumber}</div>
            <div class="fav-card-info">
              <div class="fav-card-name">${h.preview.substring(0, 50)}...</div>
              <div class="fav-card-meta">Pot: ${formatChips(h.potTotal)}</div>
            </div>
            <button class="fav-remove-btn" data-action="remove-fav-hand" data-id="${h.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `;
      });
    }
    html += `</div>`;

    els.screenFavorites.innerHTML = html;
  }

  // =====================
  // Swipe Detection
  // =====================
  function initSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    els.panelsWrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    els.panelsWrapper.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > dy && dx > 10) {
        isSwiping = true;
      }
    }, { passive: true });

    els.panelsWrapper.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) nextPanel();
        else prevPanel();
      }
    }, { passive: true });
  }

  // =====================
  // Event Delegation
  // =====================
  function initEventListeners() {
    // Global click delegation
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'open-tournament':
          navigate(`#tournament/${target.dataset.id}/overview`);
          break;

        case 'open-hand':
          navigate(`#hand/${target.dataset.id}`);
          break;

        case 'open-player-overlay':
          showPlayerOverlay(target.dataset.id);
          break;

        case 'goto-player':
          navigate(`#player/${target.dataset.id}`);
          break;

        case 'view-full-profile':
          hidePlayerOverlay();
          navigate(`#player/${target.dataset.id}`);
          break;

        case 'goto-players':
          updatePanelPosition(1);
          break;

        case 'goto-ai':
          updatePanelPosition(3);
          break;

        case 'filter-highlight': {
          const type = target.dataset.type;
          state.handFilter = type;
          updatePanelPosition(2);
          const t = getTournament(state.currentTournament);
          if (t) renderHandsPanel(t);
          break;
        }

        case 'filter-hands': {
          state.handFilter = target.dataset.filter;
          const t2 = getTournament(state.currentTournament);
          if (t2) renderHandsPanel(t2);
          break;
        }

        case 'sort-players': {
          state.playerSort = target.dataset.sort;
          const t3 = getTournament(state.currentTournament);
          if (t3) renderPlayersPanel(t3);
          break;
        }

        case 'toggle-scouting': {
          const pid = target.dataset.id;
          if (state.expandedScouting.has(pid)) {
            state.expandedScouting.delete(pid);
          } else {
            state.expandedScouting.add(pid);
          }
          const t4 = getTournament(state.currentTournament);
          if (t4) renderAiPanel(t4);
          updateAiChat();
          break;
        }

        case 'answer-quiz': {
          const quizId = target.dataset.quiz;
          const idx = parseInt(target.dataset.index);
          if (state.quizAnswers[quizId] !== undefined) return;
          state.quizAnswers[quizId] = idx;
          const t5 = getTournament(state.currentTournament);
          if (t5) renderAiPanel(t5);
          updateAiChat();
          break;
        }

        case 'send-chat': {
          sendChat();
          break;
        }

        case 'replay-back':
          if (state.replayState && state.replayState.playing) {
            clearInterval(autoPlayInterval);
            state.replayState.playing = false;
          }
          if (state.previousScreen) {
            navigate(state.previousScreen);
          } else {
            navigate('#home');
          }
          break;

        case 'replay-prev':
          replayPrev();
          break;

        case 'replay-next':
          replayNext();
          break;

        case 'replay-play':
          toggleAutoPlay();
          break;

        case 'profile-back':
          if (state.previousScreen) {
            navigate(state.previousScreen);
          } else {
            navigate('#home');
          }
          break;

        case 'toggle-fav-player': {
          const pId = target.dataset.id;
          if (state.favorites.players.has(pId)) {
            state.favorites.players.delete(pId);
          } else {
            state.favorites.players.add(pId);
          }
          showPlayerProfile(pId);
          break;
        }

        case 'search-tab': {
          state.searchTab = target.dataset.tab;
          renderSearch();
          break;
        }

        case 'sidebar-switch': {
          const tId = target.dataset.id;
          hideSidebar();
          navigate(`#tournament/${tId}/overview`);
          break;
        }

        case 'sidebar-search':
          hideSidebar();
          navigate('#search');
          break;

        case 'remove-fav-tournament':
          e.stopPropagation();
          state.favorites.tournaments.delete(target.dataset.id);
          renderFavorites();
          break;

        case 'remove-fav-player':
          e.stopPropagation();
          state.favorites.players.delete(target.dataset.id);
          renderFavorites();
          break;

        case 'remove-fav-hand':
          e.stopPropagation();
          state.favorites.hands.delete(target.dataset.id);
          renderFavorites();
          break;

        case 'search-hands':
          // handled by input event
          break;
      }
    });

    // Input events
    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-main-input') {
        state.searchQuery = e.target.value;
        const resultsEl = document.getElementById('search-results');
        if (resultsEl) resultsEl.innerHTML = renderSearchResults();
      }
      if (e.target.matches('[data-action="search-hands"]')) {
        state.handSearch = e.target.value;
        const t = getTournament(state.currentTournament);
        if (t) renderHandsPanel(t);
      }
    });

    // Keypress for chat
    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'ai-chat-input' && e.key === 'Enter') {
        sendChat();
      }
    });

    // Bottom nav
    $$('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        navigate(`#${screen}`);
      });
    });

    // Hamburger
    $('#hamburger-btn').addEventListener('click', showSidebar);

    // Sidebar close
    $('#sidebar-close').addEventListener('click', hideSidebar);
    $('#sidebar-backdrop').addEventListener('click', hideSidebar);

    // Overlay backdrop close
    els.playerOverlay.querySelector('.overlay-backdrop').addEventListener('click', hidePlayerOverlay);

    // Header favorite toggle
    els.headerFavBtn.addEventListener('click', () => {
      if (!state.currentTournament) return;
      if (state.favorites.tournaments.has(state.currentTournament)) {
        state.favorites.tournaments.delete(state.currentTournament);
      } else {
        state.favorites.tournaments.add(state.currentTournament);
      }
      updateFavButton();
    });

    // Header share
    $('#header-share-btn').addEventListener('click', () => {
      if (navigator.share && state.currentTournament) {
        const t = getTournament(state.currentTournament);
        navigator.share({ title: `HUDR - ${t.name}`, url: window.location.href }).catch(() => {});
      }
    });

    // Panel dots click
    $$('.panel-dots .dot').forEach(dot => {
      dot.addEventListener('click', () => {
        updatePanelPosition(parseInt(dot.dataset.panel));
      });
    });

    $$('.dot-label').forEach(label => {
      label.addEventListener('click', () => {
        updatePanelPosition(parseInt(label.dataset.panel));
      });
    });

    // Watch panel changes for AI chat visibility
    const origUpdate = updatePanelPosition;
    // Already handled by updateAiChat calls
  }

  // Override updatePanelPosition to also handle AI chat
  const _origUpdatePanel = updatePanelPosition;
  // We'll just call updateAiChat after each panel update by hooking into updateDots
  const _origUpdateDots = updateDots;

  // =====================
  // Chat
  // =====================
  function sendChat() {
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    input.value = '';

    // Find matching response
    const match = AI_CONTENT.chatResponses.find(r =>
      query.toLowerCase().includes(r.query.toLowerCase().split(' ').slice(0, 3).join(' '))
    );

    const response = match
      ? match.response
      : `I don't have a specific answer for that question yet. Try asking about the players, bluffs, eliminations, or comparing specific players.`;

    state.chatMessages.push({ query, response });

    const t = getTournament(state.currentTournament);
    if (t) renderAiPanel(t);
    updateAiChat();

    // Scroll to bottom of AI panel
    setTimeout(() => {
      els.panelAi.scrollTop = els.panelAi.scrollHeight;
    }, 50);
  }

  // =====================
  // Helpers
  // =====================
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function ordinal(n) {
    if (!n) return '';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // =====================
  // Init
  // =====================
  function init() {
    initEventListeners();
    initSwipe();

    // Handle initial hash
    if (window.location.hash) {
      handleRoute(window.location.hash);
    } else {
      renderHome();
    }

    // Monitor panel changes for AI chat
    const observer = new MutationObserver(() => updateAiChat());
    observer.observe(els.panelsWrapper, { attributes: true, attributeFilter: ['style'] });
  }

  // Start
  init();
})();
