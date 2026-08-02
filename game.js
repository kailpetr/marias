const SUITS = [
  { key: 'S', name: 'Zelené', symbol: '♠', red: false },
  { key: 'C', name: 'Žaludy', symbol: '♣', red: false },
  { key: 'H', name: 'Srdce', symbol: '♥', red: true },
  { key: 'D', name: 'Kule', symbol: '♦', red: true },
];

const RANKS = [
  { key: '7', label: '7', points: 0, power: 1 },
  { key: '8', label: '8', points: 0, power: 2 },
  { key: '9', label: '9', points: 0, power: 3 },
  { key: 'J', label: 'Sp', points: 2, power: 4 },
  { key: 'Q', label: 'Sv', points: 3, power: 5 },
  { key: 'K', label: 'K', points: 4, power: 6 },
  { key: '10', label: '10', points: 10, power: 7 },
  { key: 'A', label: 'A', points: 11, power: 8 },
];

const HANDS_BY_PLAYERS = { 2: 16, 3: 10, 4: 8 };
const HUMAN = 0;

const state = {
  players: 3,
  trump: 'H',
  phase: 'setup',
  deck: [],
  hands: [],
  table: [],
  scores: [],
  trickPoints: [],
  turn: 0,
  trickLeader: 0,
  round: 1,
  gameInfo: '',
  aiDelay: 650,
  aiRunning: false,
  gameOver: false,
  winner: null,
  showHints: true,
  history: [],
  melds: [],
  meldPoints: [],
  meldLocked: [],
};

const ui = {};

function $(id) {
  return document.getElementById(id);
}

function suitByKey(key) {
  return SUITS.find((s) => s.key === key);
}

function rankByKey(key) {
  return RANKS.find((r) => r.key === key);
}

function makeCard(suit, rank) {
  const suitMeta = suitByKey(suit);
  const rankMeta = rankByKey(rank);
  return {
    suit,
    rank,
    label: rankMeta.label,
    points: rankMeta.points,
    power: rankMeta.power,
    red: suitMeta.red,
    short: `${rankMeta.label}${suitMeta.symbol}`,
  };
}

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(suit.key, rank.key));
    }
  }
  return shuffle(deck);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resetState(players) {
  state.players = players;
  state.deck = buildDeck();
  state.hands = Array.from({ length: players }, () => []);
  state.table = [];
  state.scores = Array.from({ length: players }, () => 0);
  state.trickPoints = Array.from({ length: players }, () => 0);
  state.turn = 0;
  state.trickLeader = 0;
  state.round = 1;
  state.gameOver = false;
  state.winner = null;
  state.history = [];
  state.melds = Array.from({ length: players }, () => []);
  state.meldPoints = Array.from({ length: players }, () => 0);
  state.meldLocked = Array.from({ length: players }, () => false);
  state.phase = 'deal';
  state.gameInfo = 'Míchám a rozdávám karty...';
}

function dealCards() {
  const perPlayer = HANDS_BY_PLAYERS[state.players] ?? 10;
  for (let i = 0; i < perPlayer; i++) {
    for (let p = 0; p < state.players; p++) {
      state.hands[p].push(state.deck.pop());
    }
  }
  for (const hand of state.hands) {
    hand.sort(sortCardsForHand);
  }
  state.phase = 'play';
  state.gameInfo = 'Hraje se. Přiznej barvu, pokud můžeš.';
  state.turn = 0;
  state.trickLeader = 0;
  state.round = 1;
  collectMelds();
}

function sortCardsForHand(a, b) {
  if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
  return a.power - b.power;
}

function isTrump(card) {
  return card.suit === state.trump;
}

function currentLeadSuit() {
  return state.table.length ? state.table[0].card.suit : null;
}

function legalCards(player) {
  const hand = state.hands[player];
  const lead = currentLeadSuit();
  if (!lead) return [...hand];
  const follow = hand.filter((c) => c.suit === lead);
  return follow.length ? follow : [...hand];
}

function compareCards(a, b, leadSuit) {
  const aTrump = isTrump(a);
  const bTrump = isTrump(b);
  if (aTrump && !bTrump) return 1;
  if (!aTrump && bTrump) return -1;
  if (a.suit === b.suit) return a.power - b.power;
  if (a.suit === leadSuit && b.suit !== leadSuit) return 1;
  if (b.suit === leadSuit && a.suit !== leadSuit) return -1;
  return a.power - b.power;
}

function trickWinner() {
  const leadSuit = state.table[0].card.suit;
  let best = state.table[0];
  for (const play of state.table.slice(1)) {
    if (compareCards(play.card, best.card, leadSuit) > 0) {
      best = play;
    }
  }
  return best.player;
}

function cardValue(card) {
  return card.points;
}

function log(message) {
  const logEl = ui.log;
  if (!logEl) return;
  const item = document.createElement('div');
  item.className = 'log-item';
  item.textContent = message;
  logEl.prepend(item);
}

