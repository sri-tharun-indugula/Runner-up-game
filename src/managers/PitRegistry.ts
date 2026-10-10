export interface PitZone {
  startX: number;
  width: number;
}

export class PitRegistry {
  private readonly pits: PitZone[] = [];

  register(startX: number, width: number): void {
    this.pits.push({ startX, width });
  }

  unregister(startX: number): void {
    const index = this.pits.findIndex((pit) => pit.startX === startX);
    if (index >= 0) {
      this.pits.splice(index, 1);
    }
  }

  overlaps(startX: number, endX: number): boolean {
    return this.pits.some(
      (pit) => endX > pit.startX && startX < pit.startX + pit.width,
    );
  }

  clear(): void {
    this.pits.length = 0;
  }

  getAll(): readonly PitZone[] {
    return this.pits;
  }
}
