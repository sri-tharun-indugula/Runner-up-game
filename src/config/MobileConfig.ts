export const MobileConfig = {
  /** Prefer landscape; show rotate guard under this width/height ratio. */
  landscapeMinAspect: 1.15,
  touchJumpSizePx: 78,
  touchPauseSizePx: 48,
  safeMarginPx: 16,
  /** Lower particle counts on coarse-pointer / small screens. */
  particleScaleDesktop: 1,
  particleScaleMobile: 0.55,
  reduceMotionQuery: '(prefers-reduced-motion: reduce)',
} as const;

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}

export function isNarrowViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Math.min(window.innerWidth, window.innerHeight) < 720;
}

export function shouldUseMobileUx(): boolean {
  return isCoarsePointer() || isNarrowViewport();
}

export function getParticleScale(): number {
  return shouldUseMobileUx()
    ? MobileConfig.particleScaleMobile
    : MobileConfig.particleScaleDesktop;
}

export function isPortraitOrientation(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerHeight / Math.max(1, window.innerWidth) > MobileConfig.landscapeMinAspect;
}
