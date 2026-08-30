import { describe, expect, it } from 'vitest';
import { ResultCache } from './cache';

describe('ResultCache', () => {
  it('stores and retrieves results without regeneration', () => {
    const cache = new ResultCache<string>();
    cache.set('abc', 'resultado');
    expect(cache.has('abc')).toBe(true);
    expect(cache.get('abc')).toBe('resultado');
    expect(cache.size).toBe(1);
  });

  it('supports deletion and clearing', () => {
    const cache = new ResultCache<number>();
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.delete('a')).toBe(true);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
