import { PhysicsConfig } from '@/config/PhysicsConfig';

export class DeathDetector {
  check(playerY: number, playerBottom: number): boolean {
    return playerY > PhysicsConfig.deathZoneY || playerBottom > PhysicsConfig.deathZoneY;
  }
}
