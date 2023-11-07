import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  AuditReport,
  PluginConfig,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  auditReport,
  echoRunnerConfig,
  pluginConfig,
} from '@code-pushup/models/testing';
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
    await expect(() => executePlugin(pluginCfg)).rejects.toThrow();
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    const invalidAuditOutputs: AuditReport[] = [
      { p: 42 } as unknown as AuditReport,
    ];
    const pluginCfg = pluginConfig([auditReport()]);
    pluginCfg.runner = echoRunnerConfig(
      invalidAuditOutputs,
      join('tmp', 'out.json'),
    );
    await expect(() => executePlugin(pluginCfg)).rejects.toThrow(
      'Plugin output of plugin with slug mock-plugin-slug',
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
    ).rejects.toThrow();
  });
});
