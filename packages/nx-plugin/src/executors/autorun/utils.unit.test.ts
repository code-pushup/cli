import { MockInstance, expect, vi } from 'vitest';
import { toNormalizedPath } from '@code-pushup/test-utils';
import {
  parseAutorunExecutorOnlyOptions,
  parseAutorunExecutorOptions,
} from './utils';

describe('parseAutorunExecutorOnlyOptions', () => {
  it('should provide NO default projectPrefix', () => {
    expect(parseAutorunExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ projectPrefix: expect.anything() }),
    );
  });

  it('should process given projectPrefix', () => {
    expect(
      parseAutorunExecutorOnlyOptions({ projectPrefix: 'cli' }),
    ).toStrictEqual(expect.objectContaining({ projectPrefix: 'cli' }));
  });

  it('should provide NO default dryRun', () => {
    expect(parseAutorunExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ dryRun: expect.anything() }),
    );
  });

  it('should process given dryRun', () => {
    expect(parseAutorunExecutorOnlyOptions({ dryRun: false })).toStrictEqual(
      expect.objectContaining({ dryRun: false }),
    );
  });

  it('should provide default onlyPlugins', () => {
    expect(parseAutorunExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ onlyPlugins: ['json'] }),
    );
  });

  it('should process given onlyPlugins', () => {
    expect(
      parseAutorunExecutorOnlyOptions({ onlyPlugins: ['md', 'json'] }),
    ).toStrictEqual(expect.objectContaining({ onlyPlugins: ['md', 'json'] }));
  });
});

describe('parseAutorunExecutorOptions', () => {
  let processEnvSpy: MockInstance<[], NodeJS.ProcessEnv>;
  beforeAll(() => {
    processEnvSpy = vi.spyOn(process, 'env', 'get').mockReturnValue({});
  });

  afterAll(() => {
    processEnvSpy.mockRestore();
  });

  it('should leverage other config helper to assemble the executor config', () => {
    processEnvSpy.mockReturnValue({ outputDir: 'from-env-vars' });
    const projectName = 'my-app';
    const executorOptions = parseAutorunExecutorOptions(
      {
        persist: {
          filename: 'from-options',
        },
      },
      {
        projectName,
        workspaceRoot: 'workspaceRoot',
        projectConfig: {
          name: 'my-app',
          root: 'root',
        },
      },
    );
    expect(toNormalizedPath(executorOptions.config)).toBe(
      toNormalizedPath('root/code-pushup.config.ts'),
    );
    expect(executorOptions).toEqual(
      expect.objectContaining({
        progress: false,
        verbose: false,
        upload: { project: projectName },
      }),
    );
    expect(executorOptions).toEqual(
      expect.objectContaining({
        persist: {
          filename: 'from-options',
          outputDir: 'workspaceRoot/.code-pushup/my-app',
        },
      }),
    );
    expect(toNormalizedPath(executorOptions?.persist?.outputDir)).toBe(
      toNormalizedPath('workspaceRoot/.code-pushup/my-app'),
    );
  });
});
