import { describe, expect, it } from 'vitest';
import { runnerResultSchema } from '@code-pushup/models';
import {
  auditReport,
  echoRunnerConfig,
  outputFileToAuditOutputs,
} from '@code-pushup/models/testing';
import { executeRunner } from './execute-runner';

const validRunnerCfg = echoRunnerConfig([auditReport()], 'output.json');

describe('executeRunner', () => {
  it('should work with valid plugins', async () => {
    const runnerResult = await executeRunner(validRunnerCfg);

    // data sanity
    expect(runnerResult.date.endsWith('Z')).toBeTruthy();
    expect(runnerResult.duration).toBeTruthy();
    expect(runnerResult.audits[0]?.slug).toBe('mock-audit-slug');

    // schema validation
    expect(() => runnerResultSchema.parse(runnerResult.audits)).not.toThrow();
  });

  it('should use transform if provided', async () => {
    const runnerCfgWithTransform = {
      ...validRunnerCfg,
      outputFileToAuditResults: outputFileToAuditOutputs(),
    };

    const runnerResult = await executeRunner(runnerCfgWithTransform);

    expect(runnerResult.audits[0]?.displayValue).toBe(
      'transformed - mock-audit-slug',
    );
  });
});
