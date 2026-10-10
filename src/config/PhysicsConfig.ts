import { GAME_HEIGHT } from '@/config/GameConfig';

export const PhysicsConfig = {
  gravity: 1400,
  fallGravityMultiplier: 1.55,
  jumpVelocity: -640,
  doubleJumpVelocity: -560,
  jumpCutMultiplier: 0.45,
  maxFallVelocity: 950,
  maxUpwardVelocity: 720,
  coyoteTimeMs: 140,
  jumpBufferTimeMs: 160,
  landingVelocityThreshold: 50,
  hardLandingVelocity: 400,
  deathZoneY: GAME_HEIGHT + 60,
  debug: false,
} as const;

export const PhysicsCategories = {
  player: 0x0001,
  ground: 0x0002,
} as const;
