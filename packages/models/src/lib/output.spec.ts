import { describe, expect, it } from 'vitest';
import {
  mockPluginConfig,
  mockRunnerOutput,
} from './implementation/helpers.mock';
import {
  runnerOutputAuditRefsPresentInPluginConfigs,
  runnerOutputSchema,
} from './output';

/*
 RunnerOutput
 - each audit result should contain a valid slug of some audit provided during initialization
   - this is always checked within the context of the given plugin
  */
describe('runnerOutputSchema', () => {
  it('should pass if output audits are valid', () => {
    const out = mockRunnerOutput();
    expect(() => runnerOutputSchema.parse(out)).not.toThrow();
  });

  it('should throw if slugs of audits are invalid', () => {
    const out = mockRunnerOutput({ auditSlug: '-invalid-audit-slug' });
    expect(() => runnerOutputSchema.parse(out)).toThrow(
      'slug has to follow the patters',
    );
  });

  it('should throw if slugs of audits are duplicated', () => {
    const out = mockRunnerOutput({ auditSlug: ['a', 'a'] });
    expect(() => runnerOutputSchema.parse(out)).toThrow(
      'In runner output the audit slugs are not unique',
    );
  });
});

describe('RunnerOutput', () => {
  it('should pass if output audits are valid', () => {
    const plugin = mockPluginConfig({ pluginSlug: 'test', auditSlug: ['a'] });
    const out = mockRunnerOutput({ auditSlug: 'test#a' });
    expect(runnerOutputAuditRefsPresentInPluginConfigs(out, plugin)).toBe(
      false,
    );
  });

  it('should throw if output audits are not in config', () => {
    const plugin = mockPluginConfig({ pluginSlug: 'test', auditSlug: ['a'] });
    const out = mockRunnerOutput({ auditSlug: 'test#b' });
    expect(runnerOutputAuditRefsPresentInPluginConfigs(out, plugin)).toEqual([
      'test#b',
    ]);
  });
});
