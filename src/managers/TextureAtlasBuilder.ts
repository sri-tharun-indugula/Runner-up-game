import { AssetKeys } from '@/config/AssetKeys';

interface AtlasEntry {
  key: string;
  frame: string;
}

/**
 * Packs small runtime textures into shared atlases to reduce draw-state switches.
 */
export class TextureAtlasBuilder {
  static packGameplayAtlases(scene: Phaser.Scene): void {
    TextureAtlasBuilder.pack(scene, AssetKeys.Atlases.Particles, [
      { key: AssetKeys.Images.ParticleSoft, frame: AssetKeys.Frames.ParticleSoft },
      { key: AssetKeys.Images.ParticleSpark, frame: AssetKeys.Frames.ParticleSpark },
      { key: AssetKeys.Images.ParticleDust, frame: AssetKeys.Frames.ParticleDust },
    ]);

    TextureAtlasBuilder.pack(scene, AssetKeys.Atlases.Obstacles, [
      { key: AssetKeys.Images.ObstacleSpike, frame: AssetKeys.Frames.ObstacleSpike },
      { key: AssetKeys.Images.ObstacleRock, frame: AssetKeys.Frames.ObstacleRock },
      { key: AssetKeys.Images.ObstacleMoving, frame: AssetKeys.Frames.ObstacleMoving },
      { key: AssetKeys.Images.ObstaclePitMarker, frame: AssetKeys.Frames.ObstaclePitMarker },
    ]);
  }

  private static pack(scene: Phaser.Scene, atlasKey: string, entries: AtlasEntry[]): void {
    if (scene.textures.exists(atlasKey)) {
      return;
    }

    const padding = 2;
    const sizes = entries.map((entry) => {
      const texture = scene.textures.get(entry.key);
      const frame = texture.get();
      return { entry, width: frame.width, height: frame.height };
    });

    const cellW = Math.max(...sizes.map((item) => item.width)) + padding * 2;
    const cellH = Math.max(...sizes.map((item) => item.height)) + padding * 2;
    const cols = Math.ceil(Math.sqrt(sizes.length));
    const rows = Math.ceil(sizes.length / cols);
    const atlasW = cols * cellW;
    const atlasH = rows * cellH;

    const canvas = document.createElement('canvas');
    canvas.width = atlasW;
    canvas.height = atlasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const frames: Record<string, { x: number; y: number; width: number; height: number }> = {};

    sizes.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellW + padding;
      const y = row * cellH + padding;
      const source = scene.textures.get(item.entry.key).getSourceImage() as
        | HTMLImageElement
        | HTMLCanvasElement;

      ctx.drawImage(source, x, y, item.width, item.height);
      frames[item.entry.frame] = {
        x,
        y,
        width: item.width,
        height: item.height,
      };
    });

    scene.textures.addCanvas(atlasKey, canvas);
    const atlas = scene.textures.get(atlasKey);
    for (const [frameName, rect] of Object.entries(frames)) {
      atlas.add(frameName, 0, rect.x, rect.y, rect.width, rect.height);
    }

    // Free standalone textures now that atlas frames exist.
    for (const entry of entries) {
      if (scene.textures.exists(entry.key)) {
        scene.textures.remove(entry.key);
      }
    }
  }
}
