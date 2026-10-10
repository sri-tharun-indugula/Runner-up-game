import { AssetKeys } from '@/config/AssetKeys';
import { ThemeConfig } from '@/config/ThemeConfig';
import { CollectibleConfig, CollectibleType } from '@/config/CollectibleConfig';
import { GroundConfig } from '@/config/GroundConfig';
import { ParallaxLayerConfigs } from '@/config/WorldConfig';
import {
  PLAYER_FRAME_COUNT,
  PlayerConfig,
  PlayerFrameRanges,
} from '@/config/PlayerConfig';
import {
  createPlaceholderTexture,
  createSoftCircleTexture,
  createSparkTexture,
  createSpritesheetTexture,
} from '@/utils/TextureUtils';

export interface AssetDefinition {
  key: string;
  path: string;
}

export class AssetManager {
  static readonly imageAssets: AssetDefinition[] = [
    { key: AssetKeys.Images.Logo, path: 'assets/images/logo.png' },
    { key: AssetKeys.Images.Background, path: 'assets/images/background.png' },
    { key: AssetKeys.Images.Ground, path: 'assets/images/ground.png' },
    { key: AssetKeys.Images.BgSky, path: 'assets/images/bg-sky.png' },
    { key: AssetKeys.Images.BgMountains, path: 'assets/images/bg-mountains.png' },
    { key: AssetKeys.Images.BgTrees, path: 'assets/images/bg-trees.png' },
    { key: AssetKeys.Images.BgGround, path: 'assets/images/bg-ground.png' },
    { key: AssetKeys.Images.GroundTile1, path: 'assets/images/ground-tile-1.png' },
    { key: AssetKeys.Images.GroundTile2, path: 'assets/images/ground-tile-2.png' },
    { key: AssetKeys.Images.GroundTile3, path: 'assets/images/ground-tile-3.png' },
    { key: AssetKeys.Images.ObstacleSpike, path: 'assets/images/obstacle-spike.png' },
    { key: AssetKeys.Images.ObstacleRock, path: 'assets/images/obstacle-rock.png' },
    { key: AssetKeys.Images.ObstacleMoving, path: 'assets/images/obstacle-moving.png' },
    { key: AssetKeys.Images.ObstaclePitMarker, path: 'assets/images/obstacle-pit-marker.png' },
  ];

  static readonly audioAssets: AssetDefinition[] = [
    { key: AssetKeys.Audio.Bgm, path: 'assets/audio/bgm.mp3' },
    { key: AssetKeys.Audio.Jump, path: 'assets/audio/jump.mp3' },
    { key: AssetKeys.Audio.Collect, path: 'assets/audio/collect.mp3' },
  ];

  static loadImages(scene: Phaser.Scene): void {
    for (const asset of AssetManager.imageAssets) {
      scene.load.image(asset.key, asset.path);
    }
  }

  static loadAudio(scene: Phaser.Scene): void {
    for (const asset of AssetManager.audioAssets) {
      scene.load.audio(asset.key, asset.path);
    }
  }

  static createPlayerSpritesheet(scene: Phaser.Scene): void {
    const { frameWidth, frameHeight } = PlayerConfig;

    if (scene.textures.exists(AssetKeys.Sprites.Player)) {
      scene.textures.remove(AssetKeys.Sprites.Player);
    }

    createSpritesheetTexture(
      scene,
      AssetKeys.Sprites.Player,
      frameWidth,
      frameHeight,
      PLAYER_FRAME_COUNT,
      (graphics, frameIndex, offsetX) => {
        AssetManager.drawRunnerFrame(graphics, frameIndex, offsetX, frameWidth, frameHeight);
      },
    );
  }

