import { describe, expect, it } from 'vitest';
import { AuditOutputs } from '@code-pushup/models';
import { runnerEsm } from './runner-esm';

describe('executeEsmRunner', () => {
  it('should execute valid plugin config', async () => {
    const autidOutputs = await runnerEsm({
      observer: { next: console.log },
      runner: () =>
        Promise.resolve([
          { slug: 'mock-audit-slug', score: 0, value: 0 },
        ] satisfies AuditOutputs),
    });
    expect(autidOutputs.audits[0]?.slug).toBe('mock-audit-slug');
  });
});
