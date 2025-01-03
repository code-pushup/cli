import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AUDITS_MAP } from '../constants.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  const fixturesDir = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    '..',
    '..',
    'mocks',
    'fixtures',
  );

  const AUDIT_SLUGS = Object.keys(AUDITS_MAP).map(key => [
    key.replace(/-coverage/g, ''),
  ]);

  it.each(AUDIT_SLUGS)(
    'should generate issues for %s coverage if undocumented',
    async coverageType => {
      const filePath = path.join(
        fixturesDir,
        `missing-documentation/${coverageType}-coverage.ts`,
      );
      const runnerFn = createRunnerFunction({
        sourceGlob: [filePath],
      });

      const results = await runnerFn(() => void 0);

      expect(
        results.find(({ slug }) => slug === `${coverageType}-coverage`),
      ).toStrictEqual(
        expect.objectContaining({
          slug: `${coverageType}-coverage`,
          score: 0,
          value: 1,
          displayValue: `1 undocumented ${coverageType}`,
          details: {
            issues: [
              expect.objectContaining({
                message: expect.stringContaining(
                  `Missing ${coverageType} documentation for`,
                ),
                severity: 'warning',
                source: {
                  file: expect.stringContaining(path.basename(filePath)),
                  position: {
                    startLine: expect.any(Number),
                  },
                },
              }),
            ],
          },
        }),
      );
    },
  );

  it.each(AUDIT_SLUGS)(
    'should not generate issues for %s coverage if documented',
    async coverageType => {
      const filePath = path.join(
        fixturesDir,
        `filled-documentation/${coverageType}-coverage.ts`,
      );
      const runnerFn = createRunnerFunction({
        sourceGlob: [filePath],
      });

      const results = await runnerFn(() => void 0);

      expect(
        results.find(({ slug }) => slug === `${coverageType}-coverage`),
      ).toStrictEqual(
        expect.objectContaining({
          slug: `${coverageType}-coverage`,
          score: 1,
          value: 0,
          displayValue: `0 undocumented ${coverageType}`,
          details: {
            issues: [],
          },
        }),
      );
    },
  );

  it('should respect onlyAudits option', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: [],
      onlyAudits: ['classes-coverage', 'methods-coverage'],
    });

    const results = await runnerFn({} as any);

    expect(results).toHaveLength(2);
    expect(results.map(audit => audit.slug)).toStrictEqual([
      'classes-coverage',
      'methods-coverage',
    ]);
  });

  it('should respect skipAudits option', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: [],
      skipAudits: ['classes-coverage', 'methods-coverage'],
    });

    const results = await runnerFn({} as any);

    const slugs = results.map(audit => audit.slug);
    expect(slugs).not.toContain('classes-coverage');
    expect(slugs).not.toContain('methods-coverage');
  });
});
