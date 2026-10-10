/**
 * Shared tween / animation timings for Milestone 15.
 */
export const AnimationConfig = {
  player: {
    jumpStretchScaleX: 0.82,
    jumpStretchScaleY: 1.28,
    jumpStretchMs: 110,
    landSquashScaleX: 1.28,
    landSquashScaleY: 0.68,
    landSquashMs: 100,
    landRecoverMs: 120,
  },
  obstacle: {
    /** Subtle vertical pulse from the ground (origin at feet). */
    spikePulseScale: 1.06,
    spikePulseMs: 640,
    rockWobbleDegrees: 5,
    rockWobbleMs: 1100,
    /** Soft glow pulse instead of full 360 spin. */
    movingPulseScale: 1.08,
    movingPulseMs: 900,
    pitBlinkMs: 900,
  },
  ui: {
    panelEnterMs: 220,
    buttonHoverScale: 1.03,
    menuLogoFloatPx: 10,
    menuLogoFloatMs: 2200,
  },
  scene: {
    fadeMs: 300,
  },
} as const;
