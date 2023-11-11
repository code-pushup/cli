import { describe, expect, it } from 'vitest';
import {
  auditReport,
  config,
  echoRunnerConfig,
  lighthousePluginConfig,
  outputFileToAuditOutputs,
  pluginConfig,
  report,
} from '../../test';
import { pluginConfigSchema } from './plugin-config';

describe('pluginConfigSchema', () => {
  it('should parse if plugin configuration is valid', () => {
    const pluginCfg = pluginConfig([auditReport()]);
    expect(() => pluginConfigSchema.parse(pluginCfg)).not.toThrow();
  });

  it('should throw if plugin slug has a invalid pattern', () => {
    const invalidPluginSlug = '-invalid-plugin-slug';
    const pluginCfg = pluginConfig([auditReport()]);
    pluginCfg.slug = invalidPluginSlug;

    expect(() => pluginConfigSchema.parse(pluginCfg)).toThrow(
      `slug has to follow the pattern`,
    );
  });

  it('should throw if plugin audits contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-slug';
    const pluginCfg = pluginConfig([auditReport()]);
    pluginCfg.audits[0].slug = invalidAuditRef;

    expect(() => pluginConfigSchema.parse(pluginCfg)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if plugin audits slugs are duplicates', () => {
    const pluginConfig = config().plugins[0];
    pluginConfig.audits = [...pluginConfig.audits, pluginConfig.audits[0]];

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `In plugin audits the slugs are not unique`,
    );
  });

  it('should throw if plugin groups contain invalid slugs', () => {
    const invalidGroupSlug = '-invalid-group-slug';
    const pluginConfig = lighthousePluginConfig();
    const groups = pluginConfig.groups;
    groups[0].slug = invalidGroupSlug;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if plugin groups have duplicate slugs', () => {
    const pluginConfig = lighthousePluginConfig();
    const groups = pluginConfig.groups;
    pluginConfig.groups = [...groups, groups[0]];
    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      'In groups the slugs are not unique',
    );
  });

  it('should throw if plugin groups refs contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const pluginConfig = lighthousePluginConfig();
    const groups = pluginConfig.groups;

    groups[0].refs[0].slug = invalidAuditRef;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the pattern`,
    );
  });

  it('take a transform function', () => {
    const pluginCfg = pluginConfig([], {
      runner: echoRunnerConfig([auditReport()], 'out.json', {
        outputFileToAuditResults: outputFileToAuditOutputs(),
      }),
    });

    const plgCfg = pluginConfigSchema.parse(pluginCfg);
    expect(plgCfg.runner.outputFileToAuditResults).toBeDefined();
    expect(plgCfg.runner.outputFileToAuditResults([report()])).toEqual([
      { slug: 'mock-audit-slug', displayValue: 'transformed' },
    ]);
  });
});
