import { normalizePlayers, normalizeTrump, SUITS } from '../../v2/js/core.js';
import { GameEngine } from '../../v2/js/engine.js';
import { AiController } from '../../v2/js/ai.js';
import { Renderer } from '../../v2/js/renderer.js';
import { legalMoves, trickLeadSuit } from '../../v2/js/rules.js';
import { resolveCardImage, resolveBackImage } from '../card-assets.js';

const root = document.querySelector('.v3-stage');
if (!root) {
  throw new Error('V3 root element not found.');
}

const engine = new GameEngine();
const ai = new AiController({ difficulty: 'normal' });
const renderer = new Renderer(root);

const themeSelect = document.querySelector('#themeSelect');
const soundToggle = document.querySelector('#soundToggle');
const autoPlayToggle = document.querySelector('#autoPlayToggle');
const dealSound = document.querySelector('#dealSound');
const cardSound = document.querySelector('#cardSound');
const trickSound = document.querySelector('#trickSound');

const v3State = {
  theme: themeSelect?.value || 'classic',
  soundsEnabled: false,
  aiSpeed: 600,
};

function applyTheme(theme) {
  document.body.classList.remove('theme-classic', 'theme-tavern', 'theme-luxury', 'theme-retro');
  document.body.classList.add(`theme-${theme}`);
  v3State.theme = theme;
}

function setSoundState(enabled) {
  v3State.soundsEnabled = enabled;
  if (soundToggle) soundToggle.textContent = enabled ? 'Zvuk: zapnutý' : 'Zvuk: vypnutý';
}

function setSpeed(mode) {
  const mapping = {
    slow: 1000,
    normal: 600,
    fast: 250,
  };
  v3State.aiSpeed = mapping[mode] ?? 600;
  if (autoPlayToggle) {
    autoPlayToggle.textContent = `Rychlost AI: ${mode === 'slow' ? 'pomalá' : mode === 'fast' ? 'rychlá' : 'normální'}`;
  }
  engine.state.aiDelay = v3State.aiSpeed;
}

function playSound(node) {
  if (!v3State.soundsEnabled || !node) return;
  try {
    node.currentTime = 0;
    node.play().catch(() => {});
  } catch {
    // no-op
  }
}

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

function updateSeatScores(snapshot) {
  const map = [
    document.querySelector('#seatScoreBottom'),
    document.querySelector('#seatScoreTop'),
    document.querySelector('#seatScoreLeft'),
    document.querySelector('#seatScoreRight'),
  ];
  for (let i = 0; i < map.length; i++) {
    if (map[i]) map[i].textContent = String((snapshot.scores[i] || 0) + (snapshot.meldPoints[i] || 0));
  }
}

function decorateCardElement(cardEl, card, theme = v3State.theme) {
  if (!cardEl || !card) return cardEl;
  cardEl.dataset.suit = card.suit;
  cardEl.dataset.rank = card.rank;
  const image = resolveCardImage(card, theme, true);
  cardEl.style.backgroundImage = `url("${image}")`;
  cardEl.style.backgroundSize = 'cover';
  cardEl.style.backgroundPosition = 'center';
  cardEl.style.backgroundRepeat = 'no-repeat';
  cardEl.title = `${card.label} ${card.suit}`;
  return cardEl;
}

function decorateBack(cardEl, theme = v3State.theme) {
  if (!cardEl) return cardEl;
  const image = resolveBackImage(theme, true);
  cardEl.style.backgroundImage = `url("${image}")`;
  cardEl.style.backgroundSize = 'cover';
  cardEl.style.backgroundPosition = 'center';
  cardEl.style.backgroundRepeat = 'no-repeat';
  return cardEl;
}

function patchRendererForAssets() {
  const originalMakeCard = renderer.makeCard.bind(renderer);
  renderer.makeCard = (card, asButton = false) => {
    const el = originalMakeCard(card, asButton);
    el.dataset.suit = card.suit;
    el.dataset.rank = card.rank;
    decorateCardElement(el, card, v3State.theme);
    return el;
  };
}

function renderSnapshot(snapshot) {
  const playableIndices = currentPlayableIndices(snapshot);
  renderer.render(snapshot, {
    playableIndices,
    hint: engine.state.showHints ? hintForState(snapshot) : '',
  });
  updateSeatScores(snapshot);
  patchRendererForAssets();
}

engine.subscribe(renderSnapshot);

renderer.bindHandlers({
  onNewGame: async () => {
    const players = normalizePlayers(renderer.ui.playerCount.value);
    const trump = normalizeTrump(renderer.ui.trumpSelect.value);
    engine.setPlayers(players);
    engine.setTrump(trump);
    engine.state.aiDelay = v3State.aiSpeed;
    engine.startNewGame({ players, trump });
    playSound(dealSound);
    renderSnapshot(engine.snapshot());
    if (!engine.getHumanTurn()) {
      await engine.advanceAI(ai);
      renderSnapshot(engine.snapshot());
    }
  },
  onPlayCard: async (cardIndex) => {
    if (!engine.playCard(engine.state.turn, cardIndex)) return;
    playSound(cardSound);
    renderSnapshot(engine.snapshot());
    if (!engine.getHumanTurn()) {
      await engine.advanceAI(ai);
      playSound(trickSound);
      renderSnapshot(engine.snapshot());
    }
  },
  onPlayerCount: (players) => {
    engine.setPlayers(players);
    renderSnapshot(engine.snapshot());
  },
  onTrumpChange: (trump) => {
    engine.setTrump(trump);
    renderSnapshot(engine.snapshot());
  },
});

if (themeSelect) {
  themeSelect.addEventListener('change', (event) => {
    applyTheme(event.target.value);
    renderSnapshot(engine.snapshot());
  });
}

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    setSoundState(!v3State.soundsEnabled);
  });
}

if (autoPlayToggle) {
  autoPlayToggle.addEventListener('click', () => {
    const next = v3State.aiSpeed === 600 ? 'fast' : v3State.aiSpeed === 250 ? 'slow' : 'normal';
    setSpeed(next);
  });
}

applyTheme(v3State.theme);
setSoundState(false);
setSpeed('normal');
renderer.syncSettings(engine.snapshot());
engine.startNewGame({ players: engine.state.players, trump: engine.state.trump });
renderSnapshot(engine.snapshot());