function render() {
  renderTop();
  renderScoreboard();
  renderTable();
  renderHand();
  renderMelds();
  if (ui.hintText) {
    ui.hintText.textContent = state.showHints && state.phase === 'play'
      ? legalHintText()
      : '';
  }
}

function renderTop() {
  if (ui.turnLabel) ui.turnLabel.textContent = state.gameOver ? 'Konec hry' : `Hráč ${state.turn + 1}${state.turn === HUMAN ? ' (ty)' : ''}`;
  if (ui.trumpLabel) ui.trumpLabel.textContent = `${suitByKey(state.trump).name} ${suitByKey(state.trump).symbol}`;
  if (ui.roundLabel) ui.roundLabel.textContent = String(state.round);
  if (ui.gameInfo) ui.gameInfo.textContent = state.gameInfo;
}

function renderScoreboard() {
  if (!ui.scoreboard) return;
  ui.scoreboard.innerHTML = '';
  for (let p = 0; p < state.players; p++) {
    const div = document.createElement('div');
    div.className = 'score-item';
    const meld = state.meldPoints[p] || 0;
    div.innerHTML = `Hráč ${p + 1}${p === HUMAN ? ' (ty)' : ''}<br><strong>${state.scores[p] + meld}</strong> bodů <span style="opacity:.7">(${state.scores[p]} + hlášky ${meld})</span>`;
    ui.scoreboard.appendChild(div);
  }
}

function renderTable() {
  if (!ui.tableArea) return;
  ui.tableArea.innerHTML = '';
  for (let p = 0; p < state.players; p++) {
    const seat = document.createElement('div');
    seat.className = 'seat' + (p === state.turn && !state.gameOver ? ' active' : '');
    const play = state.table.find((t) => t.player === p);
    const label = document.createElement('div');
    label.textContent = `Hráč ${p + 1}${p === HUMAN ? ' (ty)' : ''}`;
    seat.appendChild(label);
    if (play) {
      seat.appendChild(renderCard(play.card, false));
      if (play.player === state.turn) seat.classList.add('active');
    } else {
      const empty = document.createElement('div');
      empty.style.opacity = '0.65';
      empty.textContent = p === state.turn && !state.gameOver ? 'Na tahu' : 'Čeká';
      seat.appendChild(empty);
    }
    ui.tableArea.appendChild(seat);
  }
}

function renderHand() {
  if (!ui.handArea) return;
  ui.handArea.innerHTML = '';
  if (state.gameOver) return;
  const hand = state.hands[HUMAN] || [];
  const legal = legalCards(HUMAN);
  hand.forEach((card, idx) => {
    const btn = renderCard(card, true);
    btn.classList.add('hand-card');
    if (legal.includes(card) && state.turn === HUMAN && state.phase === 'play') {
      btn.classList.add('playable');
      btn.onclick = () => humanPlay(idx);
    } else {
      btn.style.opacity = '0.65';
      btn.style.cursor = 'not-allowed';
    }
    ui.handArea.appendChild(btn);
  });
}

function renderCard(card, asButton) {
  const el = document.createElement(asButton ? 'button' : 'div');
  el.className = 'card' + (card.red ? ' red' : '');
  el.innerHTML = `
    <div class="top"><span>${card.label}</span><span>${suitByKey(card.suit).symbol}</span></div>
    <div class="mid">${card.label}</div>
    <div class="bottom"><span>${suitByKey(card.suit).symbol}</span><span>${card.label}</span></div>
  `;
  return el;
}

function renderMelds() {
  if (!ui.log) return;
}

function legalHintText() {
  const legal = legalCards(HUMAN);
  const lead = currentLeadSuit();
  if (!lead) return 'Můžeš začít libovolnou kartou.';
  const leadName = suitByKey(lead).name;
  if (legal.length === state.hands[HUMAN].length) return `Barvu ${leadName} nemáš, můžeš dát libovolnou kartu.`;
  return `Musíš přiznat barvu ${leadName}.`;
}

function humanPlay(index) {
  if (state.turn !== HUMAN || state.gameOver) return;
  const card = state.hands[HUMAN][index];
  const legal = legalCards(HUMAN);
  if (!legal.includes(card)) return;
  playCard(HUMAN, index);
}

function playCard(player, handIndex) {
  const card = state.hands[player].splice(handIndex, 1)[0];
  state.table.push({ player, card });
  state.history.push({ player, card: { ...card } });
  log(`Hráč ${player + 1} vyložil ${card.short}.`);
  if (state.table.length === state.players) {
    resolveTrick();
  } else {
    state.turn = (state.turn + 1) % state.players;
    render();
    maybeAI();
  }
}

