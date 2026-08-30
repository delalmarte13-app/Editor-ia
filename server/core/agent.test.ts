import { describe, expect, it, vi } from 'vitest';
import { AgentRegistry, createNoopAgent } from './agent';

describe('AgentRegistry', () => {
  it('registers and retrieves agents', () => {
    const registry = new AgentRegistry();
    const execute = vi.fn();
    registry.register({ id: 'critic', description: 'Critic', tokenBudget: 1000, execute });
    expect(registry.has('critic')).toBe(true);
    expect(registry.get('critic')?.tokenBudget).toBe(1000);
  });

  it('fails safely when a provider is not configured', async () => {
    const agent = createNoopAgent('translator');
    const result = await agent.execute({ id: 't1', projectId: 'p1', agent: 'translator', objective: 'Traducir', dependencies: [], status: 'pending', attempt: 0, maxAttempts: 2 });
    expect(result.status).toBe('failed');
    expect(result.risks).toContain('agent_not_configured');
  });
});
