import { describe, expect, it } from 'vitest';
import { AuditOutputs, auditOutputsSchema } from '@code-pushup/models';
import { auditReport, echoRunnerConfig } from '@code-pushup/models/testing';
import { executeProcessRunner } from './runner-process';

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
