import { describe, expect, it } from 'vitest';
import { AuditOutputs } from '@code-pushup/models';
import { Observer } from '@code-pushup/utils';
import { RunnerResult } from './runner';
import { executeEsmRunner } from './runner-esm';

describe('executeEsmRunner', () => {
  it('should execute valid plugin config', async () => {
    const nextSpy = vi.fn();
    const runnerResult: RunnerResult = await executeEsmRunner(
      (observer?: Observer) => {
        observer?.next?.('update');

        return Promise.resolve([
          { slug: 'mock-audit-slug', score: 0, value: 0 },
        ] satisfies AuditOutputs);
      },
      { next: nextSpy },
    );
    expect(nextSpy).toHaveBeenCalledWith('update');
    expect(runnerResult.audits[0]?.slug).toBe('mock-audit-slug');
  });

  it('should throw if plugin throws', async () => {
    const nextSpy = vi.fn();
    await expect(
      executeEsmRunner(
        () => Promise.reject(new Error('plugin exex mock error')),
        { next: nextSpy },
      ),
    ).rejects.toThrow('plugin exex mock error');
  });
});