  private static drawRunnerFrame(
    graphics: Phaser.GameObjects.Graphics,
    frameIndex: number,
    offsetX: number,
    frameWidth: number,
    frameHeight: number,
  ): void {
    const group = AssetManager.getFrameGroup(frameIndex);
    const cx = offsetX + frameWidth / 2;
    const runLen = PlayerFrameRanges.run.end - PlayerFrameRanges.run.start + 1;
    const runCycle = frameIndex - PlayerFrameRanges.run.start;
    const jumpStep = frameIndex - PlayerFrameRanges.jump.start;
    const fallStep = frameIndex - PlayerFrameRanges.fall.start;
    const landStep = frameIndex - PlayerFrameRanges.land.start;
    const idleStep = frameIndex - PlayerFrameRanges.idle.start;

    let bob = 0;
    let lean = 0;
    let lift = 0;
    let frontKick = 0;
    let backKick = 0;
    let legExtend = 0;
    let armSwing = 0;
    let armLift = 0;
    let squashY = 0;
    let hairFlip = 0;

    if (group === 'idle') {
      bob = Math.sin((idleStep / 4) * Math.PI * 2) * 1.5;
      armSwing = Math.sin((idleStep / 4) * Math.PI * 2) * 2;
    } else if (group === 'run') {
      const t = (runCycle / runLen) * Math.PI * 2;
      bob = Math.abs(Math.sin(t)) * 3.5;
      lean = 3;
      frontKick = Math.sin(t) * 14;
      backKick = Math.sin(t + Math.PI) * 14;
      armSwing = Math.sin(t) * 12;
      hairFlip = Math.sin(t) * 2;
    } else if (group === 'jump') {
      if (jumpStep === 0) {
        squashY = 5;
        lift = 2;
        armLift = 4;
        frontKick = -4;
        backKick = 4;
      } else if (jumpStep === 1) {
        lift = -14;
        legExtend = 10;
        armLift = -16;
        frontKick = 6;
        backKick = -8;
        hairFlip = -3;
      } else {
        lift = -18;
        legExtend = 14;
        armLift = -10;
        frontKick = 8;
        backKick = -6;
        hairFlip = -5;
      }
    } else if (group === 'fall') {
      lift = fallStep === 0 ? -4 : 2;
      armLift = 10 + fallStep * 4;
      frontKick = -6;
      backKick = 8;
      hairFlip = 4;
    } else {
      squashY = landStep === 0 ? 7 : 3;
      lift = landStep === 0 ? 5 : 2;
      armLift = landStep === 0 ? 6 : 2;
      frontKick = landStep === 0 ? -2 : 0;
      backKick = landStep === 0 ? 2 : 0;
    }

    const headY = frameHeight * 0.18 + bob + lift + squashY * 0.35;
    const torsoTop = frameHeight * 0.3 + bob + lift + squashY * 0.45;
    const hipY = frameHeight * 0.52 + bob + lift + squashY * 0.2;
    const torsoH = 22 - squashY * 0.5;

    const shadowScale = group === 'jump' || group === 'fall' ? 0.55 : 1;
    graphics.fillStyle(0x000000, 0.28 * shadowScale);
    graphics.fillEllipse(cx + lean, frameHeight - 2, 26 * shadowScale, 6 * shadowScale);

    graphics.fillStyle(ThemeConfig.playerPants, 1);
    graphics.fillRoundedRect(cx + 1 + backKick * 0.16 + lean, hipY, 7, 18 - legExtend * 0.15, 2);
    graphics.fillStyle(ThemeConfig.playerShoes, 1);
    graphics.fillRoundedRect(cx + backKick * 0.22 + lean, hipY + 15 - legExtend * 0.1, 11, 6, 2);

    graphics.fillStyle(ThemeConfig.playerPants, 1);
    graphics.fillRoundedRect(cx - 9 + frontKick * 0.16 + lean, hipY, 7, 18 + legExtend * 0.25, 2);
    graphics.fillStyle(ThemeConfig.playerShoes, 1);
    graphics.fillRoundedRect(cx - 11 + frontKick * 0.24 + lean, hipY + 15 + legExtend * 0.2, 11, 6, 2);

    graphics.fillStyle(0x0b1020, 1);
    graphics.fillRoundedRect(cx - 12 + lean, torsoTop - 1, 24, torsoH + 2, 6);
    graphics.fillStyle(ThemeConfig.playerSuit, 1);
    graphics.fillRoundedRect(cx - 11 + lean, torsoTop, 22, torsoH, 5);
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillRect(cx - 7 + lean, torsoTop + 4, 7, 3);
    graphics.fillStyle(ThemeConfig.neonMagenta, 0.9);
    graphics.fillRect(cx - 2 + lean, torsoTop + 9, 4, Math.max(6, torsoH - 12));

    graphics.fillStyle(ThemeConfig.playerSkin, 1);
    graphics.fillRoundedRect(cx - 17 + lean, torsoTop + 3 + armSwing * 0.28 + armLift * 0.2, 6, 14, 2);
    graphics.fillRoundedRect(cx + 11 + lean, torsoTop + 3 - armSwing * 0.28 + armLift * 0.2, 6, 14, 2);
    graphics.fillStyle(ThemeConfig.neonCyan, 0.75);
    graphics.fillCircle(cx - 14 + lean, torsoTop + 15 + armSwing * 0.28 + armLift * 0.15, 2.2);
    graphics.fillCircle(cx + 14 + lean, torsoTop + 15 - armSwing * 0.28 + armLift * 0.15, 2.2);

    graphics.fillStyle(ThemeConfig.playerSkin, 1);
    graphics.fillCircle(cx + lean, headY, 10);
    graphics.fillStyle(ThemeConfig.playerHair, 1);
    graphics.fillTriangle(
      cx - 8 + lean + hairFlip,
      headY - 4,
      cx + lean + hairFlip * 0.5,
      headY - 15,
      cx + 8 + lean,
      headY - 3,
    );
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillCircle(cx + 3.5 + lean, headY - 1, 2.2);
    graphics.fillStyle(ThemeConfig.neonYellow, 1);
    graphics.fillCircle(cx + 3.5 + lean, headY - 1, 0.9);
    graphics.fillStyle(0x1a1a2e, 0.7);
    graphics.fillRect(cx + 1 + lean, headY + 3, 5, 1.5);
  }

