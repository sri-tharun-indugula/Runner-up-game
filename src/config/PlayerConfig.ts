import { GROUND_Y } from '@/config/WorldConfig';

export const PlayerConfig = {
  screenOffsetX: 200,
  frameWidth: 48,
  frameHeight: 64,
  bodyWidth: 32,
  bodyHeight: 52,
  bodyOffsetX: 8,
  bodyOffsetY: 10,
  maxJumps: 2,
  groundSurfaceY: GROUND_Y,
  depth: 10,
} as const;

/**
 * Expanded clip for clearer run / jump / fall / land cycles.
 * idle 4 · run 8 · jump 3 · fall 2 · land 2  => 19 frames
 */
export const PlayerFrameRanges = {
  idle: { start: 0, end: 3 },
  run: { start: 4, end: 11 },
  jump: { start: 12, end: 14 },
  fall: { start: 15, end: 16 },
  land: { start: 17, end: 18 },
} as const;

export const PLAYER_FRAME_COUNT = 19;
