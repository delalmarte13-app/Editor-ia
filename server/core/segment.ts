export interface ManuscriptSegment {
  id: string;
  text: string;
  start: number;
  end: number;
  hash: string;
  chapterId?: string;
}

export interface SegmentOptions {
  maxCharacters?: number;
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Deterministic segmentation. Keeps chunks small so LLM context is not duplicated. */
export function segmentManuscript(text: string, options: SegmentOptions = {}): ManuscriptSegment[] {
  const maxCharacters = Math.max(500, options.maxCharacters ?? 6000);
  const source = text ?? '';
  if (!source.trim()) return [];

  const paragraphs = source.split(/\n\s*\n/u);
  const segments: ManuscriptSegment[] = [];
  let cursor = 0;
  let buffer = '';
  let bufferStart = 0;

  const flush = () => {
    const value = buffer.trim();
    if (!value) return;
    const startOffset = bufferStart + buffer.indexOf(value);
    segments.push({
      id: `seg-${segments.length + 1}-${hashText(value)}`,
      text: value,
      start: startOffset,
      end: startOffset + value.length,
      hash: hashText(value),
    });
    buffer = '';
  };

  for (const paragraph of paragraphs) {
    const start = source.indexOf(paragraph, cursor);
    cursor = start + paragraph.length;
    if (!paragraph.trim()) continue;

    if (paragraph.length > maxCharacters) {
      flush();
      for (let offset = 0; offset < paragraph.length; offset += maxCharacters) {
        const value = paragraph.slice(offset, offset + maxCharacters).trim();
        if (value) {
          const absolute = start + offset + paragraph.slice(offset, offset + maxCharacters).indexOf(value);
          segments.push({ id: `seg-${segments.length + 1}-${hashText(value)}`, text: value, start: absolute, end: absolute + value.length, hash: hashText(value) });
        }
      }
      continue;
    }

    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxCharacters) {
      flush();
      bufferStart = start;
      buffer = paragraph;
    } else {
      if (!buffer) bufferStart = start;
      buffer = candidate;
    }
  }

  flush();
  return segments;
}