  private static getFrameGroup(frameIndex: number): string {
    if (frameIndex <= PlayerFrameRanges.idle.end) return 'idle';
    if (frameIndex <= PlayerFrameRanges.run.end) return 'run';
    if (frameIndex <= PlayerFrameRanges.jump.end) return 'jump';
    if (frameIndex <= PlayerFrameRanges.fall.end) return 'fall';
    return 'land';
  }

  static createGroundTileTextures(scene: Phaser.Scene): void {
    const { segmentWidth } = GroundConfig;
    const height = 80;
    const variants = [
      { base: ThemeConfig.groundDark, top: ThemeConfig.neonCyan, lane: 0x22144a },
      { base: ThemeConfig.groundMid, top: ThemeConfig.neonMagenta, lane: 0x2a1b55 },
      { base: ThemeConfig.groundLight, top: ThemeConfig.neonYellow, lane: 0x341f66 },
    ];
    const keys = [
      AssetKeys.Images.GroundTile1,
      AssetKeys.Images.GroundTile2,
      AssetKeys.Images.GroundTile3,
    ];

    keys.forEach((key, index) => {
      const v = variants[index];
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(v.base, 1);
      g.fillRect(0, 0, segmentWidth, height);
      g.fillStyle(v.lane, 1);
      g.fillRect(0, 18, segmentWidth, 10);
      g.lineStyle(3, v.top, 0.9);
      g.lineBetween(0, 4, segmentWidth, 4);
      for (let x = 16; x < segmentWidth; x += 48) {
        g.fillStyle(v.top, 0.55);
        g.fillRect(x, 20, 18, 4);
      }
      g.fillStyle(0x000000, 0.25);
      g.fillRect(0, height - 10, segmentWidth, 10);
      g.generateTexture(key, segmentWidth, height);
      g.destroy();
    });
  }

