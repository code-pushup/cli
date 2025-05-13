import type {
  AuditOutput,
  AuditReport,
  PluginReport,
  Report,
} from '@code-pushup/models';

export function omitVariableAuditData({
  score: _,
  value: __,
  displayValue: ___,
  details: ____,
  ...auditReport
}: AuditReport | AuditOutput) {
  return auditReport;
}

export function omitVariablePluginData(
  { date: _, duration: __, version: ___, ...pluginReport }: PluginReport,
  options?: {
    omitAuditData: boolean;
  },
) {
  const { omitAuditData } = options ?? {};
  if (omitAuditData) {
    return {
      ...pluginReport,
      audits: pluginReport.audits.map(omitVariableAuditData),
    };
  }
  return pluginReport;
}

export function omitVariableReportData(
  { commit: _, date: __, duration: ___, version: ____, ...report }: Report,
  options?: {
    omitAuditData: boolean;
  },
) {
  return {
    ...report,
    plugins: report.plugins.map(plugin =>
      omitVariablePluginData(plugin, options),
    ),
  };
}
