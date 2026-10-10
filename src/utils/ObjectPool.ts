import { PerformanceConfig } from '@/config/PerformanceConfig';

export interface PoolStats {
  available: number;
  active: number;
  total: number;
  maxSize: number;
}

/**
 * Generic object pool with a hard capacity cap (Milestone 17).
 */
export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly active = new Set<T>();
  private readonly factory: () => T;
  private readonly maxSize: number;

  constructor(factory: () => T, initialSize: number, maxSize?: number) {
    this.factory = factory;
    this.maxSize =
      maxSize ?? Math.max(initialSize, Math.ceil(initialSize * PerformanceConfig.poolMaxMultiplier));

    const warm = Math.min(initialSize, this.maxSize);
    for (let i = 0; i < warm; i++) {
      this.available.push(factory());
    }
  }

  /** Returns null when the pool is exhausted at max capacity. */
  acquire(): T | null {
    const existing = this.available.pop();
    if (existing) {
      this.active.add(existing);
      return existing;
    }

    if (this.getTotalCount() >= this.maxSize) {
      return null;
    }

    const created = this.factory();
    this.active.add(created);
    return created;
  }

  release(item: T): void {
    if (!this.active.has(item)) {
      return;
    }
    this.active.delete(item);
    this.available.push(item);
  }

  getActive(): T[] {
    return Array.from(this.active);
  }

  getStats(): PoolStats {
    return {
      available: this.available.length,
      active: this.active.size,
      total: this.getTotalCount(),
      maxSize: this.maxSize,
    };
  }

  releaseAll(releaser: (item: T) => void): void {
    for (const item of this.getActive()) {
      releaser(item);
      this.release(item);
    }
  }

  destroy(destroyer: (item: T) => void): void {
    for (const item of [...this.available, ...this.getActive()]) {
      destroyer(item);
    }
    this.available.length = 0;
    this.active.clear();
  }

  private getTotalCount(): number {
    return this.available.length + this.active.size;
  }
}