  static createObstacleTextures(scene: Phaser.Scene): void {
    const spikeW = 44;
    const spikeH = 52;
    const spike = scene.make.graphics({ x: 0, y: 0 }, false);
    // Spiked block: solid crate with triangular teeth on top.
    spike.fillStyle(0x1a0f3a, 1);
    spike.fillRoundedRect(2, 18, spikeW - 4, spikeH - 20, 4);
    spike.fillStyle(ThemeConfig.spike, 1);
    spike.fillRoundedRect(4, 20, spikeW - 8, spikeH - 24, 3);
    spike.fillStyle(ThemeConfig.neonMagenta, 1);
    spike.fillTriangle(8, 20, 14, 4, 20, 20);
    spike.fillTriangle(18, 20, 24, 2, 30, 20);
    spike.fillTriangle(28, 20, 34, 5, 40, 20);
    spike.fillStyle(0xffffff, 0.35);
    spike.fillRect(8, 26, 10, 3);
    spike.lineStyle(2, 0xffffff, 0.45);
    spike.strokeRoundedRect(4, 20, spikeW - 8, spikeH - 24, 3);
    spike.generateTexture(AssetKeys.Images.ObstacleSpike, spikeW, spikeH);
    spike.destroy();

    const rockW = 56;
    const rockH = 56;
    const rock = scene.make.graphics({ x: 0, y: 0 }, false);
    rock.fillStyle(0x0b1020, 1);
    rock.fillRoundedRect(1, 1, rockW - 2, rockH - 2, 6);
    rock.fillStyle(ThemeConfig.rock, 1);
    rock.fillRoundedRect(4, 4, rockW - 8, rockH - 8, 5);
    rock.fillStyle(0x5c677d, 1);
    rock.fillRect(10, 12, rockW - 20, 8);
    rock.fillRect(10, 28, rockW - 20, 8);
    rock.fillStyle(ThemeConfig.neonCyan, 0.75);
    rock.fillRect(8, 8, 14, 3);
    rock.fillRect(rockW - 22, rockH - 14, 12, 3);
    rock.lineStyle(2, ThemeConfig.neonCyan, 0.55);
    rock.strokeRoundedRect(4, 4, rockW - 8, rockH - 8, 5);
    rock.generateTexture(AssetKeys.Images.ObstacleRock, rockW, rockH);
    rock.destroy();

    const movingSize = 48;
    const moving = scene.make.graphics({ x: 0, y: 0 }, false);
    moving.fillStyle(0x0b1020, 1);
    moving.fillRoundedRect(2, 2, movingSize - 4, movingSize - 4, 6);
    moving.fillStyle(ThemeConfig.moving, 1);
    moving.fillRoundedRect(5, 5, movingSize - 10, movingSize - 10, 5);
    moving.fillStyle(0xffffff, 0.35);
    moving.fillRect(10, 10, 12, 4);
    moving.fillStyle(ThemeConfig.neonYellow, 1);
    moving.fillCircle(movingSize / 2, movingSize / 2, 6);
    moving.lineStyle(3, ThemeConfig.neonYellow, 0.9);
    moving.strokeRoundedRect(5, 5, movingSize - 10, movingSize - 10, 5);
    moving.generateTexture(AssetKeys.Images.ObstacleMoving, movingSize, movingSize);
    moving.destroy();

    const marker = scene.make.graphics({ x: 0, y: 0 }, false);
    marker.fillStyle(ThemeConfig.pitMarker, 1);
    marker.fillRoundedRect(4, 0, 16, 36, 3);
    marker.fillStyle(0x0b1020, 1);
    marker.fillRect(7, 6, 10, 8);
    marker.fillRect(7, 20, 10, 8);
    marker.generateTexture(AssetKeys.Images.ObstaclePitMarker, 24, 36);
    marker.destroy();
  }

