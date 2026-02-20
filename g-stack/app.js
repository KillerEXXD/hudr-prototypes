/**
 * HUDR Prototype G: The Stack
 * Tinder-style card swiping UX for poker tournament intelligence
 */

// =====================
// Data References
// =====================
const D = window.HUDR_DATA;

// =====================
// State
// =====================
const state = {
  route: 'discover',
  routeParams: {},
  currentCategory: 'tournaments',
  currentIndex: 0,
  favorites: {
    tournaments: [],
    hands: [],
    players: [],
    highlights: [],
  },
  isFlipped: false,
  isDragging: false,
  replayState: null, // { handId, phaseIndex, stepIndex, playing }
};

// =====================
// Data Pools
// =====================
function getPool(category) {
  switch (category) {
    case 'tournaments': return D.TOURNAMENTS;
    case 'hands': return D.HANDS;
    case 'players': return D.PLAYERS;
    case 'highlights': return D.HANDS.filter(h => h.highlightType);
    default: return [];
  }
}

function getCurrentCard() {
  const pool = getPool(state.currentCategory);
  return pool[state.currentIndex] || null;
}

// =====================
// Router
// =====================
function navigate(route, params = {}) {
  state.route = route;
  state.routeParams = params;
  state.isFlipped = false;
  render();
}

function initRouter() {
  const hash = window.location.hash.slice(1) || 'discover';
  const parts = hash.split('/');

  if (parts[0] === 'detail' && parts[1] && parts[2]) {
    navigate('detail', { type: parts[1], id: parts[2] });
  } else if (parts[0] === 'replay' && parts[1]) {
    navigate('replay', { handId: parts[1] });
  } else if (['discover', 'deck', 'profile'].includes(parts[0])) {
    navigate(parts[0]);
  } else {
    navigate('discover');
  }
}

window.addEventListener('hashchange', initRouter);

// =====================
// Rendering
// =====================
const mainContent = document.getElementById('main-content');
const bottomNav = document.getElementById('bottom-nav');
const appHeader = document.getElementById('app-header');

function render() {
  // Update nav active state
  bottomNav.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.route);
  });

  // Show/hide nav and header for detail/replay views
  const isOverlay = state.route === 'detail' || state.route === 'replay';
  bottomNav.style.display = isOverlay ? 'none' : '';
  appHeader.style.display = isOverlay ? 'none' : '';
  mainContent.classList.toggle('no-scroll', state.route === 'discover');

  switch (state.route) {
    case 'discover': renderDiscover(); break;
    case 'deck': renderDeck(); break;
    case 'profile': renderProfile(); break;
    case 'detail': renderDetail(); break;
    case 'replay': renderReplay(); break;
  }
}

// =====================
// Card HTML Generators
// =====================
function renderPlayingCard(card, size = '') {
  const rank = D.getCardRank(card);
  const suit = D.getCardSuit(card);
  const isRed = D.isRedSuit(card);
  const cls = `playing-card ${isRed ? 'red' : 'black'} ${size}`;
  return `<div class="${cls}"><span class="card-rank">${rank}</span><span class="card-suit-icon">${suit}</span></div>`;
}

function renderFacedownCard(size = '') {
  return `<div class="playing-card facedown ${size}"></div>`;
}

function getHighlightColor(type) {
  const info = D.HIGHLIGHT_LABELS[type];
  return info ? info.color : '#6b7280';
}

function getHighlightIcon(type) {
  const info = D.HIGHLIGHT_LABELS[type];
  return info ? info.icon : '';
}

function getHighlightText(type) {
  const info = D.HIGHLIGHT_LABELS[type];
  return info ? info.label : '';
}

// --- Tournament Card ---
function tournamentCardFront(t) {
  const live = t.liveStatus === 'live'
    ? `<div class="card-live-badge"><span class="live-dot"></span>LIVE</div>`
    : '';
  const prize = t.prizePool ? D.formatChips(t.prizePool) : 'TBD';
  return `
    <div class="card-tournament-bg" style="background: ${t.imageGradient}; width:100%; height:100%;"></div>
    ${live}
    <div class="card-event">${t.event}</div>
    <div class="card-title">${t.name}</div>
    <div class="card-subtitle">${t.subtitle} &mdash; ${t.venue}</div>
    <div class="card-meta">
      <div class="card-meta-item"><span class="card-meta-label">Prize Pool</span><span class="card-meta-value">${prize}</span></div>
      <div class="card-meta-item"><span class="card-meta-label">Players</span><span class="card-meta-value">${t.totalEntrants > 0 ? D.formatNumber(t.totalEntrants) : 'TBD'}</span></div>
      <div class="card-meta-item"><span class="card-meta-label">Hands</span><span class="card-meta-value">${t.handCount}</span></div>
    </div>`;
}

function tournamentCardBack(t) {
  // Top 3 players (sorted by finish position)
  const tPlayers = D.PLAYERS.filter(p => true).sort((a, b) => a.finishPosition - b.finishPosition).slice(0, 3);
  const playersHtml = tPlayers.map((p, i) => {
    const stats = D.PLAYER_STATS[p.id];
    const colors = ['#fbbf24', '#9ca3af', '#cd7f32'];
    return `<div class="card-back-player">
      <div class="card-back-player-rank" style="background:${colors[i]}; color:#000;">${i + 1}</div>
      <span class="card-back-player-name">${p.name} ${p.countryFlag}</span>
      <span class="card-back-player-stat">${stats ? `VPIP ${stats.vpip}%` : ''}</span>
    </div>`;
  }).join('');

  // Top highlight
  const topHand = D.HANDS.filter(h => h.tournamentId === t.id && h.highlightType === 'biggest_pot').sort((a, b) => b.potTotal - a.potTotal)[0];
  const highlightHtml = topHand
    ? `<div class="card-back-insight">
        <div class="card-back-insight-label">Top Highlight</div>
        <div class="card-back-insight-text">${topHand.preview}</div>
      </div>`
    : '';

  // AI insight
  const ai = D.AI_CONTENT.insights[0];
  const aiHtml = ai
    ? `<div class="card-back-insight">
        <div class="card-back-insight-label">${ai.icon} AI Insight</div>
        <div class="card-back-insight-text">${ai.text}</div>
      </div>`
    : '';

  return `
    <div class="card-back-header">${t.name}</div>
    <div class="card-back-section">
      <div class="card-back-section-title">Top Players</div>
      ${playersHtml}
    </div>
    ${highlightHtml}
    ${aiHtml}`;
}

// --- Hand Card ---
function handCardFront(h) {
  const communityHtml = h.communityCards.map(c => renderPlayingCard(c)).join('');
  const badgeHtml = h.highlightType
    ? `<div class="highlight-badge" style="background: ${getHighlightColor(h.highlightType)}22; color: ${getHighlightColor(h.highlightType)};">${getHighlightIcon(h.highlightType)} ${h.highlightLabel || getHighlightText(h.highlightType)}</div>`
    : '';
  return `
    <div class="community-cards">${communityHtml}</div>
    <div class="hand-info">
      <div class="hand-number">Hand #${h.handNumber}</div>
      <div class="hand-pot">${D.formatChips(h.potTotal)}</div>
      <div class="hand-winner">Won by ${h.winnerName}</div>
      ${badgeHtml}
    </div>
    <div class="hand-preview">${h.preview}</div>`;
}

