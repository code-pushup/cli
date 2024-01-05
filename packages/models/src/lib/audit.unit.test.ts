import { describe, expect, it } from 'vitest';
import { reportMock } from '../../test';
import { pluginConfigSchema } from './plugin-config';
import { auditOutputsSchema } from './plugin-process-output';

describe('auditOutputsSchema', () => {
  it('should pass if output audits are valid', () => {
    const auditOutputs = reportMock().plugins[0].audits;
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });

  it('should throw if slugs of audits are invalid', () => {
    const auditOutputs = reportMock().plugins[0].audits;
    auditOutputs[0].slug = '-invalid-audit-slug';

    expect(() => auditOutputsSchema.parse(auditOutputs)).toThrow(
      'slug has to follow the pattern',
    );
  });

  it('should throw if slugs of audits are duplicated', () => {
    const audits = reportMock().plugins[0].audits;
    const auditOutputs = [...audits, audits[0]];
    expect(() => auditOutputsSchema.parse(auditOutputs)).toThrow(
      'In plugin audits the slugs are not unique',
    );
  });

  it('should throw if plugin groups refs contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const pluginConfig = reportMock().plugins[1];
    const groups = pluginConfig.groups;
    groups[0].refs[0].slug = invalidAuditRef;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the patter`,
    );
  });
});