  static createCollectibleTextures(scene: Phaser.Scene): void {
    const specs: Array<{
      type: CollectibleType;
      key: string;
      color: number;
      draw: (
        graphics: Phaser.GameObjects.Graphics,
        offsetX: number,
        size: number,
        frameIndex: number,
      ) => void;
    }> = [
      {
        type: CollectibleType.Coin,
        key: AssetKeys.Sprites.Coin,
        color: 0xffd166,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2;
          const radius = size * 0.35 + (frameIndex % 3);
          graphics.fillStyle(0xffd166, 1);
          graphics.fillCircle(cx, cy, radius);
          graphics.fillStyle(0xf4a261, 1);
          graphics.fillCircle(cx, cy, radius * 0.55);
        },
      },
      {
        type: CollectibleType.Gem,
        key: AssetKeys.Sprites.Gem,
        color: 0x4cc9f0,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2;
          const pulse = 1 + (frameIndex % 3) * 0.05;
          graphics.fillStyle(0x4cc9f0, 1);
          graphics.fillTriangle(
            cx,
            cy - 14 * pulse,
            cx - 12 * pulse,
            cy + 4,
            cx + 12 * pulse,
            cy + 4,
          );
          graphics.fillStyle(0x4361ee, 1);
          graphics.fillTriangle(
            cx,
            cy + 14 * pulse,
            cx - 12 * pulse,
            cy + 4,
            cx + 12 * pulse,
            cy + 4,
          );
        },
      },
      {
        type: CollectibleType.Magnet,
        key: AssetKeys.Sprites.Magnet,
        color: 0xe63946,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const midY = size / 2;
          const open = 4 + (frameIndex % 3);
          graphics.fillStyle(0xe63946, 1);
          graphics.fillRect(cx - 12, midY - 10, 8, 20);
          graphics.fillRect(cx + 4, midY - 10, 8, 20);
          graphics.fillRect(cx - 12, midY + 6, 24, 8);
          graphics.fillStyle(0x1d3557, 1);
          graphics.fillRect(cx - open, midY - 8, open * 2, 12);
        },
      },
      {
        type: CollectibleType.ScorePickup,
        key: AssetKeys.Sprites.ScorePickup,
        color: 0x06d6a0,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const midY = size / 2;
          const lift = (frameIndex % 3) - 1;
          graphics.fillStyle(0x06d6a0, 1);
          graphics.fillRoundedRect(cx - 12, midY - 10 + lift, 24, 20, 4);
          graphics.fillStyle(0xffffff, 1);
          graphics.fillRect(cx - 6, midY - 2 + lift, 12, 3);
          graphics.fillRect(cx - 1.5, midY - 6 + lift, 3, 12);
        },
      },
      {
        type: CollectibleType.Shield,
        key: AssetKeys.Sprites.Shield,
        color: 0x4cc9f0,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2;
          const r = 11 + (frameIndex % 3);
          graphics.lineStyle(3, 0x4cc9f0, 1);
          graphics.strokeCircle(cx, cy, r);
          graphics.fillStyle(0x90e0ef, 0.35);
          graphics.fillCircle(cx, cy, r - 2);
        },
      },
      {
        type: CollectibleType.SpeedBoost,
        key: AssetKeys.Sprites.SpeedBoost,
        color: 0xf77f00,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2;
          const skew = (frameIndex % 3) - 1;
          graphics.fillStyle(0xf77f00, 1);
          graphics.fillTriangle(cx - 10 + skew, cy + 8, cx - 2 + skew, cy - 10, cx + 4 + skew, cy + 2);
          graphics.fillTriangle(cx - 2 + skew, cy + 10, cx + 6 + skew, cy - 8, cx + 12 + skew, cy + 4);
        },
      },
      {
        type: CollectibleType.SlowMotion,
        key: AssetKeys.Sprites.SlowMotion,
        color: 0x90e0ef,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2;
          const angle = frameIndex * 15;
          graphics.fillStyle(0x90e0ef, 1);
          graphics.fillCircle(cx, cy, 12);
          graphics.fillStyle(0x023e8a, 1);
          graphics.fillCircle(cx, cy, 8);
          graphics.fillStyle(0xffffff, 1);
          graphics.fillRect(cx - 1, cy - 7, 2, 8);
          graphics.fillRect(cx - 1, cy - 1, 6 + (angle % 3), 2);
        },
      },
      {
        type: CollectibleType.ExtraLife,
        key: AssetKeys.Sprites.ExtraLife,
        color: 0x06d6a0,
        draw: (graphics, offsetX, size, frameIndex) => {
          const cx = offsetX + size / 2;
          const cy = size / 2 + (frameIndex % 2);
          graphics.fillStyle(0x06d6a0, 1);
          graphics.fillCircle(cx - 5, cy - 2, 6);
          graphics.fillCircle(cx + 5, cy - 2, 6);
          graphics.fillTriangle(cx - 11, cy - 1, cx + 11, cy - 1, cx, cy + 11);
        },
      },
    ];

    for (const spec of specs) {
      const size = Math.max(
        CollectibleConfig.sizes[spec.type].width,
        CollectibleConfig.sizes[spec.type].height,
      );

      createSpritesheetTexture(
        scene,
        spec.key,
        size,
        size,
        CollectibleConfig.frameCount,
        (graphics, frameIndex, offsetX) => {
          spec.draw(graphics, offsetX, size, frameIndex);
        },
      );
    }
  }

  static createParticleTextures(scene: Phaser.Scene): void {
    createSoftCircleTexture(scene, AssetKeys.Images.ParticleSoft, 16, 0xffffff);
    createSoftCircleTexture(scene, AssetKeys.Images.ParticleDust, 12, 0xc4a574);
    createSparkTexture(scene, AssetKeys.Images.ParticleSpark, 14);
  }

  /** Generates placeholder textures until real assets are added in later milestones. */
  static createPlaceholderAssets(scene: Phaser.Scene): void {
    (() => {
      const logo = scene.make.graphics({ x: 0, y: 0 }, false);
      logo.fillStyle(ThemeConfig.neonCyan, 1);
      logo.fillRoundedRect(0, 0, 256, 64, 10);
      logo.fillStyle(0x0b1020, 1);
      logo.fillRoundedRect(8, 8, 240, 48, 8);
      logo.fillStyle(ThemeConfig.neonMagenta, 1);
      logo.fillRect(24, 22, 18, 20);
      logo.fillStyle(ThemeConfig.neonYellow, 1);
      logo.fillRect(52, 18, 12, 28);
      logo.fillStyle(ThemeConfig.neonCyan, 1);
      logo.fillRect(74, 22, 18, 20);
      logo.fillRect(102, 18, 40, 8);
      logo.fillRect(102, 38, 40, 8);
      logo.generateTexture(AssetKeys.Images.Logo, 256, 64);
      logo.destroy();
    })();
    createPlaceholderTexture(scene, AssetKeys.Images.Background, 1280, 720, ThemeConfig.skyTop);
    createPlaceholderTexture(scene, AssetKeys.Images.Ground, 128, 32, 0x2d6a4f);
    AssetManager.createPlayerSpritesheet(scene);
    AssetManager.createGroundTileTextures(scene);
    AssetManager.createObstacleTextures(scene);
    AssetManager.createCollectibleTextures(scene);
    AssetManager.createParticleTextures(scene);
    AssetManager.createParallaxTextures(scene);
  }

  static createParallaxTextures(scene: Phaser.Scene): void {
    for (const layer of ParallaxLayerConfigs) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      const w = layer.tileWidth;
      const h = Math.max(8, Math.floor(layer.height));

      if (layer.style === 'sky') {
        g.fillStyle(ThemeConfig.skyTop, 1);
        g.fillRect(0, 0, w, h);
        g.fillStyle(ThemeConfig.skyBottom, 1);
        g.fillRect(0, Math.floor(h * 0.45), w, Math.ceil(h * 0.55));
        for (let i = 0; i < 28; i++) {
          const sx = (i * 97) % w;
          const sy = (i * 53) % Math.floor(h * 0.55);
          g.fillStyle(0xffffff, 0.35 + (i % 3) * 0.15);
          g.fillCircle(sx, sy, 1 + (i % 2));
        }
        g.fillStyle(ThemeConfig.neonMagenta, 0.18);
        g.fillCircle(w * 0.75, h * 0.18, 34);
        g.fillStyle(ThemeConfig.neonYellow, 0.22);
        g.fillCircle(w * 0.75, h * 0.18, 18);
      } else if (layer.style === 'city') {
        g.fillStyle(layer.baseColor, 1);
        g.fillRect(0, Math.floor(h * 0.45), w, Math.ceil(h * 0.55));
        const buildings = [40, 70, 55, 90, 48, 78, 60];
        let x = 8;
        buildings.forEach((bh, i) => {
          const bw = 36 + (i % 3) * 10;
          const top = Math.max(0, h - bh);
          g.fillStyle(layer.stripeColor, 1);
          g.fillRect(x, top, bw, bh);
          g.fillStyle(ThemeConfig.neonCyan, 0.55);
          for (let wy = top + 8; wy < h - 8; wy += 12) {
            g.fillRect(x + 6, wy, 4, 4);
            g.fillRect(x + bw - 12, wy, 4, 4);
          }
          x += bw + 14;
        });
      } else if (layer.style === 'neon-trees') {
        g.fillStyle(0x120a28, 1);
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 7; i++) {
          const tx = 30 + i * 65;
          const th = 70 + (i % 3) * 18;
          g.lineStyle(3, ThemeConfig.neonCyan, 0.85);
          g.lineBetween(tx, h, tx, h - th);
          g.lineStyle(2, ThemeConfig.neonMagenta, 0.75);
          g.lineBetween(tx, h - th * 0.55, tx - 18, h - th * 0.75);
          g.lineBetween(tx, h - th * 0.4, tx + 20, h - th * 0.65);
        }
      } else {
        g.fillStyle(ThemeConfig.groundDark, 1);
        g.fillRect(0, 0, w, h);
        g.fillStyle(ThemeConfig.neonCyan, 0.35);
        g.fillRect(0, 0, w, 4);
        for (let x = 0; x < w; x += 40) {
          g.fillStyle(ThemeConfig.neonYellow, 0.45);
          g.fillRect(x + 8, 14, 16, 3);
        }
      }

      g.generateTexture(layer.key, w, h);
      g.destroy();
    }
  }
}
