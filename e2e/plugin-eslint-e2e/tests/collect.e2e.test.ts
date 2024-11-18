import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with eslint-plugin NPM package', () => {
  const fixturesOldVersionDir = join(
    'e2e',
    'plugin-eslint-e2e',
    'mocks',
    'fixtures',
    'old-version',
  );
  const envRoot = join('tmp', 'e2e', 'plugin-eslint-e2e');
  const oldVersionDir = join(envRoot, 'old-version');
  const oldVersionOutputDir = join(oldVersionDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixturesOldVersionDir, oldVersionDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(oldVersionDir);
  });

  afterEach(async () => {
    await teardownTestFolder(oldVersionOutputDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: oldVersionDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(oldVersionOutputDir, 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
