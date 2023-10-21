import { join } from 'node:path';
import { Audit, AuditReport, PluginConfig } from '../../src';
import { runnerConfig } from './runner.mock';

export function pluginConfig(
  auditOutputs: AuditReport[],
  opt?: Partial<PluginConfig> & { outputDir?: string; outputFile?: string },
): PluginConfig {
  const { outputDir, outputFile } = opt || {};
  const pluginOutputPath = join(outputDir || 'tmp', outputFile || 'out.json');
  return {
    slug: 'mock-plugin-slug',
    title: 'Plugin Title',
    icon: 'nrwl',
    description: 'Plugin description',
    docsUrl: 'https://my-plugin.docs.dev?1',
    audits: auditOutputs.map(auditOutput => auditConfig(auditOutput)),
    runner: runnerConfig(auditOutputs, pluginOutputPath),
    ...(opt || {}),
  } satisfies PluginConfig;
}

export function auditConfig(opt?: Partial<Audit>): Audit {
  return {
    slug: opt?.slug || 'mock-audit-slug',
    title: opt?.title || 'Audit Title',
    description: opt?.description || 'audit description',
    docsUrl: opt?.docsUrl || 'http://www.my-docs.dev'
  } satisfies Required<Audit>;
}

export function auditReport(opt?: Partial<AuditReport>): AuditReport {
  return {
    slug: 'mock-audit-slug',
    title: 'Audit Title',
    description: 'audit description',
    docsUrl: 'http://www.my-docs.dev',
    score: 0,
    details: {
      issues: [],
    },
    value: 0,
    displayValue: '0x',
    ...(opt || {}),
  } satisfies AuditReport;
}
