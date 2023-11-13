import { describe, expect, it } from 'vitest';
import { config, pluginConfig } from '../../test';
import { pluginConfigSchema } from './plugin-config';
import { AuditOutputs } from './plugin-process-output';

describe('pluginConfigSchema', () => {
  it('should parse if plugin configuration is valid', () => {
    const pluginConfig = config().plugins[0];
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if plugin slug has a invalid pattern', () => {
    const invalidPluginSlug = '-invalid-plugin-slug';
    const pluginConfig = config().plugins[0];
    pluginConfig.slug = invalidPluginSlug;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the pattern`,
    );
  });

  it('should throw if plugin audits contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-slug';
    const pluginConfig = config().plugins[0];
    pluginConfig.audits[0].slug = invalidAuditRef;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
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
    const pluginConfig = config().plugins[1];
    const groups = pluginConfig.groups!;
    groups[0].slug = invalidGroupSlug;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if plugin groups have duplicate slugs', () => {
    const pluginConfig = config().plugins[1];
    const groups = pluginConfig.groups!;
    pluginConfig.groups = [...groups, groups[0]];
    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      'In groups the slugs are not unique',
    );
  });

  it('should throw if plugin groups refs contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const pluginConfig = config().plugins[1];
    const groups = pluginConfig.groups!;

    groups[0].refs[0].slug = invalidAuditRef;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the pattern`,
    );
  });

  it('should take a outputTransform function', () => {
    const undefinedPluginOutput = [
      { slug: 'audit-1', errors: 0 },
      { slug: 'audit-2', errors: 5 },
    ];
    const pluginCfg = pluginConfig([]);
    pluginCfg.runner.outputTransform = (data: unknown): AuditOutputs => {
      return (data as typeof undefinedPluginOutput).map(data => ({
        slug: data.slug,
        score: Number(data.errors === 0),
        value: data.errors,
      }));
    };

    expect(
      pluginConfigSchema.parse(pluginCfg).runner.outputTransform,
    ).toBeDefined();
    expect(
      pluginConfigSchema.parse(pluginCfg).runner.outputTransform!(
        undefinedPluginOutput,
      ),
    ).toEqual([
      { slug: 'audit-1', score: 1, value: 0 },
      { slug: 'audit-2', score: 0, value: 5 },
    ]);
  });
});
