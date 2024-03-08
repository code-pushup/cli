import { describe, expect, it } from 'vitest';
import { IssueSeverity } from '@code-pushup/models';
import {
  FinalJSPackagesPluginConfig,
  JSPackagesPluginConfig,
  PackageAuditLevel,
  fillAuditLevelMapping,
  jsPackagesPluginConfigSchema,
} from './config';

describe('jsPackagesPluginConfigSchema', () => {
  it('should accept a JS package configuration with all entities', () => {
    expect(() =>
      jsPackagesPluginConfigSchema.parse({
        auditLevelMapping: { moderate: 'error' },
        features: ['audit'],
        packageManager: 'yarn',
      } satisfies JSPackagesPluginConfig),
    ).not.toThrow();
  });

  it('should accept a minimal JS package configuration', () => {
    expect(() => jsPackagesPluginConfigSchema.parse({})).not.toThrow();
  });

  it('should fill in default values', () => {
    const config = jsPackagesPluginConfigSchema.parse({});
    expect(config).toEqual<FinalJSPackagesPluginConfig>({
      features: ['audit', 'outdated'],
      packageManager: 'npm',
      auditLevelMapping: {
        critical: 'error',
        high: 'error',
        moderate: 'warning',
        low: 'warning',
        info: 'info',
      },
    });
  });

  it('should throw for no features', () => {
    expect(() => jsPackagesPluginConfigSchema.parse({ features: [] })).toThrow(
      'too_small',
    );
  });
});

describe('fillAuditLevelMapping', () => {
  it('should fill in defaults', () => {
    expect(fillAuditLevelMapping({})).toEqual<
      Record<PackageAuditLevel, IssueSeverity>
    >({
      critical: 'error',
      high: 'error',
      moderate: 'warning',
      low: 'warning',
      info: 'info',
    });
  });

  it('should override mapping for given values', () => {
    expect(fillAuditLevelMapping({ high: 'warning', low: 'info' })).toEqual<
      Record<PackageAuditLevel, IssueSeverity>
    >({
      critical: 'error',
      high: 'warning',
      moderate: 'warning',
      low: 'info',
      info: 'info',
    });
  });
});
