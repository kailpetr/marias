import { SUITS, formatPlayerName } from './core.js';
import { cardDisplay } from './rules.js';

export class Renderer {
  constructor(root) {
    this.root = root;
    this.ui = {
      playerCount: root.querySelector('#playerCount'),
      trumpSelect: root.querySelector('#trumpSelect'),
      newGameBtn: root.querySelector('#newGameBtn'),
      gameInfo: root.querySelector('#gameInfo'),
      turnLabel: root.querySelector('#turnLabel'),
      trumpLabel: root.querySelector('#trumpLabel'),
      roundLabel: root.querySelector('#roundLabel'),
      scoreboard: root.querySelector('#scoreboard'),
      tableArea: root.querySelector('#tableArea'),
      handArea: root.querySelector('#handArea'),
      hintText: root.querySelector('#hintText'),
      log: root.querySelector('#log'),
    };

    this.populateTrumpOptions();
  }

  populateTrumpOptions() {
    this.ui.trumpSelect.innerHTML = SUITS.map((suit) => `<option value="${suit.key}">${suit.name} ${suit.symbol}</option>`).join('');
  }

  bindHandlers({ onNewGame, onPlayCard, onPlayerCount, onTrumpChange }) {
    this.ui.newGameBtn.addEventListener('click', onNewGame);
    this.ui.playerCount.addEventListener('change', (event) => onPlayerCount(Number(event.target.value)));
    this.ui.trumpSelect.addEventListener('change', (event) => onTrumpChange(event.target.value));
    this.onPlayCard = onPlayCard;
  }

  syncSettings({ players, trump }) {
    this.ui.playerCount.value = String(players);
    this.ui.trumpSelect.value = trump;
  }

  render(snapshot, { playableIndices = [], hint = '' } = {}) {
    this.renderHeader(snapshot, hint);
    this.renderScoreboard(snapshot);
    this.renderTable(snapshot);
    this.renderHand(snapshot, playableIndices);
    this.renderLog(snapshot);
  }

  renderHeader(snapshot, hint) {
    this.ui.gameInfo.textContent = snapshot.gameOver
      ? `Konec hry. Vyhrává hráč ${snapshot.winner + 1}.`
      : `Trumf je ${snapshot.trump}. ${hint || ''}`.trim();
    this.ui.turnLabel.textContent = snapshot.gameOver ? 'Konec' : formatPlayerName(snapshot.turn, snapshot.humanIndex);
    this.ui.trumpLabel.textContent = snapshot.trump;
    this.ui.roundLabel.textContent = String(snapshot.round);
    this.ui.hintText.textContent = hint;
  }

  renderScoreboard(snapshot) {
    this.ui.scoreboard.innerHTML = '';
    for (let p = 0; p < snapshot.players; p++) {
      const total = snapshot.scores[p] + snapshot.meldPoints[p];
      const el = document.createElement('div');
      el.className = 'score-item';
      el.innerHTML = `<strong>${formatPlayerName(p, snapshot.humanIndex)}</strong><br>${total} bodů <span style="opacity:.7">(${snapshot.scores[p]} + hlášky ${snapshot.meldPoints[p]})</span>`;
      this.ui.scoreboard.appendChild(el);
    }
  }

  renderTable(snapshot) {
    this.ui.tableArea.innerHTML = '';
    for (let p = 0; p < snapshot.players; p++) {
      const seat = document.createElement('div');
      seat.className = 'seat' + (p === snapshot.turn && !snapshot.gameOver ? ' active' : '');
      const label = document.createElement('div');
      label.textContent = formatPlayerName(p, snapshot.humanIndex);
      seat.appendChild(label);

      const play = snapshot.table.find((item) => item.player === p);
      if (play) {
        seat.appendChild(this.makeCard(play.card));
      } else {
        const empty = document.createElement('div');
        empty.style.opacity = '0.7';
        empty.textContent = p === snapshot.turn && !snapshot.gameOver ? 'Na tahu' : 'Čeká';
        seat.appendChild(empty);
      }
      this.ui.tableArea.appendChild(seat);
    }
  }

  renderHand(snapshot, playableIndices) {
    this.ui.handArea.innerHTML = '';
    const hand = snapshot.hands[snapshot.humanIndex] || [];
    hand.forEach((card, index) => {
      const btn = this.makeCard(card, true);
      btn.classList.add('hand-card');
      if (playableIndices.includes(index) && snapshot.turn === snapshot.humanIndex && !snapshot.gameOver) {
        btn.classList.add('playable');
        btn.addEventListener('click', () => this.onPlayCard(index));
      } else {
        btn.style.opacity = '0.65';
      }
      this.ui.handArea.appendChild(btn);
    });
  }

  renderLog(snapshot) {
    this.ui.log.innerHTML = '';
    for (const line of snapshot.log.slice(0, 20)) {
      const item = document.createElement('div');
      item.className = 'log-item';
      item.textContent = line;
      this.ui.log.appendChild(item);
    }
  }

  makeCard(card, asButton = false) {
    const el = document.createElement(asButton ? 'button' : 'div');
    el.className = 'card' + (card.red ? ' red' : '');
    el.innerHTML = `
      <div class="top"><span>${card.label}</span><span>${cardDisplay(card).slice(-1)}</span></div>
      <div class="mid">${card.label}</div>
      <div class="bottom"><span>${cardDisplay(card).slice(-1)}</span><span>${card.label}</span></div>
    `;
    return el;
  }
}
