import { join } from 'node:path';
import { expect } from 'vitest';
import { executeProcess } from '@code-pushup/utils';

const extensions = ['js', 'mjs', 'ts'] as const;
export const configFilePath = (ext: (typeof extensions)[number]) =>
  join(process.cwd(), `e2e/cli-e2e/mocks/fixtures/code-pushup.config.${ext}`);

describe('CLI print-config', () => {
  it.each(extensions)(
    'should load .%s config file with correct arguments',
    async ext => {
      const { code, stdout } = await executeProcess({
        command: 'npx',
        args: [
          '@code-pushup/cli',
          'print-config',
          '--no-progress',
          '--tsconfig=tsconfig.base.json',
          '--persist.outputDir=output-dir',
          '--persist.format=md',
          `--persist.filename=${ext}-report`,
          '--onlyPlugins=coverage',
        ],
        cwd: 'examples/react-todos-app',
      });

      expect(code).toBe(0);

      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          tsconfig: 'tsconfig.base.json',
          // filled by command options
          persist: {
            outputDir: 'output-dir',
            filename: `${ext}-report`,
            format: ['md'],
          },
          plugins: expect.arrayContaining([
            expect.objectContaining({
              slug: 'coverage',
              title: 'Code coverage',
            }),
          ]),
          categories: expect.arrayContaining([
            expect.objectContaining({ slug: 'code-coverage' }),
          ]),
          onlyPlugins: ['coverage'],
        }),
      );
    },
  );
});
