import type { ParallaxLayerConfig } from '@/config/WorldConfig';

export class ParallaxLayer {
  private readonly tileSprite: Phaser.GameObjects.TileSprite;
  private readonly scrollFactor: number;
  private readonly tileWidth: number;
  private accumulatedOffset = 0;

  constructor(
    scene: Phaser.Scene,
    config: ParallaxLayerConfig,
    viewportWidth: number,
  ) {
    this.scrollFactor = config.scrollFactor;
    this.tileWidth = config.tileWidth;

    this.tileSprite = scene.add.tileSprite(
      0,
      config.y,
      viewportWidth + config.tileWidth,
      config.height,
      config.key,
    );
    this.tileSprite.setOrigin(0, 0);
    this.tileSprite.setDepth(config.depth);
    this.tileSprite.setScrollFactor(0);
  }

  update(deltaMs: number, baseSpeed: number): void {
    const scrollAmount = (baseSpeed * this.scrollFactor * deltaMs) / 1000;
    this.accumulatedOffset += scrollAmount;
    this.tileSprite.tilePositionX = this.accumulatedOffset % this.tileWidth;
  }

  setDepth(depth: number): void {
    this.tileSprite.setDepth(depth);
  }

  destroy(): void {
    this.tileSprite.destroy();
  }
}
