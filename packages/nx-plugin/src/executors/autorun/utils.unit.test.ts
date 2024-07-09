import { afterEach, beforeEach, expect } from 'vitest';
import { autorunExecutorOnlyConfig, getExecutorOptions } from './utils';

describe('autorunExecutorOnlyConfig', () => {
  it('should provide NO default projectPrefix', () => {
    expect(autorunExecutorOnlyConfig({})).toStrictEqual(
      expect.not.objectContaining({ projectPrefix: expect.anything() }),
    );
  });

  it('should process given projectPrefix', () => {
    expect(autorunExecutorOnlyConfig({ projectPrefix: 'cli' })).toStrictEqual(
      expect.objectContaining({ projectPrefix: 'cli' }),
    );
  });

  it('should provide NO default dryRun', () => {
    expect(autorunExecutorOnlyConfig({})).toStrictEqual(
      expect.not.objectContaining({ dryRun: expect.anything() }),
    );
  });

  it('should process given dryRun', () => {
    expect(autorunExecutorOnlyConfig({ dryRun: false })).toStrictEqual(
      expect.objectContaining({ dryRun: false }),
    );
  });

  it('should provide default onlyPlugins', () => {
    expect(autorunExecutorOnlyConfig({})).toStrictEqual(
      expect.not.objectContaining({ onlyPlugins: ['json'] }),
    );
  });

  it('should process given onlyPlugins', () => {
    expect(
      autorunExecutorOnlyConfig({ onlyPlugins: ['md', 'json'] }),
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

  it('should leverage other config helper to assemble the executor config', async () => {
    // eslint-disable-next-line functional/immutable-data
    process.env = {
      outputDir: 'from-env-vars',
    };
    const projectName = 'my-app';
    const executorOptions = await getExecutorOptions(
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
      progress: false,
      verbose: false,
      persist: {
        filename: 'from-options-report',
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
