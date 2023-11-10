import { describe, expect, it } from 'vitest';
import {
  AuditOutput,
  AuditOutputs,
  PluginConfig,
  auditOutputsSchema,
} from '@code-pushup/models';
import { auditReport, pluginConfig } from '@code-pushup/models/testing';
import { DEFAULT_TESTING_CLI_OPTIONS } from '../../../test/constants';
import { executePlugin, executePlugins } from './execute-plugin';

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

  it('should throws with invalid plugin audits slug', async () => {
    const pluginCfg = invalidSlugPluginCfg;
    await expect(() => executePlugin(pluginCfg)).rejects.toThrow(
      /Plugin output of plugin .* is invalid./,
    );
  });

  it('should throw if invalid runnerOutput is produced with transform', async () => {
    const pluginCfg: PluginConfig = {
      ...validPluginCfg,
      runner: {
        ...validPluginCfg.runner,
        transform: (d: Record<string, unknown>[]) =>
          d.map((d, idx) => ({
            ...d,
            slug: '-invalid-slug-' + idx,
          })) as unknown as AuditOutputs,
      },
    };

    await expect(() => executePlugin(pluginCfg)).rejects.toThrow(
      /Plugin output of plugin .* is invalid./,
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
    ).rejects.toThrow(/Plugin output of plugin .* is invalid./);
  });

  it('should use transform if provided', async () => {
    const plugins = [
      {
        ...validPluginCfg,
        runner: {
          ...validPluginCfg.runner,
          transform: (outputs: Record<string, unknown>[]): AuditOutputs => {
            return outputs.map(output => {
              return {
                ...output,
                displayValue:
                  'transformed slug description - ' +
                  (output as { slug: string }).slug,
              } as unknown as AuditOutput;
            });
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
