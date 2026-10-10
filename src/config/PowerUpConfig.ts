export enum PowerUpType {
  Shield = 'shield',
  Magnet = 'magnet',
  SpeedBoost = 'speed',
  SlowMotion = 'slow',
  ExtraLife = 'life',
}

export const PowerUpConfig = {
  [PowerUpType.Shield]: {
    durationMs: 6000,
    cooldownMs: 8000,
    label: 'Shield',
    tint: 0x4cc9f0,
  },
  [PowerUpType.Magnet]: {
    durationMs: 5500,
    cooldownMs: 7000,
    label: 'Magnet',
    tint: 0xe63946,
    pullRadius: 300,
    pullSpeed: 560,
  },
  [PowerUpType.SpeedBoost]: {
    durationMs: 4500,
    cooldownMs: 9000,
    label: 'Speed',
    tint: 0xf77f00,
    speedMultiplier: 1.45,
  },
  [PowerUpType.SlowMotion]: {
    durationMs: 4500,
    cooldownMs: 9000,
    label: 'Slow-Mo',
    tint: 0x90e0ef,
    speedMultiplier: 0.55,
  },
  [PowerUpType.ExtraLife]: {
    durationMs: 0,
    cooldownMs: 12000,
    label: '1-Up',
    tint: 0x06d6a0,
  },
} as const;

export interface PowerUpStatus {
  type: PowerUpType;
  label: string;
  remainingMs: number;
  active: boolean;
  onCooldown: boolean;
  cooldownRemainingMs: number;
}

export interface PowerUpSnapshot {
  active: PowerUpStatus[];
  lives: number;
  speedMultiplier: number;
  magnetActive: boolean;
  shieldActive: boolean;
}
