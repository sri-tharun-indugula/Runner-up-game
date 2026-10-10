import { GAME_HEIGHT, GAME_WIDTH } from '@/config/GameConfig';
import { ThemeConfig } from '@/config/ThemeConfig';

export const WORLD_WIDTH = 100_000;
export const WORLD_HEIGHT = GAME_HEIGHT;

export const SCROLL_SPEED = 200;
export const GROUND_HEIGHT = 80;
export const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT;

export interface ParallaxLayerConfig {
  key: string;
  depth: number;
  scrollFactor: number;
  y: number;
  height: number;
  tileWidth: number;
  baseColor: number;
  stripeColor: number;
  style: 'sky' | 'city' | 'neon-trees' | 'ground';
}

export const ParallaxLayerConfigs: ParallaxLayerConfig[] = [
  {
    key: 'bg-sky',
    depth: 0,
    scrollFactor: 0.08,
    y: 0,
    height: GAME_HEIGHT,
    tileWidth: 640,
    baseColor: ThemeConfig.skyTop,
    stripeColor: ThemeConfig.skyBottom,
    style: 'sky',
  },
  {
    key: 'bg-mountains',
    depth: 1,
    scrollFactor: 0.22,
    y: GAME_HEIGHT * 0.28,
    height: GAME_HEIGHT * 0.5,
    tileWidth: 640,
    baseColor: 0x24124d,
    stripeColor: 0x3a1c6e,
    style: 'city',
  },
  {
    key: 'bg-trees',
    depth: 2,
    scrollFactor: 0.48,
    y: GAME_HEIGHT * 0.48,
    height: GAME_HEIGHT * 0.38,
    tileWidth: 480,
    baseColor: 0x1a0f3a,
    stripeColor: ThemeConfig.neonMagenta,
    style: 'neon-trees',
  },
  {
    key: 'bg-ground',
    depth: 3,
    scrollFactor: 1.0,
    y: GROUND_Y,
    height: GROUND_HEIGHT,
    tileWidth: 256,
    baseColor: ThemeConfig.groundMid,
    stripeColor: ThemeConfig.groundDark,
    style: 'ground',
  },
];

export const WorldConfig = {
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  viewportWidth: GAME_WIDTH,
  viewportHeight: GAME_HEIGHT,
  scrollSpeed: SCROLL_SPEED,
  groundY: GROUND_Y,
  groundHeight: GROUND_HEIGHT,
  parallaxLayers: ParallaxLayerConfigs,
} as const;
