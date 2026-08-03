import { SUITS, RANKS, suitByKey, rankByKey } from './core.js';
import { compareCards, hasSuit, legalCardsForHand, pointsOfTrick, winnerOfTrick } from './cards.js';

export function suitName(key) {
  return suitByKey(key).name;
}

export function suitSymbol(key) {
  return suitByKey(key).symbol;
}

export function canFollowSuit(hand, trick) {
  const lead = trick.length ? trick[0].card.suit : null;
  if (!lead) return true;
  return hasSuit(hand, lead);
}

export function legalMoves(hand, trick, trump) {
  return legalCardsForHand(hand, trick, trump);
}

export function bestTrickWinner(trick, trump) {
  return winnerOfTrick(trick, trump);
}

export function trickPoints(trick) {
  return pointsOfTrick(trick);
}

export function rankPoints(rank) {
  return rankByKey(rank).points;
}

export function rankPower(rank) {
  return rankByKey(rank).power;
}

export function cardValue(card) {
  return rankPoints(card.rank);
}

export function scoreHandMelds(hand, trumpSuit) {
  const bySuit = new Map();
  for (const card of hand) {
    if (!bySuit.has(card.suit)) bySuit.set(card.suit, []);
    bySuit.get(card.suit).push(card);
  }

  const melds = [];
  let total = 0;

  for (const [suit, cards] of bySuit.entries()) {
    const king = cards.find((card) => card.rank === 'K');
    const queen = cards.find((card) => card.rank === 'Q');
    if (king && queen) {
      const value = suit === trumpSuit ? 40 : 20;
      melds.push({ suit, cards: [king, queen], value });
      total += value;
    }
  }

  return { total, melds };
}

export function canDeclareMeld(hand, trumpSuit, suit) {
  const cards = hand.filter((card) => card.suit === suit);
  const king = cards.find((card) => card.rank === 'K');
  const queen = cards.find((card) => card.rank === 'Q');
  return Boolean(king && queen && suitByKey(suit));
}

export function isTrump(card, trumpSuit) {
  return card.suit === trumpSuit;
}

export function shouldBeat(card, currentWinner, leadSuit, trumpSuit) {
  return compareCards(card, currentWinner, leadSuit, trumpSuit) > 0;
}

export function cardDisplay(card) {
  return `${rankByKey(card.rank).label}${suitSymbol(card.suit)}`;
}

export function normalizeGameSettings({ players, trump } = {}) {
  const normalizedPlayers = [2, 3, 4].includes(Number(players)) ? Number(players) : 3;
  const normalizedTrump = SUITS.some((suit) => suit.key === trump) ? trump : 'H';
  return { players: normalizedPlayers, trump: normalizedTrump };
}

export function trickLeadSuit(trick) {
  return trick.length ? trick[0].card.suit : null;
}

export function trickWinnerAndPoints(trick, trumpSuit) {
  return {
    winner: winnerOfTrick(trick, trumpSuit),
    points: pointsOfTrick(trick),
  };
}
