import { describe, expect, it } from 'vitest';
import {
  AuditOutputs,
  OnProgress,
  PluginConfig,
  RunnerConfig,
  RunnerFunction,
  auditOutputsSchema,
} from '@code-pushup/models';
import { auditReport, pluginConfig } from '@code-pushup/models/testing';
import { DEFAULT_TESTING_CLI_OPTIONS } from '../../../test/constants';
import {
  PluginOutputMissingAuditError,
  executePlugin,
  executePlugins,
} from './execute-plugin';

const validPluginCfg = pluginConfig([auditReport()]);
const validPluginCfg2 = pluginConfig([auditReport()], {
  slug: 'p2',
});
const invalidReport = auditReport();
const invalidSlugPluginCfg = pluginConfig([auditReport()]);
invalidSlugPluginCfg.audits = [
  {
    ...invalidReport,
    slug: '-invalid-audit-slug',
  },
];

const DEFAULT_OPTIONS = { progress: DEFAULT_TESTING_CLI_OPTIONS.progress };

describe('executePlugin', () => {
  it('should execute valid plugin config', async () => {
    const pluginResult = await executePlugin(validPluginCfg);
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throw with missing plugin audit', async () => {
    const pluginCfg = invalidSlugPluginCfg;
    await expect(() => executePlugin(pluginCfg)).rejects.toThrow(
      new PluginOutputMissingAuditError('mock-audit-slug'),
    );
  });

  it('should work with valid runner config', async () => {
    const runnerConfig = validPluginCfg.runner as RunnerConfig;
    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: {
        ...runnerConfig,
        outputTransform: (audits: unknown) =>
          Promise.resolve(audits as AuditOutputs),
      },
    };
    const pluginResult = await executePlugin(pluginCfg);
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should work with valid runner function', async () => {
    const runnerFunction = (onProgress?: OnProgress) => {
      onProgress?.('update');
      return Promise.resolve([
        { slug: 'mock-audit-slug', score: 0, value: 0 },
      ] satisfies AuditOutputs);
    };

    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: runnerFunction,
    };
    const pluginResult = await executePlugin(pluginCfg);
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throw with invalid runner config', async () => {
    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: '' as unknown as RunnerFunction,
    };
    await expect(executePlugin(pluginCfg)).rejects.toThrow(
      'runner is not a function',
    );
  });

  it('should throw if invalid runnerOutput', async () => {
    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: (onProgress?: OnProgress) => {
        onProgress?.('update');

        return Promise.resolve([
          { slug: '-mock-audit-slug', score: 0, value: 0 },
        ] satisfies AuditOutputs);
      },
    };

    await expect(() => executePlugin(pluginCfg)).rejects.toThrow(
      'The slug has to follow the pattern',
    );
  });
});

describe('executePlugins', () => {
  it('should work with valid plugins', async () => {
    const plugins = [validPluginCfg, validPluginCfg2];
    const pluginResult = await executePlugins(plugins, DEFAULT_OPTIONS);

    expect(pluginResult[0]?.date.endsWith('Z')).toBeTruthy();
    expect(pluginResult[0]?.duration).toBeTruthy();

    expect(pluginResult[0]?.audits[0]?.slug).toBe('mock-audit-slug');
    expect(pluginResult[1]?.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() =>
      auditOutputsSchema.parse(pluginResult[0]?.audits),
    ).not.toThrow();
    expect(() =>
      auditOutputsSchema.parse(pluginResult[1]?.audits),
    ).not.toThrow();
  });

  it('should throws with invalid plugins', async () => {
    const plugins: PluginConfig[] = [validPluginCfg, invalidSlugPluginCfg];
    await expect(() =>
      executePlugins(plugins, DEFAULT_OPTIONS),
    ).rejects.toThrow('Audit metadata not found for slug mock-audit-slug');
  });

  it('should log invalid plugin errors and throw', async () => {
    const pluginConfig = {
      ...validPluginCfg,
      runner: vi.fn().mockRejectedValue('plugin 1 error'),
    };
    const pluginConfig2 = {
      ...validPluginCfg2,
      runner: vi.fn().mockResolvedValue([]),
    };
    const pluginConfig3 = {
      ...validPluginCfg,
      runner: vi.fn().mockRejectedValue('plugin 3 error'),
    };
    const plugins = [pluginConfig, pluginConfig2, pluginConfig3];
    await expect(() =>
      executePlugins(plugins, DEFAULT_OPTIONS),
    ).rejects.toThrow(
      'Plugins failed: 2 errors: plugin 1 error, plugin 3 error',
    );
    expect(console.error).toHaveBeenCalledWith('plugin 1 error');
    expect(console.error).toHaveBeenCalledWith('plugin 3 error');
    expect(pluginConfig.runner).toHaveBeenCalled();
    expect(pluginConfig2.runner).toHaveBeenCalled();
    expect(pluginConfig3.runner).toHaveBeenCalled();
  });

  it('should use outputTransform if provided', async () => {
    const processRunner = validPluginCfg.runner as RunnerConfig;
    const plugins: PluginConfig[] = [
      {
        ...validPluginCfg,
        runner: {
          ...processRunner,
          outputTransform: (outputs: unknown): Promise<AuditOutputs> => {
            return Promise.resolve(
              (outputs as AuditOutputs).map(output => {
                return {
                  ...output,
                  displayValue:
                    'transformed slug description - ' +
                    (output as { slug: string }).slug,
                };
              }),
            );
          },
        },
      },
    ];
    const pluginResult = await executePlugins(plugins, DEFAULT_OPTIONS);
    expect(pluginResult[0]?.audits[0]?.displayValue).toBe(
      'transformed slug description - mock-audit-slug',
    );
  });
});
