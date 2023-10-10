import {
  IssueSeverity,
  IssueSourceType,
  CategoryConfigRefType,
  SaveReportMutationVariables,
} from '@code-pushup/portal-client';
import {Issue, Report} from '@code-pushup/models';
import {Scalars} from "@code-pushup/portal-client/portal-client/src/lib/graphql/generated";

export function jsonToGql(report: Report) {
  return {
    packageName: report.packageName,
    packageVersion: report.version,
    commandStartDate: report.date,
    commandDuration: report.duration,
    plugins: report.plugins.map(plugin => ({
      audits: plugin.audits.map(audit => ({
        description: audit.description,
        details: {
          issues:
            audit.details?.issues.map(issue => ({
              message: issue.message,
              severity: transformSeverity(issue.severity),
              sourceEndColumn: issue.source?.position?.endColumn,
              sourceEndLine: issue.source?.position?.endLine,
              sourceFilePath: issue.source?.file,
              sourceStartColumn: issue.source?.position?.startColumn,
              sourceStartLine: issue.source?.position?.startLine,
              sourceType: IssueSourceType.SourceCode,
            })) || [],
        },
        docsUrl: audit.docsUrl,
        formattedValue: audit.displayValue,
        score: audit.score,
        slug: audit.slug,
        title: audit.title,
        value: audit.value,
      })),
      description: plugin.description,
      docsUrl: plugin.docsUrl,
      groups: plugin.groups?.map(group => ({
        slug: group.slug,
        title: group.title,
        description: group.description,
        refs: group.refs.map(ref => ({slug: ref.slug, weight: ref.weight})),
      })),
      icon: plugin.icon,
      slug: plugin.slug,
      title: plugin.title,
      packageName: plugin.packageName,
      packageVersion: plugin.version,
      runnerDuration: plugin.duration,
      runnerStartDate: plugin.date,
    })),
    categories: report.categories.map(category => ({
      slug: category.slug,
      title: category.title,
      description: category.description,
      refs: category.refs.map((ref) => ({
        plugin: ref.plugin,
        type: ref.type === 'audit' ? CategoryConfigRefType.Audit : CategoryConfigRefType.Group,
        weight: ref.weight,
        slug: ref.slug
      })),
    })),
  } satisfies Omit<
    SaveReportMutationVariables,
    'organization' | 'project' | 'commit'
  >;
}

function transformSeverity(severity: Issue['severity']): IssueSeverity {
  switch (severity) {
    case 'info':
      return IssueSeverity.Info;
    case 'error':
      return IssueSeverity.Error;
    case 'warning':
      return IssueSeverity.Warning;
  }
}
