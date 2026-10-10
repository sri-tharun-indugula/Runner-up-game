export enum DeathCause {
  Fall = 'fall',
  Obstacle = 'obstacle',
}

export const CollisionConfig = {
  cameraShakeIntensity: 0.012,
  cameraShakeDurationMs: 320,
  deathKnockbackX: -80,
  deathKnockbackY: -120,
  deathSpinDegrees: 75,
  deathFadeDurationMs: 450,
  deathFreezeDelayMs: 180,
  overlayFadeInMs: 250,
} as const;

export const DeathCauseLabels: Record<DeathCause, string> = {
  [DeathCause.Fall]: 'You fell into a pit!',
  [DeathCause.Obstacle]: 'You hit an obstacle!',
};
