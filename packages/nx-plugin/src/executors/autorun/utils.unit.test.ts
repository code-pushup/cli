import { afterEach, beforeEach, expect } from 'vitest';
import {
  parseAutorunExecutorOnlyOptions,
  parseAutorunExecutorOptions,
} from './utils';

describe('autorunExecutorOnlyConfig', () => {
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

describe('getExecutorOptions', () => {
  const oldEnv = process.env;
  beforeEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = {};
  });

  afterEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = oldEnv;
  });

  it('should leverage other config helper to assemble the executor config', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env = {
      outputDir: 'from-env-vars',
    };
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
    expect(executorOptions).toStrictEqual({
      config: 'root/code-pushup.config.json',
      progress: false,
      verbose: false,
      persist: {
        filename: 'from-options',
        format: ['json'],
        outputDir: expect.stringContaining(projectName),
      },
      upload: {
        // apiKey: "cp_57ba713d0803d41b2ea48aacf3a11c227fe0c7d0276870ab4fe79f4cdefcdb3c",
        //  organization: "code-pushup",
        // server: "https://new-portal.code-pushup.dev",
        project: projectName,
      },
    });
  });
});
