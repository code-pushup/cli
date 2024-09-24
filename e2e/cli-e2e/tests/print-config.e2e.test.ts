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
      const { code, stdout } = await executeProcess({
        command: 'code-pushup',
        args: [
          'print-config',
          '--no-progress',
          `--config=${configFilePath(ext)}`,
          '--tsconfig=tsconfig.base.json',
          '--persist.outputDir=output-dir',
          '--persist.format=md',
          `--persist.filename=${ext}-report`,
          '--onlyPlugins=coverage',
          '--skipPlugins=eslint',
        ],
      });

      expect(code).toBe(0);
      expect(stdout).toBe('');

      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          config: expect.stringContaining(`code-pushup.config.${ext}`),
          tsconfig: 'tsconfig.base.json',
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
            expect.objectContaining({
              slug: 'coverage',
              title: 'Code coverage',
            }),
          ],
          categories: [expect.objectContaining({ slug: 'code-coverage' })],
          onlyPlugins: ['coverage'],
          skipPlugins: ['eslint'],
        }),
      );
    },
  );
});
