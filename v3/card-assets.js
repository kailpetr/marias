import { SUITS, RANKS } from '../v2/js/core.js';

export const CARD_BACK_ID = 'card-back-v3';

export const CARD_STYLES = {
  classic: {
    face: '#f7f2e8',
    border: '#d7c7ad',
    ink: '#18222d',
    inkRed: '#a21d25',
    shadow: 'rgba(0,0,0,0.22)',
    backTop: '#5b8f62',
    backBottom: '#2f5e39',
  },
  tavern: {
    face: '#f5ead7',
    border: '#c9ae8a',
    ink: '#20160e',
    inkRed: '#a33b2e',
    shadow: 'rgba(0,0,0,0.26)',
    backTop: '#85522d',
    backBottom: '#4d2b17',
  },
  luxury: {
    face: '#f3f5f1',
    border: '#b9c5c0',
    ink: '#10222a',
    inkRed: '#b31e4a',
    shadow: 'rgba(0,0,0,0.24)',
    backTop: '#2d6b7b',
    backBottom: '#0d3943',
  },
  retro: {
    face: '#f4ecd8',
    border: '#c4b08c',
    ink: '#1d2019',
    inkRed: '#9a2d2d',
    shadow: 'rgba(0,0,0,0.20)',
    backTop: '#66704f',
    backBottom: '#3d4331',
  },
};

function suitGlyph(suit) {
  return SUITS.find((item) => item.key === suit)?.symbol ?? '?';
}

function suitName(suit) {
  return SUITS.find((item) => item.key === suit)?.name ?? suit;
}

function rankLabel(rank) {
  return RANKS.find((item) => item.key === rank)?.label ?? rank;
}

export function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createCardFaceSvg(card, theme = 'classic') {
  const style = CARD_STYLES[theme] ?? CARD_STYLES.classic;
  const red = card.red;
  const ink = red ? style.inkRed : style.ink;
  const suit = suitGlyph(card.suit);
  const label = rankLabel(card.rank);
  const suitNameText = suitName(card.suit);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360" role="img" aria-label="${label} ${suitNameText}">
    <defs>
      <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${style.face}"/>
        <stop offset="100%" stop-color="#fff"/>
      </linearGradient>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="${style.shadow}"/>
      </filter>
    </defs>
    <rect x="10" y="10" width="220" height="340" rx="18" fill="url(#frame)" stroke="${style.border}" stroke-width="4" filter="url(#soft-shadow)"/>
    <rect x="20" y="20" width="200" height="320" rx="14" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="1.5"/>
    <text x="33" y="58" font-size="34" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="${ink}">${label}</text>
    <text x="207" y="58" font-size="30" font-family="Georgia, 'Times New Roman', serif" font-weight="700" text-anchor="end" fill="${ink}">${suit}</text>
    <text x="120" y="198" font-size="96" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="${ink}" opacity="0.95">${suit}</text>
    <text x="33" y="316" font-size="30" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="${ink}" transform="rotate(180 33 316)">${label}</text>
    <text x="207" y="316" font-size="30" font-family="Georgia, 'Times New Roman', serif" font-weight="700" text-anchor="end" fill="${ink}" transform="rotate(180 207 316)">${suit}</text>
    <path d="M38 80 C54 74, 73 74, 89 80" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.25"/>
    <path d="M151 80 C167 74, 186 74, 202 80" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.25"/>
  </svg>`;

  return svgDataUri(svg.replace(/\s{2,}/g, ' ').trim());
}

export function createCardBackSvg(theme = 'classic') {
  const style = CARD_STYLES[theme] ?? CARD_STYLES.classic;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360" role="img" aria-label="Rub karty">
    <defs>
      <linearGradient id="backGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${style.backTop}"/>
        <stop offset="100%" stop-color="${style.backBottom}"/>
      </linearGradient>
      <pattern id="backPattern" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.22)"/>
        <path d="M16 4 L20 16 L16 28 L12 16 Z" fill="rgba(255,255,255,0.14)"/>
      </pattern>
      <filter id="backShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="rgba(0,0,0,0.28)"/>
      </filter>
    </defs>
    <rect x="10" y="10" width="220" height="340" rx="18" fill="url(#backGrad)" stroke="rgba(255,255,255,0.25)" stroke-width="4" filter="url(#backShadow)"/>
    <rect x="24" y="24" width="192" height="312" rx="14" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="1.2"/>
    <rect x="28" y="28" width="184" height="304" rx="12" fill="url(#backPattern)" opacity="0.95"/>
    <circle cx="120" cy="180" r="70" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.24)" stroke-width="2"/>
    <path d="M120 110 L138 158 L188 180 L138 202 L120 250 L102 202 L52 180 L102 158 Z" fill="rgba(255,255,255,0.18)"/>
    <path d="M120 140 L132 166 L158 180 L132 194 L120 220 L108 194 L82 180 L108 166 Z" fill="rgba(255,255,255,0.22)"/>
  </svg>`;
  return svgDataUri(svg.replace(/\s{2,}/g, ' ').trim());
}

export function createCardGraphic(card, theme = 'classic') {
  return createCardFaceSvg(card, theme);
}

export function getAssetPath(kind, suit, rank) {
  if (kind === 'back') return `assets/cards/back-${suit || 'default'}.png`;
  return `assets/cards/${suit}-${rank}.png`;
}

export function resolveCardImage(card, theme = 'classic', useFallbackSvg = true) {
  const path = getAssetPath('face', card.suit, card.rank);
  return useFallbackSvg ? createCardGraphic(card, theme) : path;
}

export function resolveBackImage(theme = 'classic', useFallbackSvg = true) {
  const path = getAssetPath('back', null, null);
  return useFallbackSvg ? createCardBackSvg(theme) : path;
}

export function cardFaceClass(card) {
  return card.red ? 'card-face red-card' : 'card-face black-card';
}

export function cardBackClass() {
  return 'card-back';
}

export function assetHints() {
  return {
    facePattern: 'assets/cards/{suit}-{rank}.png',
    backPattern: 'assets/cards/back.png',
    note: 'Pokud obrázek neexistuje, použije se SVG fallback.',
  };
}
