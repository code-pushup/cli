import {
  type AuditReport as PortalAudit,
  type CategoryConfig as PortalCategory,
  CategoryConfigRefType as PortalCategoryRefType,
  type GroupConfig as PortalGroup,
  type AuditReportIssue as PortalIssue,
  IssueSeverity as PortalIssueSeverity,
  IssueSourceType as PortalIssueSourceType,
  type PluginReport as PortalPlugin,
  type SaveReportMutationVariables,
} from '@code-pushup/portal-client';
import {
  AuditReport,
  CategoryConfig,
  CategoryRef,
  type Group,
  Issue,
  IssueSeverity,
  PluginReport,
  Report,
} from '@code-pushup/models';

export function reportToGQL(
  report: Report,
): Omit<SaveReportMutationVariables, 'organization' | 'project' | 'commit'> {
  return {
    packageName: report.packageName,
    packageVersion: report.version,
    commandStartDate: report.date,
    commandDuration: report.duration,
    plugins: report.plugins.map(pluginToGQL),
    categories: report.categories.map(categoryToGQL),
  };
}

function pluginToGQL(plugin: PluginReport): PortalPlugin {
  return {
    slug: plugin.slug,
    title: plugin.title,
    icon: plugin.icon,
    description: plugin.description,
    docsUrl: plugin.docsUrl,
    audits: plugin.audits.map(auditToGQL),
    groups: plugin.groups?.map(groupToGQL),
    packageName: plugin.packageName,
    packageVersion: plugin.version,
    runnerDuration: plugin.duration,
    runnerStartDate: plugin.date,
  };
}

function groupToGQL(group: Group): PortalGroup {
  return {
    slug: group.slug,
    title: group.title,
    description: group.description,
    refs: group.refs.map(ref => ({ slug: ref.slug, weight: ref.weight })),
  };
}

function auditToGQL(audit: AuditReport): PortalAudit {
  return {
    slug: audit.slug,
    title: audit.title,
    description: audit.description,
    docsUrl: audit.docsUrl,
    score: audit.score,
    value: audit.value,
    formattedValue: audit.displayValue,
    ...(audit.details && {
      details: {
        issues: audit.details.issues.map(issueToGQL),
      },
    }),
  };
}

export function issueToGQL(issue: Issue): PortalIssue {
  return {
    message: issue.message,
    severity: issueSeverityToGQL(issue.severity),
    ...(issue.source?.file && {
      sourceType: PortalIssueSourceType.SourceCode,
      sourceFilePath: issue.source.file,
      sourceStartLine: issue.source.position?.startLine,
      sourceStartColumn: issue.source.position?.startColumn,
      sourceEndLine: issue.source.position?.endLine,
      sourceEndColumn: issue.source.position?.endColumn,
    }),
  };
}

function categoryToGQL(category: CategoryConfig): PortalCategory {
  return {
    slug: category.slug,
    title: category.title,
    description: category.description,
    isBinary: category.isBinary,
    refs: category.refs.map(ref => ({
      plugin: ref.plugin,
      type: categoryRefTypeToGQL(ref.type),
      weight: ref.weight,
      slug: ref.slug,
    })),
  };
}

function categoryRefTypeToGQL(
  type: CategoryRef['type'],
): PortalCategoryRefType {
  switch (type) {
    case 'audit':
      return PortalCategoryRefType.Audit;
    case 'group':
      return PortalCategoryRefType.Group;
  }
}

function issueSeverityToGQL(severity: IssueSeverity): PortalIssueSeverity {
  switch (severity) {
    case 'info':
      return PortalIssueSeverity.Info;
    case 'error':
      return PortalIssueSeverity.Error;
    case 'warning':
      return PortalIssueSeverity.Warning;
  }
}
