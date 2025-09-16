import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { ProcessResult } from '@code-pushup/utils';
import * as utils from '@code-pushup/utils';
import { initCodePushup, nxPluginGenerator } from './init.js';
import * as createUtils from './utils.js';

describe('nxPluginGenerator', () => {
  it('should create valid command', () => {
    expect(nxPluginGenerator('init', { skipNxJson: true })).toStrictEqual({
      command: 'npx',
      args: ['nx', 'g', '@code-pushup/nx-plugin:init', '--skipNxJson'],
    });
  });
});

describe('initCodePushup', () => {
  const spyExecuteProcess = vi.spyOn(utils, 'executeProcess');
  const spyParseNxProcessOutput = vi.spyOn(createUtils, 'parseNxProcessOutput');
  const spySetupNxContext = vi.spyOn(createUtils, 'setupNxContext');
  const spyTeardownNxContext = vi.spyOn(createUtils, 'teardownNxContext');

  beforeEach(() => {
    // needed to get test folder set up
    vol.fromJSON(
      {
        'random-file': '',
      },
      MEMFS_VOLUME,
    );
    vol.rm('random-file', () => void 0);

    spyExecuteProcess.mockResolvedValue({
      stdout: 'stdout-mock',
      stderr: '',
    } as ProcessResult);
  });

  afterEach(() => {
    spyExecuteProcess.mockReset();
  });

  it('should add packages and create config file', async () => {
    const projectJson = { name: 'my-lib' };

    vol.fromJSON(
      {
        'nx.json': '{}',
        'project.json': JSON.stringify(projectJson),
      },
      MEMFS_VOLUME,
    );

    await initCodePushup();

    expect(spySetupNxContext).toHaveBeenCalledTimes(1);

    expect(spyExecuteProcess).toHaveBeenNthCalledWith(1, {
      command: 'npx',
      args: ['nx', 'g', '@code-pushup/nx-plugin:init', '--skipNxJson'],
      observer: expect.any(Object),
      verbose: false,
    });
    expect(spyParseNxProcessOutput).toHaveBeenNthCalledWith(1, 'stdout-mock');
    expect(spyExecuteProcess).toHaveBeenNthCalledWith(2, {
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration',
        '--skipTarget',
        `--project="${projectJson.name}"`,
      ],
      verbose: false,
    });
    expect(spyParseNxProcessOutput).toHaveBeenNthCalledWith(1, 'stdout-mock');
    expect(spyParseNxProcessOutput).toHaveBeenCalledTimes(2);
    expect(spyExecuteProcess).toHaveBeenCalledTimes(2);
    expect(spyTeardownNxContext).toHaveBeenCalledTimes(1);
    expect(spyTeardownNxContext).toHaveBeenNthCalledWith(1, {
      projectName: projectJson.name,
      nxJsonTeardown: false,
      projectJsonTeardown: false,
    });
  });

  it('should teardown nx.json if set up', async () => {
    const projectJson = { name: 'my-lib' };
    vol.fromJSON(
      {
        'project.json': JSON.stringify(projectJson),
      },
      MEMFS_VOLUME,
    );

    await initCodePushup();

    expect(spySetupNxContext).toHaveBeenCalledTimes(1);
    expect(spyTeardownNxContext).toHaveBeenCalledTimes(1);
    expect(spyTeardownNxContext).toHaveBeenNthCalledWith(1, {
      projectName: projectJson.name,
      nxJsonTeardown: true,
      projectJsonTeardown: false,
    });
  });

  it('should teardown project.json if set up', async () => {
    vol.fromJSON(
      {
        'nx.json': '{}',
      },
      MEMFS_VOLUME,
    );

    spyExecuteProcess.mockResolvedValue({
      stdout: 'stdout-mock',
      stderr: '',
    } as ProcessResult);

    await initCodePushup();

    expect(spySetupNxContext).toHaveBeenCalledTimes(1);
    expect(spyTeardownNxContext).toHaveBeenCalledTimes(1);
    expect(spyTeardownNxContext).toHaveBeenNthCalledWith(1, {
      projectName: 'source-root',
      nxJsonTeardown: false,
      projectJsonTeardown: true,
    });
  });
});
