import { join } from 'node:path';
import { expect } from 'vitest';
import { executeProcess } from '@code-pushup/utils';

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
            expect.objectContaining({
              slug: 'coverage',
              title: 'Code coverage',
            }),
          ],
          categories: [
            expect.objectContaining({ slug: 'bug-prevention' }),
            expect.objectContaining({ slug: 'code-style' }),
            expect.objectContaining({ slug: 'code-coverage' }),
          ],
          onlyPlugins: [],
        }),
      );
    },
  );
});
