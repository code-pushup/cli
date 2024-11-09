import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with coverage-plugin NPM package', () => {
  const envRoot = 'static-environments/coverage-e2e-env';
  const baseDir = join(envRoot, '__tests__');

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run Code coverage plugin which collects passed results and creates report.json', async () => {
    /**
     * The stats passed in the fixture are as follows
     * 3 files: one partially covered, one with no coverage, one with full coverage
     * Functions:  2 +  1 +  2 found |   1 +  0 +  2 covered (60% coverage)
     * Branches:  10 +  2 +  5 found |   8 +  0 +  5 covered (76% coverage)
     * Lines:     10 +  5 + 10 found |   7 +  0 + 10 covered (68% coverage)
     */

    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        `--config=code-pushup.existing-report.config.ts`,
        '--onlyPlugins=coverage',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(envRoot, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin that runs coverage tool and creates report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        '--onlyPlugins=coverage',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(envRoot, '.code-pushup/report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
