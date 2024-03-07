import { vol } from 'memfs';
import { beforeEach, describe, vi } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsHistoryCommandObject } from './history-command';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('history-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat call inside readRcPath
      },
      '/test',
    );
  });

  it('should have correct default arguments if no cli options are provided', async () => {
    await expect(
      yargsCli(
        objectToCliArgs({
          _: 'history',
        }),
        {
          ...DEFAULT_CLI_CONFIGURATION,
          commands: [yargsHistoryCommandObject()],
        },
      ).parseAsync(),
    ).resolves.toEqual({
      verbose: true,
      progress: false,
      targetBranch: 'main',
      numSteps: 1,
      uploadReports: true,
    });
  });
});
