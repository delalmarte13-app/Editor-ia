import { describe, expect, it } from 'vitest';
import { buildEditorialMemory, compactMemory } from './memory';

describe('editorial memory', () => {
  it('merges and deduplicates structured information', () => {
    const first = buildEditorialMemory({ projectId: 'p1', facts: ['La casa es azul'], characters: ['Leo'] });
    const second = buildEditorialMemory({ projectId: 'p1', facts: ['La casa es azul', 'Hay un perro'], characters: ['Leo', 'Ana'] }, first);
    expect(second.facts).toEqual(['La casa es azul', 'Hay un perro']);
    expect(second.characters).toEqual(['Leo', 'Ana']);
  });

  it('compacts lists without changing their order', () => {
    const memory = buildEditorialMemory({ projectId: 'p1', facts: ['1', '2', '3'] });
    const compacted = compactMemory(memory, 2);
    expect(compacted.facts).toEqual(['2', '3']);
  });
});
