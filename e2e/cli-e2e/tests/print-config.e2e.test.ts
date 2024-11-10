import { join } from 'node:path';
import { expect } from 'vitest';
import { executeProcess } from '@code-pushup/utils';

const extensions = ['js', 'mjs', 'ts'] as const;
export const configFilePath = (ext: (typeof extensions)[number]) =>
  join(process.cwd(), `examples/react-todos-app/code-pushup.config.${ext}`);

describe('CLI print-config', () => {
  const envRoot = join('static-environments', 'cli-e2e-env');
  it.each(extensions)(
    'should load .%s config file with correct arguments',
    async ext => {
      const { code, stdout } = await executeProcess({
        command: 'npx',
        args: [
          '@code-pushup/cli',
          'print-config',
          '--no-progress',
          `--config=${configFilePath(ext)}`,
          '--tsconfig=tsconfig.base.json',
          '--persist.outputDir=output-dir',
          '--persist.format=md',
          `--persist.filename=${ext}-report`,
        ],
        cwd: envRoot,
      });

      expect(code).toBe(0);

      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          config: expect.stringContaining(`code-pushup.config.${ext}`),
          tsconfig: 'tsconfig.base.json',
          // filled by command options
          plugins: [
            expect.objectContaining({
              slug: 'dummy-plugin',
              title: 'Dummy Plugin',
            }),
          ],
          categories: [expect.objectContaining({ slug: 'dummy-category' })],
        }),
      );
    },
  );
});
