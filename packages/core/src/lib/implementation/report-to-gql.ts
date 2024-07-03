import {
  type AuditReport as PortalAudit,
  type CategoryConfig as PortalCategory,
  CategoryConfigRefType as PortalCategoryRefType,
  type GroupConfig as PortalGroup,
  type AuditReportIssue as PortalIssue,
  IssueSeverity as PortalIssueSeverity,
  IssueSourceType as PortalIssueSourceType,
  type PluginReport as PortalPlugin,
  type AuditReportTable as PortalTable,
  TableAlignment as PortalTableAlignment,
  type AuditReportTableCell as PortalTableCell,
  type AuditReportTableColumn as PortalTableColumn,
  type SaveReportMutationVariables,
} from '@code-pushup/portal-client';
import type {
  AuditReport,
  CategoryConfig,
  CategoryRef,
  Group,
  Issue,
  IssueSeverity,
  PluginReport,
  Report,
  Table,
  TableAlignment,
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
  const {
    slug,
    title,
    description,
    docsUrl,
    score,
    value,
    displayValue: formattedValue,
    details,
  } = audit;
  const { issues, table } = details ?? {};
  return {
    slug,
    title,
    description,
    docsUrl,
    score,
    value,
    formattedValue,
    ...(details && {
      details: {
        ...(issues && { issues: issues.map(issueToGQL) }),
        ...(table && { tables: [tableToGQL(table)] }),
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

export function tableToGQL(table: Table): PortalTable {
  return {
    ...(table.title && { title: table.title }),
    ...(table.columns?.length && {
      columns: table.columns.map(
        (column): PortalTableColumn =>
          typeof column === 'string'
            ? { alignment: tableAlignmentToGQL(column) }
            : {
                key: column.key,
                label: column.label,
                alignment: column.align && tableAlignmentToGQL(column.align),
              },
      ),
    }),
    rows: table.rows.map((row): PortalTableCell[] =>
      Array.isArray(row)
        ? row.map(content => ({ content: content?.toString() ?? '' }))
        : Object.entries(row).map(([key, content]) => ({
            key,
            content: content?.toString() ?? '',
          })),
    ),
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

function tableAlignmentToGQL(alignment: TableAlignment): PortalTableAlignment {
  switch (alignment) {
    case 'left':
      return PortalTableAlignment.Left;
    case 'center':
      return PortalTableAlignment.Center;
    case 'right':
      return PortalTableAlignment.Right;
  }
}
