import { describe, expect, it } from 'vitest';
import {
  type AuditSeverity,
  type FinalJSPackagesPluginConfig,
  type JSPackagesPluginConfig,
  fillAuditLevelMapping,
  jsPackagesPluginConfigSchema,
} from './config.js';

describe('jsPackagesPluginConfigSchema', () => {
  it('should accept a JS package configuration with all entities', () => {
    expect(() =>
      jsPackagesPluginConfigSchema.parse({
        auditLevelMapping: { moderate: 'error' },
        checks: ['audit'],
        packageManager: 'yarn-classic',
        dependencyGroups: ['prod'],
        packageJsonPath: './ui-app/package.json',
      } satisfies JSPackagesPluginConfig),
    ).not.toThrow();
  });

  it('should accept a minimal JS package configuration', () => {
    expect(() =>
      jsPackagesPluginConfigSchema.parse({
        packageManager: 'pnpm',
      } satisfies JSPackagesPluginConfig),
    ).not.toThrow();
  });

  it('should fill in default values', () => {
    const config = jsPackagesPluginConfigSchema.parse({
      packageManager: 'npm',
    });
    expect(config).toEqual<FinalJSPackagesPluginConfig>({
      checks: ['audit', 'outdated'],
      packageManager: 'npm',
      dependencyGroups: ['prod', 'dev'],
      packageJsonPath: 'package.json',
      auditLevelMapping: {
        critical: 'error',
        high: 'error',
        moderate: 'warning',
        low: 'warning',
        info: 'info',
      },
    });
  });

  it('should throw for no passed commands', () => {
    expect(() =>
      jsPackagesPluginConfigSchema.parse({
        packageManager: 'yarn-classic',
        checks: [],
      }),
    ).toThrow('too_small');
  });

  it('should throw for no passed dependency group', () => {
    expect(() =>
      jsPackagesPluginConfigSchema.parse({
        packageManager: 'yarn-classic',
        dependencyGroups: [],
      }),
    ).toThrow('too_small');
  });
});

describe('fillAuditLevelMapping', () => {
  it('should fill in defaults', () => {
    expect(fillAuditLevelMapping({})).toEqual<AuditSeverity>({
      critical: 'error',
      high: 'error',
      moderate: 'warning',
      low: 'warning',
      info: 'info',
    });
  });

  it('should override mapping for given values', () => {
    expect(
      fillAuditLevelMapping({ high: 'warning', low: 'info' }),
    ).toEqual<AuditSeverity>({
      critical: 'error',
      high: 'warning',
      moderate: 'warning',
      low: 'info',
      info: 'info',
    });
  });
});
