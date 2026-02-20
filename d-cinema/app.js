/**
 * HUDR Cinema — Prototype D
 * "The Cinema" — Replay-first, fullscreen, gesture-driven poker hand viewer
 *
 * Navigation is entirely gesture-based:
 *   Swipe UP/DOWN    = next/previous hand
 *   Left edge swipe  = Player Stats panel
 *   Right edge swipe = AI Commentary panel
 *   Pull down top    = Tournament picker
 *   Pull up bottom   = Hand details
 *   Double-tap       = Pause/Play replay
 *   Long press       = Full detail overlay
 *   Tap              = Toggle overlay visibility
 */

(function () {
  'use strict';

  // =====================
  // Data references
  // =====================
  const {
    TOURNAMENTS, PLAYERS, PLAYER_STATS, HANDS, HIGHLIGHTS, HIGHLIGHT_LABELS,
    HAND_REPLAYS, STAT_HANDS, AI_CONTENT, WISDOM, USER_PROFILE,
    getPlayer, getTournament, getHand, getHandsForTournament,
    formatChips, formatNumber, getStatColor, getCardSuit, getCardRank, isRedSuit, formatCard,
  } = window.HUDR_DATA;

  // =====================
  // State
  // =====================
  const state = {
    currentHandIndex: 0,
    handList: [],
    selectedTournament: 'wsop-me-2025',
    handFilter: 'all',

    // Replay
    replayStep: -1,       // -1 = not started, index into flatSteps
    replayPhaseIndex: 0,
    isPlaying: true,
    playSpeed: 1500,
    playTimer: null,
    flatSteps: [],         // Flattened steps from HAND_REPLAYS for current hand

    // Panels
    leftPanelOpen: false,
    rightPanelOpen: false,
    topPanelOpen: false,
    bottomPanelOpen: false,
    detailOverlayOpen: false,

    // Overlays
    overlayVisible: true,
    overlayTimeout: null,

    // Player stats expansion
    expandedPlayer: null,

    // Favorites
    favorites: {
      tournaments: new Set(USER_PROFILE.favorites.tournaments),
      players: new Set(USER_PROFILE.favorites.players),
      hands: new Set(USER_PROFILE.favorites.hands),
    },

    // Gesture hint
    gestureHintShown: false,

    // Transition lock
    transitioning: false,
  };

  // =====================
  // DOM refs
  // =====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    handContainer: $('#hand-container'),
    handContainerNext: $('#hand-container-next'),
    pokerTable: $('#poker-table'),
    pokerTableNext: $('#poker-table-next'),
    topOverlay: $('#top-overlay'),
    bottomOverlay: $('#bottom-overlay'),
    overlayTournament: $('#overlay-tournament'),
    overlayHand: $('#overlay-hand'),
    overlayBlinds: $('#overlay-blinds'),
    overlayHighlight: $('#overlay-highlight'),
    overlayPreview: $('#overlay-preview'),
    overlayWinner: $('#overlay-winner'),
    streetIndicator: $('#street-indicator'),
    handDots: $('#hand-dots'),
    actionToast: $('#action-toast'),
    handToast: $('#hand-toast'),
    playPauseIndicator: $('#play-pause-indicator'),
    leftPanel: $('#left-panel'),
    leftPanelBackdrop: $('#left-panel-backdrop'),
    leftPanelContent: $('#left-panel-content'),
    leftPanelClose: $('#left-panel-close'),
    rightPanel: $('#right-panel'),
    rightPanelBackdrop: $('#right-panel-backdrop'),
    rightPanelContent: $('#right-panel-content'),
    rightPanelClose: $('#right-panel-close'),
    topPanel: $('#top-panel'),
    topPanelBackdrop: $('#top-panel-backdrop'),
    topPanelContent: $('#top-panel-content'),
    topPanelClose: $('#top-panel-close'),
    bottomPanel: $('#bottom-panel'),
    bottomPanelBackdrop: $('#bottom-panel-backdrop'),
    bottomPanelContent: $('#bottom-panel-content'),
    bottomPanelClose: $('#bottom-panel-close'),
    detailOverlay: $('#detail-overlay'),
    detailOverlayContent: $('#detail-overlay-content'),
    detailOverlayClose: $('#detail-overlay-close'),
    gestureHint: $('#gesture-hint'),
  };

  // =====================
  // Helpers
  // =====================

  function getLastName(name) {
    const parts = name.split(' ');
    return parts[parts.length - 1];
  }

  function renderCardHTML(card, extraClass = '') {
    const rank = getCardRank(card);
    const suit = getCardSuit(card);
    const red = isRedSuit(card);
    return `<div class="${extraClass} ${red ? 'red' : 'black'}">
      <span class="card-rank">${rank}</span>
      <span class="card-suit">${suit}</span>
    </div>`;
  }

  function actionText(action, amount) {
    const labels = {
      fold: 'Folds',
      check: 'Checks',
      call: `Calls ${formatChips(amount)}`,
      bet: `Bets ${formatChips(amount)}`,
      raise: `Raises ${formatChips(amount)}`,
      allin: `ALL-IN ${formatChips(amount)}`,
      show: 'Shows',
    };
    return labels[action] || action;
  }

  function streetLabel(street) {
    const labels = { preflop: 'PREFLOP', flop: 'FLOP', turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN' };
    return labels[street] || street;
  }

  // =====================
  // Hand list management
  // =====================

  function buildHandList() {
    let hands = getHandsForTournament(state.selectedTournament);
    if (state.handFilter !== 'all') {
      hands = hands.filter(h => h.highlightType === state.handFilter);
    }
    state.handList = hands;
    state.currentHandIndex = 0;
  }

  function currentHand() {
    return state.handList[state.currentHandIndex] || null;
  }

  // =====================
  // Flatten replay steps
  // =====================

  function flattenReplaySteps(hand) {
    const replay = HAND_REPLAYS[hand.id];
    if (!replay) return [];

    const steps = [];
    for (const phase of replay.phases) {
      // Add a phase-start marker
      steps.push({
        type: 'phase-start',
        phaseName: phase.name,
        communityCards: phase.communityCards,
        pot: phase.pot,
      });
      for (const step of phase.steps) {
        steps.push({
          type: 'action',
          phaseName: phase.name,
          communityCards: phase.communityCards,
          ...step,
        });
      }
    }
    return steps;
  }

  // =====================
  // Player position math
  // =====================

  function getPlayerPositions(playerIds) {
    const count = playerIds.length;
    const positions = [];

    if (count === 2) {
      // Heads-up: top and bottom
      positions.push({ x: 50, y: 8 });   // top
      positions.push({ x: 50, y: 82 });  // bottom
    } else if (count === 3) {
      positions.push({ x: 50, y: 6 });
      positions.push({ x: 12, y: 72 });
      positions.push({ x: 88, y: 72 });
    } else if (count <= 6) {
      // Distribute around oval
      const angleOffsets = {
        4: [-90, -10, 80, 180],
        5: [-90, -30, 30, 100, 180],
        6: [-90, -40, 10, 60, 120, 180],
      };
      const angles = angleOffsets[count] || angleOffsets[6];
      for (let i = 0; i < count; i++) {
        const angle = (angles[i] * Math.PI) / 180;
        const rx = 46, ry = 40;
        const cx = 50, cy = 46;
        positions.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
        });
      }
    } else {
      // 7-9 players
      for (let i = 0; i < count; i++) {
        const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
        const rx = 46, ry = 40;
        const cx = 50, cy = 46;
        positions.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
        });
      }
    }
    return positions;
  }

  // Bet chip positions (offset toward center from player)
  function getBetChipPos(playerPos) {
    const cx = 50, cy = 46;
    const dx = cx - playerPos.x;
    const dy = cy - playerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = 0.4;
    return {
      x: playerPos.x + dx * ratio,
      y: playerPos.y + dy * ratio,
    };
  }

  // =====================
  // Render poker table
  // =====================

  function renderTable(targetEl, hand, replayState) {
    if (!hand) {
      targetEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px;">No hands available</div>';
      return;
    }

    const replay = HAND_REPLAYS[hand.id];
    const hasReplay = !!replay;
    const players = hand.playersInvolved.map(pid => getPlayer(pid));
    const positions = getPlayerPositions(hand.playersInvolved);

    // Determine current display state
    let displayCommunityCards = [];
    let displayPot = 0;
    let displayStacks = {};
    let actingPlayerId = null;
    let actionBubbles = {};  // playerId -> { action, amount }
    let foldedPlayers = new Set();
    let winnerPlayerId = null;
    let showdownInfo = null;
    let betChips = {};  // playerId -> amount

    if (hasReplay && replayState && replayState.stepIndex >= 0) {
      const steps = state.flatSteps;
      const currentStep = steps[replayState.stepIndex];

      // Walk through all steps up to current to build state
      for (let i = 0; i <= replayState.stepIndex; i++) {
        const s = steps[i];
        if (s.type === 'phase-start') {
          displayCommunityCards = s.communityCards || [];
          if (s.pot) displayPot = s.pot;
          betChips = {};  // Reset bet chips at phase start
        } else if (s.type === 'action') {
          if (s.pot) displayPot = s.pot;
          if (s.stacks) Object.assign(displayStacks, s.stacks);
          if (s.action === 'fold') foldedPlayers.add(s.player);
          if (s.action !== 'fold' && s.action !== 'check' && s.action !== 'show' && s.amount > 0) {
            betChips[s.player] = s.amount;
          }
          if (s.winner) {
            winnerPlayerId = s.winner;
          }
        }
      }

      // Set acting player and bubble for current step
      if (currentStep && currentStep.type === 'action') {
        if (currentStep.winner) {
          winnerPlayerId = currentStep.winner;
        } else {
          actingPlayerId = currentStep.player;
          actionBubbles[currentStep.player] = {
            action: currentStep.action,
            amount: currentStep.amount || 0,
          };
          if (currentStep.action === 'show') {
            showdownInfo = showdownInfo || {};
            showdownInfo[currentStep.player] = {
              cards: currentStep.cards,
              handRank: currentStep.handRank,
            };
          }
        }
      }
    } else if (!hasReplay) {
      // Static display
      displayCommunityCards = hand.communityCards || [];
      displayPot = hand.potTotal;
      winnerPlayerId = hand.winnerId;
    } else {
      // Replay not started yet - show pre-deal state
      displayPot = 0;
    }

    // Build table HTML
    let html = '';

    // Table rail
    html += '<div class="table-rail"></div>';

    // Table felt
    html += '<div class="table-felt">';

    // Community cards
    html += '<div class="community-cards">';
    const allCards = hand.communityCards || [];
    for (let i = 0; i < 5; i++) {
      const card = displayCommunityCards[i];
      if (card) {
        const red = isRedSuit(card);
        html += `<div class="card-slot revealed ${red ? 'red' : 'black'}" data-card-index="${i}">
          <div class="card-inner">
            <span class="card-rank">${getCardRank(card)}</span>
            <span class="card-suit">${getCardSuit(card)}</span>
          </div>
        </div>`;
      } else {
        html += `<div class="card-slot" data-card-index="${i}"></div>`;
      }
    }
    html += '</div>';

    // Pot display
    if (displayPot > 0) {
      html += `<div class="pot-display" id="pot-display">
        <span class="pot-icon">&#x1FA99;</span>
        <span>${formatChips(displayPot)}</span>
      </div>`;
    }

    html += '</div>'; // end table-felt

    // Player seats
    players.forEach((player, idx) => {
      const pos = positions[idx];
      const pid = player.id;
      const isFolded = foldedPlayers.has(pid);
      const isActing = actingPlayerId === pid;
      const isWinner = winnerPlayerId === pid;
      const bubble = actionBubbles[pid];

      // Determine stack display
      let stackDisplay = formatChips(player.startingStack);
      if (displayStacks[pid] !== undefined) {
        stackDisplay = formatChips(displayStacks[pid]);
      }

      // Hole cards
      const holeCards = hand.holeCards ? hand.holeCards[pid] : null;
      const showCards = holeCards && (!hasReplay || replayState.stepIndex >= 0);

      let seatClasses = 'player-seat';
      if (isFolded) seatClasses += ' folded';
      if (isActing) seatClasses += ' acting';
      if (isWinner) seatClasses += ' winner';

      html += `<div class="${seatClasses}" style="left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%)">`;

      if (isWinner) {
        html += '<div class="winner-glow"></div>';
      }

      html += `<div class="player-avatar" style="background:${player.color}">${player.initials}</div>`;
      html += `<div class="player-name">${getLastName(player.name)}</div>`;
      html += `<div class="player-stack">${stackDisplay}</div>`;

      if (isFolded) {
        html += '<div class="player-fold-label">FOLD</div>';
      }

      // Show hole cards
      if (showCards) {
        html += '<div class="player-cards">';
        holeCards.forEach(card => {
          const red = isRedSuit(card);
          html += `<div class="player-card ${red ? 'red' : 'black'}">
            <span class="card-rank">${getCardRank(card)}</span>
            <span class="card-suit">${getCardSuit(card)}</span>
          </div>`;
        });
        html += '</div>';
      }

      // Action bubble
      if (bubble) {
        const bubbleText = actionText(bubble.action, bubble.amount);
        html += `<div class="player-action-bubble action-${bubble.action} visible">${bubbleText}</div>`;
      }

      // Showdown info
      if (showdownInfo && showdownInfo[pid]) {
        const sd = showdownInfo[pid];
        html += `<div class="player-action-bubble action-show visible">${sd.handRank}</div>`;
      }

      html += '</div>'; // end player-seat

      // Bet chip
      if (betChips[pid] && !isFolded) {
        const chipPos = getBetChipPos(pos);
        html += `<div class="player-bet-chip visible" style="left:${chipPos.x}%;top:${chipPos.y}%;transform:translate(-50%,-50%)">
          <div class="chip-icon"></div>
          <span>${formatChips(betChips[pid])}</span>
        </div>`;
      }
    });

    // Static hand label
    if (!hasReplay) {
      html += `<div class="static-hand-label">Static view &mdash; no replay data</div>`;
    }

    targetEl.innerHTML = html;
  }

  // =====================
  // Overlays
  // =====================

  function renderOverlays() {
    const hand = currentHand();
    if (!hand) return;

    const tournament = getTournament(hand.tournamentId);

    // Top overlay
    els.overlayTournament.textContent = tournament ? tournament.name : '';
    els.overlayHand.textContent = `Hand #${hand.handNumber}`;
    els.overlayBlinds.textContent = `Blinds: ${hand.blinds} / Ante: ${formatChips(hand.ante)}`;

    // Bottom overlay
    if (hand.highlightType && hand.highlightLabel) {
      els.overlayHighlight.textContent = hand.highlightLabel;
      els.overlayHighlight.className = `bottom-overlay-highlight type-${hand.highlightType}`;
      els.overlayHighlight.style.display = '';
    } else {
      els.overlayHighlight.style.display = 'none';
    }
    els.overlayPreview.textContent = hand.preview;
    els.overlayWinner.textContent = `${hand.winnerName} wins ${formatChips(hand.potTotal)}`;

    // Visibility
    if (state.overlayVisible) {
      els.topOverlay.classList.remove('hidden');
      els.bottomOverlay.classList.remove('hidden');
    } else {
      els.topOverlay.classList.add('hidden');
      els.bottomOverlay.classList.add('hidden');
    }
  }

  function showOverlay() {
    state.overlayVisible = true;
    renderOverlays();
    clearTimeout(state.overlayTimeout);
    state.overlayTimeout = setTimeout(() => {
      state.overlayVisible = false;
      renderOverlays();
    }, 3000);
  }

  // =====================
  // Street indicator
  // =====================

  function renderStreetIndicator() {
    const hand = currentHand();
    if (!hand) return;

    const replay = HAND_REPLAYS[hand.id];
    if (!replay) {
      els.streetIndicator.innerHTML = '';
      return;
    }

    const phases = replay.phases.map(p => p.name);
    let currentPhase = 'preflop';

    if (state.flatSteps.length > 0 && state.replayStep >= 0) {
      const step = state.flatSteps[state.replayStep];
      if (step) currentPhase = step.phaseName;
    }

    let html = '';
    phases.forEach(phase => {
      const isActive = phase === currentPhase;
      const phaseIdx = phases.indexOf(phase);
      const currentIdx = phases.indexOf(currentPhase);
      const isCompleted = phaseIdx < currentIdx;
      let classes = 'street-dot';
      if (isActive) classes += ' active';
      else if (isCompleted) classes += ' completed';
      html += `<div class="${classes}" title="${streetLabel(phase)}"></div>`;
    });
    els.streetIndicator.innerHTML = html;
  }

  // =====================
  // Hand dots
  // =====================

  function renderHandDots() {
    const maxDots = Math.min(state.handList.length, 30);
    let html = '';
    for (let i = 0; i < maxDots; i++) {
      const hand = state.handList[i];
      let classes = 'hand-dot';
      if (i === state.currentHandIndex) classes += ' active';
      if (hand && hand.highlightType) classes += ' highlight';
      html += `<div class="${classes}"></div>`;
    }
    els.handDots.innerHTML = html;
  }

  // =====================
  // Replay progress bar
  // =====================

  function renderReplayProgress() {
    let progressEl = document.querySelector('.replay-progress');
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.className = 'replay-progress';
      progressEl.innerHTML = '<div class="replay-progress-bar"></div>';
      document.getElementById('app').appendChild(progressEl);
    }

    const bar = progressEl.querySelector('.replay-progress-bar');
    if (state.flatSteps.length > 0 && state.replayStep >= 0) {
      const pct = ((state.replayStep + 1) / state.flatSteps.length) * 100;
      bar.style.width = pct + '%';
    } else {
      bar.style.width = '0%';
    }
  }

  // =====================
  // Replay engine
  // =====================

  function startReplay() {
    const hand = currentHand();
    if (!hand) return;

    stopReplay();
    state.flatSteps = flattenReplaySteps(hand);
    state.replayStep = -1;

    if (state.flatSteps.length === 0) {
      // No replay data — show static
      renderTable(els.pokerTable, hand, null);
      renderStreetIndicator();
      renderReplayProgress();
      return;
    }

    state.isPlaying = true;
    advanceReplay();
  }

  function advanceReplay() {
    if (!state.isPlaying) return;

    const hand = currentHand();
    if (!hand || state.flatSteps.length === 0) return;

    state.replayStep++;

    if (state.replayStep >= state.flatSteps.length) {
      // Replay finished - hold on last frame
      state.replayStep = state.flatSteps.length - 1;
      state.isPlaying = false;
      renderTable(els.pokerTable, hand, { stepIndex: state.replayStep });
      renderStreetIndicator();
      renderReplayProgress();
      return;
    }

    const step = state.flatSteps[state.replayStep];

    // Render the table at this step
    renderTable(els.pokerTable, hand, { stepIndex: state.replayStep });
    renderStreetIndicator();
    renderReplayProgress();

    // Show action toast for certain actions
    if (step.type === 'action' && step.player) {
      const player = getPlayer(step.player);
      if (player && step.action !== 'show') {
        showActionToast(`${getLastName(player.name)} ${actionText(step.action, step.amount)}`);
      }
      if (step.winner) {
        const winner = getPlayer(step.winner);
        if (winner) {
          showActionToast(`${getLastName(winner.name)} wins ${formatChips(step.amount)}!`);
        }
      }
    }

    if (step.type === 'phase-start' && step.phaseName !== 'preflop') {
      showActionToast(`--- ${streetLabel(step.phaseName)} ---`);
    }

    // Schedule next step
    let delay = state.playSpeed;
    if (step.type === 'phase-start') delay = 800;  // Faster for phase transitions
    if (step.type === 'action' && step.action === 'show') delay = 2000;  // Longer for showdown
    if (step.type === 'action' && step.winner) delay = 2500;  // Longer for winner

    state.playTimer = setTimeout(advanceReplay, delay);
  }

  function stopReplay() {
    if (state.playTimer) {
      clearTimeout(state.playTimer);
      state.playTimer = null;
    }
  }

  function togglePlayPause() {
    if (state.flatSteps.length === 0) return;

    state.isPlaying = !state.isPlaying;

    // Show play/pause indicator
    const ppEl = els.playPauseIndicator;
    ppEl.innerHTML = `<span class="pp-icon">${state.isPlaying ? '&#9654;' : '&#9646;&#9646;'}</span>`;
    ppEl.classList.add('visible');
    setTimeout(() => ppEl.classList.remove('visible'), 600);

    if (state.isPlaying) {
      // If at end, restart
      if (state.replayStep >= state.flatSteps.length - 1) {
        state.replayStep = -1;
      }
      advanceReplay();
    } else {
      stopReplay();
    }
  }

  // =====================
  // Toasts
  // =====================

  let actionToastTimer = null;
  function showActionToast(text) {
    clearTimeout(actionToastTimer);
    els.actionToast.textContent = text;
    els.actionToast.classList.add('visible');
    actionToastTimer = setTimeout(() => {
      els.actionToast.classList.remove('visible');
    }, 1200);
  }

  let handToastTimer = null;
  function showHandToast(text) {
    clearTimeout(handToastTimer);
    els.handToast.textContent = text;
    els.handToast.classList.add('visible');
    handToastTimer = setTimeout(() => {
      els.handToast.classList.remove('visible');
    }, 800);
  }

  // =====================
  // Hand navigation
  // =====================

  function nextHand() {
    if (state.transitioning) return;
    if (state.currentHandIndex >= state.handList.length - 1) return;

    state.transitioning = true;
    stopReplay();

    // Prepare next hand
    const nextIndex = state.currentHandIndex + 1;
    const nextHandData = state.handList[nextIndex];

    // Render next hand in the next container
    const nextFlatSteps = flattenReplaySteps(nextHandData);
    if (nextFlatSteps.length > 0) {
      renderTable(els.pokerTableNext, nextHandData, { stepIndex: -1 });
    } else {
      renderTable(els.pokerTableNext, nextHandData, null);
    }

    // Animate
    els.handContainerNext.style.transition = 'none';
    els.handContainerNext.classList.remove('entering');
    els.handContainerNext.classList.add('entering-from-bottom');
    els.handContainerNext.style.opacity = '0';
    els.handContainerNext.style.pointerEvents = 'none';

    // Force reflow
    void els.handContainerNext.offsetHeight;

    els.handContainerNext.style.transition = '';
    els.handContainer.classList.add('slide-up');
    els.handContainerNext.classList.remove('entering-from-bottom');
    els.handContainerNext.classList.add('entering');
    els.handContainerNext.style.opacity = '1';

    showHandToast(`Hand #${nextHandData.handNumber}`);

    setTimeout(() => {
      // Swap containers
      state.currentHandIndex = nextIndex;
      state.flatSteps = nextFlatSteps;
      state.replayStep = -1;

      els.handContainer.classList.remove('slide-up');
      els.handContainer.style.transition = 'none';
      void els.handContainer.offsetHeight;
      els.handContainer.style.transition = '';

      // Copy next content to main
      els.pokerTable.innerHTML = els.pokerTableNext.innerHTML;
      els.handContainerNext.classList.remove('entering');
      els.handContainerNext.style.opacity = '0';
      els.handContainerNext.style.pointerEvents = 'none';

      renderOverlays();
      renderHandDots();
      renderStreetIndicator();
      renderReplayProgress();
      showOverlay();

      state.transitioning = false;

      // Start replay for new hand
      startReplay();
    }, 420);
  }

  function prevHand() {
    if (state.transitioning) return;
    if (state.currentHandIndex <= 0) return;

    state.transitioning = true;
    stopReplay();

    const prevIndex = state.currentHandIndex - 1;
    const prevHandData = state.handList[prevIndex];

    const prevFlatSteps = flattenReplaySteps(prevHandData);
    if (prevFlatSteps.length > 0) {
      renderTable(els.pokerTableNext, prevHandData, { stepIndex: -1 });
    } else {
      renderTable(els.pokerTableNext, prevHandData, null);
    }

    els.handContainerNext.style.transition = 'none';
    els.handContainerNext.classList.remove('entering');
    els.handContainerNext.classList.add('entering-from-top');
    els.handContainerNext.style.opacity = '0';
    els.handContainerNext.style.pointerEvents = 'none';

    void els.handContainerNext.offsetHeight;

    els.handContainerNext.style.transition = '';
    els.handContainer.classList.add('slide-down');
    els.handContainerNext.classList.remove('entering-from-top');
    els.handContainerNext.classList.add('entering');
    els.handContainerNext.style.opacity = '1';

    showHandToast(`Hand #${prevHandData.handNumber}`);

    setTimeout(() => {
      state.currentHandIndex = prevIndex;
      state.flatSteps = prevFlatSteps;
      state.replayStep = -1;

      els.handContainer.classList.remove('slide-down');
      els.handContainer.style.transition = 'none';
      void els.handContainer.offsetHeight;
      els.handContainer.style.transition = '';

      els.pokerTable.innerHTML = els.pokerTableNext.innerHTML;
      els.handContainerNext.classList.remove('entering');
      els.handContainerNext.style.opacity = '0';
      els.handContainerNext.style.pointerEvents = 'none';

      renderOverlays();
      renderHandDots();
      renderStreetIndicator();
      renderReplayProgress();
      showOverlay();

      state.transitioning = false;
      startReplay();
    }, 420);
  }

  // =====================
  // Panel renders
  // =====================

  function renderLeftPanel() {
    const hand = currentHand();
    if (!hand) return;

    let html = '';
    hand.playersInvolved.forEach(pid => {
      const player = getPlayer(pid);
      const stats = PLAYER_STATS[pid];
      if (!player) return;

      const isExpanded = state.expandedPlayer === pid;

      html += `<div class="stats-player-card" data-player-id="${pid}">`;
      html += '<div class="stats-player-header">';
      html += `<div class="stats-player-avatar" style="background:${player.color}">${player.initials}</div>`;
      html += '<div class="stats-player-info">';
      html += `<div class="stats-player-name">${player.name}</div>`;
      html += `<div class="stats-player-meta">${player.countryFlag} ${formatChips(player.startingStack)} starting</div>`;
      html += '</div>';

      let posClass = '';
      if (player.finishPosition === 1) posClass = 'pos-1';
      else if (player.finishPosition === 2) posClass = 'pos-2';
      else if (player.finishPosition === 3) posClass = 'pos-3';
      html += `<span class="stats-player-finish ${posClass}">#${player.finishPosition}</span>`;
      html += '</div>';

      // Stat rings
      if (stats) {
        html += '<div class="stats-rings">';
        const ringStats = [
          { key: 'vpip', label: 'VPIP', value: stats.vpip, max: 100 },
          { key: 'pfr', label: 'PFR', value: stats.pfr, max: 100 },
          { key: 'af', label: 'AF', value: stats.af, max: 6 },
          { key: 'wtsd', label: 'WTSD', value: stats.wtsd, max: 100 },
        ];

        ringStats.forEach(rs => {
          const color = getStatColor(rs.key, rs.value);
          const circumference = 2 * Math.PI * 16;
          const pct = Math.min(rs.value / rs.max, 1);
          const dashOffset = circumference * (1 - pct);

          html += '<div class="stat-ring">';
          html += '<div class="stat-ring-circle">';
          html += `<svg viewBox="0 0 40 40">
            <circle class="ring-bg" cx="20" cy="20" r="16"/>
            <circle class="ring-fill" cx="20" cy="20" r="16"
              stroke="${color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"/>
          </svg>`;
          html += `<span class="stat-ring-value" style="color:${color}">${rs.key === 'af' ? rs.value.toFixed(1) : rs.value}</span>`;
          html += '</div>';
          html += `<span class="stat-ring-label">${rs.label}</span>`;
          html += '</div>';
        });

        html += '</div>';
      }

      // Expanded stats
      if (isExpanded && stats) {
        html += '<div class="stats-expanded">';
        const expandedStats = [
          ['3-Bet', stats.threeBet + '%'],
          ['4-Bet', stats.fourBet + '%'],
          ['Steal', stats.steal + '%'],
          ['Fold to Steal', stats.foldToSteal + '%'],
          ['C-Bet Flop', stats.cbetFlop + '%'],
          ['C-Bet Turn', stats.cbetTurn + '%'],
          ['WSD', stats.wsd + '%'],
          ['WWSF', stats.wwsf + '%'],
          ['Won w/o SD', stats.wonWithoutShowdown + '%'],
          ['Check-Raise', stats.checkRaiseFlop + '%'],
          ['Hands', stats.totalHands],
        ];
        expandedStats.forEach(([label, value]) => {
          html += `<div class="stats-expanded-row">
            <span class="stats-expanded-label">${label}</span>
            <span class="stats-expanded-value">${value}</span>
          </div>`;
        });
        html += '</div>';

        // AI scouting report
        const scouting = AI_CONTENT.playerScouting[pid];
        if (scouting) {
          html += `<div class="stats-scouting">
            <div class="stats-scouting-title">AI Scouting Report</div>
            ${scouting}
          </div>`;
        }
      }

      html += '</div>';
    });

    els.leftPanelContent.innerHTML = html;

    // Add tap handlers for expansion
    els.leftPanelContent.querySelectorAll('.stats-player-card').forEach(card => {
      card.addEventListener('click', () => {
        const pid = card.getAttribute('data-player-id');
        state.expandedPlayer = state.expandedPlayer === pid ? null : pid;
        renderLeftPanel();
      });
    });
  }

  function renderRightPanel() {
    const hand = currentHand();
    if (!hand) return;

    let html = '';

    // Find commentary for this hand
    const commentary = AI_CONTENT.commentary.find(c => c.handId === hand.id);

    html += '<div class="ai-section">';
    html += '<div class="ai-section-title">Commentary</div>';
    if (commentary) {
      html += `<div class="ai-commentary-text">${commentary.text}</div>`;
    } else {
      html += `<div class="ai-commentary-text" style="color:#6b7280">No specific commentary for this hand. ${hand.preview}</div>`;
    }
    html += '</div>';

    // General insights
    html += '<div class="ai-section">';
    html += '<div class="ai-section-title">Insights</div>';
    AI_CONTENT.insights.slice(0, 3).forEach(insight => {
      html += `<div class="ai-insight-card">
        <div class="ai-insight-title">${insight.icon} ${insight.title}</div>
        <div class="ai-insight-text">${insight.text}</div>
      </div>`;
    });
    html += '</div>';

    // Why this matters
    const bluffReport = AI_CONTENT.bluffReport.find(b => b.handId === hand.id);
    if (bluffReport) {
      html += '<div class="ai-section">';
      html += '<div class="ai-section-title">Why This Matters</div>';
      html += `<div class="ai-insight-card">
        <div class="ai-insight-title">Bluff Analysis</div>
        <div class="ai-insight-text">
          ${bluffReport.blufferName} bluffed ${bluffReport.victimName} with ${bluffReport.holding} on the ${bluffReport.street}.
          ${bluffReport.victimName} held ${bluffReport.victimHolding} and ${bluffReport.success ? 'folded' : 'called'}.
          Pot size: ${formatChips(bluffReport.potSize)}.
        </div>
      </div>`;
      html += '</div>';
    }

    // Chat input
    html += `<div class="ai-chat-input">
      <input type="text" placeholder="Ask about this hand..." id="ai-chat-field">
      <button id="ai-chat-send">&#9654;</button>
    </div>`;

    els.rightPanelContent.innerHTML = html;

    // Chat send handler
    const chatField = document.getElementById('ai-chat-field');
    const chatSend = document.getElementById('ai-chat-send');
    if (chatSend) {
      chatSend.addEventListener('click', () => {
        const query = chatField.value.trim();
        if (!query) return;
        // Find matching response
        const match = AI_CONTENT.chatResponses.find(r =>
          query.toLowerCase().includes(r.query.toLowerCase().split(' ')[0])
        );
        if (match) {
          chatField.value = '';
          // Show response inline
          const responseEl = document.createElement('div');
          responseEl.className = 'ai-insight-card';
          responseEl.style.marginTop = '8px';
          responseEl.innerHTML = `<div class="ai-insight-title">AI Response</div>
            <div class="ai-insight-text" style="white-space:pre-wrap">${match.response}</div>`;
          chatSend.parentElement.before(responseEl);
        }
      });
    }
  }

  function renderTopPanel() {
    let html = '';

    // Filter chips
    html += '<div class="filter-chips" id="filter-chips">';
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'biggest_pot', label: 'Big Pots', icon: '&#x1F4B0;' },
      { key: 'bluff', label: 'Bluffs', icon: '&#x1F3AD;' },
      { key: 'hero_call', label: 'Hero Calls', icon: '&#x1F9B8;' },
      { key: 'elimination', label: 'Eliminations', icon: '&#x1F480;' },
      { key: 'cooler', label: 'Coolers', icon: '&#x2744;' },
      { key: 'bad_beat', label: 'Bad Beats', icon: '&#x1F629;' },
    ];
    filters.forEach(f => {
      const active = state.handFilter === f.key ? 'active' : '';
      html += `<div class="filter-chip ${active}" data-filter="${f.key}">
        ${f.icon ? f.icon + ' ' : ''}${f.label}
      </div>`;
    });
    html += '</div>';

    // Tournament list
    TOURNAMENTS.filter(t => t.handCount > 0).forEach(t => {
      const selected = state.selectedTournament === t.id ? 'selected' : '';
      const handCount = getHandsForTournament(t.id).length;
      html += `<div class="tournament-picker-item ${selected}" data-tournament-id="${t.id}">
        <div class="tournament-picker-gradient" style="background:${t.imageGradient}"></div>
        <div class="tournament-picker-info">
          <div class="tournament-picker-name">${t.name}</div>
          <div class="tournament-picker-sub">${t.subtitle} &middot; ${t.venue}</div>
        </div>
        <div class="tournament-picker-hands">${handCount}h</div>
      </div>`;
    });

    els.topPanelContent.innerHTML = html;

    // Filter chip handlers
    els.topPanelContent.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.handFilter = chip.getAttribute('data-filter');
        buildHandList();
        closeAllPanels();
        initCurrentHand();
        renderTopPanel();
      });
    });

    // Tournament selection handlers
    els.topPanelContent.querySelectorAll('.tournament-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        state.selectedTournament = item.getAttribute('data-tournament-id');
        state.handFilter = 'all';
        buildHandList();
        closeAllPanels();
        initCurrentHand();
      });
    });
  }

  function renderBottomPanel() {
    const hand = currentHand();
    if (!hand) return;

    let html = '';

    // Community cards (large)
    html += '<div class="hand-detail-community">';
    (hand.communityCards || []).forEach(card => {
      const red = isRedSuit(card);
      html += `<div class="detail-card ${red ? 'red' : 'black'}">
        <span class="card-rank">${getCardRank(card)}</span>
        <span class="card-suit">${getCardSuit(card)}</span>
      </div>`;
    });
    html += '</div>';

    // Players with holdings
    html += '<div class="hand-detail-players">';
    hand.playersInvolved.forEach(pid => {
      const player = getPlayer(pid);
      if (!player) return;
      const isWinner = pid === hand.winnerId;
      const cards = hand.holeCards ? hand.holeCards[pid] : null;

      html += `<div class="hand-detail-player ${isWinner ? 'winner-player' : ''}">`;
      html += `<div class="hand-detail-player-name" style="color:${player.color}">${getLastName(player.name)}</div>`;

      if (cards) {
        html += '<div class="hand-detail-player-cards">';
        cards.forEach(card => {
          const red = isRedSuit(card);
          html += `<div class="player-card ${red ? 'red' : 'black'}">
            <span class="card-rank">${getCardRank(card)}</span>
            <span class="card-suit">${getCardSuit(card)}</span>
          </div>`;
        });
        html += '</div>';
      }

      if (isWinner) {
        html += `<div class="hand-detail-player-result positive">+${formatChips(hand.netResult)}</div>`;
      } else {
        // Calculate rough loss — just show pot contribution
        html += `<div class="hand-detail-player-result negative">Lost</div>`;
      }
      html += '</div>';
    });
    html += '</div>';

    // Action timeline bar
    const actions = hand.actions || [];
    const streetCounts = { preflop: 0, flop: 0, turn: 0, river: 0 };
    actions.forEach(a => { if (streetCounts[a.street] !== undefined) streetCounts[a.street]++; });
    const totalActions = Object.values(streetCounts).reduce((a, b) => a + b, 0) || 1;

    html += '<div class="action-timeline">';
    html += '<div class="action-timeline-title">Action Flow</div>';
    html += '<div class="action-timeline-bar">';
    Object.entries(streetCounts).forEach(([street, count]) => {
      if (count > 0) {
        const pct = (count / totalActions) * 100;
        html += `<div class="timeline-segment ${street}" style="width:${pct}%"></div>`;
      }
    });
    html += '</div>';
    html += '<div class="timeline-labels">';
    html += '<span>Preflop</span><span>Flop</span><span>Turn</span><span>River</span>';
    html += '</div>';
    html += '</div>';

    // Full action log
    html += '<div class="hand-log">';
    html += '<div class="hand-log-title">Hand History</div>';
    let currentStreet = '';
    actions.forEach(a => {
      if (a.street !== currentStreet) {
        currentStreet = a.street;
        const cards = a.street === 'flop' ? hand.communityCards.slice(0, 3)
          : a.street === 'turn' ? [hand.communityCards[3]]
          : a.street === 'river' ? [hand.communityCards[4]]
          : [];
        const cardsStr = cards.length > 0 ? ' [' + cards.map(c => formatCard(c)).join(' ') + ']' : '';
        html += `<div class="hand-log-entry street-header">${streetLabel(a.street)}${cardsStr}</div>`;
      }
      const player = getPlayer(a.player);
      const pName = player ? getLastName(player.name) : a.player;
      const amtStr = a.amount > 0 ? ` <span class="log-amount">${formatChips(a.amount)}</span>` : '';
      html += `<div class="hand-log-entry"><span class="log-player">${pName}</span> ${a.action}${amtStr}</div>`;
    });
    html += '</div>';

    // Action buttons
    const isFav = state.favorites.hands.has(hand.id);
    html += '<div class="hand-detail-actions">';
    html += `<button class="hand-detail-action-btn ${isFav ? 'active' : ''}" data-action="favorite">
      <span class="action-btn-icon">${isFav ? '&#10084;' : '&#9825;'}</span>
      <span>Favorite</span>
    </button>`;
    html += `<button class="hand-detail-action-btn" data-action="share">
      <span class="action-btn-icon">&#8599;</span>
      <span>Share</span>
    </button>`;
    html += `<button class="hand-detail-action-btn" data-action="comment">
      <span class="action-btn-icon">&#128172;</span>
      <span>Comment</span>
    </button>`;
    html += '</div>';

    els.bottomPanelContent.innerHTML = html;

    // Favorite toggle
    els.bottomPanelContent.querySelectorAll('[data-action="favorite"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.favorites.hands.has(hand.id)) {
          state.favorites.hands.delete(hand.id);
        } else {
          state.favorites.hands.add(hand.id);
        }
        renderBottomPanel();
      });
    });
  }

  function renderDetailOverlay() {
    const hand = currentHand();
    if (!hand) return;

    const tournament = getTournament(hand.tournamentId);
    let html = '';

    // Tournament info
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">Tournament</div>';
    html += `<div class="detail-tournament-info">
      <strong>${tournament ? tournament.name : ''}</strong><br>
      ${tournament ? tournament.venue : ''}<br>
      ${tournament ? tournament.event + ' ' + tournament.season : ''}
    </div>`;
    html += '</div>';

    // Hand info
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">Hand #' + hand.handNumber + '</div>';
    html += `<div class="detail-tournament-info">
      Blinds: ${hand.blinds} / Ante: ${formatChips(hand.ante)}<br>
      Pot: ${formatChips(hand.potTotal)}<br>
      Winner: ${hand.winnerName} (+${formatChips(hand.netResult)})
    </div>`;
    html += '</div>';

    // Highlight
    if (hand.highlightLabel) {
      html += '<div class="detail-section">';
      html += '<div class="detail-section-title">Highlight</div>';
      html += `<div class="detail-tournament-info" style="color:#fbbf24">${hand.highlightLabel}</div>`;
      html += '</div>';
    }

    // All players with stats
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">Players</div>';
    hand.playersInvolved.forEach(pid => {
      const player = getPlayer(pid);
      if (!player) return;
      const stats = PLAYER_STATS[pid];
      const cards = hand.holeCards ? hand.holeCards[pid] : null;

      html += '<div class="detail-player-row">';
      html += `<div class="detail-player-mini-avatar" style="background:${player.color}">${player.initials}</div>`;
      html += '<div>';
      html += `<div class="detail-player-info">${player.name} ${player.countryFlag}</div>`;
      if (cards) {
        html += `<div class="detail-player-stats">${cards.map(c => formatCard(c)).join(' ')}</div>`;
      }
      if (stats) {
        html += `<div class="detail-player-stats">VPIP ${stats.vpip}% / PFR ${stats.pfr}% / AF ${stats.af}</div>`;
      }
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    // AI Commentary
    const commentary = AI_CONTENT.commentary.find(c => c.handId === hand.id);
    if (commentary) {
      html += '<div class="detail-section">';
      html += '<div class="detail-section-title">AI Commentary</div>';
      html += `<div class="detail-tournament-info" style="color:#c4b5fd">${commentary.text}</div>`;
      html += '</div>';
    }

    els.detailOverlayContent.innerHTML = html;
  }

  // =====================
  // Panel open/close
  // =====================

  function openLeftPanel() {
    if (state.leftPanelOpen) return;
    state.leftPanelOpen = true;
    stopReplay();
    renderLeftPanel();
    els.leftPanel.classList.add('open');
    els.leftPanelBackdrop.classList.add('open');
  }

  function closeLeftPanel() {
    state.leftPanelOpen = false;
    state.expandedPlayer = null;
    els.leftPanel.classList.remove('open');
    els.leftPanelBackdrop.classList.remove('open');
    if (state.isPlaying) advanceReplay();
  }

  function openRightPanel() {
    if (state.rightPanelOpen) return;
    state.rightPanelOpen = true;
    stopReplay();
    renderRightPanel();
    els.rightPanel.classList.add('open');
    els.rightPanelBackdrop.classList.add('open');
  }

  function closeRightPanel() {
    state.rightPanelOpen = false;
    els.rightPanel.classList.remove('open');
    els.rightPanelBackdrop.classList.remove('open');
    if (state.isPlaying) advanceReplay();
  }

  function openTopPanel() {
    if (state.topPanelOpen) return;
    state.topPanelOpen = true;
    stopReplay();
    renderTopPanel();
    els.topPanel.classList.add('open');
    els.topPanelBackdrop.classList.add('open');
  }

  function closeTopPanel() {
    state.topPanelOpen = false;
    els.topPanel.classList.remove('open');
    els.topPanelBackdrop.classList.remove('open');
    if (state.isPlaying) advanceReplay();
  }

  function openBottomPanel() {
    if (state.bottomPanelOpen) return;
    state.bottomPanelOpen = true;
    stopReplay();
    renderBottomPanel();
    els.bottomPanel.classList.add('open');
    els.bottomPanelBackdrop.classList.add('open');
  }

  function closeBottomPanel() {
    state.bottomPanelOpen = false;
    els.bottomPanel.classList.remove('open');
    els.bottomPanelBackdrop.classList.remove('open');
    if (state.isPlaying) advanceReplay();
  }

  function openDetailOverlay() {
    if (state.detailOverlayOpen) return;
    state.detailOverlayOpen = true;
    stopReplay();
    renderDetailOverlay();
    els.detailOverlay.classList.add('open');
  }

  function closeDetailOverlay() {
    state.detailOverlayOpen = false;
    els.detailOverlay.classList.remove('open');
    if (state.isPlaying) advanceReplay();
  }

  function closeAllPanels() {
    closeLeftPanel();
    closeRightPanel();
    closeTopPanel();
    closeBottomPanel();
    closeDetailOverlay();
  }

  function anyPanelOpen() {
    return state.leftPanelOpen || state.rightPanelOpen || state.topPanelOpen || state.bottomPanelOpen || state.detailOverlayOpen;
  }

  // =====================
  // Gesture detection
  // =====================

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let longPressTimer = null;
  let lastTapTime = 0;
  let isSwiping = false;

  const SWIPE_THRESHOLD = 50;
  const EDGE_ZONE = 35;
  const TOP_PULL_ZONE = 60;
  const BOTTOM_PULL_ZONE = 60;
  const LONG_PRESS_DURATION = 500;
  const DOUBLE_TAP_DELAY = 300;

  document.addEventListener('touchstart', (e) => {
    // Don't intercept touches on panel content (for scrolling)
    if (e.target.closest('.panel-content') || e.target.closest('.filter-chips') || e.target.closest('input') || e.target.closest('button')) {
      return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;

    // Long press detection
    longPressTimer = setTimeout(() => {
      if (!isSwiping && !anyPanelOpen()) {
        openDetailOverlay();
      }
    }, LONG_PRESS_DURATION);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.panel-content') || e.target.closest('.filter-chips')) return;

    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 || dy > 10) {
      isSwiping = true;
      clearTimeout(longPressTimer);
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    clearTimeout(longPressTimer);

    if (e.target.closest('.panel-content') || e.target.closest('.filter-chips') || e.target.closest('input') || e.target.closest('button')) {
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX;
    const dy = endY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // If a panel is open, tap outside closes it
    if (anyPanelOpen() && !isSwiping && absDx < 10 && absDy < 10) {
      closeAllPanels();
      return;
    }

    if (isSwiping) {
      // Vertical swipe dominates
      if (absDy > SWIPE_THRESHOLD && absDy > absDx * 1.2) {
        // Check for top pull (from top edge)
        if (touchStartY < TOP_PULL_ZONE && dy > SWIPE_THRESHOLD) {
          openTopPanel();
          return;
        }
        // Check for bottom pull (from bottom edge)
        if (touchStartY > viewH - BOTTOM_PULL_ZONE && dy < -SWIPE_THRESHOLD) {
          openBottomPanel();
          return;
        }
        // Hand navigation
        if (dy < -SWIPE_THRESHOLD) {
          nextHand();
        } else if (dy > SWIPE_THRESHOLD) {
          prevHand();
        }
        return;
      }

      // Horizontal edge swipes
      if (absDx > SWIPE_THRESHOLD && absDx > absDy) {
        // Left edge → right = player stats
        if (touchStartX < EDGE_ZONE && dx > SWIPE_THRESHOLD) {
          openLeftPanel();
          return;
        }
        // Right edge → left = AI commentary
        if (touchStartX > viewW - EDGE_ZONE && dx < -SWIPE_THRESHOLD) {
          openRightPanel();
          return;
        }
      }
    }

    // Tap (not swipe)
    if (!isSwiping && absDx < 10 && absDy < 10 && dt < 300) {
      const now = Date.now();
      if (now - lastTapTime < DOUBLE_TAP_DELAY) {
        // Double tap — toggle play/pause
        lastTapTime = 0;
        togglePlayPause();
        return;
      }
      lastTapTime = now;

      // Single tap — toggle overlay (delayed to distinguish from double tap)
      setTimeout(() => {
        if (Date.now() - lastTapTime >= DOUBLE_TAP_DELAY - 50) {
          showOverlay();
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, { passive: true });

  // Mouse fallback for desktop testing
  let mouseDown = false;
  let mouseStartX = 0, mouseStartY = 0, mouseStartTime = 0;
  let mouseLongPressTimer = null;
  let mouseLastTapTime = 0;

  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.panel-content') || e.target.closest('.filter-chips') || e.target.closest('input') || e.target.closest('button')) return;
    mouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseStartTime = Date.now();
    isSwiping = false;

    mouseLongPressTimer = setTimeout(() => {
      if (!isSwiping && !anyPanelOpen()) {
        openDetailOverlay();
        mouseDown = false;
      }
    }, LONG_PRESS_DURATION);
  });

  document.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    const dx = Math.abs(e.clientX - mouseStartX);
    const dy = Math.abs(e.clientY - mouseStartY);
    if (dx > 10 || dy > 10) {
      isSwiping = true;
      clearTimeout(mouseLongPressTimer);
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    mouseDown = false;
    clearTimeout(mouseLongPressTimer);

    if (e.target.closest('.panel-content') || e.target.closest('.filter-chips') || e.target.closest('input') || e.target.closest('button')) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const dt = Date.now() - mouseStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    if (anyPanelOpen() && !isSwiping && absDx < 10 && absDy < 10) {
      closeAllPanels();
      return;
    }

    if (isSwiping) {
      if (absDy > SWIPE_THRESHOLD && absDy > absDx * 1.2) {
        if (mouseStartY < TOP_PULL_ZONE && dy > SWIPE_THRESHOLD) { openTopPanel(); return; }
        if (mouseStartY > viewH - BOTTOM_PULL_ZONE && dy < -SWIPE_THRESHOLD) { openBottomPanel(); return; }
        if (dy < -SWIPE_THRESHOLD) { nextHand(); }
        else if (dy > SWIPE_THRESHOLD) { prevHand(); }
        return;
      }
      if (absDx > SWIPE_THRESHOLD && absDx > absDy) {
        if (mouseStartX < EDGE_ZONE && dx > SWIPE_THRESHOLD) { openLeftPanel(); return; }
        if (mouseStartX > viewW - EDGE_ZONE && dx < -SWIPE_THRESHOLD) { openRightPanel(); return; }
      }
    }

    if (!isSwiping && absDx < 10 && absDy < 10 && dt < 300) {
      const now = Date.now();
      if (now - mouseLastTapTime < DOUBLE_TAP_DELAY) {
        mouseLastTapTime = 0;
        togglePlayPause();
        return;
      }
      mouseLastTapTime = now;
      setTimeout(() => {
        if (Date.now() - mouseLastTapTime >= DOUBLE_TAP_DELAY - 50) {
          showOverlay();
        }
      }, DOUBLE_TAP_DELAY);
    }
  });

  // Keyboard shortcuts for desktop testing
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        prevHand();
        break;
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        nextHand();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        openLeftPanel();
        break;
      case 'ArrowRight':
        e.preventDefault();
        openRightPanel();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'Escape':
        closeAllPanels();
        break;
      case 't':
        openTopPanel();
        break;
      case 'b':
        openBottomPanel();
        break;
      case 'd':
        openDetailOverlay();
        break;
    }
  });

  // =====================
  // Panel close handlers
  // =====================

  els.leftPanelClose.addEventListener('click', closeLeftPanel);
  els.rightPanelClose.addEventListener('click', closeRightPanel);
  els.topPanelClose.addEventListener('click', closeTopPanel);
  els.bottomPanelClose.addEventListener('click', closeBottomPanel);
  els.detailOverlayClose.addEventListener('click', closeDetailOverlay);

  els.leftPanelBackdrop.addEventListener('click', closeLeftPanel);
  els.rightPanelBackdrop.addEventListener('click', closeRightPanel);
  els.topPanelBackdrop.addEventListener('click', closeTopPanel);
  els.bottomPanelBackdrop.addEventListener('click', closeBottomPanel);

  // =====================
  // Gesture hint
  // =====================

  function showGestureHint() {
    if (state.gestureHintShown) return;
    els.gestureHint.style.display = 'flex';

    const dismissHint = () => {
      state.gestureHintShown = true;
      els.gestureHint.classList.add('hidden');
      setTimeout(() => {
        els.gestureHint.style.display = 'none';
      }, 500);
      document.removeEventListener('touchstart', dismissHint);
      document.removeEventListener('mousedown', dismissHint);
      document.removeEventListener('keydown', dismissHint);
    };

    // Auto-dismiss after 3 seconds
    setTimeout(dismissHint, 3000);

    document.addEventListener('touchstart', dismissHint, { once: true });
    document.addEventListener('mousedown', dismissHint, { once: true });
    document.addEventListener('keydown', dismissHint, { once: true });
  }

  // =====================
  // Init
  // =====================

  function initCurrentHand() {
    const hand = currentHand();
    if (!hand) {
      els.pokerTable.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px;">No hands match this filter</div>';
      return;
    }

    renderOverlays();
    renderHandDots();
    startReplay();
    showOverlay();
  }

  function init() {
    buildHandList();
    initCurrentHand();
    showGestureHint();
  }

  // Start the app
  init();
})();
