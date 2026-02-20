/**
 * HUDR AI — The Conversation
 * AI-first chat-based poker tournament analysis prototype
 */

(function () {
  'use strict';

  const D = window.HUDR_DATA;

  // =====================
  // State
  // =====================

  const state = {
    currentScreen: 'chat',
    messages: [],
    isTyping: false,
    sidebarOpen: false,
    favorites: {
      tournaments: new Set(D.USER_PROFILE.favorites.tournaments),
      players: new Set(D.USER_PROFILE.favorites.players),
      hands: new Set(D.USER_PROFILE.favorites.hands),
    },
    quizState: {},
    currentQuizIndex: 0,
    scrollPositions: {},
    history: [],
  };

  // =====================
  // Helpers
  // =====================

  function $(sel, parent) {
    return (parent || document).querySelector(sel);
  }

  function $$(sel, parent) {
    return Array.from((parent || document).querySelectorAll(sel));
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function renderCardHTML(card) {
    const rank = D.getCardRank(card);
    const suit = D.getCardSuit(card);
    const colorCls = D.isRedSuit(card) ? 'red' : 'black';
    return `<span class="card-rank">${rank}</span><span class="card-suit">${suit}</span>`;
  }

  function highlightColor(type) {
    const colors = {
      bluff: 'var(--accent-purple)',
      hero_call: 'var(--accent-green)',
      biggest_pot: 'var(--accent-yellow)',
      cooler: 'var(--accent-blue)',
      bad_beat: 'var(--accent-red)',
      elimination: 'var(--text-muted)',
    };
    return colors[type] || 'var(--text-muted)';
  }

  function highlightIcon(type) {
    const icons = { bluff: '🎭', hero_call: '🦸', biggest_pot: '💰', cooler: '❄️', bad_beat: '😩', elimination: '💀' };
    return icons[type] || '🃏';
  }

  // =====================
  // Render App Shell
  // =====================

  function renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Sidebar overlay + drawer
    app.appendChild(renderSidebar());

    // Screens
    app.appendChild(renderChatScreen());
    app.appendChild(renderDetailScreen('tournament'));
    app.appendChild(renderDetailScreen('hand'));
    app.appendChild(renderDetailScreen('player'));

    showScreen('chat');
    renderWelcome();
  }

  // =====================
  // Sidebar
  // =====================

  function renderSidebar() {
    const wrap = el('div');

    const overlay = el('div', 'sidebar-overlay');
    overlay.id = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);

    const sb = el('div', 'sidebar');
    sb.id = 'sidebar';

    // Header
    const header = el('div', 'sidebar-header');
    header.innerHTML = `
      <div class="sidebar-avatar">${D.USER_PROFILE.initials}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${D.USER_PROFILE.name}</div>
        <div class="sidebar-user-tier">${D.USER_PROFILE.tierIcon} ${D.USER_PROFILE.tier} &middot; Level ${D.USER_PROFILE.level}</div>
      </div>
    `;
    sb.appendChild(header);

    // New Chat
    const newChatBtn = el('button', 'sidebar-new-chat', '&#10010; New Chat');
    newChatBtn.addEventListener('click', () => {
      closeSidebar();
      newChat();
    });
    sb.appendChild(newChatBtn);

    // Conversations
    const convSection = el('div', 'sidebar-section');
    convSection.innerHTML = `<div class="sidebar-section-title">Conversations</div>`;
    const convos = [
      { icon: '💬', text: 'WSOP Analysis', date: 'Feb 20' },
      { icon: '💬', text: 'Player Comparison', date: 'Feb 19' },
      { icon: '💬', text: 'Bluff Breakdown', date: 'Feb 18' },
    ];
    convos.forEach(c => {
      const item = el('div', 'sidebar-item');
      item.innerHTML = `
        <span class="sidebar-item-icon">${c.icon}</span>
        <span class="sidebar-item-text">${c.text}</span>
        <span class="sidebar-item-date">${c.date}</span>
      `;
      item.addEventListener('click', () => {
        closeSidebar();
      });
      convSection.appendChild(item);
    });
    sb.appendChild(convSection);

    // Favorites
    const favSection = el('div', 'sidebar-section');
    favSection.innerHTML = `<div class="sidebar-section-title">Favorites</div>`;
    const favItems = [
      { icon: '🏆', text: 'WSOP Main Event 2025', action: () => navigateTo('tournament', 'wsop-me-2025') },
      { icon: '👤', text: 'Daniel Negreanu', action: () => navigateTo('player', 'p1') },
      { icon: '👤', text: 'Phil Ivey', action: () => navigateTo('player', 'p3') },
      { icon: '🃏', text: 'Hand #60 — Ivey Bluff', action: () => navigateTo('hand', 'h5') },
    ];
    favItems.forEach(f => {
      const item = el('div', 'sidebar-item');
      item.innerHTML = `
        <span class="sidebar-item-icon">${f.icon}</span>
        <span class="sidebar-item-text">${f.text}</span>
      `;
      item.addEventListener('click', () => {
        closeSidebar();
        if (f.action) f.action();
      });
      favSection.appendChild(item);
    });
    sb.appendChild(favSection);

    wrap.appendChild(overlay);
    wrap.appendChild(sb);
    return wrap;
  }

  function openSidebar() {
    state.sidebarOpen = true;
    $('#sidebar-overlay').classList.add('open');
    $('#sidebar').classList.add('open');
  }

  function closeSidebar() {
    state.sidebarOpen = false;
    $('#sidebar-overlay').classList.remove('open');
    $('#sidebar').classList.remove('open');
  }

  // =====================
  // Chat Screen
  // =====================

  function renderChatScreen() {
    const screen = el('div', 'screen chat-screen');
    screen.id = 'screen-chat';

    // Header
    const header = el('div', 'header');
    header.innerHTML = `
      <div class="header-left">
        <button class="icon-btn" id="btn-menu">&#9776;</button>
      </div>
      <div class="header-center">
        <div class="header-title"><span class="sparkle">&#10024;</span> HUDR AI</div>
      </div>
      <div class="header-right">
        <button class="icon-btn new-chat-btn" id="btn-new-chat" title="New Chat">&#10010;</button>
      </div>
    `;
    screen.appendChild(header);

    // Chat messages area
    const msgs = el('div', 'chat-messages');
    msgs.id = 'chat-messages';
    screen.appendChild(msgs);

    // Input bar
    const inputBar = el('div', 'chat-input-bar');
    inputBar.id = 'chat-input-bar';
    inputBar.innerHTML = `
      <input type="text" class="chat-input" id="chat-input" placeholder="Ask about any tournament..." autocomplete="off" />
      <button class="mic-btn" title="Voice (coming soon)">🎙️</button>
      <button class="send-btn" id="btn-send" title="Send">&#10148;</button>
    `;
    screen.appendChild(inputBar);

    return screen;
  }

  function renderWelcome() {
    const msgs = $('#chat-messages');
    msgs.innerHTML = '';

    // Welcome block
    const welcome = el('div', 'welcome-container');
    welcome.innerHTML = `
      <span class="welcome-icon">&#10024;</span>
      <h1 class="welcome-title">Welcome to HUDR Intelligence</h1>
      <p class="welcome-subtitle">I can help you explore poker tournaments, analyze players, replay hands, and test your poker knowledge.<br><br>What would you like to explore?</p>
    `;
    msgs.appendChild(welcome);

    // Quick chips
    const chips = el('div', 'quick-chips');
    const chipLabels = [
      'WSOP Main Event 2025',
      'Show me the biggest bluff',
      'Compare Negreanu vs Ivey',
      'Quiz me on poker',
      'Who played the best?',
    ];
    chipLabels.forEach(label => {
      const c = el('button', 'chip', label);
      c.addEventListener('click', () => handleUserInput(label));
      chips.appendChild(c);
    });
    msgs.appendChild(chips);
  }

  // =====================
  // Detail Screens
  // =====================

  function renderDetailScreen(type) {
    const screen = el('div', 'screen detail-screen');
    screen.id = `screen-${type}`;

    const header = el('div', 'header');
    header.innerHTML = `
      <div class="header-left">
        <button class="icon-btn back-btn" data-back="${type}">&#8592;</button>
      </div>
      <div class="header-center">
        <div class="header-title" id="header-title-${type}"></div>
        <div class="header-sub" id="header-sub-${type}"></div>
      </div>
      <div class="header-right"></div>
    `;
    screen.appendChild(header);

    const content = el('div', 'detail-content');
    content.id = `detail-content-${type}`;
    screen.appendChild(content);

    return screen;
  }

  // =====================
  // Screen Navigation
  // =====================

  function showScreen(name) {
    state.currentScreen = name;
    $$('.screen').forEach(s => s.classList.remove('active'));
    const target = $(`#screen-${name}`);
    if (target) target.classList.add('active');
    window.location.hash = name === 'chat' ? 'chat' : name;
  }

  function navigateTo(type, id) {
    // Save scroll position
    if (state.currentScreen === 'chat') {
      state.scrollPositions.chat = $('#chat-messages')?.scrollTop || 0;
    }
    state.history.push({ screen: state.currentScreen });

    if (type === 'tournament') renderTournamentDetail(id);
    else if (type === 'hand') renderHandDetail(id);
    else if (type === 'player') renderPlayerDetail(id);

    showScreen(type);
    window.location.hash = `${type}/${id}`;
  }

  function goBack() {
    const prev = state.history.pop();
    if (prev) {
      showScreen(prev.screen);
      // Restore scroll
      if (prev.screen === 'chat' && state.scrollPositions.chat !== undefined) {
        requestAnimationFrame(() => {
          const msgs = $('#chat-messages');
          if (msgs) msgs.scrollTop = state.scrollPositions.chat;
        });
      }
    } else {
      showScreen('chat');
    }
  }

  // =====================
  // Tournament Detail
  // =====================

  function renderTournamentDetail(id) {
    const t = D.getTournament(id);
    if (!t) return;

    $('#header-title-tournament').textContent = t.name;
    $('#header-sub-tournament').textContent = t.subtitle;

    const content = $('#detail-content-tournament');
    content.innerHTML = '';

    // Hero
    const hero = el('div', 'tournament-hero');
    hero.style.background = t.imageGradient;
    hero.innerHTML = `
      <div class="tournament-hero-content">
        <div class="tournament-hero-title">${t.name}</div>
        <div class="tournament-hero-sub">${t.subtitle} &middot; ${formatDate(t.date)}</div>
      </div>
    `;
    content.appendChild(hero);

    // Info grid
    const infoSection = el('div', 'detail-section');
    infoSection.innerHTML = `
      <div class="detail-section-title">Tournament Info</div>
      <div class="detail-info-grid">
        <div class="detail-info-item">
          <div class="detail-info-label">Prize Pool</div>
          <div class="detail-info-value">${t.prizePool ? D.formatChips(t.prizePool) : 'TBD'}</div>
        </div>
        <div class="detail-info-item">
          <div class="detail-info-label">Buy-in</div>
          <div class="detail-info-value">$${D.formatNumber(t.buyIn)}</div>
        </div>
        <div class="detail-info-item">
          <div class="detail-info-label">Entrants</div>
          <div class="detail-info-value">${D.formatNumber(t.totalEntrants)}</div>
        </div>
        <div class="detail-info-item">
          <div class="detail-info-label">Hands</div>
          <div class="detail-info-value">${t.handCount}</div>
        </div>
      </div>
    `;
    content.appendChild(infoSection);

    // Players
    const playersSection = el('div', 'detail-section');
    playersSection.innerHTML = `<div class="detail-section-title">Final Table Players</div>`;
    const playerList = el('div', 'detail-player-list');
    const sorted = [...D.PLAYERS].sort((a, b) => a.finishPosition - b.finishPosition);
    sorted.forEach(p => {
      const posCls = p.finishPosition === 1 ? 'gold' : p.finishPosition === 2 ? 'silver' : p.finishPosition === 3 ? 'bronze' : 'other';
      const row = el('div', 'detail-player-row');
      row.innerHTML = `
        <div class="detail-player-pos ${posCls}">${p.finishPosition}</div>
        <div class="detail-player-info">
          <div class="detail-player-name">${p.countryFlag} ${p.name}</div>
          <div class="detail-player-stack">Start: ${D.formatChips(p.startingStack)}</div>
        </div>
      `;
      row.addEventListener('click', () => navigateTo('player', p.id));
      playerList.appendChild(row);
    });
    playersSection.appendChild(playerList);
    content.appendChild(playersSection);

    // Key Hands
    const handsSection = el('div', 'detail-section');
    handsSection.innerHTML = `<div class="detail-section-title">Key Hands</div>`;
    const handList = el('div', 'detail-hand-list');
    const keyHands = D.getHandsForTournament(id).filter(h => h.highlightType).slice(0, 8);
    keyHands.forEach(h => {
      const item = el('div', 'detail-hand-item');
      item.innerHTML = `
        <div class="detail-hand-top">
          <span class="detail-hand-num">#${h.handNumber}</span>
          <span class="detail-hand-pot">${D.formatChips(h.potTotal)}</span>
        </div>
        <div class="detail-hand-preview">${h.preview}</div>
        ${h.highlightLabel ? `<span class="detail-hand-tag label-${h.highlightType}">${highlightIcon(h.highlightType)} ${h.highlightLabel}</span>` : ''}
      `;
      item.addEventListener('click', () => navigateTo('hand', h.id));
      handList.appendChild(item);
    });
    handsSection.appendChild(handList);
    content.appendChild(handsSection);

    // Ask AI FAB
    const fab = el('button', 'ask-ai-fab', '&#10024; Ask AI');
    fab.addEventListener('click', () => {
      goBack();
      setTimeout(() => {
        const input = $('#chat-input');
        if (input) {
          input.value = `Tell me about ${t.name}`;
          input.focus();
        }
      }, 100);
    });
    content.appendChild(fab);
  }

  // =====================
  // Hand Detail / Replay
  // =====================

  function renderHandDetail(id) {
    const h = D.getHand(id);
    if (!h) return;

    $('#header-title-hand').textContent = `Hand #${h.handNumber}`;
    $('#header-sub-hand').textContent = h.blinds + ' blinds';

    const content = $('#detail-content-hand');
    content.innerHTML = '';

    // Table
    const table = el('div', 'replay-table');
    const boardCards = h.communityCards.map(c => {
      const colorCls = D.isRedSuit(c) ? 'red' : 'black';
      return `<div class="board-card ${colorCls}">${renderCardHTML(c)}</div>`;
    }).join('');
    table.innerHTML = `
      <div class="replay-pot">
        <div class="replay-pot-label">Pot</div>
        <div class="replay-pot-value">${D.formatChips(h.potTotal)}</div>
        <div class="replay-board">${boardCards}</div>
      </div>
    `;
    content.appendChild(table);

    // Highlight label
    if (h.highlightLabel) {
      const tag = el('div', '', `<span class="detail-hand-tag label-${h.highlightType}" style="font-size:12px;padding:4px 10px;">${highlightIcon(h.highlightType)} ${h.highlightLabel}</span>`);
      tag.style.textAlign = 'center';
      tag.style.marginBottom = '12px';
      content.appendChild(tag);
    }

    // Preview
    const preview = el('div', 'replay-info');
    preview.innerHTML = `<div style="font-size:14px;line-height:1.6;color:var(--text-secondary)">${h.preview}</div>`;
    content.appendChild(preview);

    // Players involved
    const playersInfo = el('div', 'replay-info');
    playersInfo.innerHTML = `<div class="detail-section-title" style="margin-bottom:8px">Players</div>`;
    h.playersInvolved.forEach(pid => {
      const p = D.getPlayer(pid);
      if (!p) return;
      const cards = h.holeCards[pid] || [];
      const cardsHtml = cards.map(c => {
        const colorCls = D.isRedSuit(c) ? 'red' : 'black';
        return `<div class="mini-card ${colorCls}">${renderCardHTML(c)}</div>`;
      }).join('');
      const isWinner = h.winnerId === pid;
      const row = el('div', 'embed-player-line');
      row.innerHTML = `
        <span class="player-name" style="${isWinner ? 'color:var(--accent-green)' : ''}">${isWinner ? '🏆 ' : ''}${p.name}</span>
        <span class="player-cards">${cardsHtml}</span>
      `;
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => navigateTo('player', pid));
      playersInfo.appendChild(row);
    });
    content.appendChild(playersInfo);

    // Actions
    const actionsInfo = el('div', 'replay-info');
    actionsInfo.innerHTML = `<div class="detail-section-title" style="margin-bottom:8px">Action</div>`;
    const actionList = el('div', 'replay-action-list');
    let currentStreet = '';
    h.actions.forEach(a => {
      if (a.street !== currentStreet) {
        currentStreet = a.street;
        const streetLabel = el('div', '', `<span style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px;font-weight:600">${currentStreet}</span>`);
        streetLabel.style.margin = '6px 0 2px';
        actionList.appendChild(streetLabel);
      }
      const p = D.getPlayer(a.player);
      const actionEl = el('div', 'replay-action');
      actionEl.innerHTML = `
        <span class="action-player">${p ? p.name.split(' ').pop() : ''}</span>
        <span class="action-type ${a.action}">${a.action}</span>
        ${a.amount > 0 ? `<span class="action-amount">${D.formatChips(a.amount)}</span>` : ''}
      `;
      actionList.appendChild(actionEl);
    });
    actionsInfo.appendChild(actionList);
    content.appendChild(actionsInfo);

    // Commentary if available
    const commentary = D.AI_CONTENT.commentary.find(c => c.handId === id);
    if (commentary) {
      const commBox = el('div', 'replay-info');
      commBox.innerHTML = `
        <div class="detail-section-title" style="margin-bottom:8px">&#128172; AI Commentary</div>
        <div style="font-size:13px;line-height:1.6;color:var(--text-secondary);font-style:italic">"${commentary.text}"</div>
      `;
      content.appendChild(commBox);
    }
  }

  // =====================
  // Player Detail
  // =====================

  function renderPlayerDetail(id) {
    const p = D.getPlayer(id);
    if (!p) return;
    const stats = D.PLAYER_STATS[id];

    $('#header-title-player').textContent = p.name;
    $('#header-sub-player').textContent = `${p.countryFlag} Seat ${p.seatNumber}`;

    const content = $('#detail-content-player');
    content.innerHTML = '';

    // Header
    const headerDiv = el('div', 'player-detail-header');
    headerDiv.innerHTML = `
      <div class="player-detail-avatar" style="background:${p.color}">${p.initials}</div>
      <div class="player-detail-name">${p.countryFlag} ${p.name}</div>
      <div class="player-detail-meta">Finish: #${p.finishPosition} &middot; ${p.handsPlayed} hands</div>
    `;
    content.appendChild(headerDiv);

    // Key stats
    if (stats) {
      const statSection = el('div', 'detail-section');
      statSection.innerHTML = `<div class="detail-section-title">HUD Stats</div>`;
      const grid = el('div', 'player-stat-grid');
      const displayStats = [
        { label: 'VPIP', value: stats.vpip + '%', key: 'vpip' },
        { label: 'PFR', value: stats.pfr + '%', key: 'pfr' },
        { label: '3-Bet', value: stats.threeBet + '%', key: 'threeBet' },
        { label: 'AF', value: stats.af.toFixed(1), key: 'af' },
        { label: 'C-Bet', value: stats.cbetFlop + '%', key: 'cbetFlop' },
        { label: 'WTSD', value: stats.wtsd + '%', key: 'wtsd' },
        { label: 'WSD', value: stats.wsd + '%', key: 'wsd' },
        { label: 'WWSF', value: stats.wwsf + '%', key: 'wwsf' },
        { label: 'Steal', value: stats.steal + '%', key: 'steal' },
      ];
      displayStats.forEach(s => {
        const rawVal = typeof stats[s.key] === 'number' ? stats[s.key] : parseFloat(s.value);
        const color = D.getStatColor(s.key, rawVal);
        const item = el('div', 'player-stat-item');
        item.innerHTML = `
          <div class="player-stat-value" style="color:${color}">${s.value}</div>
          <div class="player-stat-label">${s.label}</div>
        `;
        grid.appendChild(item);
      });
      statSection.appendChild(grid);
      content.appendChild(statSection);
    }

    // Scouting report
    const scouting = D.AI_CONTENT.playerScouting[id];
    if (scouting) {
      const scoutSection = el('div', 'detail-section');
      scoutSection.innerHTML = `
        <div class="detail-section-title">&#10024; AI Scouting Report</div>
        <div style="font-size:13px;line-height:1.7;color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px">${scouting}</div>
      `;
      content.appendChild(scoutSection);
    }

    // Key hands
    const playerHands = D.HANDS.filter(h => h.playersInvolved.includes(id) && h.highlightType).slice(0, 5);
    if (playerHands.length > 0) {
      const handSection = el('div', 'detail-section');
      handSection.innerHTML = `<div class="detail-section-title">Key Hands</div>`;
      const list = el('div', 'detail-hand-list');
      playerHands.forEach(h => {
        const item = el('div', 'detail-hand-item');
        item.innerHTML = `
          <div class="detail-hand-top">
            <span class="detail-hand-num">#${h.handNumber}</span>
            <span class="detail-hand-pot">${D.formatChips(h.potTotal)}</span>
          </div>
          <div class="detail-hand-preview">${h.preview}</div>
        `;
        item.addEventListener('click', () => navigateTo('hand', h.id));
        list.appendChild(item);
      });
      handSection.appendChild(list);
      content.appendChild(handSection);
    }
  }

  // =====================
  // Chat Logic
  // =====================

  function handleUserInput(text) {
    if (!text || !text.trim()) return;
    text = text.trim();

    // Add user message
    addMessage('user', text);

    // Clear input
    const input = $('#chat-input');
    if (input) input.value = '';

    // Show typing, then respond
    showTyping();

    setTimeout(() => {
      hideTyping();
      processQuery(text);
    }, 800 + Math.random() * 400);
  }

  function processQuery(text) {
    const lower = text.toLowerCase();

    // Match patterns
    if (lower.includes('wsop') || lower.includes('main event') || lower.includes('tournament')) {
      respondTournament();
    } else if (lower.includes('biggest bluff') || lower.includes('best bluff') || lower === 'show me the biggest bluff') {
      respondBiggestBluff();
    } else if (lower.includes('compare') && (lower.includes('negreanu') || lower.includes('ivey'))) {
      respondComparison();
    } else if (lower.includes('quiz')) {
      respondQuiz();
    } else if (lower.includes('who played the best') || lower.includes('who was the best')) {
      respondBestPlayer();
    } else if (lower.includes('eliminated first') || lower.includes('first out') || lower.includes('first elimination')) {
      respondFirstElimination();
    } else if (lower.includes('how many bluffs') || lower.includes('bluff report') || lower.includes('all bluffs')) {
      respondBluffReport();
    } else if (lower.includes('more bluffs') || lower.includes('other bluffs')) {
      respondBluffReport();
    } else if (lower.includes('show the replay') || lower.includes('watch replay') || lower.includes('replay')) {
      respondReplayLink();
    } else if (lower.includes('how did he get away') || lower.includes('how did ivey')) {
      respondIveyExplanation();
    } else if (lower.includes('hellmuth') && (lower.includes('aggress') || lower.includes('stats') || lower.includes('how aggressive'))) {
      respondPlayerStats('p2');
    } else if (lower.includes('negreanu') && (lower.includes('stats') || lower.includes('profile'))) {
      respondPlayerStats('p1');
    } else if (lower.includes('ivey') && (lower.includes('stats') || lower.includes('profile'))) {
      respondPlayerStats('p3');
    } else if (lower.includes('aggressive') || lower.includes('aggression')) {
      respondPlayerStats('p2');
    } else if (lower.includes('tell me about') || lower.includes('story') || lower.includes('what happened')) {
      respondStory();
    } else if (lower.includes('final hand') || lower.includes('winning hand') || lower.includes('how did negreanu win')) {
      respondFinalHand();
    } else if (lower.includes('cooler') || lower.includes('bad beat')) {
      respondCooler();
    } else if (lower.includes('hand #') || lower.match(/hand\s*(\d+)/)) {
      const match = lower.match(/hand\s*#?\s*(\d+)/);
      if (match) {
        const handNum = parseInt(match[1]);
        const hand = D.HANDS.find(h => h.handNumber === handNum);
        if (hand) {
          respondSpecificHand(hand);
        } else {
          respondGeneric();
        }
      } else {
        respondGeneric();
      }
    } else {
      respondGeneric();
    }
  }

  // =====================
  // Response Functions
  // =====================

  function respondTournament() {
    const t = D.getTournament('wsop-me-2025');
    addMessage('ai', 'Here\'s the WSOP Main Event 2025 Final Table:', [
      { type: 'tournament', data: t },
    ]);
    addMessage('ai', D.AI_CONTENT.story.split('\n\n').slice(0, 2).join('\n\n'));
    addFollowUpChips(['Who won?', 'Show key hands', 'Quiz me on this event']);
  }

  function respondBiggestBluff() {
    const h = D.getHand('h5');
    const resp = D.AI_CONTENT.chatResponses[1];
    addMessage('ai', resp.response, [
      { type: 'hand', data: h },
    ]);
    addFollowUpChips(['Show the replay', 'More bluffs', 'How did he get away with it?']);
  }

  function respondComparison() {
    const resp = D.AI_CONTENT.chatResponses[3];
    addMessage('ai', 'Here\'s a head-to-head comparison:', [
      { type: 'comparison', data: { player1: 'p1', player2: 'p3' } },
    ]);
    addMessage('ai', resp.response.split('\n\n').pop());
    addFollowUpChips(['Who had more bluffs?', 'Show their key hands', 'How aggressive is Hellmuth?']);
  }

  function respondQuiz() {
    const quiz = D.AI_CONTENT.quiz[state.currentQuizIndex % D.AI_CONTENT.quiz.length];
    addMessage('ai', 'Let\'s test your poker knowledge! 🧠', [
      { type: 'quiz', data: quiz },
    ]);
  }

  function respondBestPlayer() {
    const resp = D.AI_CONTENT.chatResponses[0];
    addMessage('ai', resp.response);
    addFollowUpChips(['Compare Negreanu vs Ivey', 'Show Negreanu\'s stats', 'Who was eliminated first?']);
  }

  function respondFirstElimination() {
    const h = D.getHand('h11');
    const resp = D.AI_CONTENT.chatResponses[4];
    addMessage('ai', resp.response, [
      { type: 'hand', data: h },
    ]);
    addFollowUpChips(['Show next elimination', 'Who played the best?', 'Quiz me']);
  }

  function respondBluffReport() {
    const resp = D.AI_CONTENT.chatResponses[2];
    addMessage('ai', resp.response, [
      { type: 'bluff-report', data: D.AI_CONTENT.bluffReport },
    ]);
    addFollowUpChips(['Show me the biggest bluff', 'How aggressive is Hellmuth?', 'Quiz me']);
  }

  function respondReplayLink() {
    const h = D.getHand('h5');
    addMessage('ai', 'Here\'s the full replay of Ivey\'s legendary bluff on Hand #60. Tap to watch the complete action unfold:', [
      { type: 'hand', data: h },
    ]);
    addFollowUpChips(['Compare Negreanu vs Ivey', 'Show more key hands', 'Quiz me']);
  }

  function respondIveyExplanation() {
    addMessage('ai', 'Ivey\'s bluff on Hand #60 was a masterclass in reading your opponent. Here\'s why it worked:\n\n1. **Board texture**: J-7-4-2 is a dry, disconnected board that favors the caller\'s range\n\n2. **Turn raise sizing**: Ivey raised to $5.2M over Holz\'s $1.8M bet -- a huge raise that represents extreme strength\n\n3. **Story telling**: Ivey\'s line (call flop, raise turn) is consistent with a slow-played set or two pair\n\n4. **Holz\'s perspective**: With just pocket aces on a board that could contain many two-pair combos, Holz\'s fold was actually reasonable\n\nThe genius was that Ivey actually HAD two pair (7-4), but turned it into a semi-bluff by over-representing his hand\'s strength.');
    addFollowUpChips(['More bluffs', 'Show Ivey\'s stats', 'How many bluffs were there?']);
  }

  function respondPlayerStats(playerId) {
    const p = D.getPlayer(playerId);
    const stats = D.PLAYER_STATS[playerId];
    if (!p || !stats) return respondGeneric();

    addMessage('ai', `Here\'s ${p.name}'s aggression and key stats:`, [
      { type: 'stat-rings', data: { playerId, stats } },
    ]);

    const scouting = D.AI_CONTENT.playerScouting[playerId];
    if (scouting) {
      addMessage('ai', scouting);
    }
    addFollowUpChips([`View ${p.name.split(' ').pop()}'s profile`, 'Compare with Negreanu', 'Quiz me']);
  }

  function respondStory() {
    const storyParts = D.AI_CONTENT.story.split('\n\n');
    addMessage('ai', storyParts.join('\n\n'));
    addFollowUpChips(['Show the final hand', 'Who played the best?', 'Quiz me']);
  }

  function respondFinalHand() {
    const h = D.getHand('h1');
    const commentary = D.AI_CONTENT.commentary.find(c => c.handId === 'h1');
    addMessage('ai', 'The final hand of the tournament -- Hand #87:', [
      { type: 'hand', data: h },
    ]);
    if (commentary) {
      addMessage('ai', `"${commentary.text}"`);
    }
    addFollowUpChips(['Who played the best?', 'Compare the finalists', 'Quiz me']);
  }

  function respondCooler() {
    const coolerHands = D.HANDS.filter(h => h.highlightType === 'cooler' || h.highlightType === 'bad_beat');
    if (coolerHands.length > 0) {
      const h = coolerHands[0];
      addMessage('ai', 'Here\'s one of the sickest coolers from the final table:', [
        { type: 'hand', data: h },
      ]);
    }
    addFollowUpChips(['Show more bad beats', 'Who played the best?', 'Show me the biggest bluff']);
  }

  function respondSpecificHand(hand) {
    const commentary = D.AI_CONTENT.commentary.find(c => c.handId === hand.id);
    addMessage('ai', `Here's Hand #${hand.handNumber}:`, [
      { type: 'hand', data: hand },
    ]);
    if (commentary) {
      addMessage('ai', `"${commentary.text}"`);
    }
    addFollowUpChips(['Show next key hand', 'Who played the best?', 'Quiz me']);
  }

  function respondGeneric() {
    addMessage('ai', 'I can tell you about the WSOP Main Event 2025 Final Table. Try asking about specific players, hands, or bluffs! Here are some things I can help with:');
    addFollowUpChips([
      'WSOP Main Event 2025',
      'Show me the biggest bluff',
      'Compare Negreanu vs Ivey',
      'Quiz me on poker',
      'Who played the best?',
    ]);
  }

  // =====================
  // Message Rendering
  // =====================

  function addMessage(role, content, embeds) {
    state.messages.push({ role, content, embeds: embeds || [], timestamp: Date.now() });
    renderMessage(role, content, embeds);
    scrollToBottom();
  }

  function renderMessage(role, content, embeds) {
    const msgs = $('#chat-messages');
    const msg = el('div', `message ${role}`);

    if (role === 'ai') {
      const avatar = el('div', 'ai-avatar', '&#10024;');
      msg.appendChild(avatar);
    }

    const bubbleWrap = el('div');
    bubbleWrap.style.maxWidth = '85%';

    const bubble = el('div', `bubble ${role}`);

    // Process content - support basic markdown bold
    const processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
    bubble.innerHTML = processedContent;
    bubbleWrap.appendChild(bubble);

    // Render embeds
    if (embeds && embeds.length > 0) {
      embeds.forEach(embed => {
        const card = renderEmbed(embed);
        if (card) bubbleWrap.appendChild(card);
      });
    }

    msg.appendChild(bubbleWrap);
    msgs.appendChild(msg);
  }

  function renderEmbed(embed) {
    switch (embed.type) {
      case 'tournament': return renderTournamentEmbed(embed.data);
      case 'hand': return renderHandEmbed(embed.data);
      case 'comparison': return renderComparisonEmbed(embed.data);
      case 'stat-rings': return renderStatRingsEmbed(embed.data);
      case 'quiz': return renderQuizEmbed(embed.data);
      case 'bluff-report': return renderBluffReportEmbed(embed.data);
      default: return null;
    }
  }

  function renderTournamentEmbed(t) {
    const card = el('div', 'embed-card embed-tournament');
    card.innerHTML = `
      <div class="embed-header">
        <span class="embed-trophy">🏆</span>
        <div>
          <div class="embed-name">${t.name}</div>
          <div class="embed-sub">${t.subtitle}</div>
        </div>
      </div>
      <div class="embed-meta">
        <div class="embed-meta-row"><span class="embed-meta-icon">📅</span> ${formatDate(t.date)}</div>
        <div class="embed-meta-row"><span class="embed-meta-icon">📍</span> ${t.venue}</div>
        <div class="embed-meta-row"><span class="embed-meta-icon">💰</span> Prize Pool: ${t.prizePool ? D.formatChips(t.prizePool) : 'TBD'}</div>
        <div class="embed-meta-row"><span class="embed-meta-icon">🃏</span> ${t.handCount} hands &middot; ${t.playerCount} players</div>
      </div>
      <div class="embed-link">View Tournament &#8594;</div>
    `;
    card.addEventListener('click', () => navigateTo('tournament', t.id));
    return card;
  }

  function renderHandEmbed(h) {
    const card = el('div', 'embed-card embed-hand');

    // Board cards
    const boardHtml = h.communityCards.map(c => {
      const colorCls = D.isRedSuit(c) ? 'red' : 'black';
      return `<div class="board-card ${colorCls}">${renderCardHTML(c)}</div>`;
    }).join('');

    // Players with hole cards
    const playersHtml = h.playersInvolved.map(pid => {
      const p = D.getPlayer(pid);
      if (!p) return '';
      const cards = h.holeCards[pid] || [];
      const cardsHtml = cards.map(c => {
        const colorCls = D.isRedSuit(c) ? 'red' : 'black';
        return `<div class="mini-card ${colorCls}">${renderCardHTML(c)}</div>`;
      }).join('');

      const isWinner = h.winnerId === pid;
      const lastAction = h.actions.filter(a => a.player === pid).pop();
      let result = '';
      if (isWinner) result = '🏆 Won';
      else if (lastAction && lastAction.action === 'fold') result = 'Folded';
      else result = 'Lost';

      return `
        <div class="embed-player-line">
          <span class="player-name" style="${isWinner ? 'color:var(--accent-green)' : ''}">${p.name.split(' ').pop()}</span>
          <span class="player-cards">${cardsHtml}</span>
          <span class="player-result">${result}</span>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="embed-hand-header">
        <div>
          <div class="embed-hand-title">Hand #${h.handNumber}</div>
          ${h.highlightLabel ? `<div class="embed-hand-label label-${h.highlightType}">${highlightIcon(h.highlightType)} ${h.highlightType ? h.highlightType.replace('_', ' ') : ''}</div>` : ''}
        </div>
        <div class="embed-hand-pot">${D.formatChips(h.potTotal)}</div>
      </div>
      <div class="embed-board">${boardHtml}</div>
      <div class="embed-players-row">${playersHtml}</div>
      <div class="embed-link">Watch Full Replay &#8594;</div>
    `;
    card.addEventListener('click', () => navigateTo('hand', h.id));
    return card;
  }

  function renderComparisonEmbed(data) {
    const p1 = D.getPlayer(data.player1);
    const p2 = D.getPlayer(data.player2);
    const s1 = D.PLAYER_STATS[data.player1];
    const s2 = D.PLAYER_STATS[data.player2];
    if (!p1 || !p2 || !s1 || !s2) return null;

    const card = el('div', 'embed-card embed-comparison');

    const statRows = [
      { label: 'VPIP', v1: s1.vpip + '%', v2: s2.vpip + '%', n1: s1.vpip, n2: s2.vpip, higher: 'neutral' },
      { label: 'PFR', v1: s1.pfr + '%', v2: s2.pfr + '%', n1: s1.pfr, n2: s2.pfr, higher: 'neutral' },
      { label: '3-BET', v1: s1.threeBet + '%', v2: s2.threeBet + '%', n1: s1.threeBet, n2: s2.threeBet, higher: 'neutral' },
      { label: 'AF', v1: s1.af.toFixed(1), v2: s2.af.toFixed(1), n1: s1.af, n2: s2.af, higher: 'higher' },
      { label: 'WTSD', v1: s1.wtsd + '%', v2: s2.wtsd + '%', n1: s1.wtsd, n2: s2.wtsd, higher: 'neutral' },
      { label: 'WSD', v1: s1.wsd + '%', v2: s2.wsd + '%', n1: s1.wsd, n2: s2.wsd, higher: 'higher' },
    ];

    const statsHtml = statRows.map(r => {
      const w1 = r.higher === 'higher' ? (r.n1 > r.n2 ? 'winner' : '') : '';
      const w2 = r.higher === 'higher' ? (r.n2 > r.n1 ? 'winner' : '') : '';
      return `
        <div class="comp-stat-row">
          <span class="comp-val left ${w1}">${r.v1}</span>
          <span class="comp-label">${r.label}</span>
          <span class="comp-val right ${w2}">${r.v2}</span>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="comp-header">
        <div class="comp-player">
          <div class="comp-initials" style="background:${p1.color}">${p1.initials}</div>
          <span class="comp-flag">${p1.countryFlag}</span>
          <span class="comp-name">${p1.name.split(' ').pop()}</span>
        </div>
        <span class="comp-vs">VS</span>
        <div class="comp-player">
          <div class="comp-initials" style="background:${p2.color}">${p2.initials}</div>
          <span class="comp-flag">${p2.countryFlag}</span>
          <span class="comp-name">${p2.name.split(' ').pop()}</span>
        </div>
      </div>
      <div class="comp-stats">${statsHtml}</div>
      <div class="comp-result">
        <span class="trophy-icon">🏆</span> <strong>${p1.name.split(' ').pop()}</strong> 1st
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        <strong>${p2.name.split(' ').pop()}</strong> 2nd
      </div>
    `;
    return card;
  }

  function renderStatRingsEmbed(data) {
    const { stats } = data;
    const card = el('div', 'embed-card');

    const ringStats = [
      { label: 'AF', value: stats.af, max: 5, display: stats.af.toFixed(1), key: 'af' },
      { label: 'AFq', value: stats.afq, max: 100, display: stats.afq + '%', key: 'afq' },
      { label: 'C-Bet', value: stats.cbetFlop, max: 100, display: stats.cbetFlop + '%', key: 'cbetFlop' },
      { label: 'WTSD', value: stats.wtsd, max: 100, display: stats.wtsd + '%', key: 'wtsd' },
    ];

    const ringsGrid = el('div', 'embed-stats');
    ringStats.forEach(s => {
      const pct = Math.min(s.value / s.max, 1);
      const circumference = 2 * Math.PI * 22;
      const dashOffset = circumference * (1 - pct);
      const color = D.getStatColor(s.key, s.value);

      const item = el('div', 'stat-ring-item');
      item.innerHTML = `
        <div class="stat-ring">
          <svg viewBox="0 0 48 48">
            <circle class="ring-bg" cx="24" cy="24" r="22" />
            <circle class="ring-fg" cx="24" cy="24" r="22"
              stroke="${color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}" />
          </svg>
          <div class="ring-value" style="color:${color}">${s.display}</div>
        </div>
        <div class="stat-ring-label">${s.label}</div>
      `;
      ringsGrid.appendChild(item);
    });

    card.appendChild(ringsGrid);
    return card;
  }

  function renderQuizEmbed(quiz) {
    const card = el('div', 'embed-card embed-quiz');
    card.innerHTML = `
      <div class="quiz-question">${quiz.question}</div>
      <div class="quiz-options" id="quiz-${quiz.id}"></div>
    `;

    const optionsContainer = card.querySelector('.quiz-options');
    quiz.options.forEach((opt, i) => {
      const btn = el('button', 'quiz-option');
      btn.innerHTML = `
        <span class="option-marker"></span>
        <span>${opt}</span>
      `;
      btn.addEventListener('click', () => handleQuizAnswer(quiz, i, optionsContainer));
      optionsContainer.appendChild(btn);
    });

    return card;
  }

  function handleQuizAnswer(quiz, selectedIndex, container) {
    if (state.quizState[quiz.id] !== undefined) return;
    state.quizState[quiz.id] = selectedIndex;

    const options = container.querySelectorAll('.quiz-option');
    options.forEach((opt, i) => {
      if (i === quiz.correctIndex) {
        opt.classList.add('correct');
        opt.querySelector('.option-marker').innerHTML = '&#10003;';
      } else if (i === selectedIndex && selectedIndex !== quiz.correctIndex) {
        opt.classList.add('wrong');
        opt.querySelector('.option-marker').innerHTML = '&#10007;';
      } else {
        opt.classList.add('disabled');
      }
    });

    // Show explanation
    const explanation = el('div', 'quiz-explanation');
    const isCorrect = selectedIndex === quiz.correctIndex;
    explanation.innerHTML = `
      <strong>${isCorrect ? '&#9989; Correct!' : '&#10060; Not quite.'}</strong> ${quiz.explanation}
    `;
    container.appendChild(explanation);

    // Next quiz after a beat
    state.currentQuizIndex++;
    if (state.currentQuizIndex < D.AI_CONTENT.quiz.length) {
      setTimeout(() => {
        addFollowUpChips(['Next question', 'Show me a bluff', 'Compare players']);
      }, 600);
    } else {
      setTimeout(() => {
        addMessage('ai', `You've completed all ${D.AI_CONTENT.quiz.length} questions! You're a true poker scholar.`);
        addFollowUpChips(['Start quiz over', 'Show me the biggest bluff', 'Who played the best?']);
      }, 800);
    }
    scrollToBottom();
  }

  function renderBluffReportEmbed(bluffs) {
    const card = el('div', 'embed-card embed-bluff-report');
    bluffs.forEach(b => {
      const item = el('div', 'bluff-item');
      item.innerHTML = `
        <span class="bluff-icon">🎭</span>
        <div class="bluff-info">
          <div class="bluff-players">${b.blufferName} bluffs ${b.victimName}</div>
          <div class="bluff-detail">Hand #${D.getHand(b.handId)?.handNumber || '?'} &middot; ${b.holding} vs ${b.victimHolding} &middot; ${b.street}</div>
        </div>
        <span class="bluff-pot">${D.formatChips(b.potSize)}</span>
      `;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => navigateTo('hand', b.handId));
      card.appendChild(item);
    });
    return card;
  }

  // =====================
  // Follow-up Chips
  // =====================

  function addFollowUpChips(labels) {
    const msgs = $('#chat-messages');
    const chips = el('div', 'quick-chips follow-up');
    labels.forEach(label => {
      const c = el('button', 'chip', label);
      c.addEventListener('click', () => {
        // Remove these chips when one is clicked
        chips.remove();
        handleUserInput(label);
      });
      chips.appendChild(c);
    });
    msgs.appendChild(chips);
    scrollToBottom();
  }

  // =====================
  // Typing Indicator
  // =====================

  function showTyping() {
    state.isTyping = true;
    const msgs = $('#chat-messages');
    const msg = el('div', 'message ai');
    msg.id = 'typing-message';

    const avatar = el('div', 'ai-avatar', '&#10024;');
    msg.appendChild(avatar);

    const bubble = el('div', 'bubble ai');
    bubble.innerHTML = `
      <div class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    msg.appendChild(bubble);
    msgs.appendChild(msg);
    scrollToBottom();
  }

  function hideTyping() {
    state.isTyping = false;
    const typing = $('#typing-message');
    if (typing) typing.remove();
  }

  // =====================
  // Scroll
  // =====================

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const msgs = $('#chat-messages');
      if (msgs) {
        msgs.scrollTop = msgs.scrollHeight;
      }
    });
  }

  // =====================
  // New Chat
  // =====================

  function newChat() {
    state.messages = [];
    state.quizState = {};
    state.currentQuizIndex = 0;
    showScreen('chat');
    renderWelcome();
  }

  // =====================
  // Event Bindings
  // =====================

  function bindEvents() {
    // Menu button
    document.addEventListener('click', (e) => {
      const menuBtn = e.target.closest('#btn-menu');
      if (menuBtn) openSidebar();

      const newChatBtn = e.target.closest('#btn-new-chat');
      if (newChatBtn) newChat();

      const backBtn = e.target.closest('.back-btn');
      if (backBtn) goBack();
    });

    // Send button
    document.addEventListener('click', (e) => {
      const sendBtn = e.target.closest('#btn-send');
      if (sendBtn) {
        const input = $('#chat-input');
        if (input && input.value.trim()) {
          handleUserInput(input.value);
        }
      }
    });

    // Enter key in input
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'chat-input') {
        e.preventDefault();
        const input = $('#chat-input');
        if (input && input.value.trim()) {
          handleUserInput(input.value);
        }
      }
    });

    // Handle hash routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'chat') {
        showScreen('chat');
      }
    });

    // Swipe to open sidebar
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (touchStartX < 30 && dx > 60 && dy < 100) {
        openSidebar();
      }
      if (state.sidebarOpen && dx < -60) {
        closeSidebar();
      }
    }, { passive: true });

    // Follow-up chip: "Next question" triggers quiz
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        const text = chip.textContent.trim();
        if (text === 'Next question') {
          const chipsParent = chip.closest('.quick-chips');
          if (chipsParent) chipsParent.remove();

          showTyping();
          setTimeout(() => {
            hideTyping();
            respondQuiz();
          }, 600);
          return;
        }
        if (text === 'Start quiz over') {
          const chipsParent = chip.closest('.quick-chips');
          if (chipsParent) chipsParent.remove();
          state.currentQuizIndex = 0;
          state.quizState = {};

          showTyping();
          setTimeout(() => {
            hideTyping();
            respondQuiz();
          }, 600);
          return;
        }
        if (text.startsWith('View ') && text.endsWith('\'s profile')) {
          const chipsParent = chip.closest('.quick-chips');
          if (chipsParent) chipsParent.remove();

          // Find player by last name
          const name = text.replace('View ', '').replace('\'s profile', '');
          const player = D.PLAYERS.find(p => p.name.split(' ').pop() === name);
          if (player) navigateTo('player', player.id);
          return;
        }
      }
    });
  }

  // =====================
  // Init
  // =====================

  function init() {
    renderApp();
    bindEvents();
    window.location.hash = 'chat';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
