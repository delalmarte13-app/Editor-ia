import { createHash } from 'node:crypto';
import type { Manuscript } from './domain';

export interface NormalizedManuscript {
  text: string;
  hash: string;
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  warnings: string[];
}

/** Deterministic preprocessing: no LLM/token cost. */
export function normalizeManuscript(input: string): NormalizedManuscript {
  const source = typeof input === 'string' ? input : String(input ?? '');
  const text = source
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = text ? text.split(/\s+/u).filter(Boolean) : [];
  const paragraphs = text ? text.split(/\n\s*\n/u).filter(Boolean) : [];
  const warnings: string[] = [];
  if (!text) warnings.push('Manuscript is empty.');

  return {
    text,
    hash: createHash('sha256').update(text, 'utf8').digest('hex'),
    wordCount: words.length,
    characterCount: text.length,
    paragraphCount: paragraphs.length,
    warnings,
  };
}

export function toManuscript(
  id: string,
  projectId: string,
  versionId: string,
  normalized: NormalizedManuscript,
  language?: string,
): Manuscript {
  return {
    id,
    projectId,
    versionId,
    text: normalized.text,
    language,
    wordCount: normalized.wordCount,
    characterCount: normalized.characterCount,
    hash: normalized.hash,
  };
}
