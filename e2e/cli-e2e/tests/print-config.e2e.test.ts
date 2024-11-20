import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, expect } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { E2E_ENVIRONMENTS_DIR, TEST_OUTPUT_DIR } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('CLI print-config', () => {
  const extensions = ['js', 'mjs', 'ts'] as const;
  const fixtureDummyDir = join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'dummy-setup',
  );

  const testFileDir = join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'print-config',
  );
  const testFileDummySetup = join(testFileDir, 'dummy-setup');
  const configFilePath = (ext: (typeof extensions)[number]) =>
    join(process.cwd(), testFileDummySetup, `code-pushup.config.${ext}`);

  beforeAll(async () => {
    await cp(fixtureDummyDir, testFileDummySetup, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDummySetup);
  });

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
        cwd: testFileDummySetup,
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
