import { describe, expect, it } from 'vitest';
import { segmentManuscript } from './segment';

describe('segmentManuscript', () => {
  it('returns no segments for empty text', () => {
    expect(segmentManuscript('')).toEqual([]);
  });

  it('keeps small paragraphs together when possible', () => {
    const result = segmentManuscript('Uno.\n\nDos.', { maxCharacters: 1000 });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Uno.\n\nDos.');
  });

  it('splits long paragraphs deterministically', () => {
    const text = 'A'.repeat(1200);
    const first = segmentManuscript(text, { maxCharacters: 600 });
    const second = segmentManuscript(text, { maxCharacters: 600 });
    expect(first).toHaveLength(2);
    expect(first).toEqual(second);
    expect(first.every((segment) => segment.text.length <= 600)).toBe(true);
  });

  it('creates stable ids and hashes', () => {
    const result = segmentManuscript('Capítulo uno.\n\nEscena inicial.', { maxCharacters: 1000 });
    expect(result[0].id).toMatch(/^seg-1-/);
    expect(result[0].hash).toBeTruthy();
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(result[0].text.length);
  });
});
