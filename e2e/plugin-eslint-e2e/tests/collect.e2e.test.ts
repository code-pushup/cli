import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with eslint-plugin NPM package', () => {
  const fixturesFlatConfigDir = join(
    'e2e',
    'plugin-eslint-e2e',
    'mocks',
    'fixtures',
    'flat-config',
  );
  const envRoot = join('tmp', 'e2e', 'plugin-eslint-e2e');
  const flatConfigDir = join(envRoot, 'flat-config');
  const flatConfigOutputDir = join(flatConfigDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixturesFlatConfigDir, flatConfigDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(flatConfigDir);
  });

  afterEach(async () => {
    await teardownTestFolder(flatConfigOutputDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: flatConfigDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(flatConfigOutputDir, 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
