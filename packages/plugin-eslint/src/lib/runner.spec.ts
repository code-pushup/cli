import { readJsonFile } from '@code-pushup/utils';
import { ESLint } from 'eslint';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { listAudits } from './meta';
import {
  RUNNER_OUTPUT_PATH,
  createRunnerConfig,
  executeRunner,
} from './runner';

describe('executeRunner', () => {
  let cwdSpy: SpyInstance;
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
  });

  it('should execute ESLint and create audit results for React application', async () => {
    await executeRunner(argv);
    const json = await readJsonFile(RUNNER_OUTPUT_PATH);
    expect(json).toMatchSnapshot();
  });
});
