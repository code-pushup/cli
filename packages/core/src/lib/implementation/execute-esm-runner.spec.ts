import { describe, expect, it } from 'vitest';
import {
  AuditOutputs, //EsmObserver,
  auditOutputsSchema,
} from '@code-pushup/models';
import { executeEsmRunner } from './execute-esm-runner';

describe('executeEsmRunner', () => {
  it('should execute valid plugin config', async () => {
    const autidOutputs = await executeEsmRunner({
      observer: { next: console.log },
      runner: (/*observer?: EsmObserver*/) =>
        Promise.resolve([
          { slug: 'mock-audit-slug', score: 0, value: 0 },
        ] satisfies AuditOutputs),
    });
    expect(autidOutputs.audits[0]?.slug).toBe('mock-audit-slug');
    expect(autidOutputs).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(autidOutputs)).not.toThrow();
  });
});
