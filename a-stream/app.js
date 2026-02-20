/**
 * HUDR — "The Stream" Prototype
 * Feed-first mobile PWA poker tournament analysis app.
 */

(function () {
  'use strict';

  const D = window.HUDR_DATA;

  // =====================
  // State
  // =====================
  const state = {
    currentScreen: 'feed',
    currentParams: null,
    favorites: {
      tournaments: new Set(D.USER_PROFILE.favorites.tournaments),
      players: new Set(D.USER_PROFILE.favorites.players),
      hands: new Set(D.USER_PROFILE.favorites.hands),
    },
    searchQuery: '',
    replayStep: 0,
    replayPhaseIdx: 0,
    isPlaying: false,
    playInterval: null,
    activeBottomSheet: null,
    bottomSheetPlayer: null,
    expandedStat: null,
    chipFilter: 'all',
    answeredQuizzes: {},
    expandedScouting: {},
    chatResponse: null,
    handSearchQuery: '',
  };

  // =====================
  // Helpers
  // =====================
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function renderCard(card) {
    const isRed = D.isRedSuit(card);
    return `<span class="playing-card ${isRed ? 'red' : ''}">${D.formatCard(card)}</span>`;
  }

  function renderCardLarge(card) {
    const isRed = D.isRedSuit(card);
    return `<span class="playing-card large ${isRed ? 'red' : ''}">${D.formatCard(card)}</span>`;
  }

  function renderCardSmall(card) {
    const isRed = D.isRedSuit(card);
    return `<span class="playing-card ${isRed ? 'red' : ''}" style="font-size:10px;padding:2px 4px;min-width:22px">${D.formatCard(card)}</span>`;
  }

  function renderFaceDown() {
    return `<span class="playing-card face-down">&nbsp;&nbsp;</span>`;
  }

  function renderStatRing(label, value, stat, size) {
    size = size || 56;
    const color = D.getStatColor(stat, value);
    const displayVal = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value;
    const percent = stat === 'af' ? Math.min(value / 5 * 100, 100) : value;
    return `
      <svg class="stat-ring" viewBox="0 0 36 36" width="${size}" height="${size}">
        <path class="stat-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        <path class="stat-ring-fill" stroke="${color}" stroke-dasharray="${percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        <text class="stat-ring-text" x="18" y="18.5">${displayVal}${stat !== 'af' ? '%' : ''}</text>
      </svg>`;
  }

  function getHighlightTag(type) {
    if (!type) return '';
    const hl = D.HIGHLIGHT_LABELS[type];
    if (!hl) return '';
    return `<span class="tag tag-${type}">${hl.icon} ${hl.label}</span>`;
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  // =====================
  // Router
  // =====================
  function parseHash() {
    const hash = window.location.hash.slice(1) || 'feed';
    const parts = hash.split('/');
    return { screen: parts[0], param: parts[1] || null };
  }

  function renderCurrentScreen() {
    const { screen, param } = parseHash();
    state.currentScreen = screen;
    state.currentParams = param;
    closeBottomSheet();
    stopReplay();

    const app = $('#app');
    const nav = $('#bottom-nav');

    // Update nav
    $$('.nav-item', nav).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === screen);
    });

    // Show/hide nav for replay
    if (screen === 'hand') {
      nav.style.display = 'none';
    } else {
      nav.style.display = '';
    }

    switch (screen) {
      case 'feed': app.innerHTML = renderFeed(); break;
      case 'you': app.innerHTML = renderYou(); break;
      case 'tournament': app.innerHTML = renderTournamentDetail(param); break;
      case 'player': app.innerHTML = renderPlayerProfile(param); break;
      case 'hand': app.innerHTML = renderHandReplay(param); initReplay(param); break;
      default: app.innerHTML = renderFeed(); break;
    }

    window.scrollTo(0, 0);
  }

  // =====================
  // Feed Screen
  // =====================
  function renderFeed() {
    const liveTournaments = D.TOURNAMENTS.filter(t => t.liveStatus === 'live');
    const completedTournaments = D.TOURNAMENTS.filter(t => t.status === 'completed');
    const upcomingTournaments = D.TOURNAMENTS.filter(t => t.status === 'upcoming');
    const handOfDay = D.getHand('h1');
    const firstInsight = D.AI_CONTENT.insights[0];
    const todayWisdom = D.WISDOM[0];

    return `
      <div class="screen-header">
        <div class="logo">HUDR</div>
        <div class="header-actions">
          <button class="header-btn" data-action="open-search">&#128269;</button>
        </div>
      </div>

      <!-- LIVE NOW -->
      <div class="section">
        <div class="section-title">&#128308; Live Now</div>
      </div>
      <div class="h-scroll mb-24">
        ${liveTournaments.map(t => `
          <div class="live-card" style="background: ${t.imageGradient}" data-action="goto-tournament" data-id="${t.id}">
            <div class="live-badge"><div class="live-dot"></div> LIVE</div>
            <div class="live-card-name">${t.name}</div>
            <div class="live-card-venue">${t.venue}</div>
            <div class="live-card-meta">
              <span>${t.playerCount} players</span>
              <span>${t.blindLevel}</span>
              <span>${t.handCount} hands</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- HAND OF THE DAY -->
      <div class="section mb-8">
        <div class="section-title">Hand of the Day</div>
      </div>
      <div class="featured-card mb-24" data-action="goto-hand" data-id="${handOfDay.id}">
        <div class="featured-label">#${handOfDay.handNumber} &mdash; ${handOfDay.highlightLabel || 'Featured'}</div>
        <div class="featured-cards-row">
          ${handOfDay.communityCards.map(c => renderCard(c)).join('')}
        </div>
        <div class="featured-preview">${handOfDay.preview}</div>
        <div class="featured-cta">Watch Replay &rarr;</div>
      </div>

      <!-- RECENT FINAL TABLES -->
      <div class="section">
        <div class="section-title">Recent Final Tables</div>
      </div>
      <div class="h-scroll mb-24">
        ${completedTournaments.map(t => `
          <div class="tournament-card" data-action="goto-tournament" data-id="${t.id}">
            <div class="tournament-card-gradient" style="background: ${t.imageGradient}">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.9)">${t.event}</div>
            </div>
            <div class="tournament-card-body">
              <div class="tournament-card-name">${t.name}</div>
              <div class="tournament-card-sub">${t.venue}</div>
              <div class="tournament-card-stats">
                <span>${t.playerCount} players</span>
                <span>${t.handCount} hands</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- AI PICK -->
      <div class="section mb-8">
        <div class="section-title section-title-accent">&#10024; AI Pick</div>
      </div>
      <div class="ai-card mb-24" data-action="goto-tournament" data-id="wsop-me-2025">
        <div class="ai-card-icon">${firstInsight.icon}</div>
        <div class="ai-card-title">${firstInsight.title}</div>
        <div class="ai-card-text">${firstInsight.text}</div>
      </div>

      <!-- WISDOM -->
      <div class="section mb-8">
        <div class="section-title">Daily Wisdom</div>
      </div>
      <div class="wisdom-card mb-24">
        <div class="wisdom-quote">"${todayWisdom.quote}"</div>
        <div class="wisdom-author">&mdash; ${todayWisdom.author}</div>
      </div>

      <!-- UPCOMING -->
      <div class="section">
        <div class="section-title">Upcoming</div>
        ${upcomingTournaments.map(t => `
          <div class="upcoming-item" data-action="goto-tournament" data-id="${t.id}">
            <div class="upcoming-dot" style="background: ${t.imageGradient}"></div>
            <div class="upcoming-info">
              <div class="upcoming-name">${t.name}</div>
              <div class="upcoming-date">${t.date}</div>
            </div>
            <div class="upcoming-buyin">$${D.formatNumber(t.buyIn)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // =====================
  // You Screen
  // =====================
  function renderYou() {
    const u = D.USER_PROFILE;
    const xpForLevel = 3000;
    const xpPercent = (u.xp % xpForLevel) / xpForLevel * 100;

    return `
      <div class="screen-header">
        <div class="logo">HUDR</div>
        <div class="header-actions">
          <button class="header-btn" data-action="open-search">&#128269;</button>
        </div>
      </div>

      <div class="user-hero">
        <div class="user-avatar">${u.initials}</div>
        <div class="user-name">${u.name}</div>
        <div class="user-tier">${u.tierIcon} ${u.tier}</div>
      </div>

      <!-- Favorites -->
      <div class="section">
        <div class="section-title">Your Favorites</div>
      </div>
      <div class="chip-filters">
        <button class="chip-filter ${state.chipFilter === 'all' ? 'active' : ''}" data-action="chip-filter" data-id="all">All</button>
        <button class="chip-filter ${state.chipFilter === 'tournaments' ? 'active' : ''}" data-action="chip-filter" data-id="tournaments">Tournaments</button>
        <button class="chip-filter ${state.chipFilter === 'players' ? 'active' : ''}" data-action="chip-filter" data-id="players">Players</button>
        <button class="chip-filter ${state.chipFilter === 'hands' ? 'active' : ''}" data-action="chip-filter" data-id="hands">Hands</button>
      </div>
      <div class="section">
        ${renderFavorites()}
      </div>

      <!-- Strategy Coach -->
      <div class="section mb-8">
        <div class="section-title">Strategy Coach</div>
      </div>
      <div class="xp-section">
        <div class="xp-header">
          <div class="xp-level">Level ${u.level}</div>
          <div class="xp-streak">&#128293; ${u.streak} day streak</div>
        </div>
        <div class="xp-bar"><div class="xp-fill" style="width: ${xpPercent}%"></div></div>
        <div class="xp-label">${u.xp} / ${xpForLevel} XP to Level ${u.level + 1}</div>
      </div>

      <!-- Settings -->
      <div class="section">
        <div class="section-title">Settings</div>
        <div class="settings-link">Notifications <span class="text-muted">&rsaquo;</span></div>
        <div class="settings-link">Appearance <span class="text-muted">&rsaquo;</span></div>
        <div class="settings-link">Privacy <span class="text-muted">&rsaquo;</span></div>
        <div class="settings-link">Help & Support <span class="text-muted">&rsaquo;</span></div>
        <div class="settings-link" style="color: var(--red)">Sign Out <span class="text-muted">&rsaquo;</span></div>
      </div>
    `;
  }

  function renderFavorites() {
    const filter = state.chipFilter;
    let items = [];

    if (filter === 'all' || filter === 'tournaments') {
      state.favorites.tournaments.forEach(id => {
        const t = D.getTournament(id);
        if (t) items.push({ type: 'tournament', data: t });
      });
    }
    if (filter === 'all' || filter === 'players') {
      state.favorites.players.forEach(id => {
        const p = D.getPlayer(id);
        if (p) items.push({ type: 'player', data: p });
      });
    }
    if (filter === 'all' || filter === 'hands') {
      state.favorites.hands.forEach(id => {
        const h = D.getHand(id);
        if (h) items.push({ type: 'hand', data: h });
      });
    }

    if (items.length === 0) {
      return `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px">No favorites yet</div>`;
    }

    return items.map(item => {
      if (item.type === 'tournament') {
        const t = item.data;
        return `
          <div class="fav-card" data-action="goto-tournament" data-id="${t.id}">
            <div class="fav-icon" style="background:${t.imageGradient}">&#127942;</div>
            <div class="fav-info">
              <div class="fav-name">${t.name}</div>
              <div class="fav-sub">${t.venue}</div>
            </div>
            <div class="fav-arrow">&rsaquo;</div>
          </div>`;
      }
      if (item.type === 'player') {
        const p = item.data;
        return `
          <div class="fav-card" data-action="goto-player" data-id="${p.id}">
            <div class="fav-icon" style="background:${p.color}; border-radius:50%">${p.initials}</div>
            <div class="fav-info">
              <div class="fav-name">${p.name}</div>
              <div class="fav-sub">${p.countryFlag} ${p.country} &middot; Finish: #${p.finishPosition}</div>
            </div>
            <div class="fav-arrow">&rsaquo;</div>
          </div>`;
      }
      if (item.type === 'hand') {
        const h = item.data;
        return `
          <div class="fav-card" data-action="goto-hand" data-id="${h.id}">
            <div class="fav-icon" style="background:var(--border)">&#9824;&#65039;</div>
            <div class="fav-info">
              <div class="fav-name">Hand #${h.handNumber}</div>
              <div class="fav-sub">${h.winnerName} won ${D.formatChips(h.potTotal)}</div>
            </div>
            <div class="fav-arrow">&rsaquo;</div>
          </div>`;
      }
      return '';
    }).join('');
  }

  // =====================
  // Tournament Detail
  // =====================
  function renderTournamentDetail(id) {
    const t = D.getTournament(id);
    if (!t) return `<div class="section" style="padding-top:80px;text-align:center">Tournament not found</div>`;

    const hands = D.getHandsForTournament(id);
    const isFav = state.favorites.tournaments.has(id);
    const highlightTypes = Object.keys(D.HIGHLIGHT_LABELS);

    // For non-WSOP tournaments, show a simpler view
    const isWSOP = id === 'wsop-me-2025';

    return `
      <div class="back-header">
        <button class="back-btn" data-action="go-back">&larr;</button>
        <div class="back-header-title">${t.event}</div>
        <button class="header-btn" data-action="open-search">&#128269;</button>
      </div>

      <!-- Hero -->
      <div class="tournament-hero" style="background: ${t.imageGradient}; border-radius: 0 0 20px 20px; margin-bottom: 20px;">
        <button class="fav-toggle ${isFav ? 'active' : ''}" data-action="toggle-fav-tournament" data-id="${id}">${isFav ? '&#10084;&#65039;' : '&#9825;'}</button>
        <div class="tournament-hero-name">${t.name}</div>
        <div class="tournament-hero-sub">${t.venue} &middot; ${t.date}</div>
        <div class="tournament-hero-stats">
          ${t.prizePool ? `<div class="tournament-stat"><div class="tournament-stat-value">${D.formatChips(t.prizePool)}</div><div class="tournament-stat-label">Prize Pool</div></div>` : ''}
          <div class="tournament-stat"><div class="tournament-stat-value">${t.handCount}</div><div class="tournament-stat-label">Hands</div></div>
          <div class="tournament-stat"><div class="tournament-stat-value">${t.playerCount}</div><div class="tournament-stat-label">Players</div></div>
          ${t.totalEntrants ? `<div class="tournament-stat"><div class="tournament-stat-value">${D.formatNumber(t.totalEntrants)}</div><div class="tournament-stat-label">Entrants</div></div>` : ''}
        </div>
      </div>

      ${isWSOP ? `
      <!-- Players -->
      <div class="section">
        <div class="section-title">Players</div>
      </div>
      <div class="player-avatar-scroll mb-24">
        ${D.PLAYERS.sort((a, b) => a.finishPosition - b.finishPosition).map(p => `
          <div class="player-avatar-item" data-action="open-player-sheet" data-id="${p.id}">
            <div class="player-circle ${p.status === 'winner' ? 'winner' : 'eliminated'}" style="background: ${p.color}">
              ${p.initials}
            </div>
            <div class="player-name-small">${p.name.split(' ')[1]}</div>
            <div class="player-flag">${p.countryFlag}</div>
          </div>
        `).join('')}
      </div>

      <!-- AI Snapshot -->
      ${t.aiFunEnabled ? `
      <div class="section">
        <div class="section-title section-title-accent">&#10024; AI Snapshot</div>
        ${D.AI_CONTENT.insights.slice(0, 3).map(ins => `
          <div class="ai-insight-card">
            <div class="ai-insight-title">${ins.icon} ${ins.title}</div>
            <div class="ai-insight-text">${ins.text}</div>
          </div>
        `).join('')}
        <button class="ai-explore-btn" data-action="open-ai-sheet">Explore AI Analysis &rarr;</button>
      </div>
      ` : ''}

      <!-- Highlights -->
      <div class="section mb-8" style="margin-top:24px">
        <div class="section-title">Highlights</div>
      </div>
      <div class="h-scroll mb-24">
        ${highlightTypes.map(type => {
          const hl = D.HIGHLIGHT_LABELS[type];
          const count = D.HIGHLIGHTS[type].length;
          if (count === 0) return '';
          const firstHand = D.HIGHLIGHTS[type][0];
          return `
            <div class="highlight-card" data-action="goto-hand" data-id="${firstHand.id}">
              <div class="highlight-icon">${hl.icon}</div>
              <div class="highlight-label">${hl.label}</div>
              <div class="highlight-count">${count} hand${count > 1 ? 's' : ''}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- All Hands -->
      <div class="section">
        <div class="section-title">All Hands (${hands.length})</div>
        <div class="mini-search">
          <span style="font-size:14px;color:var(--text-muted)">&#128269;</span>
          <input type="text" placeholder="Search hands..." data-action="hand-search-input" id="hand-search-input">
        </div>
        <div class="hand-list" id="hand-list">
          ${renderHandList(hands)}
        </div>
      </div>
      ` : `
      <!-- Non-WSOP: minimal view -->
      <div class="section">
        <div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:14px">
          ${t.status === 'upcoming' ? 'Tournament has not started yet.' : `${t.handCount} hands recorded. Full analysis available for WSOP Main Event demo.`}
        </div>
      </div>
      `}
    `;
  }

  function renderHandList(hands) {
    const query = state.handSearchQuery.toLowerCase();
    let filtered = hands;
    if (query) {
      filtered = hands.filter(h =>
        h.preview.toLowerCase().includes(query) ||
        h.winnerName.toLowerCase().includes(query) ||
        String(h.handNumber).includes(query)
      );
    }
    return filtered.map(h => `
      <div class="hand-row" data-action="goto-hand" data-id="${h.id}">
        <div class="hand-num">#${h.handNumber}</div>
        <div class="hand-info">
          <div class="hand-winner">
            ${h.winnerName}
            ${h.highlightType ? getHighlightTag(h.highlightType) : ''}
          </div>
          <div class="hand-preview">${h.preview}</div>
        </div>
        <div class="hand-pot">${D.formatChips(h.potTotal)}</div>
        <div class="hand-replay-btn" data-action="goto-hand" data-id="${h.id}">&#9654;</div>
      </div>
    `).join('');
  }

  // =====================
  // Player Profile
  // =====================
  function renderPlayerProfile(id) {
    const p = D.getPlayer(id);
    if (!p) return `<div class="section" style="padding-top:80px;text-align:center">Player not found</div>`;

    const stats = D.PLAYER_STATS[id];
    const isFav = state.favorites.players.has(id);
    const playerHands = D.HANDS.filter(h => h.playersInvolved.includes(id));
    const playerTournaments = D.TOURNAMENTS.filter(t =>
      D.HANDS.some(h => h.tournamentId === t.id && h.playersInvolved.includes(id))
    );

    const mainStats = [
      { key: 'vpip', label: 'VPIP' },
      { key: 'pfr', label: 'PFR' },
      { key: 'threeBet', label: '3BET' },
      { key: 'cbetFlop', label: 'CBET' },
      { key: 'af', label: 'AF' },
      { key: 'wtsd', label: 'WTSD' },
      { key: 'wsd', label: 'WSD' },
      { key: 'wwsf', label: 'WWSF' },
    ];

    return `
      <div class="back-header">
        <button class="back-btn" data-action="go-back">&larr;</button>
        <div class="back-header-title">Player Profile</div>
        <button class="header-btn" data-action="open-search">&#128269;</button>
      </div>

      <div class="player-hero">
        <div class="player-avatar-large" style="background: ${p.color}">${p.initials}</div>
        <div class="player-profile-name">${p.name}</div>
        <div class="player-profile-meta">
          <span>${p.countryFlag} ${p.country}</span>
          <span>&middot;</span>
          <span>Finish: #${p.finishPosition}</span>
          <button class="fav-toggle ${isFav ? 'active' : ''}" style="position:relative;top:0;right:0;width:36px;height:36px;font-size:18px" data-action="toggle-fav-player" data-id="${id}">${isFav ? '&#10084;&#65039;' : '&#9825;'}</button>
        </div>
      </div>

      <div class="player-stat-row">
        <div class="player-stat-item">
          <div class="player-stat-value">${p.handsPlayed}</div>
          <div class="player-stat-label">Hands</div>
        </div>
        <div class="player-stat-item">
          <div class="player-stat-value">${p.tournamentsPlayed}</div>
          <div class="player-stat-label">Events</div>
        </div>
        <div class="player-stat-item">
          <div class="player-stat-value" style="color: ${p.status === 'winner' ? 'var(--green)' : 'var(--text)'}">
            ${p.status === 'winner' ? '1st' : '#' + p.finishPosition}
          </div>
          <div class="player-stat-label">Finish</div>
        </div>
      </div>

      ${stats ? `
      <div class="section">
        <div class="section-title">HUD Statistics</div>
        <div class="stat-grid">
          ${mainStats.map(s => `
            <div class="stat-ring-item" data-action="expand-stat" data-stat="${s.key}" data-player="${id}">
              ${renderStatRing(s.label, stats[s.key], s.key)}
              <div class="stat-ring-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Tournaments -->
      <div class="section">
        <div class="section-title">Tournaments</div>
        ${playerTournaments.map(t => `
          <div class="fav-card" data-action="goto-tournament" data-id="${t.id}">
            <div class="fav-icon" style="background:${t.imageGradient}">&#127942;</div>
            <div class="fav-info">
              <div class="fav-name">${t.name}</div>
              <div class="fav-sub">${t.venue}</div>
            </div>
            <div class="fav-arrow">&rsaquo;</div>
          </div>
        `).join('')}
      </div>

      <!-- Notes -->
      <div class="section">
        <div class="section-title">Notes</div>
        <div class="note-input-wrap">
          <input type="text" class="note-input" placeholder="Add a note about ${p.name.split(' ')[1]}...">
          <button class="note-btn">Save</button>
        </div>
      </div>

      <!-- Recent Hands -->
      <div class="section">
        <div class="section-title">Hand History</div>
        <div class="hand-list">
          ${playerHands.slice(0, 10).map(h => `
            <div class="hand-row" data-action="goto-hand" data-id="${h.id}">
              <div class="hand-num">#${h.handNumber}</div>
              <div class="hand-info">
                <div class="hand-winner">${h.winnerName} ${h.highlightType ? getHighlightTag(h.highlightType) : ''}</div>
                <div class="hand-preview">${h.preview}</div>
              </div>
              <div class="hand-pot">${D.formatChips(h.potTotal)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =====================
  // Hand Replay
  // =====================
  function renderHandReplay(id) {
    const h = D.getHand(id);
    if (!h) return `<div class="section" style="padding-top:80px;text-align:center">Hand not found</div>`;

    return `
      <div class="replay-screen">
        <button class="replay-close" data-action="go-back">&times;</button>
        <div class="replay-hand-label">Hand #${h.handNumber} &middot; ${h.blinds}</div>
        <div class="poker-table-container">
          <div class="poker-table" id="poker-table"></div>
        </div>
        <div class="replay-step-indicator" id="replay-step-indicator">Loading...</div>
        <div class="replay-controls">
          <button class="replay-btn" data-action="replay-start">&#9198;</button>
          <button class="replay-btn" data-action="replay-prev">&#9664;</button>
          <button class="replay-btn play" data-action="replay-play" id="replay-play-btn">&#9654;</button>
          <button class="replay-btn" data-action="replay-next">&#9654;</button>
          <button class="replay-btn" data-action="replay-end">&#9197;</button>
        </div>
        <div class="replay-log" id="replay-log"></div>
      </div>
    `;
  }

  function initReplay(handId) {
    const replay = D.HAND_REPLAYS[handId];
    const hand = D.getHand(handId);
    if (!replay || !hand) return;

    state.replayStep = 0;
    state.replayPhaseIdx = 0;
    state.isPlaying = false;

    renderReplayState(hand, replay);
  }

  function getAllReplaySteps(replay) {
    const steps = [];
    replay.phases.forEach((phase, pi) => {
      phase.steps.forEach((step, si) => {
        steps.push({ phase, phaseIdx: pi, step, stepIdx: si });
      });
    });
    return steps;
  }

  function renderReplayState(hand, replay) {
    const allSteps = getAllReplaySteps(replay);
    const currentStepIdx = state.replayStep;
    const totalSteps = allSteps.length;

    // Determine current phase and community cards
    let currentPhase = replay.phases[0];
    let communityCards = [];
    let pot = 0;
    let lastAction = null;
    let lastActionPlayer = null;

    if (currentStepIdx > 0 && currentStepIdx <= totalSteps) {
      const cs = allSteps[Math.min(currentStepIdx - 1, totalSteps - 1)];
      currentPhase = cs.phase;
      communityCards = cs.phase.communityCards || [];
      pot = cs.step.pot || cs.phase.pot || 0;
      lastAction = cs.step.action;
      lastActionPlayer = cs.step.player || cs.step.winner;
    }

    // Player positions around the table
    const playersInHand = hand.playersInvolved.map(pid => D.getPlayer(pid));
    const positions = getPlayerPositions(playersInHand.length);

    const tableEl = $('#poker-table');
    if (!tableEl) return;

    let tableHTML = `
      <div class="table-pot">
        <div class="table-pot-label">POT</div>
        <div class="table-pot-amount">${D.formatChips(pot)}</div>
      </div>
      <div class="table-community">
        ${communityCards.map(c => renderCardSmall(c)).join('')}
        ${communityCards.length === 0 ? '<span style="font-size:11px;color:rgba(255,255,255,0.3)">Pre-flop</span>' : ''}
      </div>
    `;

    playersInHand.forEach((p, i) => {
      if (!p) return;
      const pos = positions[i];
      const isActive = lastActionPlayer === p.id;
      const cards = hand.holeCards[p.id];
      const showCards = currentPhase.name === 'showdown' || true; // Show all cards in prototype

      // Get current stack
      let stack = null;
      if (currentStepIdx > 0) {
        const cs = allSteps[Math.min(currentStepIdx - 1, totalSteps - 1)];
        if (cs.step.stacks && cs.step.stacks[p.id] !== undefined) {
          stack = cs.step.stacks[p.id];
        }
      }

      // Get action text
      let actionText = '';
      if (isActive && lastAction) {
        const step = allSteps[Math.min(currentStepIdx - 1, totalSteps - 1)].step;
        if (step.action === 'show') {
          actionText = step.handRank || 'Shows';
        } else if (step.winner) {
          actionText = `Wins ${D.formatChips(step.amount)}`;
        } else {
          actionText = step.action.toUpperCase();
          if (step.amount > 0) actionText += ` ${D.formatChips(step.amount)}`;
        }
      }

      tableHTML += `
        <div class="table-player" style="left:${pos.x}%;top:${pos.y}%">
          <div class="table-player-circle ${isActive ? 'active-action' : ''}" style="background:${p.color}">
            ${p.initials}
          </div>
          <div class="table-player-name">${p.name.split(' ')[1]}</div>
          ${stack !== null ? `<div class="table-player-stack">${D.formatChips(stack)}</div>` : ''}
          ${cards && showCards ? `
          <div class="table-player-cards">
            ${cards.map(c => renderCardSmall(c)).join('')}
          </div>
          ` : ''}
          ${actionText ? `<div class="table-player-action">${actionText}</div>` : ''}
        </div>
      `;
    });

    tableEl.innerHTML = tableHTML;

    // Update indicator
    const indicator = $('#replay-step-indicator');
    if (indicator) {
      if (currentStepIdx === 0) {
        indicator.textContent = 'Press play to start';
      } else {
        indicator.textContent = `Step ${currentStepIdx} of ${totalSteps} - ${currentPhase.name.toUpperCase()}`;
      }
    }

    // Render action log
    renderReplayLog(hand, replay, currentStepIdx);
  }

  function getPlayerPositions(count) {
    if (count === 2) return [{ x: 20, y: 50 }, { x: 80, y: 50 }];
    if (count === 3) return [{ x: 50, y: 95 }, { x: 10, y: 30 }, { x: 90, y: 30 }];
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) - Math.PI / 2;
      positions.push({
        x: 50 + 42 * Math.cos(angle),
        y: 52 + 42 * Math.sin(angle),
      });
    }
    return positions;
  }

  function renderReplayLog(hand, replay, upToStep) {
    const logEl = $('#replay-log');
    if (!logEl) return;

    const allSteps = getAllReplaySteps(replay);
    let html = `<div class="replay-log-title">Hand History</div>`;
    let currentPhaseName = '';

    for (let i = 0; i < Math.min(upToStep, allSteps.length); i++) {
      const { phase, step } = allSteps[i];
      if (phase.name !== currentPhaseName) {
        currentPhaseName = phase.name;
        html += `<div class="replay-log-street">${phase.name}</div>`;
        if (phase.communityCards && phase.communityCards.length > 0) {
          html += `<div class="replay-log-entry">${phase.communityCards.map(c => D.formatCard(c)).join(' ')}</div>`;
        }
      }
      const player = D.getPlayer(step.player || step.winner);
      const name = player ? player.name.split(' ')[1] : '';

      if (step.winner) {
        html += `<div class="replay-log-entry highlight">${name} wins ${D.formatChips(step.amount)}</div>`;
      } else if (step.action === 'show') {
        html += `<div class="replay-log-entry highlight">${name} shows ${step.cards.map(c => D.formatCard(c)).join(' ')} (${step.handRank})</div>`;
      } else {
        let actionText = step.action;
        if (step.amount > 0) actionText += ` ${D.formatChips(step.amount)}`;
        html += `<div class="replay-log-entry">${name} ${actionText}</div>`;
      }
    }

    logEl.innerHTML = html;
  }

  function stepReplay(dir) {
    const handId = state.currentParams;
    const replay = D.HAND_REPLAYS[handId];
    const hand = D.getHand(handId);
    if (!replay || !hand) return;

    const allSteps = getAllReplaySteps(replay);
    const total = allSteps.length;

    if (dir === 'next') {
      state.replayStep = Math.min(state.replayStep + 1, total);
    } else if (dir === 'prev') {
      state.replayStep = Math.max(state.replayStep - 1, 0);
    } else if (dir === 'start') {
      state.replayStep = 0;
    } else if (dir === 'end') {
      state.replayStep = total;
    }

    renderReplayState(hand, replay);

    // Stop if reached end
    if (state.replayStep >= total) {
      stopReplay();
    }
  }

  function togglePlay() {
    if (state.isPlaying) {
      stopReplay();
    } else {
      state.isPlaying = true;
      const btn = $('#replay-play-btn');
      if (btn) btn.innerHTML = '&#9646;&#9646;';
      state.playInterval = setInterval(() => {
        stepReplay('next');
        const handId = state.currentParams;
        const replay = D.HAND_REPLAYS[handId];
        if (!replay) { stopReplay(); return; }
        const total = getAllReplaySteps(replay).length;
        if (state.replayStep >= total) stopReplay();
      }, 1200);
    }
  }

  function stopReplay() {
    state.isPlaying = false;
    if (state.playInterval) {
      clearInterval(state.playInterval);
      state.playInterval = null;
    }
    const btn = $('#replay-play-btn');
    if (btn) btn.innerHTML = '&#9654;';
  }

  // =====================
  // Bottom Sheets
  // =====================
  function openBottomSheet(type, data) {
    const backdrop = $('#bottom-sheet-backdrop');
    const sheet = $('#bottom-sheet');
    const content = $('#bottom-sheet-content');

    state.activeBottomSheet = type;
    state.expandedStat = null;

    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    sheet.classList.add('half');
    sheet.classList.remove('full');

    if (type === 'player-stats') {
      state.bottomSheetPlayer = data;
      content.innerHTML = renderPlayerStatsSheet(data);
    } else if (type === 'ai-analysis') {
      content.innerHTML = renderAIAnalysisSheet();
    }
  }

  function closeBottomSheet() {
    const backdrop = $('#bottom-sheet-backdrop');
    const sheet = $('#bottom-sheet');

    backdrop.classList.add('hidden');
    sheet.classList.add('hidden');
    state.activeBottomSheet = null;
    state.expandedStat = null;
  }

  function toggleSheetSize() {
    const sheet = $('#bottom-sheet');
    if (sheet.classList.contains('half')) {
      sheet.classList.remove('half');
      sheet.classList.add('full');
    } else {
      sheet.classList.remove('full');
      sheet.classList.add('half');
    }
  }

  function renderPlayerStatsSheet(playerId) {
    const p = D.getPlayer(playerId);
    if (!p) return '';
    const stats = D.PLAYER_STATS[playerId];
    if (!stats) return `<div class="bs-player-header"><div class="bs-player-avatar" style="background:${p.color}">${p.initials}</div><div><div class="bs-player-name">${p.name}</div><div class="bs-player-meta">No stats available</div></div></div>`;

    const mainStats = [
      { key: 'vpip', label: 'VPIP' },
      { key: 'pfr', label: 'PFR' },
      { key: 'threeBet', label: '3BET' },
      { key: 'cbetFlop', label: 'CBET' },
      { key: 'af', label: 'AF' },
      { key: 'wtsd', label: 'WTSD' },
      { key: 'wsd', label: 'WSD' },
      { key: 'wwsf', label: 'WWSF' },
    ];

    return `
      <div class="bs-player-header">
        <div class="bs-player-avatar" style="background:${p.color}">${p.initials}</div>
        <div>
          <div class="bs-player-name">${p.name} ${p.countryFlag}</div>
          <div class="bs-player-meta">#${p.finishPosition} finish &middot; ${p.handsPlayed} hands</div>
        </div>
      </div>
      <div class="stat-grid">
        ${mainStats.map(s => `
          <div class="stat-ring-item ${state.expandedStat === s.key ? 'expanded' : ''}" data-action="expand-stat-sheet" data-stat="${s.key}">
            ${renderStatRing(s.label, stats[s.key], s.key)}
            <div class="stat-ring-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
      <div id="stat-expand-area">
        ${state.expandedStat ? renderStatExpand(playerId, state.expandedStat) : ''}
      </div>
      <div class="view-profile-link" data-action="goto-player" data-id="${playerId}">View Full Profile &rarr;</div>
    `;
  }

  function renderStatExpand(playerId, stat) {
    const statHands = D.STAT_HANDS[playerId];
    if (!statHands || !statHands[stat]) {
      return `<div class="stat-hands-expand visible"><div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">No hand data for this stat</div></div>`;
    }
    const hands = statHands[stat];
    return `
      <div class="stat-hands-expand visible">
        ${hands.map(h => `
          <div class="stat-hand-row" data-action="goto-hand" data-id="${h.handId}">
            <div class="stat-hand-icon">${h.actionTaken ? '&#9989;' : '&#10060;'}</div>
            <div class="stat-hand-info">
              <span>#${D.getHand(h.handId)?.handNumber || '?'}</span>
              <span style="color:var(--text-muted)">${h.position}</span>
              <span>${h.cards.map(c => renderCardSmall(c)).join('')}</span>
            </div>
            <div class="stat-hand-result ${h.result.startsWith('+') ? 'positive' : 'negative'}">${h.result}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderAIAnalysisSheet() {
    const ai = D.AI_CONTENT;

    return `
      <!-- Insights -->
      <div class="accordion-item open">
        <div class="accordion-header" data-action="toggle-accordion" data-id="insights">
          &#9660; INSIGHTS
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            ${ai.insights.map(ins => `
              <div class="ai-insight-card">
                <div class="ai-insight-title">${ins.icon} ${ins.title}</div>
                <div class="ai-insight-text">${ins.text}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Player Scouting -->
      <div class="accordion-item">
        <div class="accordion-header" data-action="toggle-accordion" data-id="scouting">
          PLAYER SCOUTING
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            ${D.PLAYERS.sort((a,b) => a.finishPosition - b.finishPosition).map(p => `
              <div class="scouting-card ${state.expandedScouting[p.id] ? 'open' : ''}" data-action="toggle-scouting" data-id="${p.id}">
                <div class="scouting-header">
                  <div class="scouting-avatar" style="background:${p.color}">${p.initials}</div>
                  <div class="scouting-name">${p.name} ${p.countryFlag}</div>
                  <span class="scouting-toggle">&#9660;</span>
                </div>
                <div class="scouting-text">${ai.playerScouting[p.id] || 'No scouting report available.'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Tournament Story -->
      <div class="accordion-item">
        <div class="accordion-header" data-action="toggle-accordion" data-id="story">
          TOURNAMENT STORY
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            <div class="ai-story-text">${ai.story}</div>
          </div>
        </div>
      </div>

      <!-- Bluff Report -->
      <div class="accordion-item">
        <div class="accordion-header" data-action="toggle-accordion" data-id="bluffs">
          BLUFF REPORT
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            ${ai.bluffReport.map(b => `
              <div class="bluff-card" data-action="goto-hand" data-id="${b.handId}">
                <div class="bluff-header">
                  <div class="bluff-players">${b.blufferName} vs ${b.victimName}</div>
                  <div class="bluff-street">${b.street}</div>
                </div>
                <div class="bluff-holdings">
                  <div class="bluff-hand">Bluffer: ${b.holding}</div>
                  <div class="bluff-hand">Victim: ${b.victimHolding}</div>
                </div>
                <div class="bluff-pot">Pot: ${D.formatChips(b.potSize)} &middot; ${b.success ? 'Successful' : 'Caught'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Quiz -->
      <div class="accordion-item">
        <div class="accordion-header" data-action="toggle-accordion" data-id="quiz">
          QUIZ
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            ${ai.quiz.map((q, qi) => `
              <div class="quiz-card" data-quiz-id="${q.id}">
                <div class="quiz-question">${q.question}</div>
                ${q.options.map((opt, oi) => `
                  <button class="quiz-option ${getQuizOptionClass(q.id, oi, q.correctIndex)}" data-action="answer-quiz" data-quiz="${q.id}" data-option="${oi}" data-correct="${q.correctIndex}" ${state.answeredQuizzes[q.id] !== undefined ? 'disabled' : ''}>
                    ${opt}
                  </button>
                `).join('')}
                <div class="quiz-explanation ${state.answeredQuizzes[q.id] !== undefined ? 'visible' : ''}">${q.explanation}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Commentary -->
      <div class="accordion-item">
        <div class="accordion-header" data-action="toggle-accordion" data-id="commentary">
          COMMENTARY
          <span class="accordion-arrow">&#9660;</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-content">
            ${ai.commentary.map(c => {
              const hand = D.getHand(c.handId);
              return `
                <div class="commentary-card" data-action="goto-hand" data-id="${c.handId}">
                  <div class="commentary-hand">Hand #${hand?.handNumber || '?'}</div>
                  <div class="commentary-text">"${c.text}"</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Chat -->
      <div style="margin-top:16px">
        <div class="section-title">Ask AI</div>
        <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:4px">
          ${ai.chatResponses.map(cr => `
            <button class="chat-suggestion" data-action="chat-suggest" data-query="${cr.query}">${cr.query}</button>
          `).join('')}
        </div>
        <div class="chat-response ${state.chatResponse ? 'visible' : ''}" id="chat-response">${state.chatResponse || ''}</div>
        <div class="chat-input-area">
          <div class="chat-input-wrap">
            <input type="text" class="chat-input" placeholder="Ask about this tournament..." id="chat-input">
            <button class="chat-send" data-action="chat-send">&#8593;</button>
          </div>
        </div>
      </div>
    `;
  }

  function getQuizOptionClass(quizId, optionIdx, correctIdx) {
    if (state.answeredQuizzes[quizId] === undefined) return '';
    if (optionIdx === correctIdx) return 'correct';
    if (state.answeredQuizzes[quizId] === optionIdx && optionIdx !== correctIdx) return 'wrong';
    return 'disabled';
  }

  // =====================
  // Search Overlay
  // =====================
  function openSearch() {
    const overlay = $('#search-overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => {
      const input = $('#search-input');
      if (input) input.focus();
    }, 100);
    state.searchQuery = '';
    renderSearchResults('');
  }

  function closeSearch() {
    const overlay = $('#search-overlay');
    overlay.classList.add('hidden');
    state.searchQuery = '';
  }

  function renderSearchResults(query) {
    const container = $('#search-results');
    if (!container) return;

    if (!query) {
      // Show trending
      container.innerHTML = `
        <div class="search-group-title">Trending Tournaments</div>
        ${D.TOURNAMENTS.filter(t => t.status !== 'upcoming').slice(0, 3).map(t => `
          <div class="search-result-item" data-action="search-goto-tournament" data-id="${t.id}">
            <div class="search-result-icon" style="background:${t.imageGradient}">&#127942;</div>
            <div class="search-result-info">
              <div class="search-result-name">${t.name}</div>
              <div class="search-result-sub">${t.venue}</div>
            </div>
          </div>
        `).join('')}
        <div class="search-group-title">Top Players</div>
        ${D.PLAYERS.slice(0, 5).map(p => `
          <div class="search-result-item" data-action="search-goto-player" data-id="${p.id}">
            <div class="search-result-icon" style="background:${p.color};border-radius:50%">
              <span style="font-size:14px;font-weight:700">${p.initials}</span>
            </div>
            <div class="search-result-info">
              <div class="search-result-name">${p.name}</div>
              <div class="search-result-sub">${p.countryFlag} ${p.country} &middot; #${p.finishPosition}</div>
            </div>
          </div>
        `).join('')}
      `;
      return;
    }

    const q = query.toLowerCase();
    const matchedTournaments = D.TOURNAMENTS.filter(t =>
      t.name.toLowerCase().includes(q) || t.event.toLowerCase().includes(q) || t.venue.toLowerCase().includes(q)
    );
    const matchedPlayers = D.PLAYERS.filter(p =>
      p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    );
    const matchedHands = D.HANDS.filter(h =>
      h.preview.toLowerCase().includes(q) || h.winnerName.toLowerCase().includes(q) || String(h.handNumber).includes(q)
    ).slice(0, 5);

    let html = '';

    if (matchedTournaments.length > 0) {
      html += `<div class="search-group-title">Tournaments</div>`;
      html += matchedTournaments.map(t => `
        <div class="search-result-item" data-action="search-goto-tournament" data-id="${t.id}">
          <div class="search-result-icon" style="background:${t.imageGradient}">&#127942;</div>
          <div class="search-result-info">
            <div class="search-result-name">${t.name}</div>
            <div class="search-result-sub">${t.venue}</div>
          </div>
        </div>
      `).join('');
    }

    if (matchedPlayers.length > 0) {
      html += `<div class="search-group-title">Players</div>`;
      html += matchedPlayers.map(p => `
        <div class="search-result-item" data-action="search-goto-player" data-id="${p.id}">
          <div class="search-result-icon" style="background:${p.color};border-radius:50%">
            <span style="font-size:14px;font-weight:700">${p.initials}</span>
          </div>
          <div class="search-result-info">
            <div class="search-result-name">${p.name}</div>
            <div class="search-result-sub">${p.countryFlag} ${p.country} &middot; #${p.finishPosition}</div>
          </div>
        </div>
      `).join('');
    }

    if (matchedHands.length > 0) {
      html += `<div class="search-group-title">Hands</div>`;
      html += matchedHands.map(h => `
        <div class="search-result-item" data-action="search-goto-hand" data-id="${h.id}">
          <div class="search-result-icon" style="background:var(--border)">&#9824;&#65039;</div>
          <div class="search-result-info">
            <div class="search-result-name">Hand #${h.handNumber} - ${h.winnerName}</div>
            <div class="search-result-sub">${h.preview}</div>
          </div>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px">No results found for "${query}"</div>`;
    }

    container.innerHTML = html;
  }

  // =====================
  // Event Delegation
  // =====================
  let searchDebounce = null;

  document.body.addEventListener('click', function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    switch (action) {
      case 'nav':
        navigate(id);
        break;

      case 'goto-tournament':
        navigate('tournament/' + id);
        break;

      case 'goto-player':
        closeBottomSheet();
        navigate('player/' + id);
        break;

      case 'goto-hand':
        closeBottomSheet();
        closeSearch();
        navigate('hand/' + id);
        break;

      case 'go-back':
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigate('feed');
        }
        break;

      case 'open-search':
        openSearch();
        break;

      case 'close-search':
        closeSearch();
        break;

      case 'search-goto-tournament':
        closeSearch();
        navigate('tournament/' + id);
        break;

      case 'search-goto-player':
        closeSearch();
        navigate('player/' + id);
        break;

      case 'search-goto-hand':
        closeSearch();
        navigate('hand/' + id);
        break;

      case 'open-player-sheet':
        openBottomSheet('player-stats', id);
        break;

      case 'open-ai-sheet':
        openBottomSheet('ai-analysis');
        break;

      case 'toggle-fav-tournament': {
        if (state.favorites.tournaments.has(id)) {
          state.favorites.tournaments.delete(id);
        } else {
          state.favorites.tournaments.add(id);
        }
        const btn = target;
        btn.classList.toggle('active');
        btn.innerHTML = state.favorites.tournaments.has(id) ? '&#10084;&#65039;' : '&#9825;';
        btn.classList.add('heart-bounce');
        setTimeout(() => btn.classList.remove('heart-bounce'), 300);
        break;
      }

      case 'toggle-fav-player': {
        if (state.favorites.players.has(id)) {
          state.favorites.players.delete(id);
        } else {
          state.favorites.players.add(id);
        }
        const btn = target;
        btn.classList.toggle('active');
        btn.innerHTML = state.favorites.players.has(id) ? '&#10084;&#65039;' : '&#9825;';
        btn.classList.add('heart-bounce');
        setTimeout(() => btn.classList.remove('heart-bounce'), 300);
        break;
      }

      case 'chip-filter':
        state.chipFilter = id;
        renderCurrentScreen();
        break;

      case 'expand-stat-sheet': {
        const stat = target.dataset.stat;
        state.expandedStat = state.expandedStat === stat ? null : stat;
        const content = $('#bottom-sheet-content');
        if (content && state.bottomSheetPlayer) {
          content.innerHTML = renderPlayerStatsSheet(state.bottomSheetPlayer);
        }
        break;
      }

      case 'expand-stat': {
        // No-op on player profile page, stats are display-only there
        break;
      }

      case 'toggle-accordion': {
        const item = target.closest('.accordion-item');
        if (item) item.classList.toggle('open');
        break;
      }

      case 'toggle-scouting': {
        const card = target.closest('.scouting-card');
        const pid = target.closest('[data-id]').dataset.id;
        state.expandedScouting[pid] = !state.expandedScouting[pid];
        if (card) card.classList.toggle('open');
        break;
      }

      case 'answer-quiz': {
        const quizId = target.dataset.quiz;
        const optionIdx = parseInt(target.dataset.option);
        const correctIdx = parseInt(target.dataset.correct);
        if (state.answeredQuizzes[quizId] !== undefined) return;
        state.answeredQuizzes[quizId] = optionIdx;
        // Re-render the AI sheet to update quiz state
        const content = $('#bottom-sheet-content');
        if (content) content.innerHTML = renderAIAnalysisSheet();
        break;
      }

      case 'chat-suggest': {
        const query = target.dataset.query;
        const response = D.AI_CONTENT.chatResponses.find(cr => cr.query === query);
        if (response) {
          state.chatResponse = response.response;
          const respEl = $('#chat-response');
          if (respEl) {
            respEl.textContent = response.response;
            respEl.classList.add('visible');
          }
          const input = $('#chat-input');
          if (input) input.value = query;
        }
        break;
      }

      case 'chat-send': {
        const input = $('#chat-input');
        if (input && input.value.trim()) {
          const query = input.value.trim().toLowerCase();
          const response = D.AI_CONTENT.chatResponses.find(cr =>
            cr.query.toLowerCase().includes(query) || query.includes(cr.query.toLowerCase().split(' ')[0])
          );
          state.chatResponse = response ? response.response : 'I can answer questions about this tournament\'s hands, players, stats, and strategy. Try asking about a specific player or hand.';
          const respEl = $('#chat-response');
          if (respEl) {
            respEl.textContent = state.chatResponse;
            respEl.classList.add('visible');
          }
        }
        break;
      }

      case 'replay-start': stepReplay('start'); break;
      case 'replay-prev': stepReplay('prev'); break;
      case 'replay-next': stepReplay('next'); break;
      case 'replay-end': stepReplay('end'); break;
      case 'replay-play': togglePlay(); break;
    }
  });

  // Search input handler
  document.body.addEventListener('input', function (e) {
    if (e.target.id === 'search-input') {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderSearchResults(e.target.value.trim());
      }, 300);
    }
    if (e.target.id === 'hand-search-input') {
      state.handSearchQuery = e.target.value.trim();
      const handList = $('#hand-list');
      if (handList) {
        const hands = D.getHandsForTournament(state.currentParams);
        handList.innerHTML = renderHandList(hands);
      }
    }
  });

  // Bottom sheet backdrop click
  $('#bottom-sheet-backdrop').addEventListener('click', closeBottomSheet);

  // Bottom sheet drag handle
  let dragStartY = 0;
  let isDragging = false;

  const dragHandle = $('#bottom-sheet-drag');
  dragHandle.addEventListener('touchstart', function (e) {
    isDragging = true;
    dragStartY = e.touches[0].clientY;
  });

  document.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - dragStartY;
    if (dy > 50) {
      const sheet = $('#bottom-sheet');
      if (sheet.classList.contains('full')) {
        sheet.classList.remove('full');
        sheet.classList.add('half');
      } else {
        closeBottomSheet();
      }
      isDragging = false;
    } else if (dy < -50) {
      const sheet = $('#bottom-sheet');
      sheet.classList.remove('half');
      sheet.classList.add('full');
      isDragging = false;
    }
  });

  document.addEventListener('touchend', function () {
    isDragging = false;
  });

  // Also support mouse for drag handle (desktop testing)
  dragHandle.addEventListener('mousedown', function (e) {
    isDragging = true;
    dragStartY = e.clientY;
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    const dy = e.clientY - dragStartY;
    if (dy > 50) {
      const sheet = $('#bottom-sheet');
      if (sheet.classList.contains('full')) {
        sheet.classList.remove('full');
        sheet.classList.add('half');
      } else {
        closeBottomSheet();
      }
      isDragging = false;
    } else if (dy < -50) {
      const sheet = $('#bottom-sheet');
      sheet.classList.remove('half');
      sheet.classList.add('full');
      isDragging = false;
    }
  });

  document.addEventListener('mouseup', function () {
    isDragging = false;
  });

  // =====================
  // Init
  // =====================
  window.addEventListener('hashchange', renderCurrentScreen);
  renderCurrentScreen();
})();
