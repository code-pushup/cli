import { join } from 'path';
import { expect } from 'vitest';
import { PersistConfig, UploadConfig } from '@code-pushup/models';
import {
  CliArgsObject,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/utils';

const extensions = ['js', 'mjs', 'ts'] as const;
type Extension = (typeof extensions)[number];

const configFile = (ext: Extension) =>
  join(process.cwd(), `e2e/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (argObj: Partial<CliArgsObject>) =>
  executeProcess({
    command: 'npx',
    args: [
      './dist/packages/cli',
      'print-config',
      ...objectToCliArgs({
        verbose: true,
        ...argObj,
      }),
    ],
  });

// TODO: use print-config command once implemented and check stdout
describe('print-config', () => {
  it.each(extensions)('should load .%s config file', async ext => {
    const { code, stderr, stdout } = await execCli({ config: configFile(ext) });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const args = JSON.parse(stdout);
    expect(args).toEqual({
      interactive: true,
      verbose: true,
      config: expect.stringContaining(`code-pushup.config.${ext}`),
      upload: {
        organization: 'code-pushup',
        project: `cli-${ext}`,
        apiKey: 'e2e-api-key',
        server: 'https://e2e.com/api',
      },
      persist: { outputDir: `tmp/${ext}` },
      plugins: expect.any(Array),
      categories: expect.any(Array),
    });
  });

  it('should load .%s config file and merge cli arguments', async () => {
    const { code, stderr, stdout } = await execCli({
      config: configFile('ts'),
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const args = JSON.parse(stdout);
    expect(args).toEqual({
      interactive: true,
      verbose: true,
      config: expect.stringContaining(`code-pushup.config.ts`),
      upload: {
        organization: 'code-pushup',
        project: `cli-ts`,
        apiKey: 'e2e-api-key',
        server: 'https://e2e.com/api',
      },
      persist: {
        outputDir: `tmp/ts`,
      },
      plugins: expect.any(Array),
      categories: [],
    });
  });
});
