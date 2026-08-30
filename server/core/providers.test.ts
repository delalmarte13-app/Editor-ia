import assert from 'node:assert/strict';
import test from 'node:test';
import { availableProviders, providerFor } from './providers.ts';

test('prefers local/free providers before paid fallback', () => {
  const list = availableProviders({ GROQ_API_KEY: 'x', OPENAI_API_KEY: 'x' } as NodeJS.ProcessEnv);
  assert.equal(list[0].id, 'ollama');
  assert.equal(list[1].id, 'groq');
});

test('selects configured provider deterministically', () => {
  const provider = providerFor({ GEMINI_API_KEY: 'x' } as NodeJS.ProcessEnv);
  assert.equal(provider?.id, 'ollama');
});
