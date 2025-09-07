import { type MockInstance, expect, vi } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import { Command } from '../executors/internal/types.js';
import {
  parseAutorunExecutorOnlyOptions,
  parseCliExecutorOptions,
  parsePrintConfigExecutorOptions,
} from './options.js';

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
    const executorOptions = parseCliExecutorOptions({
      persist: {
        filename: 'from-options',
      },
    });
    expect(osAgnosticPath(executorOptions.config ?? '')).toBe(
      osAgnosticPath('{projectRoot}/code-pushup.config.ts'),
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
      osAgnosticPath('{projectRoot}/.code-pushup'),
    );
  });

  it.each<Command | undefined>(['upload', 'autorun', undefined])(
    'should include upload config for command %s if API key is provided',
    command => {
      const executorOptions = parseCliExecutorOptions({
        command,
        upload: {
          apiKey: '123456789',
        },
      });

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
      const executorOptions = parseCliExecutorOptions({
        command,
        upload: {
          organization: 'code-pushup',
        },
      });

      expect(executorOptions).toEqual(
        expect.not.objectContaining({
          upload: expect.any(Object),
        }),
      );
    },
  );
});
