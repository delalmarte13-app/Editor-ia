export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
}

/** In-process cache for deterministic work; prevents duplicate LLM calls upstream. */
export class ResultCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, { key, value, createdAt: Date.now() });
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
