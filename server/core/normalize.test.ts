import { describe, expect, it } from 'vitest';
import { normalizeManuscript } from './normalize';

describe('normalizeManuscript', () => {
  it('normalizes whitespace and newlines deterministically', () => {
    const result = normalizeManuscript('  Hola   mundo  \r\n\r\n\r\nAdiós.  ');
    expect(result.text).toBe('Hola   mundo\n\nAdiós.');
    expect(result.wordCount).toBe(4);
    expect(result.paragraphCount).toBe(2);
  });

  it('preserves unicode', () => {
    const result = normalizeManuscript('Érase una vez: niño, corazón y acción.');
    expect(result.text).toContain('Érase');
    expect(result.text).toContain('corazón');
    expect(result.wordCount).toBe(7);
  });

  it('returns a stable sha256 hash', () => {
    const a = normalizeManuscript('Texto de prueba');
    const b = normalizeManuscript('  Texto de prueba  ');
    expect(a.hash).toBe(b.hash);
  });

  it('handles empty input without throwing', () => {
    const result = normalizeManuscript('   \n\n ');
    expect(result.text).toBe('');
    expect(result.wordCount).toBe(0);
    expect(result.warnings).toContain('Manuscript is empty.');
  });
});
