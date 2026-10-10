export class LocalStorage {
  static read<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  static write<T>(key: string, value: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }
}
