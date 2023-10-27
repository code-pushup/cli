import { ESLint } from 'eslint';
import os from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { readJsonFile } from '@code-pushup/utils';
import { listAudits } from './meta';
import {
  RUNNER_OUTPUT_PATH,
  createRunnerConfig,
  executeRunner,
} from './runner';

describe('executeRunner', () => {
  let cwdSpy: SpyInstance;
  let platformSpy: SpyInstance;
  let argv: string[];

  beforeAll(async () => {
    const appDir = join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      'test',
      'fixtures',
      'todos-app',
    );
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appDir);
    // Windows does not require additional quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');

    const eslintrc = '.eslintrc.js';
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];

    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: { extends: eslintrc },
    });
    const audits = await listAudits(eslint, patterns);

    const runnerConfig = createRunnerConfig(
      'bin.js',
      audits,
      eslintrc,
      patterns,
    );
    argv = [runnerConfig.command, ...(runnerConfig.args ?? [])];
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();
  });

  it('should execute ESLint and create audit results for React application', async () => {
    await executeRunner(argv);
    const json = await readJsonFile(RUNNER_OUTPUT_PATH);
    expect(json).toMatchSnapshot();
  });
});
