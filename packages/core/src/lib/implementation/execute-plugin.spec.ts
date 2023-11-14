import { describe, expect, it } from 'vitest';
import {
  AuditOutputs,
  PluginConfig,
  RunnerConfig,
  auditOutputsSchema,
} from '@code-pushup/models';
import { auditReport, pluginConfig } from '@code-pushup/models/testing';
import { Observer } from '@code-pushup/utils';
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

  it('should work with valid process runner config', async () => {
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

  it('should work with valid esm runner config', async () => {
    const esmRunnerConfig = (observer?: Observer) => {
      observer?.next?.('update');
      return Promise.resolve([
        { slug: 'mock-audit-slug', score: 0, value: 0 },
      ] satisfies AuditOutputs);
    };

    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: esmRunnerConfig,
    };
    const pluginResult = await executePlugin(pluginCfg);
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throw if invalid runnerOutput is produced with transform', async () => {
    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: (observer?: Observer) => {
        observer?.next?.('update');

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
