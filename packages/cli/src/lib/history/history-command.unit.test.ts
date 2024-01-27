import { vol } from 'memfs';
import { beforeEach, describe } from 'vitest';
import { HistoryOptions } from '@code-pushup/core';
import { MINIMAL_CONFIG_MOCK } from '@code-pushup/testing-utils';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsConfigCommandObject } from '../print-config/print-config-command';
import { yargsCli } from '../yargs-cli';

describe('history-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  it('should have correct default arguments if no cli options are provided', async () => {
    const verboseConfig: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    };
    await expect(
      yargsCli(
        objectToCliArgs({
          ...verboseConfig,
          _: 'history',
          targetBranch: 'main',
          numSteps: 1,
          uploadReports: true,
          gitRestore: undefined,
        }),
        {
          ...DEFAULT_CLI_CONFIGURATION,
          commands: [yargsConfigCommandObject()],
        },
      ).parseAsync(),
    ).resolves.toEqual({});
  });

  it('should throw for invalid targetBranch', async () => {
    const verboseConfig: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
      targetBranch: 'test',
    };
    await expect(
      yargsCli(
        objectToCliArgs({
          ...verboseConfig,
          _: 'history',
        }),
        {
          ...DEFAULT_CLI_CONFIGURATION,
          commands: [yargsConfigCommandObject()],
        },
      ).parseAsync(),
    ).rejects.toThrow('PPP');
  });
});
