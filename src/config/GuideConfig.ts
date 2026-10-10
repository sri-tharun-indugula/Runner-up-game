/**
 * Pre-run guide content for Tharun Infinity Runner.
 */
export const GuideConfig = {
  title: 'How to Play',
  controls: [
    { label: 'Jump', detail: 'Space · ↑ · Click · JUMP button' },
    { label: 'Double Jump', detail: 'Jump again while in the air' },
    { label: 'Pause', detail: 'P · Esc · Pause button' },
  ],
  obstacles: [
    { name: 'Spike Block', detail: 'Toothed ground block — jump over it', swatch: '#ff2e97' },
    { name: 'Crate Block', detail: 'Solid cube — clear with a jump', swatch: '#8d99ae' },
    { name: 'Hover Block', detail: 'Floating block — time your jump', swatch: '#ff9f1c' },
    { name: 'Pits', detail: 'Gaps in the track — jump the gap', swatch: '#ffe66d' },
  ],
  powers: [
    { name: 'Shield', detail: 'Blocks one obstacle hit', swatch: '#4cc9f0' },
    { name: 'Magnet', detail: 'Pulls coins and pickups to you', swatch: '#e63946' },
    { name: 'Speed', detail: 'Run faster for a short time', swatch: '#f77f00' },
    { name: 'Slow-Mo', detail: 'World slows so you can react', swatch: '#90e0ef' },
    { name: '1-Up', detail: 'Extra life — revive once if you die', swatch: '#06d6a0' },
  ],
  pickups: [
    { name: 'Coins', detail: '+score and banked coins', swatch: '#ffd166' },
    { name: 'Gems', detail: 'Big score + more coins', swatch: '#9b5de5' },
    { name: 'Score Orb', detail: 'Large score bonus', swatch: '#06d6a0' },
  ],
  tips: [
    'Land safely — hard falls still hurt your rhythm.',
    'Shield does not save you from pits.',
    'Watch the HUD timers when a power-up is active.',
  ],
} as const;
