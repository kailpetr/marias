import { DEFAULT_SETTINGS, GAME_PHASES, PLAYER_TYPES, delay, emptyHands, emptyScores, normalizePlayers, normalizeTrump } from './core.js';
import { createStandardDeck, dealHands, legalCardsForHand, cloneTrick, pointsOfTrick, winnerOfTrick, removeCardFromHand, hasSuit } from './cards.js';

export class GameEngine {
  constructor() {
    this.state = this.createInitialState();
    this.listeners = new Set();
  }

  createInitialState() {
    return {
      players: DEFAULT_SETTINGS.players,
      humanIndex: 0,
      trump: DEFAULT_SETTINGS.trump,
      aiDelay: DEFAULT_SETTINGS.aiDelay,
      showHints: DEFAULT_SETTINGS.showHints,
      phase: GAME_PHASES.SETUP,
      deck: [],
      hands: emptyHands(DEFAULT_SETTINGS.players),
      table: [],
      scores: emptyScores(DEFAULT_SETTINGS.players),
      meldPoints: emptyScores(DEFAULT_SETTINGS.players),
      turn: 0,
      trickLeader: 0,
      round: 1,
      gameOver: false,
      winner: null,
      log: [],
      history: [],
      waitingForHuman: false,
      aiBusy: false,
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  snapshot() {
    return {
      ...this.state,
      deck: [...this.state.deck],
      hands: this.state.hands.map((hand) => [...hand]),
      table: cloneTrick(this.state.table),
      scores: [...this.state.scores],
      meldPoints: [...this.state.meldPoints],
      log: [...this.state.log],
      history: [...this.state.history],
    };
  }

  log(message) {
    this.state.log.unshift(message);
    if (this.state.log.length > 80) this.state.log.length = 80;
  }

  configure({ players, trump, aiDelay, showHints } = {}) {
    if (players !== undefined) this.state.players = normalizePlayers(players);
    if (trump !== undefined) this.state.trump = normalizeTrump(trump);
    if (aiDelay !== undefined) this.state.aiDelay = Number(aiDelay) || DEFAULT_SETTINGS.aiDelay;
    if (showHints !== undefined) this.state.showHints = Boolean(showHints);
    this.state.hands = emptyHands(this.state.players);
    this.state.scores = emptyScores(this.state.players);
    this.state.meldPoints = emptyScores(this.state.players);
    this.emit();
  }

  startNewGame({ players, trump } = {}) {
    if (players !== undefined) this.state.players = normalizePlayers(players);
    if (trump !== undefined) this.state.trump = normalizeTrump(trump);

    this.state.deck = createStandardDeck();
    this.state.hands = dealHands(this.state.players, this.state.deck);
    this.state.scores = emptyScores(this.state.players);
    this.state.meldPoints = this.calculateMelds();
    this.state.table = [];
    this.state.turn = 0;
    this.state.trickLeader = 0;
    this.state.round = 1;
    this.state.gameOver = false;
    this.state.winner = null;
    this.state.log = [];
    this.state.history = [];
    this.state.phase = GAME_PHASES.PLAY;
    this.state.waitingForHuman = this.state.turn === this.state.humanIndex;
    this.state.aiBusy = false;

    this.log(`Rozdáno. Trumf je ${this.state.trump}.`);
    this.emit();
  }

  calculateMelds() {
    const points = emptyScores(this.state.players);
    for (let p = 0; p < this.state.players; p++) {
      const hand = this.state.hands[p];
      const bySuit = new Map();
      for (const card of hand) {
        if (!bySuit.has(card.suit)) bySuit.set(card.suit, []);
        bySuit.get(card.suit).push(card);
      }
      for (const [suit, cards] of bySuit.entries()) {
        const king = cards.find((card) => card.rank === 'K');
        const queen = cards.find((card) => card.rank === 'Q');
        if (king && queen) {
          points[p] += suit === this.state.trump ? 40 : 20;
        }
      }
    }
    return points;
  }

  currentLeadSuit() {
    return this.state.table.length ? this.state.table[0].card.suit : null;
  }

  legalCardsForPlayer(player) {
    return legalCardsForHand(this.state.hands[player], this.state.table, this.state.trump);
  }

  canPlayCard(player, cardIndex) {
    if (this.state.gameOver) return false;
    if (player !== this.state.turn) return false;
    const hand = this.state.hands[player];
    const card = hand[cardIndex];
    if (!card) return false;
    return this.legalCardsForPlayer(player).some((legal) => legal.suit === card.suit && legal.rank === card.rank);
  }

  playCard(player, cardIndex) {
    if (!this.canPlayCard(player, cardIndex)) return false;

    const [card] = this.state.hands[player].splice(cardIndex, 1);
    this.state.table.push({ player, card });
    this.state.history.push({ player, card: { ...card }, round: this.state.round });
    this.log(`Hráč ${player + 1} zahrál ${card.rank}${card.suit}.`);

    if (this.state.table.length === this.state.players) {
      this.finishTrick();
    } else {
      this.state.turn = (this.state.turn + 1) % this.state.players;
      this.state.waitingForHuman = this.state.turn === this.state.humanIndex;
      this.emit();
    }

    return true;
  }

  finishTrick() {
    const winner = winnerOfTrick(this.state.table, this.state.trump);
    const trickPoints = pointsOfTrick(this.state.table);
    this.state.scores[winner] += trickPoints;
    this.state.table = [];
    this.state.turn = winner;
    this.state.trickLeader = winner;
    this.state.round += 1;
    this.log(`Trik bere hráč ${winner + 1} za ${trickPoints} bodů.`);

    if (this.isGameFinished()) {
      this.finishGame();
    } else {
      this.state.waitingForHuman = this.state.turn === this.state.humanIndex;
      this.emit();
    }
  }

  isGameFinished() {
    return this.state.hands.every((hand) => hand.length === 0);
  }

  finishGame() {
    this.state.gameOver = true;
    this.state.phase = GAME_PHASES.GAME_OVER;
    const totals = this.state.scores.map((score, index) => score + this.state.meldPoints[index]);
    let best = totals[0];
    let winner = 0;
    for (let i = 1; i < totals.length; i++) {
      if (totals[i] > best) {
        best = totals[i];
        winner = i;
      }
    }
    this.state.winner = winner;
    this.log(`Konec hry. Vyhrává hráč ${winner + 1} se ${best} body.`);
    this.emit();
  }

  getPlayableCards(player = this.state.turn) {
    return this.legalCardsForPlayer(player);
  }

  getHumanTurn() {
    return this.state.turn === this.state.humanIndex && !this.state.gameOver;
  }

  setHumanIndex(index) {
    this.state.humanIndex = Math.max(0, Math.min(index, this.state.players - 1));
    this.state.waitingForHuman = this.getHumanTurn();
    this.emit();
  }

  setTrump(trump) {
    this.state.trump = normalizeTrump(trump);
    this.emit();
  }

  setPlayers(players) {
    this.state.players = normalizePlayers(players);
    this.state.hands = emptyHands(this.state.players);
    this.state.scores = emptyScores(this.state.players);
    this.state.meldPoints = emptyScores(this.state.players);
    this.state.turn = 0;
    this.state.trickLeader = 0;
    this.state.round = 1;
    this.emit();
  }

  isWaitingForHuman() {
    return this.state.waitingForHuman && !this.state.gameOver;
  }

  async advanceAI(aiController) {
    if (this.state.gameOver) return;
    if (this.state.turn === this.state.humanIndex) {
      this.state.waitingForHuman = true;
      this.emit();
      return;
    }
    if (this.state.aiBusy) return;
    this.state.aiBusy = true;
    try {
      while (!this.state.gameOver && this.state.turn !== this.state.humanIndex) {
        await delay(this.state.aiDelay);
        const move = aiController.chooseMove(this.snapshot());
        if (!move) break;
        const played = this.playCard(this.state.turn, move.cardIndex);
        if (!played) break;
      }
    } finally {
      this.state.aiBusy = false;
      this.emit();
    }
  }

  historySummary() {
    return this.state.history.map((item) => ({
      player: item.player,
      card: { ...item.card },
      round: item.round,
    }));
  }

  resetLog() {
    this.state.log = [];
    this.emit();
  }

  legalMoveExists(player = this.state.turn) {
    return this.legalCardsForPlayer(player).length > 0;
  }

  isTrumpCard(card) {
    return card.suit === this.state.trump;
  }

  playerHasSuit(player, suit) {
    return hasSuit(this.state.hands[player], suit);
  }
}
