import { AssetKeys } from '@/config/AssetKeys';
import { CollectibleConfig } from '@/config/CollectibleConfig';
import { PlayerConfig, PlayerFrameRanges } from '@/config/PlayerConfig';

export type GuideMotion = 'bob' | 'pulse' | 'blink' | 'spin';

export interface GuideIconPreview {
  /** Full spritesheet or single-frame data URL. */
  src: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  motion: GuideMotion;
}

export interface GuideVisualRow {
  name: string;
  detail: string;
  icon: GuideIconPreview;
}

export interface GuideVisuals {
  runner: GuideVisualRow;
  actions: GuideVisualRow[];
  obstacles: GuideVisualRow[];
  powers: GuideVisualRow[];
  pickups: GuideVisualRow[];
}

/**
 * Builds How-to-Play icons from the same Phaser textures used in-run,
 * so the guide shows real art + CSS frame animation instead of color chips.
 */
export class GuidePreviewFactory {
  static build(scene: Phaser.Scene): GuideVisuals {
    const spike = GuidePreviewFactory.atlasFrame(
      scene,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstacleSpike,
      'bob',
    );
    const rock = GuidePreviewFactory.atlasFrame(
      scene,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstacleRock,
      'pulse',
    );
    const moving = GuidePreviewFactory.atlasFrame(
      scene,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstacleMoving,
      'bob',
    );
    const pit = GuidePreviewFactory.atlasFrame(
      scene,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstaclePitMarker,
      'blink',
    );

    return {
      runner: {
        name: 'Your Runner',
        detail: 'Keep moving forward — jump and double-jump to clear hazards.',
        icon: GuidePreviewFactory.sheetRange(
          scene,
          AssetKeys.Sprites.Player,
          PlayerFrameRanges.run.start,
          PlayerFrameRanges.run.end,
          'spin',
          PlayerConfig.frameWidth,
          PlayerConfig.frameHeight,
        ),
      },
      actions: [
        {
          name: 'Run',
          detail: 'Always sprinting — timing is everything',
          icon: GuidePreviewFactory.sheetRange(
            scene,
            AssetKeys.Sprites.Player,
            PlayerFrameRanges.run.start,
            PlayerFrameRanges.run.end,
            'spin',
            PlayerConfig.frameWidth,
            PlayerConfig.frameHeight,
          ),
        },
        {
          name: 'Jump',
          detail: 'Space / ↑ / Click / JUMP — press again mid-air',
          icon: GuidePreviewFactory.sheetRange(
            scene,
            AssetKeys.Sprites.Player,
            PlayerFrameRanges.jump.start,
            PlayerFrameRanges.jump.end,
            'spin',
            PlayerConfig.frameWidth,
            PlayerConfig.frameHeight,
          ),
        },
        {
          name: 'Land',
          detail: 'Soft landings keep your rhythm smooth',
          icon: GuidePreviewFactory.sheetRange(
            scene,
            AssetKeys.Sprites.Player,
            PlayerFrameRanges.land.start,
            PlayerFrameRanges.land.end,
            'spin',
            PlayerConfig.frameWidth,
            PlayerConfig.frameHeight,
          ),
        },
      ],
      obstacles: [
        {
          name: 'Spike Block',
          detail: 'Toothed ground block — jump over it',
          icon: spike,
        },
        {
          name: 'Crate Block',
          detail: 'Solid cube — clear with a jump',
          icon: rock,
        },
        {
          name: 'Hover Block',
          detail: 'Floating block — time your jump',
          icon: moving,
        },
        {
          name: 'Pits',
          detail: 'Gaps in the track — jump the gap',
          icon: pit,
        },
      ],
      powers: [
        {
          name: 'Shield',
          detail: 'Blocks one obstacle hit',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.Shield, 'spin'),
        },
        {
          name: 'Magnet',
          detail: 'Pulls coins and pickups to you',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.Magnet, 'spin'),
        },
        {
          name: 'Speed',
          detail: 'Run faster for a short time',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.SpeedBoost, 'spin'),
        },
        {
          name: 'Slow-Mo',
          detail: 'World slows so you can react',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.SlowMotion, 'spin'),
        },
        {
          name: '1-Up',
          detail: 'Extra life — revive once if you die',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.ExtraLife, 'spin'),
        },
      ],
      pickups: [
        {
          name: 'Coins',
          detail: '+score and banked coins',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.Coin, 'spin'),
        },
        {
          name: 'Gems',
          detail: 'Big score + more coins',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.Gem, 'spin'),
        },
        {
          name: 'Score Orb',
          detail: 'Large score bonus',
          icon: GuidePreviewFactory.sheet(scene, AssetKeys.Sprites.ScorePickup, 'spin'),
        },
      ],
    };
  }

  private static atlasFrame(
    scene: Phaser.Scene,
    atlasKey: string,
    frameName: string,
    motion: GuideMotion,
  ): GuideIconPreview {
    const texture = scene.textures.get(atlasKey);
    const frame = texture.get(frameName);
    const src = GuidePreviewFactory.drawFrame(texture, frame);
    return {
      src,
      frameCount: 1,
      frameWidth: frame.width,
      frameHeight: frame.height,
      motion,
    };
  }

  private static sheet(
    scene: Phaser.Scene,
    textureKey: string,
    motion: GuideMotion,
  ): GuideIconPreview {
    return GuidePreviewFactory.sheetRange(
      scene,
      textureKey,
      0,
      CollectibleConfig.frameCount - 1,
      motion,
    );
  }

  private static sheetRange(
    scene: Phaser.Scene,
    textureKey: string,
    start: number,
    end: number,
    motion: GuideMotion,
    fallbackW = 32,
    fallbackH = 32,
  ): GuideIconPreview {
    if (!scene.textures.exists(textureKey)) {
      return { src: '', frameCount: 1, frameWidth: fallbackW, frameHeight: fallbackH, motion };
    }

    const texture = scene.textures.get(textureKey);
    const frameCount = end - start + 1;
    const baseFrameKey = String(start);
    const zeroKey = '0';
    const base = texture.has(baseFrameKey)
      ? texture.get(baseFrameKey)
      : texture.has(zeroKey)
        ? texture.get(zeroKey)
        : texture.get();
    const frameWidth = base?.cutWidth || fallbackW;
    const frameHeight = base?.cutHeight || fallbackH;

    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * frameCount;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { src: '', frameCount: 1, frameWidth, frameHeight, motion };
    }

    for (let i = 0; i < frameCount; i++) {
      const frameKey = String(start + i);
      if (!texture.has(frameKey)) {
        continue;
      }
      const frame = texture.get(frameKey);
      GuidePreviewFactory.blit(ctx, texture, frame, i * frameWidth, 0);
    }

    return {
      src: canvas.toDataURL('image/png'),
      frameCount,
      frameWidth,
      frameHeight,
      motion,
    };
  }

  private static drawFrame(
    texture: Phaser.Textures.Texture,
    frame: Phaser.Textures.Frame,
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, frame.width);
    canvas.height = Math.max(1, frame.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }
    GuidePreviewFactory.blit(ctx, texture, frame, 0, 0);
    return canvas.toDataURL('image/png');
  }

  private static blit(
    ctx: CanvasRenderingContext2D,
    texture: Phaser.Textures.Texture,
    frame: Phaser.Textures.Frame,
    dx: number,
    dy: number,
  ): void {
    const source = texture.getSourceImage() as CanvasImageSource;
    ctx.drawImage(
      source,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      dx,
      dy,
      frame.width,
      frame.height,
    );
  }
}
