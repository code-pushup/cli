import { describe, expect, it } from 'vitest';
import { mockPluginConfig, mockAuditOutputs } from '../../test';
import { runnerOutputAuditRefsPresentInPluginConfigs } from './report';

describe('RunnerOutput', () => {
  it('should pass if output audits are valid', () => {
    const pluginCfg = mockPluginConfig({
      pluginSlug: 'test',
      auditSlug: ['a'],
    });
    const runnerOutput = mockAuditOutputs({ auditSlug: 'test#a' });
    expect(
      runnerOutputAuditRefsPresentInPluginConfigs(runnerOutput, pluginCfg),
    ).toBe(false);
  });

  it('should throw if output audits are not in config', () => {
    const pluginCfg = mockPluginConfig({
      pluginSlug: 'test',
      auditSlug: ['a'],
    });
    const runnerOutput = mockAuditOutputs({ auditSlug: 'test#b' });
    expect(
      runnerOutputAuditRefsPresentInPluginConfigs(runnerOutput, pluginCfg),
    ).toEqual(['test#b']);
  });
});
