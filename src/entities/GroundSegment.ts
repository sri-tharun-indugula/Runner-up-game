import { GroundConfig, GroundTileConfig } from '@/config/GroundConfig';
import { GroundGenerator } from '@/managers/GroundGenerator';

export class GroundSegment {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private segmentIndex = 0;

  constructor(
    groundGroup: Phaser.Physics.Arcade.StaticGroup,
    generator: GroundGenerator,
    segmentIndex: number,
  ) {
    const tileKey = generator.getTileKey(segmentIndex);
    const x = generator.getSegmentCenterX(segmentIndex);

    this.sprite = groundGroup.create(
      x,
      GroundTileConfig.centerY,
      tileKey,
    ) as Phaser.Physics.Arcade.Sprite;

    this.sprite.setDisplaySize(GroundConfig.segmentWidth, GroundTileConfig.height);
    this.sprite.setDepth(GroundConfig.depth);
    this.configureSegment(segmentIndex, generator);
  }

  getSegmentIndex(): number {
    return this.segmentIndex;
  }

  getLeft(): number {
    return this.sprite.x - GroundConfig.segmentWidth / 2;
  }

  getRight(): number {
    return this.sprite.x + GroundConfig.segmentWidth / 2;
  }

  reposition(segmentIndex: number, generator: GroundGenerator): void {
    const tileKey = generator.getTileKey(segmentIndex);
    const x = generator.getSegmentCenterX(segmentIndex);

    this.sprite.setTexture(tileKey);
    this.sprite.setPosition(x, GroundTileConfig.centerY);
    this.configureSegment(segmentIndex, generator);
  }

  reconfigure(generator: GroundGenerator): void {
    this.configureSegment(this.segmentIndex, generator);
  }

  private configureSegment(segmentIndex: number, generator: GroundGenerator): void {
    this.segmentIndex = segmentIndex;
    const hasCollision = generator.shouldHaveGround(segmentIndex);

    this.sprite.setVisible(hasCollision);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    if (hasCollision) {
      body.enable = true;
      this.sprite.refreshBody();
    } else {
      body.enable = false;
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
