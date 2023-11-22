import { expect } from 'vitest';
import { executeProcess } from '@code-pushup/utils';
import { configFile, extensions } from '../mocks/utils';

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
          `--config=${configFile(ext)}`,
          '--persist.outputDir=my-dir',
          '--persist.format=md',
          '--persist.filename=my-report',
        ],
      });

      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          config: expect.stringContaining(`code-pushup.config.${ext}`),
          upload: {
            organization: 'code-pushup',
            project: `cli-${ext}`,
            apiKey: 'e2e-api-key',
            server: 'https://e2e.com/api',
          },
          persist: {
            outputDir: 'my-dir',
            format: ['md'],
            filename: 'my-report',
          },
          plugins: expect.arrayContaining([
            expect.objectContaining({ slug: 'eslint', title: 'ESLint' }),
            expect.objectContaining({
              slug: 'lighthouse',
              title: 'ChromeDevTools Lighthouse',
            }),
          ]),
          // @TODO add test data to config file
          categories: expect.any(Array),
          onlyPlugins: [],
        }),
      );
    },
    120000,
  );
});