function resolveTrick() {
  const winner = trickWinner();
  const points = state.table.reduce((sum, p) => sum + cardValue(p.card), 0);
  state.scores[winner] += points;
  state.table = [];
  state.turn = winner;
  state.trickLeader = winner;
  state.round += 1;
  log(`Trik bere hráč ${winner + 1} a získává ${points} bodů.`);
  if (state.hands.every((h) => h.length === 0)) {
    finishGame();
    return;
  }
  render();
  maybeAI();
}

function chooseBestCard(hand, leadSuit, trick) {
  const legal = leadSuit ? hand.filter((c) => c.suit === leadSuit) : hand;
  const playable = legal.length ? legal : hand;
  if (!trick.length) {
    return playable.slice().sort((a, b) => a.points - b.points || a.power - b.power)[0];
  }
  const currentWinner = trick.reduce((best, play) => {
    if (!best) return play.card;
    return compareCards(play.card, best, trick[0].card.suit) > 0 ? play.card : best;
  }, null);
  const beating = playable.filter((c) => compareCards(c, currentWinner, trick[0].card.suit) > 0);
  if (beating.length) {
    return beating.slice().sort((a, b) => a.points - b.points || a.power - b.power)[0];
  }
  return playable.slice().sort((a, b) => a.points - b.points || a.power - b.power)[0];
}

function maybeAI() {
  if (state.gameOver || state.turn === HUMAN || state.phase !== 'play') return;
  if (state.aiRunning) return;
  state.aiRunning = true;
  state.gameInfo = `Hraje AI hráč ${state.turn + 1}...`;
  render();
  setTimeout(() => {
    const player = state.turn;
    const hand = state.hands[player];
    const leadSuit = currentLeadSuit();
    const card = chooseBestCard(hand, leadSuit, state.table);
    const idx = hand.indexOf(card);
    playCard(player, idx);
    state.aiRunning = false;
  }, state.aiDelay);
}

function finishGame() {
  state.gameOver = true;
  const total = state.scores.map((s, i) => s + (state.meldPoints[i] || 0));
  let best = -1;
  let winner = 0;
  for (let i = 0; i < total.length; i++) {
    if (total[i] > best) {
      best = total[i];
      winner = i;
    }
  }
  state.winner = winner;
  state.gameInfo = `Konec hry. Vyhrává hráč ${winner + 1} se ${best} body.`;
  log(state.gameInfo);
  render();
}

function meldPairs(card1, card2) {
  return card1 && card2 && card1.suit === card2.suit && ((card1.rank === 'K' && card2.rank === 'Q') || (card1.rank === 'Q' && card2.rank === 'K'));
}

function collectMelds() {
  for (let p = 0; p < state.players; p++) {
    const hand = state.hands[p];
    const suits = new Map();
    for (const card of hand) {
      if (!suits.has(card.suit)) suits.set(card.suit, []);
      suits.get(card.suit).push(card);
    }
    let points = 0;
    const list = [];
    for (const cards of suits.values()) {
      const king = cards.find((c) => c.rank === 'K');
      const queen = cards.find((c) => c.rank === 'Q');
      if (meldPairs(king, queen)) {
        const sameSuit = king.suit === state.trump;
        const value = sameSuit ? 40 : 20;
        points += value;
        list.push({ suit: king.suit, value });
      }
    }
    state.meldPoints[p] = points;
    state.melds[p] = list;
  }
}

function newGame(players, trump) {
  resetState(players);
  state.trump = trump;
  dealCards();
  state.gameInfo = `Trumpf je ${suitByKey(trump).name}.`;
  render();
  maybeAI();
}

function updateMeldsFromCurrentHands() {
  collectMelds();
}

function setupUI() {
  ui.playerCount = $('playerCount');
  ui.newGameBtn = $('newGameBtn');
  ui.trumpSelect = $('trumpSelect');
  ui.variantSelect = $('variantSelect');
  ui.gameInfo = $('gameInfo');
  ui.scoreboard = $('scoreboard');
  ui.turnLabel = $('turnLabel');
  ui.trumpLabel = $('trumpLabel');
  ui.roundLabel = $('roundLabel');
  ui.tableArea = $('tableArea');
  ui.log = $('log');
  ui.handArea = $('handArea');
  ui.hintText = $('hintText');

  ui.trumpSelect.innerHTML = SUITS.map((s) => `<option value="${s.key}">${s.name} ${s.symbol}</option>`).join('');
  ui.trumpSelect.value = state.trump;
  ui.playerCount.value = String(state.players);

  ui.newGameBtn.addEventListener('click', () => {
    const players = Number(ui.playerCount.value);
    const trump = ui.trumpSelect.value;
    newGame(players, trump);
  });

  ui.playerCount.addEventListener('change', () => {
    state.players = Number(ui.playerCount.value);
  });

  ui.trumpSelect.addEventListener('change', () => {
    state.trump = ui.trumpSelect.value;
    renderTop();
  });

  ui.variantSelect.addEventListener('change', () => {
    state.showHints = ui.variantSelect.value === 'teach';
    render();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  newGame(state.players, state.trump);
});
