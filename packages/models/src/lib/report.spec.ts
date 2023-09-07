import {describe, expect, it} from 'vitest';
import {mockPluginConfig, mockRunnerOutput,} from './implementation/helpers.mock';
import {runnerOutputAuditRefsPresentInPluginConfigs} from "./report";

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
