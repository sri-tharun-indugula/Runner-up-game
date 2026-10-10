import { GroundConfig } from '@/config/GroundConfig';
import { PitRegistry } from '@/managers/PitRegistry';

export class GroundGenerator {
  constructor(private readonly pitRegistry: PitRegistry) {}

  getSegmentWorldX(segmentIndex: number): number {
    return segmentIndex * GroundConfig.segmentWidth;
  }

  shouldHaveGround(segmentIndex: number): boolean {
    const segmentStart = this.getSegmentWorldX(segmentIndex);
    const segmentEnd = segmentStart + GroundConfig.segmentWidth;
    return !this.pitRegistry.overlaps(segmentStart, segmentEnd);
  }

  getTileKey(segmentIndex: number): string {
    const index = Math.abs(segmentIndex) % GroundConfig.tileVariations.length;
    return GroundConfig.tileVariations[index];
  }

  getSegmentCenterX(segmentIndex: number): number {
    return this.getSegmentWorldX(segmentIndex) + GroundConfig.segmentWidth / 2;
  }
}
