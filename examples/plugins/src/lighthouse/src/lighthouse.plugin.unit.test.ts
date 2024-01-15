import { describe, expect, it } from 'vitest';
import { PluginOptions, runnerConfig } from './lighthouse.plugin';

describe('runnerConfig', () => {
  const baseOptions: PluginOptions = {
    url: 'https://example.com',
  };
  const lcpAuditOutputBase = {
    displayValue: expect.stringContaining('sec'),
    score: 1,
    slug: 'largest-contentful-paint',
    value: 0,
  };

  it('should execute if url is given', () => {
    expect(runnerConfig(baseOptions)).toEqual([lcpAuditOutputBase]);
  });

  it('should run only audits included in given onlyAudits', () => {
    expect(
      runnerConfig({
        ...baseOptions,
        onlyAudits: [lcpAuditOutputBase.slug],
      }),
    ).toEqual([
      expect.objectContaining({
        slug: lcpAuditOutputBase.slug,
        value: 0,
      }),
    ]);
  });
});
