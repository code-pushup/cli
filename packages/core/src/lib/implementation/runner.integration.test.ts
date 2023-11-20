import { describe, expect, it } from 'vitest';
import {
  AuditOutputs,
  OnProgress,
  auditOutputsSchema,
} from '@code-pushup/models';
import { auditReport, echoRunnerConfig } from '@code-pushup/models/testing';
import {
  RunnerResult,
  executeRunnerConfig,
  executeRunnerFunction,
} from './runner';

const validRunnerCfg = echoRunnerConfig([auditReport()], 'output.json');

describe('executeRunnerConfig', () => {
  it('should work with valid plugins', async () => {
    const runnerResult = await executeRunnerConfig(validRunnerCfg);

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
      outputTransform: (output: unknown) => {
        const audits = JSON.parse(output as string);
        return (audits as AuditOutputs).map(a => ({
          ...a,
          displayValue: `transformed - ${a.slug}`,
        }));
      },
    };

    const runnerResult = await executeRunnerConfig(runnerCfgWithTransform);

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
      executeRunnerConfig(runnerCfgWithErrorTransform),
    ).rejects.toThrow('transform mock error');
  });
});

describe('executeRunnerFunction', () => {
  it('should execute valid plugin config', async () => {
    const nextSpy = vi.fn();
    const runnerResult: RunnerResult = await executeRunnerFunction(
      (observer?: OnProgress) => {
        observer?.('update');

        return Promise.resolve([
          { slug: 'mock-audit-slug', score: 0, value: 0 },
        ] satisfies AuditOutputs);
      },
      nextSpy,
    );
    expect(nextSpy).toHaveBeenCalledWith('update');
    expect(runnerResult.audits[0]?.slug).toBe('mock-audit-slug');
  });

  it('should throw if plugin throws', async () => {
    const nextSpy = vi.fn();
    await expect(
      executeRunnerFunction(
        () => Promise.reject(new Error('plugin exec mock error')),
        nextSpy,
      ),
    ).rejects.toThrow('plugin exec mock error');
    expect(nextSpy).not.toHaveBeenCalled();
  });
});
