import { join } from 'node:path';
import {
  type Audit,
  type AuditReport,
  type PluginConfig,
  auditReportSchema,
  auditSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { echoRunnerConfigMock } from './runner-config.mock.js';

export function pluginConfigMock(
  auditOutputs: AuditReport[],
  opt?: Partial<PluginConfig> & { outputDir?: string; outputFile?: string },
): PluginConfig {
  const { outputDir, outputFile } = opt || {};
  const pluginOutputFile = join(
    outputDir || 'tmp',
    outputFile || `out.${Date.now()}.json`,
  );
  return pluginConfigSchema.parse({
    slug: 'mock-plugin-slug',
    title: 'Plugin Title',
    icon: 'nrwl',
    description: 'Plugin description',
    docsUrl: 'https://my-plugin.docs.dev?1',
    audits: auditOutputs.map(auditOutput => auditConfigMock(auditOutput)),
    runner: echoRunnerConfigMock(auditOutputs, pluginOutputFile),
    ...opt,
  });
}

export function auditConfigMock(opt?: Partial<Audit>): Audit {
  return auditSchema.parse({
    slug: opt?.slug || 'mock-audit-slug',
    title: opt?.title || 'Audit Title',
    description: opt?.description || 'audit description',
    docsUrl: opt?.docsUrl || 'http://www.my-docs.dev',
  }) as Required<Audit>;
}

export function auditReportMock(opt?: Partial<AuditReport>): AuditReport {
  return auditReportSchema.parse({
    slug: 'mock-audit-slug',
    title: 'Audit Title',
    description: 'audit description',
    docsUrl: 'http://www.my-docs.dev',
    score: 0,
    value: 0,
    displayValue: '0x',
    details: {
      issues: [],
    },
    ...opt,
  }) as Required<AuditReport>;
}
