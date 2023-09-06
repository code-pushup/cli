import { describe, expect, it } from 'vitest';
import {
  mockGroupConfig,
  mockPluginConfig,
} from './implementation/helpers.mock';
import { pluginConfigSchema, groupSchema } from './plugin-config';

describe('pluginConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const cfg = mockPluginConfig();
    expect(() => pluginConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if plugin slug has a invalid pattern', () => {
    const invalidCategorySlug = '-invalid-plugin-slug';
    const cfg = mockPluginConfig({ pluginSlug: invalidCategorySlug });

    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if audit ref in audits is invalid', () => {
    const invalidAuditRef = '-invalid-audit-slug';
    const cfg = mockPluginConfig({ auditSlug: [invalidAuditRef] });

    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if audit refs are duplicates', () => {
    const duplicatedAuditRef = 'mock-audit-slug';
    const cfg = mockPluginConfig({
      auditSlug: [duplicatedAuditRef, duplicatedAuditRef],
    });

    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      `In plugin audits the slugs are not unique`,
    );
  });

  it('should throw if groups slug in invalid', () => {
    const invalidGroupSlug = '-invalid-group-slug';
    const cfg = mockPluginConfig();
    cfg.groups = [mockGroupConfig({ groupSlug: invalidGroupSlug })];

    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if group metrics ref in invalid', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const cfg = mockPluginConfig();
    cfg.groups = [mockGroupConfig({ auditSlug: invalidAuditRef })];

    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      `slug has to follow the patter`,
    );
  });

  it('should throw if groups have duplicate slugs', () => {
    const auditSlug = 'no-any';
    const cfg = mockPluginConfig({ auditSlug });
    cfg.groups = [
      mockGroupConfig({ auditSlug }),
      mockGroupConfig({ auditSlug }),
    ];
    expect(() => pluginConfigSchema.parse(cfg)).toThrow(
      'In groups the slugs are not unique',
    );
  });

  it('should throw if a group has duplicate audit refs', () => {
    const auditSlug = 'no-any';
    // @TODO use pluginConfigSchema instead of groupSchema
    const cfg = mockGroupConfig({ auditSlug: [auditSlug, auditSlug] });

    expect(() => groupSchema.parse(cfg)).toThrow(
      'In plugin groups the audit refs are not unique',
    );
  });
});
