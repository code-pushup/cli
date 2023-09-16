import { describe, expect, it } from 'vitest';
import { mockPluginConfig, mockRunnerOutput } from '../../test';
import { runnerOutputAuditRefsPresentInPluginConfigs } from './report';

describe('RunnerOutput', () => {
  it('should pass if output audits are valid', () => {
    const pluginCfg = mockPluginConfig({ pluginSlug: 'test', auditSlug: ['a'] });
    const runnerOutput = mockRunnerOutput({ auditSlug: 'test#a' });
    expect(runnerOutputAuditRefsPresentInPluginConfigs(runnerOutput, pluginCfg)).toBe(
      false,
    );
  });

  it('should throw if output audits are not in config', () => {
    const pluginCfg = mockPluginConfig({ pluginSlug: 'test', auditSlug: ['a'] });
    const runnerOutput = mockRunnerOutput({ auditSlug: 'test#b' });
    expect(runnerOutputAuditRefsPresentInPluginConfigs(runnerOutput, pluginCfg)).toEqual([
      'test#b',
    ]);
  });
});
