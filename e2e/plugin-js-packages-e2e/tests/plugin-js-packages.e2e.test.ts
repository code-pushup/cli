import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('plugin-js-packages', () => {
  const fixturesDir = path.join(
    'e2e',
    'plugin-js-packages-e2e',
    'mocks',
    'fixtures',
  );
  const fixturesNPMDir = path.join(fixturesDir, 'npm-repo');

  const envRoot = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
  );
  const npmRepoDir = path.join(envRoot, 'npm-repo');

  beforeAll(async () => {
    await cp(fixturesNPMDir, npmRepoDir, { recursive: true });
  });

  afterAll(async () => {
    // await teardownTestFolder(npmRepoDir);
  });

  it('should run JS packages plugin for NPM and create report.json', async () => {
    const { code: installCode } = await executeProcess({
      command: 'npm',
      args: ['install'],
      cwd: npmRepoDir,
    });

    expect(installCode).toBe(0);

    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: npmRepoDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile<Report>(
      path.join(npmRepoDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect.objectContaining({
      categories: expect.arrayContaining([
        expect.objectContaining({ slug: 'security' }),
        expect.objectContaining({ slug: 'updates' }),
      ]),
      plugins: expect.arrayContaining([
        expect.objectContaining({
          packageName: '@code-pushup/js-packages-plugin',
          audits: expect.arrayContaining([
            expect.objectContaining({
              slug: 'npm-audit-prod',
              displayValue: expect.stringMatching(/\d vulnerabilities/),
              value: expect.closeTo(7, 10), // there are 7 vulnerabilities (6 high, 1 low) at the time
              details: expect.objectContaining({
                issues: expect.any(Array),
              }),
            }),
            expect.objectContaining({
              slug: 'npm-outdated-prod',
              displayValue: '1 major outdated package version',
              value: 1,
              score: 0,
              details: {
                issues: expect.arrayContaining([
                  expect.objectContaining({
                    message: expect.stringMatching(
                      /Package \[`express`].*\*\*major\*\* update from \*\*\d+\.\d+\.\d+\*\* to \*\*\d+\.\d+\.\d+\*\*/,
                    ),
                    severity: 'error',
                  }),
                ]),
              },
            }),
          ]),
        }),
      ]),
    });
  });
});
