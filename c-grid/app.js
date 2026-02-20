/**
 * HUDR Grid — "The Grid" Dashboard-First PWA
 * Prototype C: Bloomberg/Notion-style widget dashboard
 */

(function () {
  'use strict';

  const D = window.HUDR_DATA;

  // =====================
  // State
  // =====================
  const state = {
    currentScreen: 'dashboard',
    selectedTournament: 'wsop-me-2025',
    expandedWidget: null,
    selectedPlayer: 'p1',
    handFilter: 'all',
    replayHand: null,
    replayStep: 0,
    replayPlaying: false,
    dropdownOpen: false,
    expandedPlayerId: null,
    selectedStat: null,
    quizAnswers: {},
    chatMessages: [],
    searchQuery: '',
    favorites: {
      tournaments: new Set(D.USER_PROFILE.favorites.tournaments),
      players: new Set(D.USER_PROFILE.favorites.players),
      hands: new Set(D.USER_PROFILE.favorites.hands),
    },
  };

  // =====================
  // DOM References
  // =====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const mainContent = $('#mainContent');
  const replayModal = $('#replayModal');
  const replayContent = $('#replayContent');
  const tournamentSelector = $('#tournamentSelector');
  const tournamentDropdown = $('#tournamentDropdown');
  const dropdownList = $('#dropdownList');
  const tournamentNameEl = $('#tournamentName');

  // =====================
  // Helpers
  // =====================
  function getTournamentPlayers() {
    // Only WSOP ME has full player data
    if (state.selectedTournament === 'wsop-me-2025') return D.PLAYERS;
    return D.PLAYERS.slice(0, D.getTournament(state.selectedTournament)?.playerCount || 6);
  }

  function getTournamentHands() {
    return D.getHandsForTournament(state.selectedTournament);
  }

  function renderCard(card) {
    const rank = D.getCardRank(card);
    const suit = D.getCardSuit(card);
    const red = D.isRedSuit(card);
    return `<span class="mini-card ${red ? 'red' : 'black'}">${rank}${suit}</span>`;
  }

  function renderReplayCard(card, facedown) {
    if (facedown) return `<div class="replay-card facedown"><span class="replay-card-rank"></span><span class="replay-card-suit"></span></div>`;
    const rank = D.getCardRank(card);
    const suit = D.getCardSuit(card);
    const red = D.isRedSuit(card);
    return `<div class="replay-card ${red ? 'red' : ''}"><span class="replay-card-rank">${rank}</span><span class="replay-card-suit">${suit}</span></div>`;
  }

  function renderMiniPlayerCard(card, facedown) {
    if (facedown) return `<div class="replay-player-card-mini facedown">&nbsp;</div>`;
    const rank = D.getCardRank(card);
    const suit = D.getCardSuit(card);
    const red = D.isRedSuit(card);
    return `<div class="replay-player-card-mini ${red ? 'red' : ''}"><span style="font-size:10px;font-weight:800;line-height:1">${rank}</span><span style="font-size:9px;line-height:1">${suit}</span></div>`;
  }

  function getHighlightColor(type) {
    const colors = {
      biggest_pot: '#f59e0b',
      bluff: '#8b5cf6',
      hero_call: '#10b981',
      cooler: '#3b82f6',
      bad_beat: '#ef4444',
      elimination: '#6b7280',
    };
    return colors[type] || '#6b7280';
  }

  function createProgressRingSVG(value, max, color, size, label) {
    const r = (size - 6) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const offset = circumference * (1 - pct);
    const displayVal = max <= 10 ? value.toFixed(1) : Math.round(value);
    return `
      <svg class="stat-ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="stat-ring-bg" cx="${c}" cy="${c}" r="${r}" />
        <circle class="stat-ring-fill" cx="${c}" cy="${c}" r="${r}"
          stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          transform="rotate(-90 ${c} ${c})" />
        <text class="stat-ring-value" x="${c}" y="${c + 1}" text-anchor="middle" dominant-baseline="middle" font-size="${size < 42 ? 10 : 12}" font-weight="700">${displayVal}</text>
      </svg>
    `;
  }

  // =====================
  // Routing
  // =====================
  function navigate(screen, params) {
    if (screen === 'dashboard' || screen === 'search' || screen === 'profile') {
      state.currentScreen = screen;
      state.expandedWidget = null;
      state.expandedPlayerId = null;
      state.selectedStat = null;
    }
    if (params?.widget) {
      state.expandedWidget = params.widget;
    }
    if (params?.player) {
      state.selectedPlayer = params.player;
    }
    if (params?.hand) {
      openReplay(params.hand);
      return;
    }
    updateHash();
    render();
    updateNav();
  }

  function updateHash() {
    if (state.expandedWidget) {
      location.hash = `#widget/${state.expandedWidget}`;
    } else {
      location.hash = `#${state.currentScreen}`;
    }
  }

  function handleHashChange() {
    const hash = location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    if (parts[0] === 'widget' && parts[1]) {
      state.currentScreen = 'dashboard';
      state.expandedWidget = parts[1];
    } else if (parts[0] === 'hand' && parts[1]) {
      openReplay(parts[1]);
      return;
    } else if (parts[0] === 'player' && parts[1]) {
      state.currentScreen = 'dashboard';
      state.expandedWidget = 'players';
      state.expandedPlayerId = parts[1];
    } else {
      state.currentScreen = parts[0] || 'dashboard';
      state.expandedWidget = null;
    }
    render();
    updateNav();
  }

  function updateNav() {
    $$('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.screen === state.currentScreen);
    });
  }

  // =====================
  // Tournament Dropdown
  // =====================
  function initDropdown() {
    dropdownList.innerHTML = D.TOURNAMENTS.map((t) => {
      let statusBadge = '';
      if (t.liveStatus === 'live') statusBadge = `<span class="dd-status live">LIVE</span>`;
      else if (t.status === 'upcoming') statusBadge = `<span class="dd-status upcoming">SOON</span>`;
      return `<div class="dropdown-item ${t.id === state.selectedTournament ? 'active' : ''}" data-id="${t.id}">
        <span>${t.name}</span>${statusBadge}
      </div>`;
    }).join('');

    tournamentSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      state.dropdownOpen = !state.dropdownOpen;
      tournamentDropdown.classList.toggle('open', state.dropdownOpen);
      tournamentSelector.classList.toggle('open', state.dropdownOpen);
    });

    dropdownList.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      state.selectedTournament = item.dataset.id;
      state.dropdownOpen = false;
      tournamentDropdown.classList.remove('open');
      tournamentSelector.classList.remove('open');
      const t = D.getTournament(state.selectedTournament);
      tournamentNameEl.textContent = t ? t.name.replace(/\s*\d{4}$/, '') : '';
      // Re-init dropdown active states
      dropdownList.querySelectorAll('.dropdown-item').forEach((d) => {
        d.classList.toggle('active', d.dataset.id === state.selectedTournament);
      });
      render();
    });

    document.addEventListener('click', () => {
      if (state.dropdownOpen) {
        state.dropdownOpen = false;
        tournamentDropdown.classList.remove('open');
        tournamentSelector.classList.remove('open');
      }
    });
  }

  // =====================
  // Render
  // =====================
  function render() {
    if (state.expandedWidget) {
      renderExpandedWidget();
      return;
    }
    switch (state.currentScreen) {
      case 'dashboard': renderDashboard(); break;
      case 'search': renderSearch(); break;
      case 'profile': renderProfile(); break;
      default: renderDashboard();
    }
  }

  // =====================
  // Dashboard
  // =====================
  function renderDashboard() {
    const players = getTournamentPlayers();
    const hands = getTournamentHands();
    const stats = D.PLAYER_STATS[state.selectedPlayer] || D.PLAYER_STATS.p1;
    const tournament = D.getTournament(state.selectedTournament);

    mainContent.innerHTML = `
      <div class="widget-grid">
        ${renderWidgetPlayers(players)}
        ${renderWidgetHands(hands)}
        ${renderWidgetStats(stats)}
        ${renderWidgetAI()}
        ${renderWidgetHighlights()}
        ${renderWidgetTimeline()}
      </div>
    `;

    // Wire up widget taps
    mainContent.querySelectorAll('.widget').forEach((w) => {
      const type = w.dataset.widget;
      if (!type) return;

      const expandBtn = w.querySelector('.widget-expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigate('dashboard', { widget: type });
        });
      }

      w.addEventListener('click', (e) => {
        if (e.target.closest('.widget-expand') || e.target.closest('.stats-player-selector') || e.target.closest('.highlight-pill')) return;
        navigate('dashboard', { widget: type });
      });
    });

    // Stats player selector
    const statsSelector = mainContent.querySelector('.stats-player-selector');
    if (statsSelector) {
      statsSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        // Cycle through players
        const playerIds = players.map((p) => p.id);
        const idx = playerIds.indexOf(state.selectedPlayer);
        state.selectedPlayer = playerIds[(idx + 1) % playerIds.length];
        render();
      });
    }

    // Highlight pills
    mainContent.querySelectorAll('.highlight-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate('dashboard', { widget: 'highlights' });
      });
    });
  }

  // =====================
  // Widget: Players
  // =====================
  function renderWidgetPlayers(players) {
    const display = players.slice(0, 9);
    return `
      <div class="widget" data-widget="players">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">Players</span>
            <span class="widget-badge">${players.length}</span>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <div class="player-grid">
            ${display.map((p) => `
              <div class="player-avatar-mini" style="border-color: ${p.color}">${p.initials}</div>
            `).join('')}
          </div>
        </div>
        <div class="widget-footer">${players.length} players &bull; Tap to explore</div>
      </div>
    `;
  }

  // =====================
  // Widget: Hands
  // =====================
  function renderWidgetHands(hands) {
    const latest = hands.slice(0, 5);
    return `
      <div class="widget" data-widget="hands">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">Hands</span>
            <span class="widget-badge">${hands.length}</span>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <div class="hands-mini-list">
            ${latest.map((h) => {
              const winner = D.getPlayer(h.winnerId);
              const dotColor = h.highlightType ? getHighlightColor(h.highlightType) : null;
              return `
                <div class="hand-mini-row">
                  <span class="hand-mini-num">#${h.handNumber}</span>
                  <span class="hand-mini-winner">${winner ? winner.initials : '??'}</span>
                  <span class="hand-mini-pot">${D.formatChips(h.potTotal)}</span>
                  ${dotColor ? `<span class="hand-mini-dot" style="background:${dotColor}"></span>` : '<span class="hand-mini-dot" style="background:transparent"></span>'}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="widget-footer">Latest hands &bull; Tap for all</div>
      </div>
    `;
  }

  // =====================
  // Widget: Stats
  // =====================
  function renderWidgetStats(stats) {
    const player = D.getPlayer(state.selectedPlayer);
    const statItems = [
      { key: 'vpip', label: 'VPIP', value: stats.vpip, max: 100 },
      { key: 'pfr', label: 'PFR', value: stats.pfr, max: 100 },
      { key: 'af', label: 'AF', value: stats.af, max: 5 },
      { key: 'wtsd', label: 'WTSD', value: stats.wtsd, max: 100 },
    ];

    return `
      <div class="widget" data-widget="stats">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">Stats</span>
            <button class="stats-player-selector">
              <span style="width:8px;height:8px;border-radius:50%;background:${player?.color || '#666'};display:inline-block"></span>
              ${player?.initials || '??'}
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M2 3l2 2 2-2" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <div class="stats-ring-grid">
            ${statItems.map((s) => {
              const color = D.getStatColor(s.key, s.value);
              return `
                <div class="stat-ring">
                  ${createProgressRingSVG(s.value, s.max, color, 44, s.label)}
                  <span class="stat-ring-label">${s.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="widget-footer">${player?.name || 'Player'} &bull; ${stats.totalHands} hands</div>
      </div>
    `;
  }

  // =====================
  // Widget: AI Insights
  // =====================
  function renderWidgetAI() {
    const insights = D.AI_CONTENT.insights.slice(0, 2);
    return `
      <div class="widget widget-ai" data-widget="ai">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">AI</span>
            <span class="ai-sparkle">&#10024;</span>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <div class="ai-insights-mini">
            ${insights.map((ins) => `
              <div class="ai-insight-mini">
                <span class="ai-insight-icon">${ins.icon}</span>
                <span class="ai-insight-text">${ins.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="widget-footer">${D.AI_CONTENT.insights.length} insights &bull; Tap to explore</div>
      </div>
    `;
  }

  // =====================
  // Widget: Highlights
  // =====================
  function renderWidgetHighlights() {
    const types = Object.entries(D.HIGHLIGHT_LABELS);
    return `
      <div class="widget full-width" data-widget="highlights">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">Highlights</span>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <div class="highlight-pills">
            ${types.map(([key, info]) => {
              const count = D.HIGHLIGHTS[key]?.length || 0;
              if (count === 0) return '';
              return `<div class="highlight-pill" data-type="${key}" style="border-color:${info.color}33">
                <span>${info.icon}</span>
                <span class="pill-count" style="color:${info.color}">${count}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =====================
  // Widget: Timeline (Mini SVG)
  // =====================
  function renderWidgetTimeline() {
    const timeline = D.CHIP_TIMELINE;
    if (!timeline || timeline.length === 0) return '';

    // Build SVG polylines
    const players = D.PLAYERS;
    const handNums = timeline.map((t) => t.handNumber);
    const minHand = Math.min(...handNums);
    const maxHand = Math.max(...handNums);

    // Gather all stack values for Y range
    let maxStack = 0;
    timeline.forEach((t) => {
      Object.values(t.stacks).forEach((v) => { if (v > maxStack) maxStack = v; });
    });

    const svgW = 320;
    const svgH = 80;
    const pad = { l: 4, r: 4, t: 4, b: 4 };
    const plotW = svgW - pad.l - pad.r;
    const plotH = svgH - pad.t - pad.b;

    function scaleX(hand) { return pad.l + ((hand - minHand) / (maxHand - minHand || 1)) * plotW; }
    function scaleY(stack) { return pad.t + plotH - (stack / maxStack) * plotH; }

    // Build polylines per player
    const lines = players.map((p) => {
      const points = [];
      timeline.forEach((t) => {
        if (t.stacks[p.id] !== undefined) {
          points.push(`${scaleX(t.handNumber).toFixed(1)},${scaleY(t.stacks[p.id]).toFixed(1)}`);
        }
      });
      if (points.length < 2) return '';
      return `<polyline class="timeline-line" points="${points.join(' ')}" stroke="${p.color}" />`;
    }).filter(Boolean).join('');

    return `
      <div class="widget full-width" data-widget="timeline">
        <div class="widget-header">
          <div class="widget-title">
            <span class="widget-title-text">Timeline</span>
          </div>
          <button class="widget-expand" title="Expand">&#x2922;</button>
        </div>
        <div class="widget-body">
          <svg class="timeline-mini" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none">
            ${lines}
          </svg>
        </div>
      </div>
    `;
  }

  // =====================
  // Expanded Widget Screens
  // =====================
  function renderExpandedWidget() {
    let html = '';
    switch (state.expandedWidget) {
      case 'players': html = renderExpandedPlayers(); break;
      case 'hands': html = renderExpandedHands(); break;
      case 'stats': html = renderExpandedStats(); break;
      case 'ai': html = renderExpandedAI(); break;
      case 'highlights': html = renderExpandedHighlights(); break;
      case 'timeline': html = renderExpandedTimeline(); break;
      default: html = '<div class="expanded-body">Unknown widget</div>';
    }

    const titles = {
      players: 'Players',
      hands: 'Hand History',
      stats: 'HUD Stats',
      ai: 'AI Analysis',
      highlights: 'Highlights',
      timeline: 'Chip Timeline',
    };

    mainContent.innerHTML = `
      <div class="expanded-widget" id="expandedWidget">
        <div class="expanded-header">
          <span class="expanded-title">${titles[state.expandedWidget] || 'Widget'}</span>
          <button class="expanded-close" id="expandedClose">&times;</button>
        </div>
        <div class="expanded-body">${html}</div>
      </div>
    `;

    $('#expandedClose').addEventListener('click', () => {
      const el = $('#expandedWidget');
      el.classList.add('closing');
      setTimeout(() => {
        state.expandedWidget = null;
        state.expandedPlayerId = null;
        state.selectedStat = null;
        navigate('dashboard');
      }, 200);
    });

    wireExpandedEvents();
  }

  function wireExpandedEvents() {
    switch (state.expandedWidget) {
      case 'players': wireExpandedPlayers(); break;
      case 'hands': wireExpandedHands(); break;
      case 'stats': wireExpandedStats(); break;
      case 'ai': wireExpandedAI(); break;
      case 'highlights': wireExpandedHighlights(); break;
      case 'timeline': wireExpandedTimeline(); break;
    }
  }

  // =====================
  // Expanded: Players
  // =====================
  function renderExpandedPlayers() {
    const players = getTournamentPlayers();
    return players.map((p) => {
      const stats = D.PLAYER_STATS[p.id];
      const isExpanded = state.expandedPlayerId === p.id;
      const posClass = p.finishPosition === 1 ? 'winner' : '';

      let expandedHtml = '';
      if (isExpanded && stats) {
        const scouting = D.AI_CONTENT.playerScouting[p.id] || '';
        const allStats = [
          { label: 'VPIP', value: stats.vpip, key: 'vpip' },
          { label: 'PFR', value: stats.pfr, key: 'pfr' },
          { label: '3Bet', value: stats.threeBet, key: 'threeBet' },
          { label: 'AF', value: stats.af, key: 'af' },
          { label: 'CB-F', value: stats.cbetFlop, key: 'cbetFlop' },
          { label: 'CB-T', value: stats.cbetTurn, key: 'cbetTurn' },
          { label: 'WTSD', value: stats.wtsd, key: 'wtsd' },
          { label: 'WSD', value: stats.wsd, key: 'wsd' },
        ];
        expandedHtml = `
          <div class="player-card-expanded" data-player="${p.id}">
            <div class="player-expanded-stats">
              ${allStats.map((s) => {
                const color = D.getStatColor(s.key, s.value);
                const displayVal = s.key === 'af' ? s.value.toFixed(1) : s.value;
                return `<div class="player-expanded-stat">
                  <span class="player-expanded-stat-value" style="color:${color}">${displayVal}</span>
                  <span class="player-expanded-stat-label">${s.label}</span>
                </div>`;
              }).join('')}
            </div>
            ${scouting ? `<div class="player-scouting"><div class="player-scouting-text">${scouting}</div></div>` : ''}
          </div>
        `;
      }

      return `
        <div class="player-card" data-player="${p.id}" style="${isExpanded ? 'border-bottom-left-radius:0;border-bottom-right-radius:0;margin-bottom:0' : ''}">
          <div class="player-card-avatar" style="border-color:${p.color}">${p.initials}</div>
          <div class="player-card-info">
            <div class="player-card-name">${p.countryFlag} ${p.name}</div>
            <div class="player-card-meta">${p.handsPlayed} hands &bull; ${p.status === 'winner' ? 'Winner' : `${p.status} ${p.finishPosition ? '#' + p.finishPosition : ''}`}</div>
          </div>
          <div class="player-card-position ${posClass}">${p.finishPosition ? '#' + p.finishPosition : '-'}</div>
        </div>
        ${expandedHtml}
      `;
    }).join('');
  }

  function wireExpandedPlayers() {
    mainContent.querySelectorAll('.player-card').forEach((card) => {
      card.addEventListener('click', () => {
        const pid = card.dataset.player;
        state.expandedPlayerId = state.expandedPlayerId === pid ? null : pid;
        renderExpandedWidget();
      });
    });
  }

  // =====================
  // Expanded: Hands
  // =====================
  function renderExpandedHands() {
    const hands = getTournamentHands();
    const filterTypes = [
      { key: 'all', label: 'All' },
      { key: 'biggest_pot', label: 'Big Pots' },
      { key: 'bluff', label: 'Bluffs' },
      { key: 'hero_call', label: 'Hero Calls' },
      { key: 'cooler', label: 'Coolers' },
      { key: 'bad_beat', label: 'Bad Beats' },
      { key: 'elimination', label: 'Eliminations' },
    ];

    const filtered = state.handFilter === 'all'
      ? hands
      : hands.filter((h) => h.highlightType === state.handFilter);

    return `
      <div class="hands-filter-bar">
        ${filterTypes.map((f) => `
          <button class="hands-filter-chip ${state.handFilter === f.key ? 'active' : ''}" data-filter="${f.key}">${f.label}</button>
        `).join('')}
      </div>
      <div class="hands-list">
        ${filtered.map((h) => {
          const winner = D.getPlayer(h.winnerId);
          const highlightBar = h.highlightType
            ? `<div class="hand-row-highlight" style="background:${getHighlightColor(h.highlightType)}"></div>`
            : '';
          return `
            <div class="hand-row" data-hand="${h.id}">
              ${highlightBar}
              <span class="hand-row-number">${h.handNumber}</span>
              <div class="hand-row-info">
                <div class="hand-row-preview">${h.preview}</div>
                <div class="hand-row-meta">
                  <span>${winner ? winner.initials : '??'} wins</span>
                  <span>&bull;</span>
                  <div class="hand-row-cards">
                    ${h.communityCards ? h.communityCards.map((c) => renderCard(c)).join('') : ''}
                  </div>
                </div>
              </div>
              <span class="hand-row-pot">${D.formatChips(h.potTotal)}</span>
            </div>
          `;
        }).join('')}
        ${filtered.length === 0 ? '<div style="text-align:center;color:var(--text-dim);padding:20px;font-size:13px">No hands found for this filter</div>' : ''}
      </div>
    `;
  }

  function wireExpandedHands() {
    mainContent.querySelectorAll('.hands-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.handFilter = chip.dataset.filter;
        renderExpandedWidget();
      });
    });

    mainContent.querySelectorAll('.hand-row').forEach((row) => {
      row.addEventListener('click', () => {
        openReplay(row.dataset.hand);
      });
    });
  }

  // =====================
  // Expanded: Stats
  // =====================
  function renderExpandedStats() {
    const players = getTournamentPlayers();
    const stats = D.PLAYER_STATS[state.selectedPlayer];
    if (!stats) return '<div style="padding:20px;text-align:center;color:var(--text-dim)">No stats available</div>';

    const categories = [
      {
        title: 'Preflop',
        stats: [
          { key: 'vpip', label: 'VPIP', value: stats.vpip, max: 100 },
          { key: 'pfr', label: 'PFR', value: stats.pfr, max: 100 },
          { key: 'threeBet', label: '3Bet', value: stats.threeBet, max: 100 },
          { key: 'fourBet', label: '4Bet', value: stats.fourBet, max: 100 },
        ],
      },
      {
        title: 'Postflop',
        stats: [
          { key: 'cbetFlop', label: 'CB-F', value: stats.cbetFlop, max: 100 },
          { key: 'cbetTurn', label: 'CB-T', value: stats.cbetTurn, max: 100 },
          { key: 'cbetRiver', label: 'CB-R', value: stats.cbetRiver, max: 100 },
          { key: 'checkRaiseFlop', label: 'CR-F', value: stats.checkRaiseFlop, max: 100 },
        ],
      },
      {
        title: 'Aggression',
        stats: [
          { key: 'af', label: 'AF', value: stats.af, max: 5 },
          { key: 'afq', label: 'AFq', value: stats.afq, max: 100 },
          { key: 'afFlop', label: 'AF-F', value: stats.afFlop, max: 5 },
          { key: 'afTurn', label: 'AF-T', value: stats.afTurn, max: 5 },
        ],
      },
      {
        title: 'Showdown',
        stats: [
          { key: 'wtsd', label: 'WTSD', value: stats.wtsd, max: 100 },
          { key: 'wsd', label: 'WSD', value: stats.wsd, max: 100 },
          { key: 'wwsf', label: 'WWSF', value: stats.wwsf, max: 100 },
          { key: 'wonWithoutShowdown', label: 'W/oSD', value: stats.wonWithoutShowdown, max: 100 },
        ],
      },
    ];

    // Stat drilldown
    let drilldownHtml = '';
    if (state.selectedStat && D.STAT_HANDS[state.selectedPlayer]) {
      const statHands = D.STAT_HANDS[state.selectedPlayer][state.selectedStat];
      if (statHands && statHands.length > 0) {
        drilldownHtml = `
          <div class="stat-drilldown">
            <div class="stat-drilldown-title">${state.selectedStat.toUpperCase()} Hands</div>
            ${statHands.map((sh) => {
              const posColor = sh.result.startsWith('+') ? 'positive' : 'negative';
              return `<div class="stat-hand-row" data-hand="${sh.handId}">
                <div class="stat-hand-action ${sh.actionTaken ? 'yes' : 'no'}">${sh.actionTaken ? '&#10003;' : '&#10005;'}</div>
                <div class="stat-hand-cards">${sh.cards.map((c) => renderCard(c)).join('')}</div>
                <span class="stat-hand-pos">${sh.position}</span>
                <span class="stat-hand-result ${posColor}">${sh.result}</span>
              </div>`;
            }).join('')}
          </div>
        `;
      }
    }

    return `
      <div class="stats-selector-bar">
        ${players.map((p) => `
          <button class="stats-player-chip ${state.selectedPlayer === p.id ? 'active' : ''}" data-player="${p.id}">
            <span class="stats-player-dot" style="background:${p.color}"></span>
            ${p.initials}
          </button>
        `).join('')}
      </div>
      ${categories.map((cat) => `
        <div class="stats-category">
          <div class="stats-category-title">${cat.title}</div>
          <div class="stats-grid-full">
            ${cat.stats.map((s) => {
              const color = D.getStatColor(s.key, s.value);
              const isSelected = state.selectedStat === s.key;
              return `
                <div class="stat-cell ${isSelected ? 'active' : ''}" data-stat="${s.key}" style="${isSelected ? `border-color:${color};background:var(--bg-surface)` : ''}">
                  ${createProgressRingSVG(s.value, s.max, color, 40, s.label)}
                  <span class="stat-cell-label">${s.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
      ${drilldownHtml}
    `;
  }

  function wireExpandedStats() {
    mainContent.querySelectorAll('.stats-player-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.selectedPlayer = chip.dataset.player;
        state.selectedStat = null;
        renderExpandedWidget();
      });
    });

    mainContent.querySelectorAll('.stat-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const stat = cell.dataset.stat;
        state.selectedStat = state.selectedStat === stat ? null : stat;
        renderExpandedWidget();
      });
    });

    mainContent.querySelectorAll('.stat-hand-row').forEach((row) => {
      row.addEventListener('click', () => {
        openReplay(row.dataset.hand);
      });
    });
  }

  // =====================
  // Expanded: AI
  // =====================
  function renderExpandedAI() {
    const insights = D.AI_CONTENT.insights;
    const story = D.AI_CONTENT.story;
    const quiz = D.AI_CONTENT.quiz;
    const commentary = D.AI_CONTENT.commentary;
    const chatSuggestions = D.AI_CONTENT.chatResponses.map((c) => c.query);

    return `
      <!-- Insights -->
      <div class="ai-section">
        <div class="ai-section-title">&#128202; Key Insights</div>
        ${insights.map((ins) => `
          <div class="ai-insight-card">
            <div class="ai-insight-card-title">${ins.icon} ${ins.title}</div>
            <div class="ai-insight-card-text">${ins.text}</div>
          </div>
        `).join('')}
      </div>

      <!-- Story -->
      <div class="ai-section">
        <div class="ai-section-title">&#128214; Story of the Final Table</div>
        <div class="ai-story-text">${story}</div>
      </div>

      <!-- Quiz -->
      <div class="ai-section">
        <div class="ai-section-title">&#127919; Quiz</div>
        ${quiz.map((q, qi) => `
          <div class="ai-quiz-card" data-quiz="${qi}">
            <div class="ai-quiz-question">${qi + 1}. ${q.question}</div>
            <div class="ai-quiz-options">
              ${q.options.map((opt, oi) => `
                <button class="ai-quiz-option" data-quiz-idx="${qi}" data-option="${oi}">${opt}</button>
              `).join('')}
            </div>
            <div class="ai-quiz-explanation" id="quizExpl${qi}">${q.explanation}</div>
          </div>
        `).join('')}
      </div>

      <!-- Commentary -->
      <div class="ai-section">
        <div class="ai-section-title">&#127908; Commentary</div>
        ${commentary.map((c) => {
          const hand = D.getHand(c.handId);
          return `
            <div class="ai-commentary-card" data-hand="${c.handId}">
              <div class="ai-commentary-hand">Hand #${hand ? hand.handNumber : '?'}</div>
              <div class="ai-commentary-text">${c.text}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Chat -->
      <div class="ai-section">
        <div class="ai-section-title">&#128172; Ask AI</div>
        <div class="ai-chat-container">
          <div class="ai-chat-messages" id="aiChatMessages">
            ${state.chatMessages.map((m) => `
              <div class="ai-chat-message ${m.role}">${m.text}</div>
            `).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
            ${chatSuggestions.slice(0, 3).map((s) => `
              <button class="hands-filter-chip ai-suggestion" data-query="${s}" style="font-size:11px;padding:4px 10px;min-height:32px">${s}</button>
            `).join('')}
          </div>
          <div class="ai-chat-input-row">
            <input class="ai-chat-input" id="aiChatInput" placeholder="Ask about this tournament..." />
            <button class="ai-chat-send" id="aiChatSend">&#8593;</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireExpandedAI() {
    // Quiz
    mainContent.querySelectorAll('.ai-quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qi = parseInt(btn.dataset.quizIdx);
        const oi = parseInt(btn.dataset.option);
        if (state.quizAnswers[qi] !== undefined) return; // Already answered
        state.quizAnswers[qi] = oi;

        const quiz = D.AI_CONTENT.quiz[qi];
        const correct = quiz.correctIndex === oi;

        // Mark all options in this question
        const card = btn.closest('.ai-quiz-card');
        card.querySelectorAll('.ai-quiz-option').forEach((opt) => {
          const optIdx = parseInt(opt.dataset.option);
          if (optIdx === quiz.correctIndex) {
            opt.classList.add('correct');
          } else if (optIdx === oi && !correct) {
            opt.classList.add('incorrect');
          }
        });

        // Show explanation
        const expl = card.querySelector('.ai-quiz-explanation');
        if (expl) expl.classList.add('show');
      });
    });

    // Commentary hand tap
    mainContent.querySelectorAll('.ai-commentary-card').forEach((card) => {
      card.addEventListener('click', () => {
        openReplay(card.dataset.hand);
      });
    });

    // Chat
    const chatInput = $('#aiChatInput');
    const chatSend = $('#aiChatSend');
    const chatMessages = $('#aiChatMessages');

    function sendChat(query) {
      if (!query.trim()) return;
      state.chatMessages.push({ role: 'user', text: query });

      // Find matching response
      const match = D.AI_CONTENT.chatResponses.find((cr) =>
        cr.query.toLowerCase() === query.toLowerCase()
      );
      const response = match
        ? match.response
        : "I can analyze player stats, hand histories, and tournament patterns. Try asking about specific players, hands, or strategies!";
      state.chatMessages.push({ role: 'assistant', text: response });

      chatMessages.innerHTML = state.chatMessages.map((m) => `
        <div class="ai-chat-message ${m.role}">${m.text}</div>
      `).join('');
      chatMessages.scrollTop = chatMessages.scrollHeight;
      if (chatInput) chatInput.value = '';
    }

    if (chatSend) {
      chatSend.addEventListener('click', () => sendChat(chatInput?.value || ''));
    }
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChat(chatInput.value);
      });
    }

    // Suggestion chips
    mainContent.querySelectorAll('.ai-suggestion').forEach((chip) => {
      chip.addEventListener('click', () => {
        sendChat(chip.dataset.query);
      });
    });
  }

  // =====================
  // Expanded: Highlights
  // =====================
  function renderExpandedHighlights() {
    return Object.entries(D.HIGHLIGHT_LABELS).map(([key, info]) => {
      const hands = D.HIGHLIGHTS[key] || [];
      if (hands.length === 0) return '';
      return `
        <div class="highlight-section">
          <div class="highlight-section-header">
            <span class="highlight-section-icon">${info.icon}</span>
            <span class="highlight-section-title" style="color:${info.color}">${info.label}</span>
            <span class="highlight-section-count">(${hands.length})</span>
          </div>
          ${hands.map((h) => {
            const winner = D.getPlayer(h.winnerId);
            return `
              <div class="hand-row" data-hand="${h.id}">
                <div class="hand-row-highlight" style="background:${info.color}"></div>
                <span class="hand-row-number">${h.handNumber}</span>
                <div class="hand-row-info">
                  <div class="hand-row-preview">${h.preview}</div>
                  <div class="hand-row-meta">
                    <span>${winner ? winner.initials : '??'} wins</span>
                    <span>&bull;</span>
                    <div class="hand-row-cards">${h.communityCards ? h.communityCards.map((c) => renderCard(c)).join('') : ''}</div>
                  </div>
                </div>
                <span class="hand-row-pot">${D.formatChips(h.potTotal)}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  }

  function wireExpandedHighlights() {
    mainContent.querySelectorAll('.hand-row').forEach((row) => {
      row.addEventListener('click', () => {
        openReplay(row.dataset.hand);
      });
    });
  }

  // =====================
  // Expanded: Timeline
  // =====================
  function renderExpandedTimeline() {
    const timeline = D.CHIP_TIMELINE;
    const players = D.PLAYERS;
    if (!timeline || timeline.length === 0) return '<div style="text-align:center;color:var(--text-dim);padding:20px">No timeline data</div>';

    const handNums = timeline.map((t) => t.handNumber);
    const minHand = Math.min(...handNums);
    const maxHand = Math.max(...handNums);

    let maxStack = 0;
    timeline.forEach((t) => {
      Object.values(t.stacks).forEach((v) => { if (v > maxStack) maxStack = v; });
    });

    const svgW = 360;
    const svgH = 240;
    const pad = { l: 40, r: 10, t: 10, b: 24 };
    const plotW = svgW - pad.l - pad.r;
    const plotH = svgH - pad.t - pad.b;

    function sx(hand) { return pad.l + ((hand - minHand) / (maxHand - minHand || 1)) * plotW; }
    function sy(stack) { return pad.t + plotH - (stack / maxStack) * plotH; }

    // Grid lines
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH / 4) * i;
      const val = maxStack - (maxStack / 4) * i;
      gridLines.push(`<line class="timeline-grid-line" x1="${pad.l}" y1="${y}" x2="${svgW - pad.r}" y2="${y}" />`);
      gridLines.push(`<text class="timeline-axis-label" x="${pad.l - 4}" y="${y + 3}" text-anchor="end">${D.formatChips(val)}</text>`);
    }

    // X axis labels
    const xLabels = [];
    const step = Math.max(1, Math.floor(handNums.length / 5));
    for (let i = 0; i < handNums.length; i += step) {
      const h = handNums[i];
      xLabels.push(`<text class="timeline-axis-label" x="${sx(h)}" y="${svgH - 4}" text-anchor="middle">#${h}</text>`);
    }

    // Player lines
    const lines = players.map((p) => {
      const points = [];
      timeline.forEach((t) => {
        if (t.stacks[p.id] !== undefined) {
          points.push(`${sx(t.handNumber).toFixed(1)},${sy(t.stacks[p.id]).toFixed(1)}`);
        }
      });
      if (points.length < 2) return '';
      return `<polyline class="timeline-line" points="${points.join(' ')}" stroke="${p.color}" />`;
    }).filter(Boolean).join('');

    // Elimination annotations
    const annotations = [];
    const elimHands = D.HANDS.filter((h) => h.highlightType === 'elimination');
    elimHands.forEach((h) => {
      const loser = h.playersInvolved.find((pid) => pid !== h.winnerId);
      const loserPlayer = D.getPlayer(loser);
      if (!loserPlayer) return;
      const tEntry = timeline.find((t) => t.handNumber >= h.handNumber && !t.stacks[loser]);
      const prevEntry = timeline.find((t) => t.handNumber < h.handNumber && t.stacks[loser]);
      if (!prevEntry) return;
      const lastStack = prevEntry.stacks[loser];
      annotations.push(`
        <g class="timeline-annotation" data-hand="${h.id}">
          <circle cx="${sx(h.handNumber)}" cy="${sy(lastStack)}" r="4" fill="${loserPlayer.color}" stroke="var(--bg-primary)" stroke-width="2" />
        </g>
      `);
    });

    return `
      <div class="timeline-full">
        <div class="timeline-legend">
          ${players.map((p) => `
            <div class="timeline-legend-item">
              <span class="timeline-legend-dot" style="background:${p.color}"></span>
              <span>${p.initials}</span>
            </div>
          `).join('')}
        </div>
        <svg class="timeline-chart-full" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet">
          ${gridLines.join('')}
          ${xLabels.join('')}
          ${lines}
          ${annotations.join('')}
        </svg>
      </div>
    `;
  }

  function wireExpandedTimeline() {
    mainContent.querySelectorAll('.timeline-annotation').forEach((ann) => {
      ann.addEventListener('click', () => {
        openReplay(ann.dataset.hand);
      });
    });
  }

  // =====================
  // Search Screen
  // =====================
  function renderSearch() {
    const q = state.searchQuery.toLowerCase();
    let resultsHtml = '';

    if (q.length > 0) {
      // Players
      const matchedPlayers = D.PLAYERS.filter((p) => p.name.toLowerCase().includes(q));
      // Hands
      const matchedHands = D.HANDS.filter((h) => h.preview.toLowerCase().includes(q) || String(h.handNumber).includes(q));
      // Tournaments
      const matchedTournaments = D.TOURNAMENTS.filter((t) => t.name.toLowerCase().includes(q));

      if (matchedPlayers.length > 0) {
        resultsHtml += `
          <div class="search-result-section">
            <div class="search-result-label">Players</div>
            ${matchedPlayers.map((p) => `
              <div class="search-result-item" data-action="player" data-id="${p.id}">
                <div class="search-result-icon" style="border:2px solid ${p.color};border-radius:50%">${p.initials}</div>
                <div class="search-result-text">
                  <div class="search-result-title">${p.countryFlag} ${p.name}</div>
                  <div class="search-result-sub">Finish: #${p.finishPosition} &bull; ${p.handsPlayed} hands</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (matchedHands.length > 0) {
        resultsHtml += `
          <div class="search-result-section">
            <div class="search-result-label">Hands</div>
            ${matchedHands.slice(0, 10).map((h) => `
              <div class="search-result-item" data-action="hand" data-id="${h.id}">
                <div class="search-result-icon">#${h.handNumber}</div>
                <div class="search-result-text">
                  <div class="search-result-title">${h.winnerName} wins ${D.formatChips(h.potTotal)}</div>
                  <div class="search-result-sub">${h.preview.slice(0, 60)}...</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (matchedTournaments.length > 0) {
        resultsHtml += `
          <div class="search-result-section">
            <div class="search-result-label">Tournaments</div>
            ${matchedTournaments.map((t) => `
              <div class="search-result-item" data-action="tournament" data-id="${t.id}">
                <div class="search-result-icon">&#127942;</div>
                <div class="search-result-text">
                  <div class="search-result-title">${t.name}</div>
                  <div class="search-result-sub">${t.venue} &bull; ${t.handCount} hands</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (matchedPlayers.length === 0 && matchedHands.length === 0 && matchedTournaments.length === 0) {
        resultsHtml = '<div style="text-align:center;color:var(--text-dim);padding:40px;font-size:13px">No results found</div>';
      }
    } else {
      // Show suggested searches
      resultsHtml = `
        <div style="text-align:center;color:var(--text-dim);padding:40px;font-size:13px">
          Search for players, hands, or tournaments
        </div>
      `;
    }

    mainContent.innerHTML = `
      <div class="search-container fade-in">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 12L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input class="search-input" id="searchInput" placeholder="Search players, hands, stats..." value="${state.searchQuery}" />
        </div>
        <div class="search-results">${resultsHtml}</div>
      </div>
    `;

    const searchInput = $('#searchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderSearch();
      });
    }

    // Result clicks
    mainContent.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const id = item.dataset.id;
        if (action === 'player') {
          state.expandedPlayerId = id;
          navigate('dashboard', { widget: 'players' });
        } else if (action === 'hand') {
          openReplay(id);
        } else if (action === 'tournament') {
          state.selectedTournament = id;
          const t = D.getTournament(id);
          tournamentNameEl.textContent = t ? t.name.replace(/\s*\d{4}$/, '') : '';
          dropdownList.querySelectorAll('.dropdown-item').forEach((d) => {
            d.classList.toggle('active', d.dataset.id === id);
          });
          navigate('dashboard');
        }
      });
    });
  }

  // =====================
  // Profile Screen
  // =====================
  function renderProfile() {
    const profile = D.USER_PROFILE;
    const wisdom = D.WISDOM[Math.floor(Math.random() * D.WISDOM.length)];

    const favPlayers = D.PLAYERS.filter((p) => state.favorites.players.has(p.id));
    const favTournaments = D.TOURNAMENTS.filter((t) => state.favorites.tournaments.has(t.id));

    mainContent.innerHTML = `
      <div class="profile-container fade-in">
        <div class="profile-header-card">
          <div class="profile-avatar">${profile.initials}</div>
          <div class="profile-info">
            <div class="profile-name">${profile.name}</div>
            <div class="profile-tier">${profile.tierIcon} ${profile.tier} &bull; Level ${profile.level}</div>
          </div>
        </div>

        <div class="profile-stats-row">
          <div class="profile-stat-card">
            <span class="profile-stat-value">${profile.xp}</span>
            <span class="profile-stat-label">XP</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-value">${profile.level}</span>
            <span class="profile-stat-label">Level</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-value">${profile.streak}</span>
            <span class="profile-stat-label">Streak</span>
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Favorite Players</div>
          ${favPlayers.map((p) => `
            <div class="profile-fav-row">
              <span class="profile-fav-icon" style="color:${p.color}">&#9679;</span>
              <span class="profile-fav-name">${p.countryFlag} ${p.name}</span>
            </div>
          `).join('')}
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Favorite Tournaments</div>
          ${favTournaments.map((t) => `
            <div class="profile-fav-row">
              <span class="profile-fav-icon">&#127942;</span>
              <span class="profile-fav-name">${t.name}</span>
            </div>
          `).join('')}
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Daily Wisdom</div>
          <div class="profile-wisdom">
            <div class="profile-wisdom-quote">"${wisdom.quote}"</div>
            <div class="profile-wisdom-author">&mdash; ${wisdom.author}</div>
          </div>
        </div>
      </div>
    `;
  }

  // =====================
  // Hand Replay Modal
  // =====================
  function openReplay(handId) {
    const hand = D.getHand(handId);
    if (!hand) return;

    state.replayHand = handId;
    state.replayStep = 0;
    state.replayPlaying = false;

    const replay = D.HAND_REPLAYS[handId];
    renderReplayModal(hand, replay);
    replayModal.classList.add('open');
  }

  function closeReplay() {
    replayModal.classList.remove('open');
    state.replayHand = null;
    state.replayPlaying = false;
    if (state._replayInterval) {
      clearInterval(state._replayInterval);
      state._replayInterval = null;
    }
  }

  function renderReplayModal(hand, replay) {
    const players = hand.playersInvolved.map((pid) => D.getPlayer(pid)).filter(Boolean);

    if (!replay) {
      // Simple display without step-by-step
      replayContent.innerHTML = `
        <div class="replay-header">
          <div>
            <div class="replay-title">Hand #${hand.handNumber}</div>
            <div class="replay-subtitle">${hand.highlightLabel || hand.blinds}</div>
          </div>
          <button class="replay-close" id="replayClose">&times;</button>
        </div>
        <div class="replay-table">
          <div class="replay-community">
            ${hand.communityCards ? hand.communityCards.map((c) => renderReplayCard(c)).join('') : ''}
          </div>
          <div class="replay-pot">Pot: ${D.formatChips(hand.potTotal)}</div>
          <div class="replay-players">
            ${players.map((p) => {
              const cards = hand.holeCards[p.id];
              const isWinner = p.id === hand.winnerId;
              return `
                <div class="replay-player">
                  <div class="replay-player-avatar ${isWinner ? 'winner' : ''}" style="border-color:${p.color}">${p.initials}</div>
                  <div class="replay-player-cards">
                    ${cards ? cards.map((c) => renderMiniPlayerCard(c)).join('') : renderMiniPlayerCard(null, true) + renderMiniPlayerCard(null, true)}
                  </div>
                  <div class="replay-player-name">${p.name.split(' ').pop()}</div>
                  ${isWinner ? '<div style="font-size:10px;color:var(--yellow);font-weight:700">WINNER</div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="replay-action-log">
          ${renderActionLog(hand)}
        </div>
      `;

      replayContent.querySelector('#replayClose').addEventListener('click', closeReplay);
      return;
    }

    // Full replay with step-by-step
    renderReplayStep(hand, replay);
  }

  function renderReplayStep(hand, replay) {
    const players = hand.playersInvolved.map((pid) => D.getPlayer(pid)).filter(Boolean);

    // Collect all steps across phases
    const allSteps = [];
    replay.phases.forEach((phase) => {
      allSteps.push({ type: 'phase', name: phase.name, communityCards: phase.communityCards });
      phase.steps.forEach((step) => {
        allSteps.push({ type: 'step', ...step, phaseName: phase.name, communityCards: phase.communityCards });
      });
    });

    const totalSteps = allSteps.length;
    const currentStep = Math.min(state.replayStep, totalSteps - 1);
    const step = allSteps[currentStep];

    // Determine visible community cards
    let visibleCards = [];
    for (let i = 0; i <= currentStep; i++) {
      if (allSteps[i].communityCards) {
        visibleCards = allSteps[i].communityCards;
      }
    }

    // Determine current pot
    let currentPot = 0;
    for (let i = 0; i <= currentStep; i++) {
      if (allSteps[i].pot !== undefined) currentPot = allSteps[i].pot;
    }

    // Determine if showdown reached
    const isShowdown = step?.phaseName === 'showdown' || step?.name === 'showdown';
    const showCards = isShowdown || currentStep >= totalSteps - 1;
    const winnerStep = allSteps.find((s) => s.winner);

    // Build action log up to current step
    const logEntries = [];
    for (let i = 0; i <= currentStep; i++) {
      const s = allSteps[i];
      if (s.type === 'phase') {
        logEntries.push({ type: 'header', text: s.name.toUpperCase() });
      } else if (s.winner) {
        const winnerPlayer = D.getPlayer(s.winner);
        logEntries.push({ type: 'winner', text: `${winnerPlayer ? winnerPlayer.name.split(' ').pop() : '??'} wins ${D.formatChips(s.amount)}` });
      } else if (s.action === 'show') {
        const p = D.getPlayer(s.player);
        logEntries.push({
          type: 'action',
          player: p ? p.initials : '??',
          text: `shows ${s.cards ? s.cards.map(D.formatCard).join(' ') : ''} - ${s.handRank || ''}`,
          amount: '',
        });
      } else if (s.player) {
        const p = D.getPlayer(s.player);
        const actionText = s.action === 'allin' ? 'all-in' : s.action;
        logEntries.push({
          type: 'action',
          player: p ? p.initials : '??',
          text: actionText,
          amount: s.amount > 0 ? D.formatChips(s.amount) : '',
        });
      }
    }

    const progress = totalSteps > 1 ? ((currentStep / (totalSteps - 1)) * 100) : 100;

    replayContent.innerHTML = `
      <div class="replay-header">
        <div>
          <div class="replay-title">Hand #${hand.handNumber}</div>
          <div class="replay-subtitle">${hand.highlightLabel || hand.blinds}</div>
        </div>
        <button class="replay-close" id="replayClose">&times;</button>
      </div>
      <div class="replay-table">
        <div class="replay-community">
          ${visibleCards.length > 0 ? visibleCards.map((c) => renderReplayCard(c)).join('') : '<div style="color:var(--text-dim);font-size:12px">Preflop</div>'}
        </div>
        <div class="replay-pot">Pot: ${D.formatChips(currentPot)}</div>
        <div class="replay-players">
          ${players.map((p) => {
            const cards = hand.holeCards[p.id];
            const isWinner = winnerStep && winnerStep.winner === p.id && currentStep >= allSteps.indexOf(winnerStep);
            const isTurn = step?.player === p.id && step?.type === 'step';
            const revealCards = showCards || (isShowdown && step?.player === p.id && step?.action === 'show');
            return `
              <div class="replay-player">
                <div class="replay-player-avatar ${isWinner ? 'winner' : ''} ${isTurn ? 'active-turn' : ''}" style="border-color:${p.color}">${p.initials}</div>
                <div class="replay-player-cards">
                  ${cards ? cards.map((c) => renderMiniPlayerCard(c, !revealCards && !showCards)).join('') : ''}
                </div>
                <div class="replay-player-name">${p.name.split(' ').pop()}</div>
                ${step?.stacks && step.stacks[p.id] !== undefined ? `<div class="replay-player-stack">${D.formatChips(step.stacks[p.id])}</div>` : ''}
                ${isWinner ? '<div style="font-size:10px;color:var(--yellow);font-weight:700;margin-top:2px">WINNER</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="replay-action-log" id="replayLog">
        ${logEntries.map((e) => {
          if (e.type === 'header') return `<div class="replay-action-entry street-header">${e.text}</div>`;
          if (e.type === 'winner') return `<div class="replay-action-entry winner-entry">${e.text}</div>`;
          return `<div class="replay-action-entry">
            <span class="replay-action-player">${e.player}</span>
            <span class="replay-action-text">${e.text}</span>
            <span class="replay-action-amount">${e.amount}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="replay-controls">
        <button class="replay-control-btn" id="replayPrev">&#9664;</button>
        <button class="replay-control-btn primary" id="replayPlayPause">${state.replayPlaying ? '&#10074;&#10074;' : '&#9654;'}</button>
        <button class="replay-control-btn" id="replayNext">&#9654;</button>
        <div class="replay-progress">
          <div class="replay-progress-fill" style="width:${progress}%"></div>
        </div>
      </div>
    `;

    // Scroll log to bottom
    const logEl = $('#replayLog');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

    // Wire controls
    replayContent.querySelector('#replayClose').addEventListener('click', closeReplay);

    replayContent.querySelector('#replayPrev').addEventListener('click', () => {
      if (state.replayStep > 0) {
        state.replayStep--;
        renderReplayStep(hand, replay);
      }
    });

    replayContent.querySelector('#replayNext').addEventListener('click', () => {
      if (state.replayStep < totalSteps - 1) {
        state.replayStep++;
        renderReplayStep(hand, replay);
      }
    });

    replayContent.querySelector('#replayPlayPause').addEventListener('click', () => {
      state.replayPlaying = !state.replayPlaying;
      if (state.replayPlaying) {
        state._replayInterval = setInterval(() => {
          if (state.replayStep < totalSteps - 1) {
            state.replayStep++;
            renderReplayStep(hand, replay);
          } else {
            state.replayPlaying = false;
            clearInterval(state._replayInterval);
            state._replayInterval = null;
            renderReplayStep(hand, replay);
          }
        }, 1200);
      } else {
        clearInterval(state._replayInterval);
        state._replayInterval = null;
      }
      renderReplayStep(hand, replay);
    });
  }

  function renderActionLog(hand) {
    const entries = [];
    let currentStreet = '';
    hand.actions.forEach((a) => {
      if (a.street !== currentStreet) {
        currentStreet = a.street;
        entries.push(`<div class="replay-action-entry street-header">${currentStreet.toUpperCase()}</div>`);
      }
      const p = D.getPlayer(a.player);
      const actionText = a.action === 'allin' ? 'all-in' : a.action;
      entries.push(`
        <div class="replay-action-entry">
          <span class="replay-action-player">${p ? p.initials : '??'}</span>
          <span class="replay-action-text">${actionText}</span>
          <span class="replay-action-amount">${a.amount > 0 ? D.formatChips(a.amount) : ''}</span>
        </div>
      `);
    });

    const winner = D.getPlayer(hand.winnerId);
    entries.push(`<div class="replay-action-entry winner-entry">${winner ? winner.name.split(' ').pop() : '??'} wins ${D.formatChips(hand.potTotal)}</div>`);

    return entries.join('');
  }

  // =====================
  // Bottom Nav Handling
  // =====================
  function initNav() {
    $$('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate(btn.dataset.screen);
      });
    });
  }

  // =====================
  // Swipe to close replay
  // =====================
  function initSwipeGestures() {
    let startY = 0;
    let currentY = 0;

    replayModal.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    replayModal.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
    }, { passive: true });

    replayModal.addEventListener('touchend', () => {
      const diff = currentY - startY;
      if (diff > 100) {
        closeReplay();
      }
    });
  }

  // =====================
  // Initialize
  // =====================
  function init() {
    initDropdown();
    initNav();
    initSwipeGestures();

    // Set initial tournament name
    const t = D.getTournament(state.selectedTournament);
    tournamentNameEl.textContent = t ? t.name.replace(/\s*\d{4}$/, '') : '';

    // Handle hash
    window.addEventListener('hashchange', handleHashChange);

    // Initial render
    if (location.hash) {
      handleHashChange();
    } else {
      render();
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
