import { join } from 'node:path';
import { expect } from 'vitest';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { executeProcess, objectToCliArgs } from '@code-pushup/utils';

const extensions = ['js', 'mjs', 'ts'] as const;
export const configFilePath = (ext: (typeof extensions)[number]) =>
  join(process.cwd(), `e2e/cli-e2e/mocks/fixtures/code-pushup.config.${ext}`);

describe('print-config', () => {
  it.each(extensions)(
    'should load .%s config file with correct arguments',
    async ext => {
      const { code, stderr, stdout } = await executeProcess({
        command: 'code-pushup',
        args: [
          'print-config',
          '--verbose',
          '--no-progress',
          `--config=${configFilePath(ext)}`,
          '--persist.outputDir=output-dir',
          '--persist.format=md',
          `--persist.filename=${ext}-report`,
        ],
      });

      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          config: expect.stringContaining(`code-pushup.config.${ext}`),
          // filled by command options
          persist: {
            outputDir: 'output-dir',
            filename: `${ext}-report`,
            format: ['md'],
          },
          upload: {
            organization: 'code-pushup',
            project: `cli-${ext}`,
            apiKey: 'e2e-api-key',
            server: 'https://e2e.com/api',
          },
          plugins: [
            expect.objectContaining({ slug: 'eslint', title: 'ESLint' }),
          ],
          categories: [
            expect.objectContaining({ slug: 'bug-prevention' }),
            expect.objectContaining({ slug: 'code-style' }),
          ],
          onlyPlugins: [],
        }),
      );
    },
  );
  it.each([
    [
      'defaults',
      {},
      { verbose: false, progress: true },
      'cli-overwrites',
      { verbose: true, progress: false },
      { verbose: true, progress: false },
    ],
  ])(
    'should handle general arguments for %s correctly',
    async (id, cliObj, printResult) => {
      const { code, stderr, stdout } = await executeProcess({
        command: 'code-pushup',
        args: [
          'print-config',
          `--config=${configFilePath('ts')}`,
          ...objectToCliArgs(cliObj),
        ],
      });

      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(JSON.parse(stdout)).toEqual(expect.objectContaining(printResult));
    },
  );

  it.each([
    [
      'defaults',
      {},
      {
        outputDir: PERSIST_OUTPUT_DIR,
        format: PERSIST_FORMAT,
        filename: PERSIST_FILENAME,
      },
    ],
    [
      'cli-overwrites',
      {
        'persist.outputDir': 'tmp',
        'persist.format': 'md',
        'persist.filename': 'report-name',
      },
      { outputDir: 'tmp', format: ['md'], filename: 'report-name' },
    ],
  ])(
    'should handle persist arguments for %s correctly',
    async (id, cliObj, persistResult) => {
      const { code, stderr, stdout } = await executeProcess({
        command: 'code-pushup',
        args: [
          'print-config',
          `--config=${configFilePath('ts')}`,
          ...objectToCliArgs(cliObj),
        ],
      });

      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(JSON.parse(stdout)?.persist).toEqual(
        expect.objectContaining(persistResult),
      );
    },
  );
});