function handCardBack(h) {
  // Group actions by street
  const streets = {};
  h.actions.forEach(a => {
    if (!streets[a.street]) streets[a.street] = [];
    streets[a.street].push(a);
  });

  let actionsHtml = '';
  for (const [street, actions] of Object.entries(streets)) {
    actionsHtml += `<div class="street-label">${street}</div>`;
    actions.forEach(a => {
      const player = D.getPlayer(a.player);
      const name = player ? player.name.split(' ').pop() : a.player;
      const amt = a.amount > 0 ? D.formatChips(a.amount) : '';
      actionsHtml += `<div class="action-step">
        <span class="action-player">${name}</span>
        <span class="action-type ${a.action}">${a.action}</span>
        <span class="action-amount">${amt}</span>
      </div>`;
    });
  }

  // Players involved with hole cards
  const playersHtml = h.playersInvolved.map(pid => {
    const p = D.getPlayer(pid);
    const cards = h.holeCards[pid];
    const cardsHtml = cards ? cards.map(c => renderPlayingCard(c, 'mini')).join('') : '';
    return `<div class="card-back-player">
      <div class="card-back-player-rank" style="background:${p.color};">${p.initials}</div>
      <span class="card-back-player-name">${p.name}</span>
      <span style="display:flex;gap:2px;">${cardsHtml}</span>
    </div>`;
  }).join('');

  const hasReplay = D.HAND_REPLAYS[h.id];

  return `
    <div class="card-back-header">Hand #${h.handNumber} &mdash; ${D.formatChips(h.potTotal)}</div>
    <div class="card-back-section">
      <div class="card-back-section-title">Players</div>
      ${playersHtml}
    </div>
    <div class="card-back-section action-summary" style="max-height:200px; overflow-y:auto;">
      ${actionsHtml}
    </div>
    ${hasReplay ? `<button class="replay-cta" data-action="replay" data-id="${h.id}">&#9654; Watch Replay</button>` : ''}`;
}

// --- Player Card ---
function playerCardFront(p) {
  const stats = D.PLAYER_STATS[p.id];
  const statusBadge = p.status === 'winner'
    ? `<div class="player-card-badge winner">&#9733; Winner</div>`
    : `<div class="player-card-badge eliminated">#${p.finishPosition}</div>`;

  const statsRow = stats ? `
    <div class="player-card-stats-row">
      <div class="player-mini-stat"><span class="stat-val" style="color:${D.getStatColor('vpip', stats.vpip)}">${stats.vpip}%</span><span class="stat-label">VPIP</span></div>
      <div class="player-mini-stat"><span class="stat-val" style="color:${D.getStatColor('pfr', stats.pfr)}">${stats.pfr}%</span><span class="stat-label">PFR</span></div>
      <div class="player-mini-stat"><span class="stat-val" style="color:${D.getStatColor('af', stats.af)}">${stats.af}</span><span class="stat-label">AF</span></div>
    </div>` : '';

  return `
    <div class="player-avatar-large" style="background:${p.color};">${p.initials}</div>
    <div class="player-card-name">${p.name}</div>
    <div class="player-card-country">${p.countryFlag} ${p.country}</div>
    ${statusBadge}
    ${statsRow}`;
}

function playerCardBack(p) {
  const stats = D.PLAYER_STATS[p.id];
  if (!stats) return `<div class="card-back-header">${p.name}</div><div style="color:var(--text-muted);padding:20px;">No stats available</div>`;

  const ringStats = [
    { key: 'vpip', label: 'VPIP', value: stats.vpip, max: 50 },
    { key: 'pfr', label: 'PFR', value: stats.pfr, max: 40 },
    { key: 'threeBet', label: '3-Bet', value: stats.threeBet, max: 20 },
    { key: 'wtsd', label: 'WTSD', value: stats.wtsd, max: 60 },
  ];

  const ringsHtml = ringStats.map(s => {
    const pct = Math.min(s.value / s.max, 1);
    const circumference = 2 * Math.PI * 28;
    const offset = circumference * (1 - pct);
    const color = D.getStatColor(s.key, s.value);
    return `<div class="stat-ring-item">
      <div class="stat-ring">
        <svg viewBox="0 0 64 64">
          <circle class="ring-bg" cx="32" cy="32" r="28"/>
          <circle class="ring-value" cx="32" cy="32" r="28" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="ring-label"><span style="color:${color}">${s.key === 'af' ? s.value : s.value + '%'}</span><small>${s.label}</small></div>
      </div>
    </div>`;
  }).join('');

  // More stats
  const extraStats = [
    { label: 'AF', value: stats.af, key: 'af' },
    { label: 'WSD', value: stats.wsd + '%', key: 'wsd' },
    { label: 'C-Bet', value: stats.cbetFlop + '%', key: 'cbetFlop' },
    { label: 'Steal', value: stats.steal + '%', key: 'steal' },
    { label: 'Hands', value: stats.totalHands, key: null },
    { label: 'WWSF', value: stats.wwsf + '%', key: 'wwsf' },
  ];

  const extraHtml = extraStats.map(s => {
    const color = s.key ? D.getStatColor(s.key, parseFloat(s.value)) : 'var(--text-primary)';
    return `<div class="detail-stat-cell"><div class="stat-value" style="color:${color}">${s.value}</div><div class="stat-name">${s.label}</div></div>`;
  }).join('');

  return `
    <div class="card-back-header">${p.name} ${p.countryFlag}</div>
    <div class="stat-rings">${ringsHtml}</div>
    <div class="detail-stat-grid" style="margin-top:4px;">${extraHtml}</div>`;
}

// --- Highlight Card ---
function highlightCardFront(h) {
  const color = getHighlightColor(h.highlightType);
  const icon = getHighlightIcon(h.highlightType);
  const label = getHighlightText(h.highlightType);
  return `
    <div style="position:absolute;inset:0;background:linear-gradient(135deg, ${color}22, ${color}11);"></div>
    <div class="highlight-icon-large" style="position:relative;z-index:1;">${icon}</div>
    <div class="highlight-type-label" style="color:${color};position:relative;z-index:1;">${label}</div>
    <div class="highlight-hand-number" style="position:relative;z-index:1;">Hand #${h.handNumber}</div>
    <div class="highlight-pot-size" style="position:relative;z-index:1;">${D.formatChips(h.potTotal)}</div>
    <div class="highlight-description" style="position:relative;z-index:1;">${h.preview}</div>`;
}

function highlightCardBack(h) {
  return handCardBack(h);
}

