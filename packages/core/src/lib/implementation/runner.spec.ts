import { describe, expect, it } from 'vitest';
import { AuditOutputs, auditOutputsSchema } from '@code-pushup/models';
import { auditReport, echoRunnerConfig } from '@code-pushup/models/testing';
import { Observer } from '@code-pushup/utils';
import { RunnerResult, executeEsmRunner, executeProcessRunner } from './runner';

const validRunnerCfg = echoRunnerConfig([auditReport()], 'output.json');

describe('executeRunner', () => {
  it('should work with valid plugins', async () => {
    const runnerResult = await executeProcessRunner(validRunnerCfg);

    // data sanity
    expect(runnerResult.date.endsWith('Z')).toBeTruthy();
    expect(runnerResult.duration).toBeTruthy();
    expect(runnerResult.audits[0]?.slug).toBe('mock-audit-slug');

    // schema validation
    expect(() => auditOutputsSchema.parse(runnerResult.audits)).not.toThrow();
  });

  it('should use transform if provided', async () => {
    const runnerCfgWithTransform = {
      ...validRunnerCfg,
      outputTransform: (audits: unknown) =>
        (audits as AuditOutputs).map(a => ({
          ...a,
          displayValue: `transformed - ${a.slug}`,
        })),
    };

    const runnerResult = await executeProcessRunner(runnerCfgWithTransform);

    expect(runnerResult.audits[0]?.displayValue).toBe(
      'transformed - mock-audit-slug',
    );
  });

  it('should throw if transform throws', async () => {
    const runnerCfgWithErrorTransform = {
      ...validRunnerCfg,
      outputTransform: () => {
        return Promise.reject(new Error('transform mock error'));
      },
    };

    await expect(
      executeProcessRunner(runnerCfgWithErrorTransform),
    ).rejects.toThrow('transform mock error');
  });
});

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
        () => Promise.reject(new Error('plugin exec mock error')),
        { next: nextSpy },
      ),
    ).rejects.toThrow('plugin exec mock error');
  });
});
