import { join } from 'path';
import { expect } from 'vitest';
import { CliArgsObject } from '@code-pushup/utils';
import { configFile, execCli, extensions } from '../mocks/utils';

const execCliPrintConfig = (argObj: Partial<CliArgsObject>) =>
  execCli('print-config', {
    ...argObj,
  });

describe('print-config', () => {
  it.each(extensions)('should load .%s config file', async ext => {
    const { code, stderr, stdout } = await execCliPrintConfig({
      config: configFile(ext),
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const args = JSON.parse(stdout);
    expect(args).toEqual({
      progress: false,
      verbose: true,
      config: expect.stringContaining(`code-pushup.config.${ext}`),
      upload: {
        organization: 'code-pushup',
        project: `cli-${ext}`,
        apiKey: 'e2e-api-key',
        server: 'https://e2e.com/api',
      },
      persist: {
        outputDir: join('tmp', ext),
        filename: 'report',
      },
      plugins: expect.any(Array),
      categories: expect.any(Array),
    });
  });

  it('should load .ts config file and merge cli arguments', async () => {
    const { code, stderr, stdout } = await execCliPrintConfig({
      'persist.filename': 'my-report',
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const args = JSON.parse(stdout);
    expect(args).toEqual({
      progress: false,
      verbose: true,
      config: expect.stringContaining(`code-pushup.config.ts`),
      upload: {
        organization: 'code-pushup',
        project: `cli-ts`,
        apiKey: 'e2e-api-key',
        server: 'https://e2e.com/api',
      },
      persist: {
        outputDir: join('tmp', 'ts'),
        filename: 'my-report',
      },
      plugins: expect.any(Array),
      categories: expect.any(Array),
    });
  });

  it('should parse persist.format from arguments', async () => {
    const { code, stderr, stdout } = await execCliPrintConfig({
      'persist.format': ['md', 'json', 'stdout'],
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const args = JSON.parse(stdout);
    expect(args.persist.format).toEqual(['md', 'json', 'stdout']);
  });
});
