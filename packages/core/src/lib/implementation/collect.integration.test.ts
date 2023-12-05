import { describe, expect, it } from 'vitest';
import { reportSchema } from '@code-pushup/models';
import { minimalConfig } from '@code-pushup/models/testing';
import { CollectOptions, collect } from './collect';

const baseOptions: CollectOptions = {
  ...minimalConfig(),
  verbose: true,
  progress: false,
};

describe('collect', () => {
  it('should execute with valid options', async () => {
    const report = await collect(baseOptions);
    expect(() =>
      reportSchema.omit({ packageName: true, version: true }).parse(report),
    ).not.toThrow();
    expect(report.plugins[0]?.audits[0]?.slug).toBe('audit-1');
  });
});
