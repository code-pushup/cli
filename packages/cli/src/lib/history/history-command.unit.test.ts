import {vol} from 'memfs';
import {beforeEach, describe, vi} from "vitest";
import {makeStatusClean, makeStatusDirty} from '@code-pushup/testing-utils';
import {objectToCliArgs} from '@code-pushup/utils';
import {DEFAULT_CLI_CONFIGURATION} from '../../../mocks/constants';
import {yargsCli} from '../yargs-cli';
import {yargsHistoryCommandObject} from "./history-command";

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
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
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
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

  it('should guard against diry status of the git status', async () => {
    await makeStatusDirty();
    const verboseConfig = {
      verbose: true,
      progress: false,
    };
    await expect(
      yargsCli(
        objectToCliArgs({
          ...verboseConfig,
          _: 'history',
        }),
        {
          ...DEFAULT_CLI_CONFIGURATION,
          commands: [yargsHistoryCommandObject()],
        },
      ).parseAsync(),
    ).rejects.toThrow('Dirty status');
    await makeStatusClean();
  });

  it('should throw for invalid targetBranch', async () => {
    const verboseConfig = {
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
          commands: [yargsHistoryCommandObject()],
        },
      ).parseAsync(),
    ).rejects.toThrow('target branch invalid');
  });

});
