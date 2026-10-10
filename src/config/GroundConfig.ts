import { WorldConfig } from '@/config/WorldConfig';

export const GroundConfig = {
  segmentWidth: 256,
  poolSize: 8,
  recycleMargin: 128,
  spawnAheadMargin: 512,
  depth: 4,
  tileVariations: ['ground-tile-1', 'ground-tile-2', 'ground-tile-3'] as const,
} as const;

export type GroundTileKey = (typeof GroundConfig.tileVariations)[number];

export const GroundTileConfig = {
  width: GroundConfig.segmentWidth,
  height: WorldConfig.groundHeight,
  surfaceY: WorldConfig.groundY,
  centerY: WorldConfig.groundY + WorldConfig.groundHeight / 2,
} as const;
