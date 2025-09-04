import { type MockInstance, expect, vi } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import type { Command } from '../internal/types.js';
import {
  mergeExecutorOptions,
  parseAutorunExecutorOnlyOptions,
  parseAutorunExecutorOptions,
  parsePrintConfigExecutorOptions,
} from './utils.js';

describe('parsePrintConfigExecutorOptions', () => {
  it('should provide NO default output path', () => {
    expect(parsePrintConfigExecutorOptions({})).toStrictEqual(
      expect.not.objectContaining({ output: expect.anything() }),
    );
  });

  it('should process given output path', () => {
    expect(
      parsePrintConfigExecutorOptions({ output: 'code-pushup.config.json' }),
    ).toStrictEqual(
      expect.objectContaining({ output: 'code-pushup.config.json' }),
    );
  });
});

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
    expect(osAgnosticPath(executorOptions.config ?? '')).toBe(
      osAgnosticPath('root/code-pushup.config.ts'),
    );
    expect(executorOptions).toEqual(
      expect.objectContaining({
        progress: false,
        verbose: false,
      }),
    );

    expect(processEnvSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

    expect(executorOptions.persist).toEqual(
      expect.objectContaining({
        filename: 'from-options',
      }),
    );

    expect(osAgnosticPath(executorOptions.persist?.outputDir ?? '')).toBe(
      osAgnosticPath('workspaceRoot/.code-pushup/my-app'),
    );
  });

  it.each<Command | undefined>(['upload', 'autorun', undefined])(
    'should include upload config for command %s if API key is provided',
    command => {
      const projectName = 'my-app';
      const executorOptions = parseAutorunExecutorOptions(
        {
          command,
          upload: {
            apiKey: '123456789',
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

      expect(executorOptions).toEqual(
        expect.objectContaining({
          upload: expect.any(Object),
        }),
      );
    },
  );

  it.each<Command>(['collect'])(
    'should not include upload config for command %s',
    command => {
      const projectName = 'my-app';
      const executorOptions = parseAutorunExecutorOptions(
        {
          command,
          upload: {
            organization: 'code-pushup',
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

      expect(executorOptions).toEqual(
        expect.not.objectContaining({
          upload: expect.any(Object),
        }),
      );
    },
  );

  it.each<Command>(['print-config'])(
    'should include output config for command %s',
    command => {
      const projectName = 'my-app';
      const executorOptions = parseAutorunExecutorOptions(
        {
          command,
          output: 'code-pushup.config.json',
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

      expect(executorOptions).toEqual(
        expect.objectContaining({
          output: 'code-pushup.config.json',
        }),
      );
    },
  );
});

describe('mergeExecutorOptions', () => {
  it('should deeply merge target and CLI options', () => {
    const targetOptions = {
      persist: {
        outputDir: '.reports',
        filename: 'report',
      },
    };
    const cliOptions = {
      persist: {
        filename: 'report-file',
      },
    };
    const expected = {
      persist: {
        outputDir: '.reports',
        filename: 'report-file',
      },
    };
    expect(mergeExecutorOptions(targetOptions, cliOptions)).toEqual(expected);
  });
});
