export const SUITS = [
  { key: 'S', name: 'Zelené', symbol: '♠', red: false },
  { key: 'C', name: 'Žaludy', symbol: '♣', red: false },
  { key: 'H', name: 'Srdce', symbol: '♥', red: true },
  { key: 'D', name: 'Kule', symbol: '♦', red: true },
];

export const RANKS = [
  { key: '7', label: '7', points: 0, power: 1 },
  { key: '8', label: '8', points: 0, power: 2 },
  { key: '9', label: '9', points: 0, power: 3 },
  { key: 'J', label: 'Sp', points: 2, power: 4 },
  { key: 'Q', label: 'Sv', points: 3, power: 5 },
  { key: 'K', label: 'K', points: 4, power: 6 },
  { key: '10', label: '10', points: 10, power: 7 },
  { key: 'A', label: 'A', points: 11, power: 8 },
];

export const PLAYER_TYPES = {
  HUMAN: 'human',
  AI: 'ai',
};

export const GAME_PHASES = {
  SETUP: 'setup',
  DEAL: 'deal',
  PLAY: 'play',
  END_TRICK: 'end_trick',
  GAME_OVER: 'game_over',
};

export const HANDS_BY_PLAYERS = Object.freeze({
  2: 16,
  3: 10,
  4: 8,
});

export const DEFAULT_SETTINGS = Object.freeze({
  players: 3,
  trump: 'H',
  aiDelay: 600,
  showHints: true,
});

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function suitByKey(key) {
  const suit = SUITS.find((item) => item.key === key);
  if (!suit) throw new Error(`Unknown suit: ${key}`);
  return suit;
}

export function rankByKey(key) {
  const rank = RANKS.find((item) => item.key === key);
  if (!rank) throw new Error(`Unknown rank: ${key}`);
  return rank;
}

export function createCard(suit, rank) {
  const suitMeta = suitByKey(suit);
  const rankMeta = rankByKey(rank);
  return Object.freeze({
    suit,
    rank,
    label: rankMeta.label,
    points: rankMeta.points,
    power: rankMeta.power,
    red: suitMeta.red,
    short: `${rankMeta.label}${suitMeta.symbol}`,
  });
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(suit.key, rank.key));
    }
  }
  return shuffle(deck);
}

export function emptyScores(players) {
  return Array.from({ length: players }, () => 0);
}

export function emptyHands(players) {
  return Array.from({ length: players }, () => []);
}

export function normalizePlayers(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || !HANDS_BY_PLAYERS[num]) {
    return DEFAULT_SETTINGS.players;
  }
  return num;
}

export function normalizeTrump(value) {
  const suit = SUITS.find((item) => item.key === value);
  return suit ? suit.key : DEFAULT_SETTINGS.trump;
}

export function cardEquals(a, b) {
  return a && b && a.suit === b.suit && a.rank === b.rank;
}

export function formatPlayerName(index, humanIndex = 0) {
  return `Hráč ${index + 1}${index === humanIndex ? ' (ty)' : ''}`;
}
