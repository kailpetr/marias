import { SUITS, RANKS, HANDS_BY_PLAYERS, createCard, createDeck, shuffle, suitByKey, rankByKey } from './core.js';

export { SUITS, RANKS, HANDS_BY_PLAYERS, suitByKey, rankByKey };

export function cardToLabel(card) {
  return `${rankByKey(card.rank).label}${suitByKey(card.suit).symbol}`;
}

export function sortCardsForHand(a, b) {
  if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
  return a.power - b.power;
}

export function createStandardDeck() {
  return createDeck();
}

export function dealHands(players, deck) {
  const perPlayer = HANDS_BY_PLAYERS[players];
  if (!perPlayer) throw new Error(`Unsupported player count: ${players}`);
  const hands = Array.from({ length: players }, () => []);
  let index = 0;
  for (let r = 0; r < perPlayer; r++) {
    for (let p = 0; p < players; p++) {
      hands[p].push(deck[index++]);
    }
  }
  return hands.map((hand) => hand.slice().sort(sortCardsForHand));
}

export function isTrump(card, trump) {
  return card.suit === trump;
}

export function leadSuitOf(trick) {
  return trick.length ? trick[0].card.suit : null;
}

export function legalCardsForHand(hand, trick, trump) {
  const lead = leadSuitOf(trick);
  if (!lead) return [...hand];
  const follow = hand.filter((card) => card.suit === lead);
  return follow.length ? follow : [...hand];
}

export function compareCards(a, b, leadSuit, trumpSuit) {
  const aTrump = a.suit === trumpSuit;
  const bTrump = b.suit === trumpSuit;
  if (aTrump && !bTrump) return 1;
  if (!aTrump && bTrump) return -1;
  if (a.suit === b.suit) return a.power - b.power;
  if (a.suit === leadSuit && b.suit !== leadSuit) return 1;
  if (b.suit === leadSuit && a.suit !== leadSuit) return -1;
  return a.power - b.power;
}

export function winnerOfTrick(trick, trumpSuit) {
  if (!trick.length) return null;
  const leadSuit = trick[0].card.suit;
  let best = trick[0];
  for (const play of trick.slice(1)) {
    if (compareCards(play.card, best.card, leadSuit, trumpSuit) > 0) {
      best = play;
    }
  }
  return best.player;
}

export function pointsOfTrick(trick) {
  return trick.reduce((sum, play) => sum + play.card.points, 0);
}

export function cloneCard(card) {
  return { ...card };
}

export function cloneTrick(trick) {
  return trick.map((play) => ({ player: play.player, card: cloneCard(play.card) }));
}

export function removeCardFromHand(hand, index) {
  const [card] = hand.splice(index, 1);
  return card;
}

export function formatCard(card) {
  return `${rankByKey(card.rank).label}${suitByKey(card.suit).symbol}`;
}

export function hasSuit(hand, suit) {
  return hand.some((card) => card.suit === suit);
}

export function findCardIndex(hand, targetCard) {
  return hand.findIndex((card) => card.suit === targetCard.suit && card.rank === targetCard.rank);
}

export function pointsForRank(rank) {
  return rankByKey(rank).points;
}

export function isHighCard(card) {
  return card.rank === 'A' || card.rank === '10' || card.rank === 'K';
}

export function cardStrength(card, trumpSuit, leadSuit) {
  let strength = card.power;
  if (card.suit === leadSuit) strength += 20;
  if (card.suit === trumpSuit) strength += 40;
  return strength;
}
