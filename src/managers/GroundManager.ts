import { GroundConfig, GroundTileConfig } from '@/config/GroundConfig';
import { GroundSegment } from '@/entities/GroundSegment';
import { GroundGenerator } from '@/managers/GroundGenerator';
import { PitRegistry } from '@/managers/PitRegistry';

export class GroundManager {
  private readonly scene: Phaser.Scene;
  private readonly groundGroup: Phaser.Physics.Arcade.StaticGroup;
  private readonly generator: GroundGenerator;
  private readonly segments: GroundSegment[] = [];
  private highestSegmentIndex = -1;

  constructor(scene: Phaser.Scene, pitRegistry: PitRegistry) {
    this.scene = scene;
    this.generator = new GroundGenerator(pitRegistry);
    this.groundGroup = this.scene.physics.add.staticGroup();
    this.spawnInitialSegments();
  }

  update(scrollX: number): void {
    this.recycleSegments(scrollX);
    this.ensureCoverage(scrollX);
  }

  refreshAllSegments(): void {
    for (const segment of this.segments) {
      segment.reconfigure(this.generator);
    }
  }

  getGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.groundGroup;
  }

  getSurfaceY(): number {
    return GroundTileConfig.surfaceY;
  }

  destroy(): void {
    for (const segment of this.segments) {
      segment.destroy();
    }
    this.segments.length = 0;
    this.groundGroup.clear(true, true);
  }

  private spawnInitialSegments(): void {
    for (let i = 0; i < GroundConfig.poolSize; i++) {
      const segment = new GroundSegment(this.groundGroup, this.generator, i);
      this.segments.push(segment);
      this.highestSegmentIndex = i;
    }

    // Cover from world start (scrollX = 0). Using a mid-viewport x recycled
    // early segments out from under the player and caused instant fall deaths.
    this.ensureCoverage(0);
  }

  private ensureCoverage(scrollX: number): void {
    const coverageTarget = scrollX + GroundConfig.spawnAheadMargin + this.scene.cameras.main.width;

    while (this.getRightmostEdge() < coverageTarget) {
      this.recycleLeftmostSegment();
    }
  }

  private recycleSegments(scrollX: number): void {
    const recycleThreshold = scrollX - GroundConfig.recycleMargin;

    for (const segment of this.segments) {
      if (segment.getRight() < recycleThreshold) {
        this.highestSegmentIndex++;
        segment.reposition(this.highestSegmentIndex, this.generator);
      }
    }
  }

  private recycleLeftmostSegment(): void {
    const leftmost = this.findLeftmostSegment();
    if (!leftmost) {
      return;
    }

    this.highestSegmentIndex++;
    leftmost.reposition(this.highestSegmentIndex, this.generator);
  }

  private findLeftmostSegment(): GroundSegment | null {
    if (this.segments.length === 0) {
      return null;
    }

    return this.segments.reduce((leftmost, segment) =>
      segment.getLeft() < leftmost.getLeft() ? segment : leftmost,
    );
  }

  private getRightmostEdge(): number {
    if (this.segments.length === 0) {
      return 0;
    }

    return Math.max(...this.segments.map((segment) => segment.getRight()));
  }
}
