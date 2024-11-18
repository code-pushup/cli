import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with coverage-plugin NPM package', () => {
  const envRoot = 'tmp/e2e/plugin-coverage-e2e';
  const fixtureDir = join('e2e', 'plugin-coverage-e2e', 'mocks', 'fixtures');
  const basicDir = join(envRoot, 'basic-setup');
  const existingDir = join(envRoot, 'existing-report');

  beforeAll(async () => {
    await cp(fixtureDir, envRoot, { recursive: true });
  });
  afterAll(async () => {
    await teardownTestFolder(join(basicDir));
    await teardownTestFolder(join(existingDir));
  });
  afterEach(async () => {
    await teardownTestFolder(join(basicDir, '.code-pushup'));
    await teardownTestFolder(join(existingDir, '.code-pushup'));
  });

  it('should run Code coverage plugin which collects passed results and creates report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: basicDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(basicDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin that runs coverage tool and creates report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: existingDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(existingDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
