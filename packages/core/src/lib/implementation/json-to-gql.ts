import {
  CategoryConfigRefType,
  IssueSourceType,
  IssueSeverity as PortalIssueSeverity,
  SaveReportMutationVariables,
} from '@code-pushup/portal-client';
import {
  AuditReport,
  CategoryConfig,
  IssueSeverity as CliIssueSeverity,
  Issue,
  PluginReport,
  Report,
} from '@code-pushup/models';
import { toArray } from '@code-pushup/utils';

export function jsonReportToGql(report: Report) {
  return {
    packageName: report.packageName,
    packageVersion: report.version,
    commandStartDate: report.date,
    commandDuration: report.duration,
    plugins: pluginReportsToGql(report.plugins),
    categories: categoryConfigsToGql(toArray(report.categories)),
  } satisfies Omit<
    SaveReportMutationVariables,
    'organization' | 'project' | 'commit'
  >;
}

function pluginReportsToGql(plugins: PluginReport[]) {
  return plugins.map(plugin => ({
    audits: auditReportsToGql(plugin.audits),
    description: plugin.description,
    docsUrl: plugin.docsUrl,
    groups: plugin.groups?.map(group => ({
      slug: group.slug,
      title: group.title,
      description: group.description,
      refs: group.refs.map(ref => ({ slug: ref.slug, weight: ref.weight })),
    })),
    icon: plugin.icon,
    slug: plugin.slug,
    title: plugin.title,
    packageName: plugin.packageName,
    packageVersion: plugin.version,
    runnerDuration: plugin.duration,
    runnerStartDate: plugin.date,
  }));
}

function auditReportsToGql(audits: AuditReport[]) {
  return audits.map(audit => ({
    description: audit.description,
    details: {
      issues: issuesToGql(audit.details?.issues),
    },
    docsUrl: audit.docsUrl,
    formattedValue: audit.displayValue,
    score: audit.score,
    slug: audit.slug,
    title: audit.title,
    value: audit.value,
  }));
}

export function issuesToGql(issues: Issue[] | undefined) {
  return (
    issues?.map(issue => ({
      message: issue.message,
      severity: transformSeverity(issue.severity),
      ...(issue.source?.file && {
        sourceType: IssueSourceType.SourceCode,
        sourceFilePath: issue.source.file,
        sourceStartLine: issue.source.position?.startLine,
        sourceStartColumn: issue.source.position?.startColumn,
        sourceEndLine: issue.source.position?.endLine,
        sourceEndColumn: issue.source.position?.endColumn,
      }),
    })) ?? []
  );
}

function categoryConfigsToGql(categories: CategoryConfig[]) {
  return categories.map(category => ({
    slug: category.slug,
    title: category.title,
    description: category.description,
    refs: category.refs.map(ref => ({
      plugin: ref.plugin,
      type:
        ref.type === 'audit'
          ? CategoryConfigRefType.Audit
          : CategoryConfigRefType.Group,
      weight: ref.weight,
      slug: ref.slug,
    })),
  }));
}

function transformSeverity(severity: CliIssueSeverity): PortalIssueSeverity {
  switch (severity) {
    case 'info':
      return PortalIssueSeverity.Info;
    case 'error':
      return PortalIssueSeverity.Error;
    case 'warning':
      return PortalIssueSeverity.Warning;
  }
}
