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
    expect(runnerConfig(baseOptions)).toEqual({
      args: [
        "lighthouse",
          "https://example.com",
          "--no-verbose",
          "--output=\"json\"",
          "--output-path=\".code-pushup/lighthouse-report.json\"",
        ],
      command: "npx",
      outputFile: "lighthouse-report.json",
      outputTransform: expect.any(Function),
    });
  });

  it('should run only audits included in given onlyAudits', () => {
    expect(
      runnerConfig({
        ...baseOptions,
        onlyAudits: [lcpAuditOutputBase.slug],
      }),
    ).toEqual(
      expect.objectContaining({
        args: [
          "lighthouse",
          "https://example.com",
          "--no-verbose",
          "--output=\"json\"",
          "--output-path=\".code-pushup/lighthouse-report.json\"",
          `--onlyAudits="${lcpAuditOutputBase.slug}"`
        ],
        command: "npx",
        outputFile: "lighthouse-report.json",
        outputTransform: expect.any(Function),
      }),
    );
  });
});
