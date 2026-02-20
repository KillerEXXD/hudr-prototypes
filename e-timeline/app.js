/**
 * HUDR — Prototype E: "The Timeline"
 * Chronological ESPN play-by-play tournament analysis.
 */

(function () {
  'use strict';

  const D = window.HUDR_DATA;

  // =====================
  // State
  // =====================
  const state = {
    currentScreen: 'explore',
    selectedTournament: null,
    selectedMoment: null,
    trackedPlayer: null,
    replayStep: 0,
    replayPhase: 0,
    replayPlaying: false,
    replayInterval: null,
    favorites: {
      tournaments: new Set(D.USER_PROFILE.favorites.tournaments),
      players: new Set(D.USER_PROFILE.favorites.players),
      hands: new Set(D.USER_PROFILE.favorites.hands),
    },
    bookmarkedMoments: new Set(),
    recentlyViewed: [],
  };

  // =====================
  // SVG Icons
  // =====================
  const ICONS = {
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" stroke="none"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    bookmarkFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    skipBack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19,20 9,12 19,4" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
    skipForward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,4 15,12 5,20" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  };

  // =====================
  // Router
  // =====================
  function navigate(screen, params) {
    state.currentScreen = screen;
    if (params) {
      if (params.tournamentId !== undefined) state.selectedTournament = params.tournamentId;
      if (params.handId !== undefined) state.selectedMoment = params.handId;
      if (params.playerId !== undefined) state.trackedPlayer = params.playerId;
    }
    if (screen === 'tournament') {
      state.selectedMoment = null;
      state.trackedPlayer = null;
      // Track recently viewed
      const tid = state.selectedTournament;
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== tid);
      state.recentlyViewed.unshift(tid);
      if (state.recentlyViewed.length > 10) state.recentlyViewed.pop();
    }
    if (screen === 'hand') {
      state.replayStep = 0;
      state.replayPhase = 0;
      state.replayPlaying = false;
      if (state.replayInterval) { clearInterval(state.replayInterval); state.replayInterval = null; }
    }
    render();
    updateHash();
  }

  function updateHash() {
    const s = state.currentScreen;
    if (s === 'explore') window.location.hash = '#explore';
    else if (s === 'library') window.location.hash = '#library';
    else if (s === 'tournament') window.location.hash = '#tournament/' + state.selectedTournament;
    else if (s === 'hand') window.location.hash = '#hand/' + state.selectedMoment;
    else if (s === 'player') window.location.hash = '#player/' + state.trackedPlayer;
  }

  function parseHash() {
    const hash = window.location.hash.slice(1) || 'explore';
    const parts = hash.split('/');
    if (parts[0] === 'tournament' && parts[1]) navigate('tournament', { tournamentId: parts[1] });
    else if (parts[0] === 'hand' && parts[1]) navigate('hand', { handId: parts[1] });
    else if (parts[0] === 'player' && parts[1]) navigate('player', { playerId: parts[1] });
    else if (parts[0] === 'library') navigate('library');
    else navigate('explore');
  }

  window.addEventListener('hashchange', parseHash);

  // =====================
  // Event Delegation
  // =====================
  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'go-explore') navigate('explore');
    else if (action === 'go-library') navigate('library');
    else if (action === 'go-tournament') navigate('tournament', { tournamentId: target.dataset.id });
    else if (action === 'go-hand') navigate('hand', { handId: target.dataset.id });
    else if (action === 'go-player') navigate('player', { playerId: target.dataset.id });
    else if (action === 'go-back') {
      if (state.currentScreen === 'hand') navigate('tournament', { tournamentId: state.selectedTournament });
      else if (state.currentScreen === 'player') navigate('tournament', { tournamentId: state.selectedTournament || 'wsop-me-2025' });
      else navigate('explore');
    }
    else if (action === 'select-moment') {
      state.selectedMoment = target.dataset.hand;
      renderMomentDetail();
      highlightSelectedDot(target.dataset.hand);
    }
    else if (action === 'toggle-track') {
      const pid = target.dataset.player;
      if (state.trackedPlayer === pid) {
        state.trackedPlayer = null;
      } else {
        state.trackedPlayer = pid;
      }
      updateFocusMode();
      updateTrackToggle();
      updateLegendChips();
    }
    else if (action === 'legend-player') {
      const pid = target.dataset.player;
      if (state.trackedPlayer === pid) {
        state.trackedPlayer = null;
      } else {
        state.trackedPlayer = pid;
      }
      updateFocusMode();
      updateTrackToggle();
      updateLegendChips();
    }
    else if (action === 'replay-prev') replayPrev();
    else if (action === 'replay-next') replayNext();
    else if (action === 'replay-play') replayTogglePlay();
    else if (action === 'replay-start') { state.replayPhase = 0; state.replayStep = 0; renderReplayState(); }
    else if (action === 'replay-end') replayEnd();
    else if (action === 'replay-phase') {
      state.replayPhase = parseInt(target.dataset.phase);
      state.replayStep = 0;
      renderReplayState();
    }
    else if (action === 'bookmark-moment') {
      const hid = target.dataset.hand;
      if (state.bookmarkedMoments.has(hid)) state.bookmarkedMoments.delete(hid);
      else state.bookmarkedMoments.add(hid);
    }
    else if (action === 'fav-hand') {
      const hid = target.dataset.hand;
      if (state.favorites.hands.has(hid)) state.favorites.hands.delete(hid);
      else state.favorites.hands.add(hid);
    }
  });

  // =====================
  // Render Router
  // =====================
  function render() {
    const app = document.getElementById('app');
    let html = '';
    switch (state.currentScreen) {
      case 'explore': html = renderExplore(); break;
      case 'library': html = renderLibrary(); break;
      case 'tournament': html = renderTournament(); break;
      case 'hand': html = renderHandReplay(); break;
      case 'player': html = renderPlayerProfile(); break;
      default: html = renderExplore();
    }
    html += renderBottomNav();
    app.innerHTML = html;

    // Post-render
    if (state.currentScreen === 'tournament') {
      initTimelineScroll();
    }
    if (state.currentScreen === 'hand') {
      renderReplayState();
    }
  }

  // =====================
  // Bottom Nav
  // =====================
  function renderBottomNav() {
    const isExplore = ['explore', 'tournament', 'hand', 'player'].includes(state.currentScreen);
    const isLibrary = state.currentScreen === 'library';
    return `
      <nav class="bottom-nav">
        <button class="nav-item ${isExplore ? 'active' : ''}" data-action="go-explore">
          ${ICONS.compass}
          <span>Explore</span>
        </button>
        <button class="nav-item ${isLibrary ? 'active' : ''}" data-action="go-library">
          ${ICONS.bookmark}
          <span>Library</span>
        </button>
      </nav>`;
  }

  // =====================
  // Explore Screen
  // =====================
  function renderExplore() {
    const wsop = D.getTournament('wsop-me-2025');
    const otherTournaments = D.TOURNAMENTS.filter(t => t.id !== 'wsop-me-2025' && t.status !== 'upcoming');

    return `
      <div class="screen fade-in">
        <div class="screen-header">
          <div class="logo">HUDR</div>
          <div class="header-icon">${ICONS.search}</div>
        </div>

        <div class="section-title">Featured</div>
        ${renderFeaturedCard(wsop)}

        <div class="section-title">Recent Tournaments</div>
        <div class="tournament-list">
          ${otherTournaments.map(t => renderTournamentCard(t)).join('')}
        </div>
      </div>`;
  }

  function renderFeaturedCard(t) {
    return `
      <div class="featured-card" data-action="go-tournament" data-id="${t.id}">
        <div class="card-bg" style="background: ${t.imageGradient}">
          <div class="card-content">
            <div class="badge">FEATURED</div>
            <h2>${t.name}</h2>
            <div class="subtitle">${t.subtitle} &mdash; ${t.event}</div>
            <div class="meta-row">
              <span>${t.handCount} hands</span>
              <span>${t.playerCount} players</span>
              <span>${t.date}</span>
            </div>
            <div class="mini-timeline-preview">
              ${renderMiniTimeline()}
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderMiniTimeline() {
    const data = D.CHIP_TIMELINE;
    const width = 300;
    const height = 44;
    const pad = { l: 4, r: 4, t: 4, b: 4 };
    const maxHand = Math.max(...data.map(d => d.handNumber));
    const allStacks = data.flatMap(d => Object.values(d.stacks));
    const maxStack = Math.max(...allStacks);
    const x = (h) => pad.l + (h / maxHand) * (width - pad.l - pad.r);
    const y = (s) => height - pad.b - (s / maxStack) * (height - pad.t - pad.b);

    let paths = '';
    D.PLAYERS.forEach(p => {
      const points = data
        .filter(d => d.stacks[p.id] !== undefined)
        .map(d => `${x(d.handNumber)},${y(d.stacks[p.id])}`)
        .join(' ');
      if (points) {
        paths += `<polyline points="${points}" fill="none" stroke="${p.color}" stroke-width="1.5" opacity="0.7"/>`;
      }
    });

    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${paths}</svg>`;
  }

  function renderTournamentCard(t) {
    const isLive = t.liveStatus === 'live';
    return `
      <div class="tournament-card" data-action="go-tournament" data-id="${t.id}">
        <div class="t-icon" style="background: ${t.imageGradient}">
          ${isLive ? '' : ''}
        </div>
        <div class="t-info">
          <div class="t-name">${t.name}</div>
          <div class="t-sub">${t.subtitle}</div>
          <div class="t-meta">
            <span>${t.handCount} hands</span>
            <span>${t.playerCount} players</span>
            <span>${t.date}</span>
          </div>
        </div>
        ${isLive ? '<span class="live-badge">LIVE</span>' : '<span class="arrow">' + ICONS.chevronRight + '</span>'}
      </div>`;
  }

  // =====================
  // Tournament Timeline
  // =====================
  function renderTournament() {
    const t = D.getTournament(state.selectedTournament);
    if (!t) return renderExplore();

    const trackLabel = state.trackedPlayer
      ? D.getPlayer(state.trackedPlayer).name.split(' ').pop()
      : 'All';

    return `
      <div class="timeline-page">
        <div class="timeline-top-bar">
          <button class="back-btn" data-action="go-back">
            ${ICONS.chevronLeft} Back
          </button>
          <div class="tournament-title">${t.name}</div>
          <button class="track-toggle ${state.trackedPlayer ? 'active' : ''}" id="track-toggle"
                  data-action="toggle-track" data-player="${state.trackedPlayer || ''}">
            ${state.trackedPlayer ? 'Track: ' + trackLabel : 'All Players'}
          </button>
        </div>

        <div class="timeline-area">
          <div class="timeline-scroll" id="timeline-scroll">
            <div class="timeline-svg-container" id="timeline-container">
              ${renderTimelineSVG(t.id)}
            </div>
          </div>
        </div>

        <div class="player-legend" id="player-legend">
          ${renderPlayerLegend(t.id)}
        </div>

        <div class="moment-detail" id="moment-detail">
          ${state.selectedMoment ? renderMomentContent(state.selectedMoment) : renderDefaultSummary(t)}
        </div>
      </div>`;
  }

  function renderTimelineSVG(tournamentId) {
    const data = D.CHIP_TIMELINE;
    const hands = D.getHandsForTournament(tournamentId);
    const width = 1500;
    const height = 280;
    const pad = { top: 20, right: 50, bottom: 32, left: 55 };

    const maxHand = Math.max(...data.map(d => d.handNumber));
    const allStacks = data.flatMap(d => Object.values(d.stacks));
    const maxStack = Math.max(...allStacks) * 1.05;
    const xScale = (h) => pad.left + (h / maxHand) * (width - pad.left - pad.right);
    const yScale = (s) => height - pad.bottom - (s / maxStack) * (height - pad.top - pad.bottom);

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="timeline-svg" id="timeline-svg"
                    style="width: ${width}px; height: 100%;">`;

    // Grid lines + labels
    for (let i = 0; i <= maxHand; i += 10) {
      const x = xScale(i);
      svg += `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${height - pad.bottom}" stroke="#1a1a1a" stroke-width="0.5"/>`;
      svg += `<text x="${x}" y="${height - 10}" fill="#4b5563" font-size="10" text-anchor="middle" font-family="Inter, sans-serif">#${i}</text>`;
    }

    // Y-axis labels
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = (maxStack / yTicks) * i;
      const yPos = yScale(val);
      svg += `<line x1="${pad.left}" y1="${yPos}" x2="${width - pad.right}" y2="${yPos}" stroke="#1a1a1a" stroke-width="0.3"/>`;
      svg += `<text x="${pad.left - 8}" y="${yPos + 3}" fill="#4b5563" font-size="9" text-anchor="end" font-family="Inter, sans-serif">${D.formatChips(Math.round(val))}</text>`;
    }

    // Blind level change markers (approximate)
    const blindChanges = [
      { hand: 15, label: '40K/80K' },
      { hand: 30, label: '60K/120K' },
      { hand: 40, label: '80K/160K' },
      { hand: 52, label: '100K/200K' },
      { hand: 65, label: '150K/300K' },
      { hand: 80, label: '200K/400K' },
    ];
    blindChanges.forEach(bc => {
      const x = xScale(bc.hand);
      svg += `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${height - pad.bottom}" stroke="#2a2a2a" stroke-width="1" stroke-dasharray="4,4"/>`;
      svg += `<text x="${x}" y="${pad.top - 4}" fill="#4b5563" font-size="8" text-anchor="middle" font-family="Inter, sans-serif">${bc.label}</text>`;
    });

    // Player polylines
    D.PLAYERS.forEach(player => {
      const playerData = data.filter(d => d.stacks[player.id] !== undefined);
      if (playerData.length === 0) return;

      const points = playerData.map(d => `${xScale(d.handNumber)},${yScale(d.stacks[player.id])}`).join(' ');
      const focusClass = state.trackedPlayer ? (state.trackedPlayer === player.id ? 'focused' : '') : '';

      svg += `<polyline points="${points}" fill="none" stroke="${player.color}" stroke-width="2"
                class="player-line ${focusClass}" data-player="${player.id}"/>`;

      // Elimination dot (end of line, if player ended)
      const lastDataPoint = playerData[playerData.length - 1];
      if (player.status === 'eliminated') {
        const lx = xScale(lastDataPoint.handNumber);
        const ly = yScale(lastDataPoint.stacks[player.id]);
        const focusDotClass = state.trackedPlayer ? (state.trackedPlayer === player.id ? 'focused' : '') : '';
        svg += `<circle cx="${lx}" cy="${ly}" r="4" fill="#1a1a1a" stroke="${player.color}" stroke-width="2"
                  class="elimination-dot ${focusDotClass}" data-player="${player.id}"/>`;
      }
    });

    // Key moment dots
    hands.forEach(hand => {
      if (!hand.highlightType) return;
      const hlInfo = D.HIGHLIGHT_LABELS[hand.highlightType];
      if (!hlInfo) return;

      // Find closest data point
      const dp = findClosestDataPoint(data, hand.handNumber);
      if (!dp) return;
      const winnerStack = dp.stacks[hand.winnerId];
      if (winnerStack === undefined) return;

      const cx = xScale(hand.handNumber);
      const cy = yScale(winnerStack);
      const isSelected = state.selectedMoment === hand.id;
      const player = D.getPlayer(hand.winnerId);
      const focusClass = state.trackedPlayer
        ? (hand.playersInvolved.includes(state.trackedPlayer) ? 'focused' : '')
        : '';

      svg += `<circle cx="${cx}" cy="${cy}" r="${isSelected ? 8 : 6}" fill="${hlInfo.color}"
                class="moment-dot ${isSelected ? 'selected' : ''} ${focusClass}"
                data-hand="${hand.id}" data-action="select-moment"
                style="cursor:pointer">
                <animate attributeName="r" values="${isSelected ? '8;11;8' : '6;6;6'}" dur="1.5s" repeatCount="indefinite"/>
              </circle>`;

      // Dot label on hover
      svg += `<text x="${cx}" y="${cy - 12}" fill="${hlInfo.color}" font-size="8" text-anchor="middle"
                font-weight="600" font-family="Inter, sans-serif" opacity="0.8"
                class="moment-dot ${focusClass}">#${hand.handNumber}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  function findClosestDataPoint(data, handNumber) {
    let closest = null;
    let minDiff = Infinity;
    data.forEach(d => {
      const diff = Math.abs(d.handNumber - handNumber);
      if (diff < minDiff) { minDiff = diff; closest = d; }
    });
    return closest;
  }

  function renderPlayerLegend(tournamentId) {
    const lastData = D.CHIP_TIMELINE[D.CHIP_TIMELINE.length - 1];
    return D.PLAYERS.map(p => {
      const isTracked = state.trackedPlayer === p.id;
      const isDimmed = state.trackedPlayer && !isTracked;
      const isElim = p.status === 'eliminated';
      return `
        <div class="legend-chip ${isTracked ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}"
             data-action="legend-player" data-player="${p.id}">
          <div class="chip-dot" style="background: ${p.color}"></div>
          <span class="chip-name ${isElim ? 'chip-elim' : ''}">${p.name.split(' ').pop()}</span>
        </div>`;
    }).join('');
  }

  function renderDefaultSummary(t) {
    const hands = D.getHandsForTournament(t.id);
    const eliminations = hands.filter(h => h.highlightType === 'elimination').sort((a, b) => a.handNumber - b.handNumber);
    const bigPots = hands.filter(h => h.highlightType === 'biggest_pot').sort((a, b) => b.potTotal - a.potTotal);
    const bluffs = hands.filter(h => h.highlightType === 'bluff');

    const milestones = [];
    if (eliminations.length > 0) {
      const first = eliminations[0];
      milestones.push({ icon: '💀', text: `First elimination: ${first.winnerName} eliminates on Hand #${first.handNumber}`, hand: first.handNumber, color: '#6b7280' });
    }
    if (bigPots.length > 0) {
      const biggest = bigPots[0];
      milestones.push({ icon: '💰', text: `Biggest pot: ${D.formatChips(biggest.potTotal)} on Hand #${biggest.handNumber}`, hand: biggest.handNumber, color: '#f59e0b' });
    }
    if (bluffs.length > 0) {
      milestones.push({ icon: '🎭', text: `${bluffs.length} confirmed bluffs detected`, hand: null, color: '#8b5cf6' });
    }
    milestones.push({ icon: '🏆', text: `Winner: ${D.PLAYERS.find(p => p.finishPosition === 1)?.name || 'TBD'}`, hand: null, color: '#f59e0b' });

    const storyPreview = D.AI_CONTENT.story.split('\n\n')[0];

    return `
      <div class="default-summary slide-up">
        <div class="summary-header">
          <div class="icon" style="background: ${t.imageGradient}">${t.handCount > 80 ? '🏆' : '🃏'}</div>
          <div>
            <h3>${t.name}</h3>
            <div class="sub">${t.subtitle}</div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="summary-stat">
            <div class="value">${t.handCount}</div>
            <div class="label">Hands</div>
          </div>
          <div class="summary-stat">
            <div class="value">${t.playerCount}</div>
            <div class="label">Players</div>
          </div>
          <div class="summary-stat">
            <div class="value">${D.formatChips(t.prizePool)}</div>
            <div class="label">Prize Pool</div>
          </div>
        </div>

        <div class="section-title" style="padding: 0; margin-top: 4px;">Key Moments</div>
        <div class="milestone-list">
          ${milestones.map(m => `
            <div class="milestone-item">
              <div class="m-icon" style="background: ${m.color}15; color: ${m.color}">${m.icon}</div>
              <div class="m-text">${m.text}</div>
              ${m.hand ? `<div class="m-hand">#${m.hand}</div>` : ''}
            </div>`).join('')}
        </div>

        <div class="ai-story-preview">
          <div class="ai-badge">AI STORY SUMMARY</div>
          <p>${storyPreview}</p>
        </div>
      </div>`;
  }

  function renderMomentContent(handId) {
    const hand = D.getHand(handId);
    if (!hand) return renderDefaultSummary(D.getTournament(state.selectedTournament));

    const hlInfo = hand.highlightType ? D.HIGHLIGHT_LABELS[hand.highlightType] : null;
    const commentary = D.AI_CONTENT.commentary.find(c => c.handId === handId);

    // Find before/after stacks for winner
    const data = D.CHIP_TIMELINE;
    const beforeDp = findClosestDataPoint(data.filter(d => d.handNumber < hand.handNumber), hand.handNumber);
    const afterDp = findClosestDataPoint(data.filter(d => d.handNumber >= hand.handNumber), hand.handNumber);
    const winnerBefore = beforeDp?.stacks[hand.winnerId];
    const winnerAfter = afterDp?.stacks[hand.winnerId];

    return `
      <div class="moment-selected slide-up">
        <div class="moment-header">
          ${hlInfo ? `<div class="type-badge hl-${hand.highlightType}">${hlInfo.icon} ${hlInfo.label}</div>` : ''}
          <div class="hand-info">
            <div class="hand-number">Hand #${hand.handNumber} &bull; Blinds ${hand.blinds}</div>
            <div class="hand-label">${hand.highlightLabel || hand.preview}</div>
          </div>
        </div>

        <div class="community-cards">
          ${hand.communityCards.map(c => renderCard(c)).join('')}
        </div>

        <div class="players-involved">
          ${hand.playersInvolved.map(pid => {
            const p = D.getPlayer(pid);
            const isWinner = pid === hand.winnerId;
            const cards = hand.holeCards[pid];
            return `
              <div class="player-row ${isWinner ? 'winner' : ''}" data-action="go-player" data-player="${pid}">
                <div class="p-avatar" style="background: ${p.color}">${p.initials}</div>
                <div class="p-info">
                  ${isWinner ? '<div class="winner-label">WINNER</div>' : ''}
                  <div class="p-name">${p.name}</div>
                  ${cards ? `<div class="p-hand-cards">${cards.map(c => renderCard(c, true)).join('')}</div>` : ''}
                </div>
                <div class="p-result">
                  ${isWinner ? `<div class="p-pot">${D.formatChips(hand.potTotal)}</div>` : ''}
                  <div class="p-net ${isWinner ? 'positive' : 'negative'}">
                    ${isWinner ? '+' : '-'}${D.formatChips(Math.abs(hand.netResult))}
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>

        ${winnerBefore !== undefined && winnerAfter !== undefined ? `
          <div class="stack-comparison">
            <div class="stack-box">
              <div class="label">Before</div>
              <div class="value">${D.formatChips(winnerBefore)}</div>
            </div>
            <div class="stack-arrow">&rarr;</div>
            <div class="stack-box">
              <div class="label">After</div>
              <div class="value" style="color: var(--green)">${D.formatChips(winnerAfter)}</div>
            </div>
          </div>` : ''}

        <div class="moment-preview">${hand.preview}</div>

        ${commentary ? `
          <div class="ai-commentary">
            <div class="ai-label">AI COMMENTARY</div>
            <p>${commentary.text}</p>
          </div>` : ''}

        <button class="replay-btn" data-action="go-hand" data-id="${hand.id}">
          ${ICONS.play} Watch Replay
        </button>
      </div>`;
  }

  function renderCard(card, small) {
    const rank = D.getCardRank(card);
    const suit = D.getCardSuit(card);
    const isRed = D.isRedSuit(card);
    return `<div class="card-display ${isRed ? 'red' : 'black'} ${small ? 'small' : ''}">
      <span class="card-rank">${rank}</span>
      <span class="card-suit">${suit}</span>
    </div>`;
  }

  // =====================
  // Timeline Interactions
  // =====================
  function initTimelineScroll() {
    const scrollEl = document.getElementById('timeline-scroll');
    if (scrollEl) {
      // Start scrolled about 20% in
      scrollEl.scrollLeft = 100;
    }
  }

  function renderMomentDetail() {
    const detailEl = document.getElementById('moment-detail');
    if (detailEl) {
      detailEl.innerHTML = state.selectedMoment
        ? renderMomentContent(state.selectedMoment)
        : renderDefaultSummary(D.getTournament(state.selectedTournament));
    }
  }

  function highlightSelectedDot(handId) {
    const svg = document.getElementById('timeline-svg');
    if (!svg) return;
    svg.querySelectorAll('.moment-dot.selected').forEach(el => el.classList.remove('selected'));
    svg.querySelectorAll(`.moment-dot[data-hand="${handId}"]`).forEach(el => el.classList.add('selected'));
  }

  function updateFocusMode() {
    const svg = document.getElementById('timeline-svg');
    if (!svg) return;

    if (state.trackedPlayer) {
      svg.classList.add('focus-mode');
      svg.querySelectorAll('.player-line').forEach(el => {
        el.classList.toggle('focused', el.dataset.player === state.trackedPlayer);
      });
      svg.querySelectorAll('.elimination-dot').forEach(el => {
        el.classList.toggle('focused', el.dataset.player === state.trackedPlayer);
      });
      // Show moment dots for hands involving tracked player
      const hands = D.HANDS;
      svg.querySelectorAll('.moment-dot').forEach(el => {
        if (el.dataset.hand) {
          const hand = D.getHand(el.dataset.hand);
          el.classList.toggle('focused', hand && hand.playersInvolved.includes(state.trackedPlayer));
        }
      });
    } else {
      svg.classList.remove('focus-mode');
      svg.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
    }
  }

  function updateTrackToggle() {
    const btn = document.getElementById('track-toggle');
    if (!btn) return;
    if (state.trackedPlayer) {
      const p = D.getPlayer(state.trackedPlayer);
      btn.textContent = 'Track: ' + p.name.split(' ').pop();
      btn.classList.add('active');
      btn.dataset.player = state.trackedPlayer;
    } else {
      btn.textContent = 'All Players';
      btn.classList.remove('active');
      btn.dataset.player = '';
    }
  }

  function updateLegendChips() {
    const legend = document.getElementById('player-legend');
    if (!legend) return;
    legend.innerHTML = renderPlayerLegend(state.selectedTournament);
  }

  // =====================
  // Hand Replay
  // =====================
  function renderHandReplay() {
    const hand = D.getHand(state.selectedMoment);
    if (!hand) return renderExplore();

    const replay = D.HAND_REPLAYS[hand.id];
    const hasReplay = !!replay;

    return `
      <div class="replay-page">
        <div class="timeline-top-bar">
          <button class="back-btn" data-action="go-back">
            ${ICONS.chevronLeft} Timeline
          </button>
          <div class="tournament-title">Hand #${hand.handNumber} &bull; ${hand.blinds}</div>
          <div style="width: 60px"></div>
        </div>

        <div class="replay-table-area" id="replay-table-area">
          ${renderPokerTable(hand, replay)}
        </div>

        <div class="replay-controls" id="replay-controls">
          ${hasReplay ? renderReplayControls(replay) : renderSimpleActions(hand)}
        </div>
      </div>`;
  }

  function renderPokerTable(hand, replay) {
    const players = hand.playersInvolved.map(pid => D.getPlayer(pid));
    const positions = getPlayerPositions(players.length);

    // Determine current phase/step state
    let currentPot = 0;
    let currentCards = [];
    let playerStacks = {};
    let lastAction = {};

    if (replay) {
      const phase = replay.phases[state.replayPhase];
      if (phase) {
        currentCards = phase.communityCards || [];
        currentPot = phase.pot;

        // Apply steps up to current
        for (let i = 0; i <= Math.min(state.replayStep, phase.steps.length - 1); i++) {
          const step = phase.steps[i];
          if (step.pot !== undefined) currentPot = step.pot;
          if (step.stacks) Object.assign(playerStacks, step.stacks);
          if (step.player && step.action) {
            lastAction[step.player] = step.action + (step.amount ? ' ' + D.formatChips(step.amount) : '');
          }
          if (step.winner) {
            lastAction = {};
            lastAction[step.winner] = 'WINS ' + D.formatChips(step.amount);
          }
        }
      }
    } else {
      currentCards = hand.communityCards;
      currentPot = hand.potTotal;
    }

    let html = `<div class="poker-table">`;

    // Community cards
    if (currentCards.length > 0) {
      html += `<div class="table-community-cards">
        ${currentCards.map(c => renderCard(c, true)).join('')}
      </div>`;
    }

    // Pot
    html += `<div class="table-pot">
      <div class="pot-label">Pot</div>
      <div class="pot-amount">${D.formatChips(currentPot)}</div>
    </div>`;

    // Players
    players.forEach((p, i) => {
      const pos = positions[i];
      const cards = hand.holeCards[p.id];
      const isWinner = p.id === hand.winnerId;
      const stack = playerStacks[p.id] || p.startingStack;
      const action = lastAction[p.id];

      html += `
        <div class="table-player" style="left: ${pos.x}%; top: ${pos.y}%" data-action="go-player" data-player="${p.id}">
          ${action ? `<div class="tp-action ${action.split(' ')[0].toLowerCase()}">${action}</div>` : ''}
          <div class="tp-avatar ${action ? 'active' : ''} ${isWinner && !replay ? 'winner-avatar' : ''}" style="background: ${p.color}">${p.initials}</div>
          <div class="tp-name">${p.name.split(' ').pop()}</div>
          <div class="tp-stack">${D.formatChips(stack)}</div>
          ${cards ? `<div class="tp-cards">${cards.map(c => renderCard(c, true)).join('')}</div>` : ''}
        </div>`;
    });

    html += '</div>';
    return html;
  }

  function getPlayerPositions(count) {
    const positions = {
      2: [{ x: 25, y: 82 }, { x: 75, y: 18 }],
      3: [{ x: 50, y: 88 }, { x: 12, y: 30 }, { x: 88, y: 30 }],
      4: [{ x: 25, y: 88 }, { x: 12, y: 30 }, { x: 88, y: 30 }, { x: 75, y: 88 }],
      5: [{ x: 50, y: 88 }, { x: 8, y: 55 }, { x: 25, y: 12 }, { x: 75, y: 12 }, { x: 92, y: 55 }],
    };
    return positions[count] || positions[2];
  }

  function renderReplayControls(replay) {
    const phases = replay.phases;
    const currentPhase = phases[state.replayPhase];

    let html = '<div class="replay-street-tabs">';
    phases.forEach((phase, i) => {
      const isActive = i === state.replayPhase;
      const isCompleted = i < state.replayPhase;
      html += `<button class="street-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                data-action="replay-phase" data-phase="${i}">
                ${phase.name.charAt(0).toUpperCase() + phase.name.slice(1)}
              </button>`;
    });
    html += '</div>';

    html += `
      <div class="replay-step-controls">
        <button class="step-btn" data-action="replay-start">${ICONS.skipBack}</button>
        <button class="step-btn" data-action="replay-prev">${ICONS.chevronLeft}</button>
        <button class="step-btn play" data-action="replay-play">
          ${state.replayPlaying ? ICONS.pause : ICONS.play}
        </button>
        <button class="step-btn" data-action="replay-next">${ICONS.chevronRight}</button>
        <button class="step-btn" data-action="replay-end">${ICONS.skipForward}</button>
      </div>`;

    // Hand log
    html += '<div class="replay-hand-log" id="replay-log">';
    for (let pi = 0; pi <= state.replayPhase; pi++) {
      const phase = phases[pi];
      const maxStep = pi === state.replayPhase ? state.replayStep : phase.steps.length - 1;
      for (let si = 0; si <= Math.min(maxStep, phase.steps.length - 1); si++) {
        const step = phase.steps[si];
        if (!step.player) continue;
        const p = D.getPlayer(step.player);
        const isCurrent = pi === state.replayPhase && si === state.replayStep;
        const actionText = step.action === 'show'
          ? `shows ${step.cards ? step.cards.map(D.formatCard).join(' ') : ''} (${step.handRank || ''})`
          : step.action + (step.amount ? ' ' + D.formatChips(step.amount) : '');
        html += `<div class="log-entry ${isCurrent ? 'current' : ''}">
          <span class="log-player">${p ? p.name.split(' ').pop() : '???'}</span> ${actionText}
        </div>`;
      }
      // Check for winner
      const phase2 = phases[pi];
      const maxStep2 = pi === state.replayPhase ? state.replayStep : phase2.steps.length - 1;
      for (let si = 0; si <= Math.min(maxStep2, phase2.steps.length - 1); si++) {
        const step = phase2.steps[si];
        if (step.winner) {
          const wp = D.getPlayer(step.winner);
          html += `<div class="log-entry current" style="color: var(--green)">
            <span class="log-player" style="color: var(--green)">${wp ? wp.name.split(' ').pop() : '???'}</span> wins ${D.formatChips(step.amount)}
          </div>`;
        }
      }
    }
    html += '</div>';

    return html;
  }

  function renderSimpleActions(hand) {
    let html = '<div class="replay-hand-log">';
    let currentStreet = '';
    hand.actions.forEach(a => {
      if (a.street !== currentStreet) {
        currentStreet = a.street;
        html += `<div class="log-entry" style="color: var(--accent); font-weight: 700; margin-top: 4px;">
          ${currentStreet.toUpperCase()}
        </div>`;
      }
      const p = D.getPlayer(a.player);
      html += `<div class="log-entry">
        <span class="log-player">${p ? p.name.split(' ').pop() : '???'}</span>
        ${a.action}${a.amount ? ' ' + D.formatChips(a.amount) : ''}
      </div>`;
    });
    html += `<div class="log-entry" style="color: var(--green); font-weight: 700; margin-top: 4px;">
      ${hand.winnerName} wins ${D.formatChips(hand.potTotal)}
    </div>`;
    html += '</div>';
    return html;
  }

  function renderReplayState() {
    const tableArea = document.getElementById('replay-table-area');
    const controlsArea = document.getElementById('replay-controls');
    const hand = D.getHand(state.selectedMoment);
    if (!hand || !tableArea) return;
    const replay = D.HAND_REPLAYS[hand.id];
    if (!replay) return;

    tableArea.innerHTML = renderPokerTable(hand, replay);
    controlsArea.innerHTML = renderReplayControls(replay);

    // Auto-scroll log
    const log = document.getElementById('replay-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  function replayNext() {
    const hand = D.getHand(state.selectedMoment);
    if (!hand) return;
    const replay = D.HAND_REPLAYS[hand.id];
    if (!replay) return;

    const phase = replay.phases[state.replayPhase];
    if (state.replayStep < phase.steps.length - 1) {
      state.replayStep++;
    } else if (state.replayPhase < replay.phases.length - 1) {
      state.replayPhase++;
      state.replayStep = 0;
    }
    renderReplayState();
  }

  function replayPrev() {
    if (state.replayStep > 0) {
      state.replayStep--;
    } else if (state.replayPhase > 0) {
      state.replayPhase--;
      const hand = D.getHand(state.selectedMoment);
      const replay = D.HAND_REPLAYS[hand.id];
      const prevPhase = replay.phases[state.replayPhase];
      state.replayStep = Math.max(0, prevPhase.steps.length - 1);
    }
    renderReplayState();
  }

  function replayEnd() {
    const hand = D.getHand(state.selectedMoment);
    if (!hand) return;
    const replay = D.HAND_REPLAYS[hand.id];
    if (!replay) return;

    state.replayPhase = replay.phases.length - 1;
    state.replayStep = replay.phases[state.replayPhase].steps.length - 1;
    renderReplayState();
  }

  function replayTogglePlay() {
    if (state.replayPlaying) {
      clearInterval(state.replayInterval);
      state.replayInterval = null;
      state.replayPlaying = false;
      renderReplayState();
    } else {
      state.replayPlaying = true;
      renderReplayState();
      state.replayInterval = setInterval(() => {
        const hand = D.getHand(state.selectedMoment);
        if (!hand) { replayTogglePlay(); return; }
        const replay = D.HAND_REPLAYS[hand.id];
        if (!replay) { replayTogglePlay(); return; }

        const phase = replay.phases[state.replayPhase];
        if (state.replayStep < phase.steps.length - 1) {
          state.replayStep++;
        } else if (state.replayPhase < replay.phases.length - 1) {
          state.replayPhase++;
          state.replayStep = 0;
        } else {
          // Reached end
          clearInterval(state.replayInterval);
          state.replayInterval = null;
          state.replayPlaying = false;
        }
        renderReplayState();
      }, 1200);
    }
  }

  // =====================
  // Player Profile
  // =====================
  function renderPlayerProfile() {
    const player = D.getPlayer(state.trackedPlayer);
    if (!player) return renderExplore();

    const stats = D.PLAYER_STATS[player.id];
    const scouting = D.AI_CONTENT.playerScouting[player.id];
    const finishLabel = player.finishPosition === 1 ? 'Winner' : `${ordinal(player.finishPosition)} Place`;
    const finishColor = player.finishPosition === 1 ? 'var(--accent)' : player.finishPosition <= 3 ? 'var(--green)' : 'var(--text-secondary)';

    return `
      <div class="screen fade-in">
        <div class="screen-header">
          <button class="back-btn" data-action="go-back">
            ${ICONS.chevronLeft} Back
          </button>
          <div style="font-weight: 700; font-size: 14px;">Player Profile</div>
          <div style="width: 50px"></div>
        </div>

        <div class="player-profile">
          <div class="player-hero">
            <div class="hero-avatar" style="background: ${player.color}">${player.initials}</div>
            <div class="hero-info">
              <h2>${player.name}</h2>
              <div class="country">${player.countryFlag} ${player.country}</div>
              <div class="finish" style="color: ${finishColor}">${finishLabel}</div>
            </div>
          </div>

          <div class="summary-stats" style="margin-bottom: 4px;">
            <div class="summary-stat">
              <div class="value">${D.formatChips(player.startingStack)}</div>
              <div class="label">Start Stack</div>
            </div>
            <div class="summary-stat">
              <div class="value">${D.formatChips(player.endingStack)}</div>
              <div class="label">End Stack</div>
            </div>
            <div class="summary-stat">
              <div class="value">${player.handsPlayed}</div>
              <div class="label">Hands</div>
            </div>
          </div>

          ${stats ? renderPlayerStats(stats) : ''}

          ${scouting ? `
            <div class="scouting-report">
              <div class="ai-badge">AI SCOUTING REPORT</div>
              <p>${scouting}</p>
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderPlayerStats(stats) {
    const groups = [
      { title: 'Preflop', stats: [
        { label: 'VPIP', key: 'vpip' }, { label: 'PFR', key: 'pfr' }, { label: '3-Bet', key: 'threeBet' },
        { label: '4-Bet', key: 'fourBet' }, { label: 'Steal', key: 'steal' }, { label: 'Fold to Steal', key: 'foldToSteal' },
      ]},
      { title: 'Postflop', stats: [
        { label: 'C-Bet F', key: 'cbetFlop' }, { label: 'C-Bet T', key: 'cbetTurn' }, { label: 'C-Bet R', key: 'cbetRiver' },
        { label: 'Fold CB F', key: 'foldToCbetFlop' }, { label: 'Fold CB T', key: 'foldToCbetTurn' }, { label: 'CR Flop', key: 'checkRaiseFlop' },
      ]},
      { title: 'Aggression & Showdown', stats: [
        { label: 'AF', key: 'af' }, { label: 'AFq', key: 'afq' }, { label: 'WTSD', key: 'wtsd' },
        { label: 'W$SD', key: 'wsd' }, { label: 'WWSF', key: 'wwsf' }, { label: 'W w/o SD', key: 'wonWithoutShowdown' },
      ]},
    ];

    let html = '';
    groups.forEach(g => {
      html += `<div class="stat-section-title">${g.title}</div>`;
      html += '<div class="stats-grid">';
      g.stats.forEach(s => {
        const val = stats[s.key];
        if (val === undefined) return;
        const color = D.getStatColor(s.key, val);
        const display = typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val;
        html += `
          <div class="stat-cell">
            <div class="stat-value" style="color: ${color}">${display}${s.key !== 'af' ? '%' : ''}</div>
            <div class="stat-label">${s.label}</div>
          </div>`;
      });
      html += '</div>';
    });
    return html;
  }

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // =====================
  // Library Screen
  // =====================
  function renderLibrary() {
    const favTournaments = D.TOURNAMENTS.filter(t => state.favorites.tournaments.has(t.id));
    const favHands = D.HANDS.filter(h => state.favorites.hands.has(h.id));
    const recentTournaments = state.recentlyViewed.map(id => D.getTournament(id)).filter(Boolean);
    const bookmarked = [...state.bookmarkedMoments].map(id => D.getHand(id)).filter(Boolean);

    return `
      <div class="screen fade-in">
        <div class="screen-header">
          <div class="logo">HUDR</div>
          <div style="font-weight: 600; font-size: 14px;">Library</div>
          <div style="width: 36px"></div>
        </div>

        <div class="section-title">Favorited Tournaments</div>
        <div class="library-section">
          ${favTournaments.length > 0
            ? `<div class="tournament-list" style="padding: 0;">
                ${favTournaments.map(t => renderTournamentCard(t)).join('')}
              </div>`
            : renderEmptyState('No favorites yet', 'Explore tournaments and add them to your favorites.')}
        </div>

        <div class="section-title">Favorite Hands</div>
        <div class="library-section">
          ${favHands.length > 0
            ? favHands.map(h => renderLibraryHandCard(h)).join('')
            : renderEmptyState('No favorite hands', 'Tap moments on the timeline to save them.')}
        </div>

        <div class="section-title">Recently Viewed</div>
        <div class="library-section">
          ${recentTournaments.length > 0
            ? `<div class="tournament-list" style="padding: 0;">
                ${recentTournaments.map(t => renderTournamentCard(t)).join('')}
              </div>`
            : renderEmptyState('Nothing yet', 'Tournaments you view will appear here.')}
        </div>

        <div class="section-title">Bookmarked Moments</div>
        <div class="library-section">
          ${bookmarked.length > 0
            ? bookmarked.map(h => renderLibraryHandCard(h)).join('')
            : renderEmptyState('No bookmarks', 'Bookmark moments from the timeline.')}
        </div>
      </div>`;
  }

  function renderLibraryHandCard(hand) {
    const hlInfo = hand.highlightType ? D.HIGHLIGHT_LABELS[hand.highlightType] : null;
    return `
      <div class="library-hand-card" data-action="go-tournament" data-id="${hand.tournamentId}">
        <div class="hand-icon">${hlInfo ? hlInfo.icon : '🃏'}</div>
        <div class="hand-info">
          <div class="hand-title">${hand.highlightLabel || hand.preview}</div>
          <div class="hand-sub">Hand #${hand.handNumber} &bull; ${D.formatChips(hand.potTotal)}</div>
        </div>
        <span class="arrow">${ICONS.chevronRight}</span>
      </div>`;
  }

  function renderEmptyState(title, text) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.bookmark}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>`;
  }

  // =====================
  // Init
  // =====================
  parseHash();
})();
