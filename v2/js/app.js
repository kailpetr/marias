import { normalizePlayers, normalizeTrump, SUITS } from './core.js';
import { GameEngine } from './engine.js';
import { AiController } from './ai.js';
import { Renderer } from './renderer.js';
import { legalMoves, trickLeadSuit } from './rules.js';

const root = document.querySelector('.app-shell');
const engine = new GameEngine();
const ai = new AiController({ difficulty: 'normal' });
const renderer = new Renderer(root);

function currentPlayableIndices(snapshot) {
  const hand = snapshot.hands[snapshot.humanIndex] || [];
  const legal = legalMoves(hand, snapshot.table, snapshot.trump);
  return hand
    .map((card, index) => ({ card, index }))
    .filter((item) => legal.some((legalCard) => legalCard.suit === item.card.suit && legalCard.rank === item.card.rank))
    .map((item) => item.index);
}

function hintForState(snapshot) {
  if (snapshot.gameOver) return '';
  const hand = snapshot.hands[snapshot.humanIndex] || [];
  const lead = trickLeadSuit(snapshot.table);
  if (!lead) return 'Můžeš začít libovolnou kartou.';
  const hasLead = hand.some((card) => card.suit === lead);
  return hasLead ? `Musíš přiznat barvu ${lead}.` : 'Nemáš barvu v barvě, můžeš zahrát libovolnou kartu.';
}

function update(snapshot) {
  const playableIndices = currentPlayableIndices(snapshot);
  renderer.render(snapshot, {
    playableIndices,
    hint: engine.state.showHints ? hintForState(snapshot) : '',
  });
}

engine.subscribe(update);

renderer.bindHandlers({
  onNewGame: async () => {
    const players = normalizePlayers(renderer.ui.playerCount.value);
    const trump = normalizeTrump(renderer.ui.trumpSelect.value);
    engine.setPlayers(players);
    engine.setTrump(trump);
    engine.startNewGame({ players, trump });
    update(engine.snapshot());
    if (engine.getHumanTurn()) return;
    await engine.advanceAI(ai);
    update(engine.snapshot());
  },
  onPlayCard: async (cardIndex) => {
    if (!engine.playCard(engine.state.turn, cardIndex)) return;
    update(engine.snapshot());
    if (!engine.getHumanTurn()) {
      await engine.advanceAI(ai);
      update(engine.snapshot());
    }
  },
  onPlayerCount: (players) => {
    engine.setPlayers(players);
    update(engine.snapshot());
  },
  onTrumpChange: (trump) => {
    engine.setTrump(trump);
    update(engine.snapshot());
  },
});

renderer.syncSettings(engine.snapshot());
engine.startNewGame({ players: engine.state.players, trump: engine.state.trump });
update(engine.snapshot());
