import type {
  AuditFragment,
  BasicTreeNodeDataFragment,
  CategoryFragment,
  CommitFragment,
  CoverageTreeNodeDataFragment,
  GroupFragment,
  IssueFragment,
  PluginFragment,
  ReportFragment,
  TableFragment,
  TreeFragment,
} from '@code-pushup/portal-client';
import type {
  AuditReport,
  BasicTreeNode,
  CategoryConfig,
  CategoryRef,
  Commit,
  CoverageTreeNode,
  Group,
  Issue,
  PluginReport,
  Report,
  Table,
  Tree,
} from '@code-pushup/models';
import { lowercase } from '@code-pushup/utils';

export function transformGQLReport(report: ReportFragment): Report {
  return {
    commit: transformGQLCommit(report.commit),
    plugins: report.plugins.map(plugin =>
      transformGQLPlugin(
        plugin,
        report.issues?.edges.map(({ node }) => node) ?? [],
      ),
    ),
    categories: report.categories.map(transformGQLCategory),
    // TODO: make report metadata required in Portal API?
    packageName: report.packageName ?? 'unknown',
    version: report.packageVersion ?? 'unknown',
    date: report.commandStartDate ?? '',
    duration: report.commandDuration ?? 0,
  };
}

function transformGQLCommit(commit: CommitFragment): Commit {
  return {
    hash: commit.sha,
    message: commit.message,
    // TODO: make commit author and date required in Portal API?
    author: commit.author
      ? `${commit.author.name} <${commit.author.email}>`
      : 'unknown',
    date: commit.date ? new Date(commit.date) : new Date(),
  };
}

function transformGQLCategory(category: CategoryFragment): CategoryConfig {
  return {
    slug: category.slug,
    title: category.title,
    ...(category.description && { description: category.description }),
    refs: category.refs.map(
      ({ target, weight }): CategoryRef => ({
        type: lowercase(target.__typename),
        plugin: target.plugin.slug,
        slug: target.slug,
        weight,
      }),
    ),
    // TODO: Portal API migration - convert isBinary to scoreTarget for backward compatibility
    // Remove this conversion when Portal API supports scoreTarget (#713)
    scoreTarget: category.isBinary ? 1 : undefined,
  };
}

function transformGQLPlugin(
  plugin: PluginFragment,
  issues: IssueFragment[],
): PluginReport {
  return {
    slug: plugin.slug,
    title: plugin.title,
    icon: plugin.icon,
    ...(plugin.description && { description: plugin.description }),
    ...(plugin.docsUrl && { docsUrl: plugin.docsUrl }),
    audits: plugin.audits.edges.map(({ node }) =>
      transformGQLAudit(
        node,
        issues.filter(
          issue =>
            issue.audit.plugin.slug === plugin.slug &&
            issue.audit.slug === node.slug,
        ),
      ),
    ),
    groups: plugin.groups.map(transformGQLGroup),
    ...(plugin.packageName && { packageName: plugin.packageName }),
    ...(plugin.packageVersion && { version: plugin.packageVersion }),
    // TODO: make plugin metadata required in Portal API?
    date: plugin.runnerStartDate ?? '',
    duration: plugin.runnerDuration ?? 0,
  };
}

function transformGQLGroup(group: GroupFragment): Group {
  return {
    slug: group.slug,
    title: group.title,
    ...(group.description && { description: group.description }),
    refs: group.refs.map(({ target, weight }) => ({
      slug: target.slug,
      weight,
    })),
  };
}

function transformGQLAudit(
  audit: AuditFragment,
  issues: IssueFragment[],
): AuditReport {
  return {
    slug: audit.slug,
    title: audit.title,
    ...(audit.description && { description: audit.description }),
    ...(audit.docsUrl && { docsUrl: audit.docsUrl }),
    score: audit.score,
    value: audit.value,
    ...(audit.formattedValue && { displayValue: audit.formattedValue }),
    ...(audit.details?.enabled && {
      details: {
        ...(issues.length > 0 && {
          issues: issues.map(transformGQLIssue),
        }),
        ...(audit.details.tables[0] && {
          table: transformGQLTable(audit.details.tables[0]),
        }),
        ...(audit.details.trees.length > 0 && {
          trees: audit.details.trees.map(transformGQLTree),
        }),
      },
    }),
  };
}

function transformGQLIssue(issue: IssueFragment): Issue {
  return {
    message: issue.message,
    severity: lowercase(issue.severity),
    ...(issue.source?.__typename === 'SourceCodeLocation' && {
      source: {
        file: issue.source.filePath,
        position: {
          startLine: issue.source.startLine ?? 0,
          ...(issue.source.startColumn != null && {
            startColumn: issue.source.startColumn,
          }),
          ...(issue.source.endLine != null && {
            endLine: issue.source.endLine,
          }),
          ...(issue.source.endColumn != null && {
            endColumn: issue.source.endColumn,
          }),
        },
      },
    }),
  };
}

function transformGQLTable(table: TableFragment): Table {
  if (!table.header) {
    return {
      ...(table.title && { title: table.title }),
      rows: table.body.map(cells => cells.map(cell => cell.content)),
    };
  }

  return {
    ...(table.title && { title: table.title }),
    columns: table.header.map(({ content, alignment }, idx) => ({
      key: idx.toString(),
      label: content,
      align: lowercase(alignment),
    })),
    rows: table.body.map(cells =>
      Object.fromEntries(cells.map((cell, idx) => [idx, cell.content])),
    ),
  };
}

function transformGQLTree(tree: TreeFragment): Tree {
  switch (tree.__typename) {
    case 'BasicTree':
      return {
        type: 'basic',
        ...(tree.title && { title: tree.title }),
        root: transformGQLBasicTreeNode(tree.root),
      };
    case 'CoverageTree':
      return {
        type: 'coverage',
        ...(tree.title && { title: tree.title }),
        root: transformGQLCoverageTreeNode(tree.root),
      };
  }
}

// widens limited-depth GraphQL fragment to recursive data structure
type TreeNodeGQL<T> = T & {
  children?: TreeNodeGQL<T>[] | null;
};

function transformGQLBasicTreeNode(
  node: TreeNodeGQL<BasicTreeNodeDataFragment>,
): BasicTreeNode {
  return {
    name: node.name,
    ...(node.customValues && {
      values: Object.fromEntries(
        node.customValues.map(({ key, value }) => [key, value]),
      ),
    }),
    ...(node.children && {
      children: node.children.map(transformGQLBasicTreeNode),
    }),
  };
}

function transformGQLCoverageTreeNode(
  node: TreeNodeGQL<CoverageTreeNodeDataFragment>,
): CoverageTreeNode {
  return {
    name: node.name,
    values: {
      coverage: node.values.coverage,
      ...(node.values.missing && {
        missing: node.values.missing.map(missing => ({
          ...(missing.kind && { kind: missing.kind }),
          ...(missing.name && { name: missing.name }),
          startLine: missing.startLine,
          ...(missing.startColumn && { startColumn: missing.startColumn }),
          ...(missing.endLine && { endLine: missing.endLine }),
          ...(missing.endColumn && { endColumn: missing.endColumn }),
        })),
      }),
    },
    ...(node.children && {
      children: node.children.map(transformGQLCoverageTreeNode),
    }),
  };
}