// =====================
// Card Renderer (main)
// =====================
function renderCardHTML(item, category) {
  let frontContent, backContent, extraClass = '';
  switch (category) {
    case 'tournaments':
      frontContent = tournamentCardFront(item);
      backContent = tournamentCardBack(item);
      extraClass = 'card-tournament';
      break;
    case 'hands':
      frontContent = handCardFront(item);
      backContent = handCardBack(item);
      extraClass = 'card-hand';
      break;
    case 'players':
      frontContent = playerCardFront(item);
      backContent = playerCardBack(item);
      extraClass = 'card-player';
      break;
    case 'highlights':
      frontContent = highlightCardFront(item);
      backContent = highlightCardBack(item);
      extraClass = 'card-highlight';
      break;
  }

  return `
    <div class="card-flipper ${state.isFlipped ? 'flipped' : ''} ${extraClass}">
      <div class="card-front">${frontContent}</div>
      <div class="card-back">${backContent}</div>
    </div>
    <div class="swipe-glow like-glow"></div>
    <div class="swipe-glow nope-glow"></div>
    <div class="swipe-glow detail-glow"></div>
    <div class="swipe-indicator like">LIKE</div>
    <div class="swipe-indicator nope">NOPE</div>
    <div class="swipe-indicator detail">INFO</div>`;
}

// =====================
// Discover View
// =====================
function renderDiscover() {
  const pool = getPool(state.currentCategory);
  const total = pool.length;
  const idx = state.currentIndex;
  const current = pool[idx];

  const categories = [
    { key: 'tournaments', label: 'Tournaments', icon: '' },
    { key: 'hands', label: 'Hands', icon: '' },
    { key: 'players', label: 'Players', icon: '' },
    { key: 'highlights', label: 'Highlights', icon: '' },
  ];

  const chipsHtml = categories.map(c =>
    `<button class="category-chip ${c.key === state.currentCategory ? 'active' : ''}" data-action="category" data-id="${c.key}">${c.label}</button>`
  ).join('');

  if (!current) {
    mainContent.innerHTML = `
      <div class="discover-view">
        <div class="category-bar">${chipsHtml}</div>
        <div class="empty-stack">
          <div class="empty-icon">&#127183;</div>
          <div class="empty-title">No more cards</div>
          <div class="empty-text">You've seen all the ${state.currentCategory}!</div>
          <button class="empty-btn" data-action="reset-stack">Start Over</button>
        </div>
      </div>`;
    return;
  }

  // Build card stack (current + 2 behind)
  let stackHtml = '';

  // Card behind 2
  if (pool[idx + 2]) {
    stackHtml += `<div class="swipe-card card-behind-2">
      <div class="card-flipper ${pool[idx + 2].imageGradient ? 'card-tournament' : state.currentCategory === 'hands' ? 'card-hand' : state.currentCategory === 'players' ? 'card-player' : 'card-highlight'}">
        <div class="card-front" style="${pool[idx + 2].imageGradient ? 'background:' + pool[idx + 2].imageGradient : 'background:var(--bg-card)'}"></div>
      </div>
    </div>`;
  }

  // Card behind 1
  if (pool[idx + 1]) {
    stackHtml += `<div class="swipe-card card-behind-1">
      <div class="card-flipper ${pool[idx + 1].imageGradient ? 'card-tournament' : state.currentCategory === 'hands' ? 'card-hand' : state.currentCategory === 'players' ? 'card-player' : 'card-highlight'}">
        <div class="card-front" style="${pool[idx + 1].imageGradient ? 'background:' + pool[idx + 1].imageGradient : 'background:var(--bg-card)'}"></div>
      </div>
    </div>`;
  }

  // Active card
  stackHtml += `<div class="swipe-card card-active" id="active-card">
    ${renderCardHTML(current, state.currentCategory)}
  </div>`;

  mainContent.innerHTML = `
    <div class="discover-view">
      <div class="category-bar">${chipsHtml}</div>
      <div class="stack-counter">${idx + 1} of ${total}</div>
      <div class="card-stack-container">
        <div class="card-stack" id="card-stack">${stackHtml}</div>
      </div>
      <div class="swipe-buttons">
        <button class="swipe-btn skip" data-action="swipe-left" title="Skip">&#10005;</button>
        <button class="swipe-btn detail" data-action="swipe-up" title="Details">&#8679;</button>
        <button class="swipe-btn fav" data-action="swipe-right" title="Favorite">&#9829;</button>
      </div>
    </div>`;

  // Attach swipe physics
  requestAnimationFrame(() => initSwipePhysics());
}

// =====================
// Swipe Physics
// =====================
let swipeData = null;

