import { describe, expect, it } from 'vitest';
import { report } from '../../test';
import { pluginConfigSchema } from './plugin-config';
import { auditOutputsSchema } from './plugin-process-output';

describe('auditOutputsSchema', () => {
  it('should pass if output audits are valid', () => {
    const auditOutputs = report().plugins[0].audits;
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });

  it('should throw if slugs of audits are invalid', () => {
    const auditOutputs = report().plugins[0].audits;
    auditOutputs[0].slug = '-invalid-audit-slug';

    expect(() => auditOutputsSchema.parse(auditOutputs)).toThrow(
      'slug has to follow the pattern',
    );
  });

  it('should throw if slugs of audits are duplicated', () => {
    const audits = report().plugins[0].audits;
    const auditOutputs = [...audits, audits[0]];
    expect(() => auditOutputsSchema.parse(auditOutputs)).toThrow(
      'In plugin audits the slugs are not unique',
    );
  });

  it('should throw if plugin groups refs contain invalid slugs', () => {
    const invalidAuditRef = '-invalid-audit-ref';
    const pluginConfig = report().plugins[1];
    const groups = pluginConfig.groups;
    groups[0].refs[0].slug = invalidAuditRef;
    pluginConfig.groups = groups;

    expect(() => pluginConfigSchema.parse(pluginConfig)).toThrow(
      `slug has to follow the patter`,
    );
  });
});
