import { describe, expect, it } from 'vitest';
import { config } from '../../test';
import { auditGroupSchema, pluginConfigSchema } from './plugin-config';

describe('auditGroupSchema', () => {
  it('should throw if a group has duplicate audit refs', () => {
    const group = config().plugins[1].groups[0];
    group.refs = [...group.refs, group.refs[0]];

    expect(() => auditGroupSchema.parse(group)).toThrow(
      'In plugin groups the audit refs are not unique',
    );
  });
});

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
    const groups = pluginConfig.groups;
    groups[0].slug = invalidGroupSlug;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if plugin groups have duplicate slugs', () => {
    const pluginConfig = config().plugins[1];
    const groups = pluginConfig.groups;
    pluginConfig.groups = [...groups, groups[0]];
    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      'In groups the slugs are not unique',
    );
  });

  it('should throw if plugin groups refs contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const pluginConfig = config().plugins[1];
    const groups = pluginConfig.groups;

    groups[0].refs[0].slug = invalidAuditRef;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the pattern`,
    );
  });
});
