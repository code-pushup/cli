import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { LIGHTHOUSE_OUTPUT_FILE_DEFAULT } from './constants';
import { LighthouseCliOptions, runnerConfig } from './lighthouse.plugin';

describe('lighthouse-runnerConfig', () => {
  const baseOptions: LighthouseCliOptions = {
    url: LIGHTHOUSE_URL,
    headless: true,
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
        'lighthouse',
        LIGHTHOUSE_URL,
        '--no-verbose',
        '--output="json"',
        `--output-path="${LIGHTHOUSE_OUTPUT_FILE_DEFAULT}"`,
      ],
      command: 'npx',
      outputFile: LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
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
        args: [`--onlyAudits="${lcpAuditOutputBase.slug}"`],
        command: 'npx',
        outputFile: 'lighthouse-report.json',
        outputTransform: expect.any(Function),
      }),
    );
  });
});