function initSwipePhysics() {
  const card = document.getElementById('active-card');
  if (!card) return;

  let startX = 0, startY = 0, currentX = 0, currentY = 0;
  let startTime = 0;
  let isDrag = false;

  function onStart(e) {
    // Don't start swipe if tapping a button
    if (e.target.closest('button, .replay-cta')) return;

    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    currentX = 0;
    currentY = 0;
    startTime = Date.now();
    isDrag = false;

    card.classList.add('no-transition');
    state.isDragging = true;

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function onMove(e) {
    const point = e;
    updateDrag(point.clientX - startX, point.clientY - startY);
  }

  function onTouchMove(e) {
    e.preventDefault();
    const point = e.touches[0];
    updateDrag(point.clientX - startX, point.clientY - startY);
  }

  function updateDrag(dx, dy) {
    currentX = dx;
    currentY = dy;
    isDrag = true;

    const rotation = dx * 0.08;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`;

    // Update indicators
    const likeIndicator = card.querySelector('.swipe-indicator.like');
    const nopeIndicator = card.querySelector('.swipe-indicator.nope');
    const detailIndicator = card.querySelector('.swipe-indicator.detail');
    const likeGlow = card.querySelector('.swipe-glow.like-glow');
    const nopeGlow = card.querySelector('.swipe-glow.nope-glow');
    const detailGlow = card.querySelector('.swipe-glow.detail-glow');

    const absDx = Math.abs(dx);
    const threshold = 100;
    const upThreshold = 80;

    if (dx > 30) {
      const opacity = Math.min((dx - 30) / (threshold - 30), 1);
      likeIndicator.style.opacity = opacity;
      likeGlow.style.opacity = opacity * 0.8;
      nopeIndicator.style.opacity = 0;
      nopeGlow.style.opacity = 0;
      detailIndicator.style.opacity = 0;
      detailGlow.style.opacity = 0;
    } else if (dx < -30) {
      const opacity = Math.min((absDx - 30) / (threshold - 30), 1);
      nopeIndicator.style.opacity = opacity;
      nopeGlow.style.opacity = opacity * 0.8;
      likeIndicator.style.opacity = 0;
      likeGlow.style.opacity = 0;
      detailIndicator.style.opacity = 0;
      detailGlow.style.opacity = 0;
    } else if (dy < -30 && absDx < 50) {
      const opacity = Math.min((Math.abs(dy) - 30) / (upThreshold - 30), 1);
      detailIndicator.style.opacity = opacity;
      detailGlow.style.opacity = opacity * 0.8;
      likeIndicator.style.opacity = 0;
      likeGlow.style.opacity = 0;
      nopeIndicator.style.opacity = 0;
      nopeGlow.style.opacity = 0;
    } else {
      likeIndicator.style.opacity = 0;
      nopeIndicator.style.opacity = 0;
      detailIndicator.style.opacity = 0;
      likeGlow.style.opacity = 0;
      nopeGlow.style.opacity = 0;
      detailGlow.style.opacity = 0;
    }
  }

  function onEnd(e) {
    cleanup();
    finishDrag();
  }

  function onTouchEnd(e) {
    cleanup();
    finishDrag();
  }

  function cleanup() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    card.classList.remove('no-transition');
    state.isDragging = false;
  }

  function finishDrag() {
    const duration = Date.now() - startTime;
    const velocityX = currentX / Math.max(duration, 1) * 1000;
    const absDx = Math.abs(currentX);
    const threshold = 100;
    const upThreshold = 80;

    // Check if it was a tap (not a drag)
    if (!isDrag || (absDx < 10 && Math.abs(currentY) < 10 && duration < 300)) {
      // Tap = flip card
      card.style.transform = '';
      flipCard();
      return;
    }

    if (currentX > threshold || velocityX > 600) {
      // Swipe right = favorite
      swipeRight();
    } else if (currentX < -threshold || velocityX < -600) {
      // Swipe left = skip
      swipeLeft();
    } else if (currentY < -upThreshold && absDx < 50) {
      // Swipe up = detail
      swipeUp();
    } else {
      // Spring back
      card.classList.add('spring-back');
      card.style.transform = '';
      // Reset indicators
      card.querySelectorAll('.swipe-indicator, .swipe-glow').forEach(el => el.style.opacity = 0);
      setTimeout(() => card.classList.remove('spring-back'), 400);
    }
  }

  // Use pointer events on desktop, touch events on mobile
  card.addEventListener('pointerdown', onStart);
  card.addEventListener('touchstart', (e) => {
    // Prevent pointer events from also firing
    onStart(e);
  }, { passive: true });
}

function swipeRight() {
  const card = document.getElementById('active-card');
  if (card) {
    card.classList.add('swiping-right');
    card.style.transform = 'translate(150%, 0) rotate(30deg)';
  }

  // Heart animation
  const heart = document.createElement('div');
  heart.className = 'heart-burst';
  heart.textContent = '\u2764\uFE0F';
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 800);

  // Add to favorites
  const current = getCurrentCard();
  if (current) {
    const favList = state.favorites[state.currentCategory];
    if (!favList.includes(current.id)) {
      favList.push(current.id);
    }
  }

  setTimeout(advanceCard, 350);
}

function swipeLeft() {
  const card = document.getElementById('active-card');
  if (card) {
    card.classList.add('swiping-left');
    card.style.transform = 'translate(-150%, 0) rotate(-30deg)';
  }

  setTimeout(advanceCard, 350);
}

function swipeUp() {
  const card = document.getElementById('active-card');
  if (card) {
    card.classList.add('swiping-up');
    card.style.transform = 'translate(0, -150%) rotate(0deg)';
  }

  const current = getCurrentCard();
  if (current) {
    setTimeout(() => {
      openDetail(state.currentCategory === 'highlights' ? 'hand' : state.currentCategory.replace(/s$/, ''), current.id);
    }, 350);
  }
}

function advanceCard() {
  state.currentIndex++;
  state.isFlipped = false;
  render();
}

function flipCard() {
  state.isFlipped = !state.isFlipped;
  const flipper = document.querySelector('#active-card .card-flipper');
  if (flipper) {
    flipper.classList.toggle('flipped', state.isFlipped);
  }
}

// =====================
// Detail View
// =====================
function openDetail(type, id) {
  navigate('detail', { type, id });
}

function renderDetail() {
  const { type, id } = state.routeParams;

  let html = '';
  switch (type) {
    case 'tournament': html = renderTournamentDetail(id); break;
    case 'hand': html = renderHandDetail(id); break;
    case 'player': html = renderPlayerDetail(id); break;
    default: html = '<div>Unknown detail type</div>';
  }

  mainContent.innerHTML = `
    <div class="detail-view">
      <div class="detail-header">
        <button class="detail-back-btn" data-action="back">&#8592; Back</button>
        <div class="detail-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      </div>
      <div class="detail-body">${html}</div>
    </div>`;
}

function renderTournamentDetail(id) {
  const t = D.getTournament(id);
  if (!t) return '<div>Tournament not found</div>';

  const hands = D.getHandsForTournament(t.id).slice(0, 10);
  const players = D.PLAYERS.sort((a, b) => a.finishPosition - b.finishPosition);

  const playersHtml = players.map(p =>
    `<div class="detail-player-row" data-action="open-detail" data-type="player" data-id="${p.id}">
      <div class="detail-player-pos">${p.finishPosition}</div>
      <div class="detail-player-avatar" style="background:${p.color};">${p.initials}</div>
      <div class="detail-player-info">
        <div class="detail-player-name">${p.name} ${p.countryFlag}</div>
        <div class="detail-player-sub">${p.handsPlayed} hands &bull; ${p.status === 'winner' ? 'Winner' : 'Eliminated'}</div>
      </div>
    </div>`
  ).join('');

  const handsHtml = hands.map(h =>
    `<div class="detail-hand-row" data-action="open-detail" data-type="hand" data-id="${h.id}">
      <div class="detail-hand-number">#${h.handNumber}</div>
      <div class="detail-hand-info">
        <div class="detail-hand-preview">${h.preview}</div>
      </div>
      <div class="detail-hand-pot">${D.formatChips(h.potTotal)}</div>
    </div>`
  ).join('');

  const aiHtml = D.AI_CONTENT.insights.slice(0, 3).map(ai =>
    `<div class="detail-ai-card">
      <div class="ai-icon">${ai.icon}</div>
      <div class="ai-title">${ai.title}</div>
      <div class="ai-text">${ai.text}</div>
    </div>`
  ).join('');

  const prize = t.prizePool ? D.formatChips(t.prizePool) : 'TBD';

  return `
    <div class="detail-tournament-hero" style="background:${t.imageGradient}">
      <div class="hero-event">${t.event}</div>
      <div class="hero-title">${t.name}</div>
      <div class="hero-meta">
        <div class="card-meta-item"><span class="card-meta-label">Prize Pool</span><span class="card-meta-value">${prize}</span></div>
        <div class="card-meta-item"><span class="card-meta-label">Entrants</span><span class="card-meta-value">${D.formatNumber(t.totalEntrants)}</span></div>
        <div class="card-meta-item"><span class="card-meta-label">Hands</span><span class="card-meta-value">${t.handCount}</span></div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Final Table Players</div>
      <div class="stagger-children">${playersHtml}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Key Hands</div>
      ${handsHtml}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">AI Insights</div>
      ${aiHtml}
    </div>`;
}

function renderHandDetail(id) {
  const h = D.getHand(id);
  if (!h) return '<div>Hand not found</div>';

  const communityHtml = h.communityCards.map(c => renderPlayingCard(c, 'small')).join('');

  const playersHtml = h.playersInvolved.map(pid => {
    const p = D.getPlayer(pid);
    const cards = h.holeCards[pid];
    const cardsHtml = cards ? cards.map(c => renderPlayingCard(c, 'small')).join('') : '';
    const isWinner = pid === h.winnerId;
    return `<div class="detail-player-row" data-action="open-detail" data-type="player" data-id="${pid}">
      <div class="detail-player-avatar" style="background:${p.color}; ${isWinner ? 'box-shadow:0 0 8px rgba(16,185,129,0.5);border:2px solid var(--green);' : ''}">${p.initials}</div>
      <div class="detail-player-info">
        <div class="detail-player-name">${p.name} ${isWinner ? '<span style="color:var(--green);font-size:12px;">(Winner)</span>' : ''}</div>
        <div class="detail-player-sub">${p.countryFlag} Seat ${p.seatNumber}</div>
      </div>
      <div style="display:flex;gap:4px;">${cardsHtml}</div>
    </div>`;
  }).join('');

  // Actions grouped by street
  const streets = {};
  h.actions.forEach(a => {
    if (!streets[a.street]) streets[a.street] = [];
    streets[a.street].push(a);
  });

  let actionsHtml = '';
  for (const [street, actions] of Object.entries(streets)) {
    actionsHtml += `<div class="street-label">${street}</div>`;
    actions.forEach(a => {
      const player = D.getPlayer(a.player);
      const name = player ? player.name.split(' ').pop() : a.player;
      const amt = a.amount > 0 ? D.formatChips(a.amount) : '';
      actionsHtml += `<div class="action-step">
        <span class="action-player">${name}</span>
        <span class="action-type ${a.action}">${a.action}</span>
        <span class="action-amount">${amt}</span>
      </div>`;
    });
  }

  const hasReplay = D.HAND_REPLAYS[h.id];
  const commentary = D.AI_CONTENT.commentary.find(c => c.handId === h.id);

  const badgeHtml = h.highlightType
    ? `<div class="highlight-badge" style="background:${getHighlightColor(h.highlightType)}22;color:${getHighlightColor(h.highlightType)};margin-bottom:16px;">${getHighlightIcon(h.highlightType)} ${h.highlightLabel || getHighlightText(h.highlightType)}</div>`
    : '';

  return `
    ${badgeHtml}
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:4px;">Hand #${h.handNumber} &mdash; ${h.blinds}</div>
      <div style="font-size:28px;font-weight:800;margin-bottom:8px;">${D.formatChips(h.potTotal)}</div>
      <div style="display:flex;gap:6px;justify-content:center;">${communityHtml}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Players</div>
      ${playersHtml}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Action</div>
      <div class="action-summary">${actionsHtml}</div>
    </div>

    ${commentary ? `<div class="detail-section">
      <div class="detail-section-title">Commentary</div>
      <div class="detail-ai-card">
        <div class="ai-text">${commentary.text}</div>
      </div>
    </div>` : ''}

    ${hasReplay ? `<button class="replay-cta" data-action="replay" data-id="${h.id}" style="width:100%;margin-top:8px;">&#9654; Watch Full Replay</button>` : ''}`;
}

function renderPlayerDetail(id) {
  const p = D.getPlayer(id);
  if (!p) return '<div>Player not found</div>';

  const stats = D.PLAYER_STATS[p.id];

  // Top hero section
  let heroHtml = `
    <div style="text-align:center;margin-bottom:24px;">
      <div class="player-avatar-large" style="background:${p.color};margin:0 auto 12px;">${p.initials}</div>
      <div style="font-size:24px;font-weight:800;">${p.name}</div>
      <div style="font-size:16px;margin:4px 0;">${p.countryFlag} ${p.country}</div>
      <div class="player-card-badge ${p.status === 'winner' ? 'winner' : 'eliminated'}" style="display:inline-flex;margin-top:4px;">
        ${p.status === 'winner' ? '&#9733; Winner' : '#' + p.finishPosition + ' Finish'}
      </div>
    </div>`;

  if (!stats) {
    return heroHtml + '<div style="color:var(--text-muted);text-align:center;padding:20px;">No stats available</div>';
  }

  // Stats grid
  const statItems = [
    { label: 'VPIP', value: stats.vpip + '%', key: 'vpip', raw: stats.vpip },
    { label: 'PFR', value: stats.pfr + '%', key: 'pfr', raw: stats.pfr },
    { label: '3-Bet', value: stats.threeBet + '%', key: 'threeBet', raw: stats.threeBet },
    { label: 'AF', value: stats.af.toString(), key: 'af', raw: stats.af },
    { label: 'WTSD', value: stats.wtsd + '%', key: 'wtsd', raw: stats.wtsd },
    { label: 'WSD', value: stats.wsd + '%', key: 'wsd', raw: stats.wsd },
    { label: 'WWSF', value: stats.wwsf + '%', key: 'wwsf', raw: stats.wwsf },
    { label: 'C-Bet F', value: stats.cbetFlop + '%', key: 'cbetFlop', raw: stats.cbetFlop },
    { label: 'Steal', value: stats.steal + '%', key: 'steal', raw: stats.steal },
  ];

  const statsGrid = statItems.map(s => {
    const color = D.getStatColor(s.key, s.raw);
    return `<div class="detail-stat-cell"><div class="stat-value" style="color:${color}">${s.value}</div><div class="stat-name">${s.label}</div></div>`;
  }).join('');

  // Scouting report
  const scouting = D.AI_CONTENT.playerScouting[p.id] || '';

  // Player's hands
  const playerHands = D.HANDS.filter(h => h.playersInvolved.includes(p.id)).sort((a, b) => b.handNumber - a.handNumber).slice(0, 8);
  const handsHtml = playerHands.map(h => {
    const isWinner = h.winnerId === p.id;
    const result = isWinner ? `<span style="color:var(--green);">+${D.formatChips(h.netResult)}</span>` : `<span style="color:var(--red);">Lost</span>`;
    return `<div class="detail-hand-row" data-action="open-detail" data-type="hand" data-id="${h.id}">
      <div class="detail-hand-number">#${h.handNumber}</div>
      <div class="detail-hand-info">
        <div class="detail-hand-preview">${h.preview}</div>
      </div>
      <div class="detail-hand-pot">${result}</div>
    </div>`;
  }).join('');

  return `
    ${heroHtml}

    <div class="detail-section">
      <div class="detail-section-title">HUD Stats (${stats.totalHands} hands)</div>
      <div class="detail-stat-grid">${statsGrid}</div>
    </div>

    ${scouting ? `<div class="detail-section">
      <div class="detail-section-title">AI Scouting Report</div>
      <div class="detail-scouting">${scouting}</div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Hands Played</div>
      ${handsHtml}
    </div>`;
}

// =====================
// Hand Replay
// =====================
function renderReplay() {
  const { handId } = state.routeParams;
  const replay = D.HAND_REPLAYS[handId];
  const hand = D.getHand(handId);

  if (!replay || !hand) {
    mainContent.innerHTML = `<div class="replay-view">
      <div class="detail-header">
        <button class="detail-back-btn" data-action="back">&#8592; Back</button>
        <div class="detail-title">Hand Replay</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text-muted);">
        No replay data available for this hand
      </div>
    </div>`;
    return;
  }

  // Init replay state if needed
  if (!state.replayState || state.replayState.handId !== handId) {
    state.replayState = {
      handId,
      phaseIndex: 0,
      stepIndex: -1, // -1 = phase intro (show community cards)
      playing: false,
    };
  }

  const rs = state.replayState;
  const phase = replay.phases[rs.phaseIndex];
  const step = rs.stepIndex >= 0 ? phase.steps[rs.stepIndex] : null;

  // Determine players involved
  const playerIds = hand.playersInvolved;
  const positions = getTablePositions(playerIds.length);

  // Get current stacks, folded status, action bubble
  const foldedPlayers = new Set();
  const currentStacks = {};

  // Initialize stacks from player data
  playerIds.forEach(pid => {
    const p = D.getPlayer(pid);
    currentStacks[pid] = p.startingStack;
  });

  // Walk through all steps up to current to determine state
  let lastActionPlayer = null;
  let lastAction = null;

  for (let pi = 0; pi <= rs.phaseIndex; pi++) {
    const ph = replay.phases[pi];
    const maxStep = pi < rs.phaseIndex ? ph.steps.length - 1 : rs.stepIndex;

    for (let si = 0; si <= maxStep && si < ph.steps.length; si++) {
      const s = ph.steps[si];
      if (s.action === 'fold') foldedPlayers.add(s.player);
      if (s.stacks) {
        Object.assign(currentStacks, s.stacks);
      }
      if (s.player && s.action !== 'show') {
        lastActionPlayer = s.player;
        lastAction = s;
      }
    }
  }

  // Community cards for current phase
  const communityCards = phase.communityCards || [];

  // Current pot
  let currentPot = 0;
  if (step && step.pot !== undefined) {
    currentPot = step.pot;
  } else if (rs.stepIndex === -1) {
    currentPot = phase.pot || 0;
  } else {
    currentPot = phase.pot || 0;
  }

  // Table seats HTML
  const seatsHtml = playerIds.map((pid, i) => {
    const p = D.getPlayer(pid);
    const pos = positions[i];
    const isFolded = foldedPlayers.has(pid);
    const isWinner = hand.winnerId === pid;
    const cards = hand.holeCards[pid];
    const stack = currentStacks[pid] !== undefined ? currentStacks[pid] : p.startingStack;

    // Show cards if showdown phase or if we want to show all
    const showCards = phase.name === 'showdown' || true; // Always show in prototype
    const cardsHtml = showCards && cards && !isFolded
      ? cards.map(c => renderPlayingCard(c, 'mini')).join('')
      : (isFolded ? '' : `${renderFacedownCard('mini')}${renderFacedownCard('mini')}`);

    // Action bubble
    let bubbleHtml = '';
    if (lastActionPlayer === pid && step && lastAction) {
      const actionColors = {
        raise: 'var(--red)', bet: 'var(--red)', call: 'var(--blue)',
        check: 'var(--green)', fold: 'var(--text-muted)', allin: 'var(--yellow)',
        show: 'var(--text-primary)',
      };
      const bgColors = {
        raise: 'rgba(239,68,68,0.2)', bet: 'rgba(239,68,68,0.2)', call: 'rgba(59,130,246,0.2)',
        check: 'rgba(16,185,129,0.2)', fold: 'rgba(107,114,128,0.2)', allin: 'rgba(245,158,11,0.2)',
        show: 'rgba(255,255,255,0.1)',
      };
      const actionLabel = lastAction.action === 'allin' ? 'ALL-IN' : lastAction.action.toUpperCase();
      const amt = lastAction.amount > 0 ? ` ${D.formatChips(lastAction.amount)}` : '';
      bubbleHtml = `<div class="seat-action-bubble" style="background:${bgColors[lastAction.action]};color:${actionColors[lastAction.action]};">${actionLabel}${amt}</div>`;
    }

    return `<div class="table-seat" style="left:${pos.x}%;top:${pos.y}%;">
      ${bubbleHtml}
      <div class="seat-avatar ${isWinner ? 'is-winner' : ''} ${isFolded ? 'is-folded' : ''}" style="background:${p.color};">${p.initials}</div>
      <div class="seat-name">${p.name.split(' ').pop()}</div>
      <div class="seat-stack">${D.formatChips(stack)}</div>
      <div class="seat-cards">${cardsHtml}</div>
    </div>`;
  }).join('');

  // Community cards on table
  const tableCardsHtml = communityCards.map(c => renderPlayingCard(c, 'mini')).join('');

  // Build log entries
  let logEntries = [];
  for (let pi = 0; pi <= rs.phaseIndex; pi++) {
    const ph = replay.phases[pi];
    const maxStep = pi < rs.phaseIndex ? ph.steps.length : Math.min(rs.stepIndex + 1, ph.steps.length);

    for (let si = 0; si < maxStep; si++) {
      const s = ph.steps[si];
      if (s.winner) {
        logEntries.push({ text: `${D.getPlayer(s.winner).name} wins ${D.formatChips(s.amount)}`, isCurrent: pi === rs.phaseIndex && si === rs.stepIndex, isWin: true });
      } else if (s.action === 'show') {
        logEntries.push({ text: `${D.getPlayer(s.player).name} shows ${s.cards.map(D.formatCard).join(' ')} (${s.handRank})`, isCurrent: pi === rs.phaseIndex && si === rs.stepIndex });
      } else {
        const p = D.getPlayer(s.player);
        const name = p ? p.name.split(' ').pop() : s.player;
        const amt = s.amount > 0 ? ` ${D.formatChips(s.amount)}` : '';
        logEntries.push({
          player: name,
          action: s.action,
          amount: amt,
          isCurrent: pi === rs.phaseIndex && si === rs.stepIndex,
        });
      }
    }
  }

  const logHtml = logEntries.map(e => {
    if (e.text) {
      return `<div class="replay-log-entry ${e.isCurrent ? 'current' : ''}" ${e.isWin ? 'style="color:var(--green);"' : ''}>
        <span class="log-action">${e.text}</span>
      </div>`;
    }
    return `<div class="replay-log-entry ${e.isCurrent ? 'current' : ''}">
      <span class="log-player">${e.player}</span>
      <span class="log-action">${e.action}</span>
      <span class="log-amount">${e.amount}</span>
    </div>`;
  }).join('');

  const isAtEnd = rs.phaseIndex >= replay.phases.length - 1 && rs.stepIndex >= (phase.steps.length - 1);
  const isAtStart = rs.phaseIndex === 0 && rs.stepIndex <= -1;

  mainContent.innerHTML = `
    <div class="replay-view">
      <div class="detail-header">
        <button class="detail-back-btn" data-action="back">&#8592; Back</button>
        <div class="detail-title">Hand #${hand.handNumber}</div>
      </div>

      <div class="poker-table-container">
        <div class="poker-table">
          ${seatsHtml}
          <div class="table-community-cards">${tableCardsHtml}</div>
          <div class="table-pot">
            <div class="table-pot-label">POT</div>
            ${D.formatChips(currentPot)}
          </div>
        </div>
      </div>

      <div class="replay-controls">
        <div class="replay-phase">${phase.name}</div>
        <div class="replay-buttons">
          <button class="replay-btn" data-action="replay-reset" ${isAtStart ? 'style="opacity:0.3;"' : ''}>&#9198;</button>
          <button class="replay-btn" data-action="replay-prev" ${isAtStart ? 'style="opacity:0.3;"' : ''}>&#9664;</button>
          <button class="replay-btn play" data-action="replay-play">${rs.playing ? '&#9646;&#9646;' : '&#9654;'}</button>
          <button class="replay-btn" data-action="replay-next" ${isAtEnd ? 'style="opacity:0.3;"' : ''}>&#9654;</button>
          <button class="replay-btn" data-action="replay-end" ${isAtEnd ? 'style="opacity:0.3;"' : ''}>&#9197;</button>
        </div>
      </div>

      <div class="replay-log" id="replay-log">${logHtml}</div>
    </div>`;

  // Scroll log to bottom
  const logEl = document.getElementById('replay-log');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

function getTablePositions(count) {
  // Positions around an oval table (percentages)
  const layouts = {
    2: [
      { x: 25, y: 85 },
      { x: 75, y: 85 },
    ],
    3: [
      { x: 50, y: 90 },
      { x: 15, y: 30 },
      { x: 85, y: 30 },
    ],
    4: [
      { x: 25, y: 90 },
      { x: 75, y: 90 },
      { x: 85, y: 20 },
      { x: 15, y: 20 },
    ],
    5: [
      { x: 50, y: 92 },
      { x: 10, y: 65 },
      { x: 20, y: 15 },
      { x: 80, y: 15 },
      { x: 90, y: 65 },
    ],
    6: [
      { x: 35, y: 92 },
      { x: 65, y: 92 },
      { x: 92, y: 50 },
      { x: 65, y: 8 },
      { x: 35, y: 8 },
      { x: 8, y: 50 },
    ],
    7: [
      { x: 50, y: 92 },
      { x: 15, y: 75 },
      { x: 5, y: 35 },
      { x: 25, y: 5 },
      { x: 75, y: 5 },
      { x: 95, y: 35 },
      { x: 85, y: 75 },
    ],
    8: [
      { x: 35, y: 92 },
      { x: 65, y: 92 },
      { x: 92, y: 65 },
      { x: 92, y: 30 },
      { x: 65, y: 5 },
      { x: 35, y: 5 },
      { x: 8, y: 30 },
      { x: 8, y: 65 },
    ],
    9: [
      { x: 50, y: 92 },
      { x: 20, y: 85 },
      { x: 5, y: 55 },
      { x: 10, y: 20 },
      { x: 35, y: 5 },
      { x: 65, y: 5 },
      { x: 90, y: 20 },
      { x: 95, y: 55 },
      { x: 80, y: 85 },
    ],
  };
  return layouts[count] || layouts[Math.min(count, 9)];
}

function replayNext() {
  if (!state.replayState) return;
  const rs = state.replayState;
  const replay = D.HAND_REPLAYS[rs.handId];
  if (!replay) return;

  const phase = replay.phases[rs.phaseIndex];

  if (rs.stepIndex < phase.steps.length - 1) {
    rs.stepIndex++;
  } else if (rs.phaseIndex < replay.phases.length - 1) {
    rs.phaseIndex++;
    rs.stepIndex = phase.steps.length > 0 ? 0 : -1;
    // Ensure we start at step 0 for next phase if it has steps
    const nextPhase = replay.phases[rs.phaseIndex];
    rs.stepIndex = nextPhase.steps.length > 0 ? 0 : -1;
  } else {
    // End of replay, stop playing
    rs.playing = false;
  }

  renderReplay();
}

function replayPrev() {
  if (!state.replayState) return;
  const rs = state.replayState;
  const replay = D.HAND_REPLAYS[rs.handId];
  if (!replay) return;

  if (rs.stepIndex > 0) {
    rs.stepIndex--;
  } else if (rs.stepIndex === 0) {
    rs.stepIndex = -1;
  } else if (rs.phaseIndex > 0) {
    rs.phaseIndex--;
    const prevPhase = replay.phases[rs.phaseIndex];
    rs.stepIndex = prevPhase.steps.length - 1;
  }

  renderReplay();
}

function replayReset() {
  if (!state.replayState) return;
  state.replayState.phaseIndex = 0;
  state.replayState.stepIndex = -1;
  state.replayState.playing = false;
  renderReplay();
}

function replayEnd() {
  if (!state.replayState) return;
  const replay = D.HAND_REPLAYS[state.replayState.handId];
  if (!replay) return;

  state.replayState.phaseIndex = replay.phases.length - 1;
  const lastPhase = replay.phases[state.replayState.phaseIndex];
  state.replayState.stepIndex = lastPhase.steps.length - 1;
  state.replayState.playing = false;
  renderReplay();
}

let replayInterval = null;

function replayTogglePlay() {
  if (!state.replayState) return;
  state.replayState.playing = !state.replayState.playing;

  if (state.replayState.playing) {
    // Check if at end, if so restart
    const replay = D.HAND_REPLAYS[state.replayState.handId];
    const lastPhase = replay.phases[replay.phases.length - 1];
    if (state.replayState.phaseIndex >= replay.phases.length - 1 && state.replayState.stepIndex >= lastPhase.steps.length - 1) {
      state.replayState.phaseIndex = 0;
      state.replayState.stepIndex = -1;
    }

    replayInterval = setInterval(() => {
      const rs = state.replayState;
      const rp = D.HAND_REPLAYS[rs.handId];
      const phase = rp.phases[rs.phaseIndex];
      const isEnd = rs.phaseIndex >= rp.phases.length - 1 && rs.stepIndex >= phase.steps.length - 1;

      if (isEnd) {
        rs.playing = false;
        clearInterval(replayInterval);
        replayInterval = null;
        renderReplay();
      } else {
        replayNext();
      }
    }, 1200);
  } else {
    clearInterval(replayInterval);
    replayInterval = null;
  }

  renderReplay();
}

// =====================
// Deck View
// =====================
function renderDeck() {
  const sections = [
    { key: 'tournaments', label: 'Tournaments', icon: '&#127942;', getItem: id => D.getTournament(id) },
    { key: 'players', label: 'Players', icon: '&#128100;', getItem: id => D.getPlayer(id) },
    { key: 'hands', label: 'Hands', icon: '&#127183;', getItem: id => D.getHand(id) },
    { key: 'highlights', label: 'Highlights', icon: '&#11088;', getItem: id => D.getHand(id) },
  ];

  const totalFavs = Object.values(state.favorites).reduce((sum, arr) => sum + arr.length, 0);

  if (totalFavs === 0) {
    mainContent.innerHTML = `
      <div class="deck-view">
        <div class="deck-header">Your Deck</div>
        <div class="deck-subtitle">Cards you've favorited</div>
        <div class="deck-empty">
          <div class="empty-icon">&#128451;</div>
          <div class="empty-title">No favorites yet</div>
          <div>Swipe right on cards you like to add them to your deck</div>
        </div>
      </div>`;
    return;
  }

  let sectionsHtml = '';
  sections.forEach(section => {
    const favIds = state.favorites[section.key];
    if (favIds.length === 0) return;

    const itemsHtml = favIds.map(id => {
      const item = section.getItem(id);
      if (!item) return '';

      let title = '', sub = '', iconBg = '', detailType = '';

      switch (section.key) {
        case 'tournaments':
          title = item.name;
          sub = `${item.event} &bull; ${item.handCount} hands`;
          iconBg = item.imageGradient;
          detailType = 'tournament';
          break;
        case 'players':
          title = `${item.name} ${item.countryFlag}`;
          sub = `#${item.finishPosition} finish &bull; ${item.handsPlayed} hands`;
          iconBg = item.color;
          detailType = 'player';
          break;
        case 'hands':
        case 'highlights':
          title = `Hand #${item.handNumber} &mdash; ${D.formatChips(item.potTotal)}`;
          sub = item.preview;
          iconBg = getHighlightColor(item.highlightType) || 'var(--bg-card)';
          detailType = 'hand';
          break;
      }

      return `<div class="deck-item" data-action="open-detail" data-type="${detailType}" data-id="${id}">
        <div class="deck-item-icon" style="background:${iconBg};">
          ${section.key === 'players' ? item.initials : section.icon}
        </div>
        <div class="deck-item-info">
          <div class="deck-item-title">${title}</div>
          <div class="deck-item-sub">${sub}</div>
        </div>
        <button class="deck-item-remove" data-action="remove-fav" data-category="${section.key}" data-id="${id}" title="Remove">&#10005;</button>
      </div>`;
    }).join('');

    sectionsHtml += `
      <div class="deck-section">
        <div class="deck-section-header">
          <div class="deck-section-title">${section.icon} ${section.label}</div>
          <div class="deck-section-count">${favIds.length}</div>
        </div>
        ${itemsHtml}
      </div>`;
  });

  mainContent.innerHTML = `
    <div class="deck-view">
      <div class="deck-header">Your Deck</div>
      <div class="deck-subtitle">${totalFavs} card${totalFavs !== 1 ? 's' : ''} collected</div>
      ${sectionsHtml}
    </div>`;
}

// =====================
// Profile View
// =====================
function renderProfile() {
  const u = D.USER_PROFILE;
  const totalFavs = Object.values(state.favorites).reduce((sum, arr) => sum + arr.length, 0);
  const totalSwiped = state.currentIndex + totalFavs; // approximate
  const pool = getPool(state.currentCategory);
  const xpPct = (u.xp % 500) / 500 * 100;

  mainContent.innerHTML = `
    <div class="profile-view">
      <div class="profile-card">
        <div class="profile-avatar">${u.initials}</div>
        <div class="profile-name">${u.name}</div>
        <div class="profile-tier">${u.tierIcon} ${u.tier} Tier</div>
        <div class="profile-level">Level ${u.level} &bull; ${u.xp} XP</div>
        <div class="profile-xp-bar"><div class="profile-xp-fill" style="width:${xpPct}%"></div></div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <div class="stat-number">${totalSwiped}</div>
          <div class="stat-label">Swiped</div>
        </div>
        <div class="profile-stat">
          <div class="stat-number">${totalFavs}</div>
          <div class="stat-label">Favorites</div>
        </div>
        <div class="profile-stat">
          <div class="stat-number">${u.streak}</div>
          <div class="stat-label">Streak</div>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">Settings</div>
        <div class="profile-menu-item">
          <span class="menu-icon">&#128276;</span>
          <span class="menu-label">Notifications</span>
          <span class="menu-arrow">&#8250;</span>
        </div>
        <div class="profile-menu-item">
          <span class="menu-icon">&#127912;</span>
          <span class="menu-label">Appearance</span>
          <span class="menu-arrow">&#8250;</span>
        </div>
        <div class="profile-menu-item">
          <span class="menu-icon">&#128274;</span>
          <span class="menu-label">Privacy</span>
          <span class="menu-arrow">&#8250;</span>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">Support</div>
        <div class="profile-menu-item">
          <span class="menu-icon">&#10067;</span>
          <span class="menu-label">Help Center</span>
          <span class="menu-arrow">&#8250;</span>
        </div>
        <div class="profile-menu-item">
          <span class="menu-icon">&#128172;</span>
          <span class="menu-label">Send Feedback</span>
          <span class="menu-arrow">&#8250;</span>
        </div>
      </div>

      <div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:12px;">
        HUDR &bull; The Stack v1.0<br>
        Prototype G
      </div>
    </div>`;
}

// =====================
// Event Delegation
// =====================
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    case 'nav':
      state.route = id;
      if (id === 'discover') {
        // Don't reset index, keep position
      }
      state.isFlipped = false;
      // Clean up replay
      if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
      }
      if (state.replayState) state.replayState.playing = false;
      state.replayState = null;
      render();
      break;

    case 'category':
      state.currentCategory = id;
      state.currentIndex = 0;
      state.isFlipped = false;
      render();
      break;

    case 'swipe-left':
      swipeLeft();
      break;

    case 'swipe-right':
      swipeRight();
      break;

    case 'swipe-up':
      swipeUp();
      break;

    case 'reset-stack':
      state.currentIndex = 0;
      state.isFlipped = false;
      render();
      break;

    case 'back':
      if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
      }
      if (state.replayState) {
        state.replayState.playing = false;
        state.replayState = null;
      }
      // Go back to previous view
      if (state.route === 'replay') {
        // Check if we came from a detail view
        const handId = state.routeParams.handId;
        navigate('detail', { type: 'hand', id: handId });
      } else {
        navigate('discover');
      }
      break;

    case 'open-detail':
      const type = btn.dataset.type;
      const detailId = btn.dataset.id;
      openDetail(type, detailId);
      break;

    case 'replay':
      if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
      }
      state.replayState = null;
      navigate('replay', { handId: id });
      break;

    case 'replay-next':
      replayNext();
      break;

    case 'replay-prev':
      replayPrev();
      break;

    case 'replay-play':
      replayTogglePlay();
      break;

    case 'replay-reset':
      replayReset();
      break;

    case 'replay-end':
      replayEnd();
      break;

    case 'remove-fav':
      const category = btn.dataset.category;
      const favId = btn.dataset.id;
      state.favorites[category] = state.favorites[category].filter(f => f !== favId);
      render();
      break;
  }
});

// =====================
// Init
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});

// If DOM already loaded
if (document.readyState !== 'loading') {
  initRouter();
}
