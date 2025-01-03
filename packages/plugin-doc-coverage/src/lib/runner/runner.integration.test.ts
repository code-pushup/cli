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

  const undocumentedSourceGlob = [
    path.join(fixturesDir, 'missing-documentation/**/*.ts'),
  ];
  const documentedSourceGlob = [
    path.join(fixturesDir, 'filled-documentation/**/*.ts'),
  ];

  it('should generate correct audit outputs for documentation coverage', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: undocumentedSourceGlob,
    });

    const results = await runnerFn({} as any);

    // Verify all expected audits are present
    expect(results).toHaveLength(Object.keys(AUDITS_MAP).length);

    // Verify structure and content of each audit
    results.forEach(audit => {
      expect(audit).toMatchObject({
        score: 0,
        value: expect.any(Number),
        displayValue: expect.stringMatching(/^\d+ undocumented/),
        details: {
          issues: expect.arrayContaining([
            expect.objectContaining({
              message: 'Missing documentation',
              severity: 'warning',
              source: {
                file: expect.stringContaining(
                  audit.slug.replace('-coverage', ''),
                ),
                position: expect.objectContaining({
                  startLine: expect.any(Number),
                }),
              },
            }),
          ]),
        },
      });
    });
  });

  it('should respect onlyAudits option', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: undocumentedSourceGlob,
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
      sourceGlob: undocumentedSourceGlob,
      skipAudits: ['classes-coverage', 'methods-coverage'],
    });

    const results = await runnerFn({} as any);

    const slugs = results.map(audit => audit.slug);
    expect(slugs).not.toContain('classes-coverage');
    expect(slugs).not.toContain('methods-coverage');
  });

  it('should generate correct audit outputs for undocumented code', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: undocumentedSourceGlob,
    });

    const results = await runnerFn({} as any);

    results.forEach(audit => {
      expect(audit.score).toBe(0);
      expect(audit.details?.issues?.length).toBeGreaterThan(0); // There are multiples classes due to methods and properties
    });
  });

  it('should generate correct audit outputs for documented code', async () => {
    const runnerFn = createRunnerFunction({
      sourceGlob: documentedSourceGlob,
    });

    const results = await runnerFn({} as any);

    results.forEach(audit => {
      expect(audit.score).toBe(1);
      expect(audit.details?.issues?.length).toBe(0);
    });
  });
});
