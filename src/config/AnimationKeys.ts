export const AnimationKeys = {
  Player: {
    Idle: 'player-idle',
    Run: 'player-run',
    Jump: 'player-jump',
    Fall: 'player-fall',
    Land: 'player-land',
  },
  Collectible: {
    Coin: 'collectible-coin-spin',
    Gem: 'collectible-gem-spin',
    Magnet: 'collectible-magnet-pulse',
    ScorePickup: 'collectible-score-spin',
    Shield: 'collectible-shield-spin',
    SpeedBoost: 'collectible-speed-spin',
    SlowMotion: 'collectible-slow-spin',
    ExtraLife: 'collectible-life-spin',
  },
} as const;

export enum PlayerState {
  Idle = 'idle',
  Running = 'running',
  Jumping = 'jumping',
  Falling = 'falling',
  Landing = 'landing',
  Dead = 'dead',
}
