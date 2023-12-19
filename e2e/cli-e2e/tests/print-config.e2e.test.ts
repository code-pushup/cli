import { expect } from 'vitest';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { executeProcess, objectToCliArgs } from '@code-pushup/utils';
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
        ],
      });

      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(JSON.parse(stdout)).toEqual(
        expect.objectContaining({
          config: expect.stringContaining(`code-pushup.config.${ext}`),
          // filled by command options
          persist: {
            outputDir: PERSIST_OUTPUT_DIR,
            filename: PERSIST_FILENAME,
            format: PERSIST_FORMAT,
          },
          upload: {
            organization: 'code-pushup',
            project: `cli-${ext}`,
            apiKey: 'e2e-api-key',
            server: 'https://e2e.com/api',
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

  it('should load .ts config file and overload it with arguments', async () => {
    const { code, stderr, stdout } = await executeProcess({
      command: 'code-pushup',
      args: [
        'print-config',
        '--verbose',
        '--no-progress',
        `--config=${configFile('ts')}`,
        '--persist.outputDir=my-dir',
        '--persist.format=md',
        '--persist.filename=my-report',
      ],
    });

    expect(JSON.parse(stdout)?.persist).toEqual(
      expect.objectContaining({
        outputDir: 'my-dir',
        format: ['md'],
        filename: 'my-report',
      }),
    );
  }, 120000);
});
