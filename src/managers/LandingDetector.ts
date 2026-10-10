import { PhysicsConfig } from '@/config/PhysicsConfig';

export interface LandingEvent {
  impactVelocity: number;
  isHardLanding: boolean;
}

export class LandingDetector {
  private wasAirborne = false;
  private peakFallVelocity = 0;
  private readonly onLand: (event: LandingEvent) => void;

  constructor(onLand: (event: LandingEvent) => void) {
    this.onLand = onLand;
  }

  update(body: Phaser.Physics.Arcade.Body): void {
    const onGround = body.blocked.down || body.touching.down;

    if (!onGround) {
      if (body.velocity.y > this.peakFallVelocity) {
        this.peakFallVelocity = body.velocity.y;
      }
      this.wasAirborne = true;
      return;
    }

    if (this.wasAirborne && body.velocity.y >= 0) {
      const impactVelocity = this.peakFallVelocity;
      const isHardLanding = impactVelocity >= PhysicsConfig.hardLandingVelocity;

      if (impactVelocity >= PhysicsConfig.landingVelocityThreshold) {
        this.onLand({ impactVelocity, isHardLanding });
      }
    }

    this.wasAirborne = false;
    this.peakFallVelocity = 0;
  }

  reset(): void {
    this.wasAirborne = false;
    this.peakFallVelocity = 0;
  }
}
