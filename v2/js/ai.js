import { delay } from './core.js';
import { legalCardsForHand, compareCards } from './cards.js';

export class AiController {
  constructor({ difficulty = 'normal' } = {}) {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  chooseMove(snapshot) {
    const player = snapshot.turn;
    const hand = snapshot.hands[player];
    const legal = legalCardsForHand(hand, snapshot.table, snapshot.trump);
    if (!legal.length) return null;

    const leadSuit = snapshot.table.length ? snapshot.table[0].card.suit : null;
    const currentWinner = snapshot.table.length
      ? snapshot.table.reduce((best, play) => {
          if (!best) return play.card;
          return compareCards(play.card, best, leadSuit, snapshot.trump) > 0 ? play.card : best;
        }, null)
      : null;

    const sorted = [...legal].sort((a, b) => {
      const scoreA = this.cardScore(a, snapshot, currentWinner, leadSuit);
      const scoreB = this.cardScore(b, snapshot, currentWinner, leadSuit);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.power - b.power;
    });

    const pick = this.difficulty === 'easy'
      ? sorted[0]
      : this.difficulty === 'hard'
        ? sorted[sorted.length - 1]
        : this.chooseBalanced(sorted, snapshot, currentWinner, leadSuit);

    return { cardIndex: hand.findIndex((card) => card.suit === pick.suit && card.rank === pick.rank) };
  }

  chooseBalanced(sorted, snapshot, currentWinner, leadSuit) {
    if (!currentWinner) {
      return sorted[0];
    }

    const beating = sorted.filter((card) => compareCards(card, currentWinner, leadSuit, snapshot.trump) > 0);
    if (beating.length) {
      return beating.sort((a, b) => this.cardScore(a, snapshot, currentWinner, leadSuit) - this.cardScore(b, snapshot, currentWinner, leadSuit))[0];
    }

    return sorted[0];
  }

  cardScore(card, snapshot, currentWinner, leadSuit) {
    let score = card.points * 3 + card.power;

    if (card.suit === snapshot.trump) score += 15;
    if (leadSuit && card.suit === leadSuit) score += 8;
    if (card.rank === 'A' || card.rank === '10') score += 4;

    if (currentWinner) {
      const canBeat = compareCards(card, currentWinner, leadSuit, snapshot.trump) > 0;
      if (canBeat) score -= 6;
      else score += 2;
    }

    if (this.difficulty === 'hard') score -= card.points;
    if (this.difficulty === 'easy') score += card.points;

    return score;
  }

  async think(ms) {
    await delay(ms);
  }
}
