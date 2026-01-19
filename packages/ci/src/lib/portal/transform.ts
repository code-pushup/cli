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
    plugins: report.plugins.map((plugin: PluginFragment) =>
      transformGQLPlugin(
        plugin,
        report.issues?.edges.map(({ node }: { node: IssueFragment }) => node) ??
          [],
      ),
    ),
    categories: report.categories.map((category: CategoryFragment) =>
      transformGQLCategory(category),
    ),
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
    ...(category.scoreTarget != null && { scoreTarget: category.scoreTarget }),
    refs: category.refs.map(
      ({
        target,
        weight,
      }: {
        target: { __typename: string; plugin: { slug: string }; slug: string };
        weight: number;
      }): CategoryRef => ({
        type: lowercase(target.__typename as 'Audit' | 'Group'),
        plugin: target.plugin.slug,
        slug: target.slug,
        weight,
      }),
    ),
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
    audits: plugin.audits.edges.map(({ node }: { node: AuditFragment }) =>
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
    refs: group.refs.map(
      ({ target, weight }: { target: { slug: string }; weight: number }) => ({
        slug: target.slug,
        weight,
      }),
    ),
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
    severity: lowercase(issue.severity as 'ERROR' | 'WARNING' | 'INFO'),
    ...(issue.source?.__typename === 'SourceCodeLocation' && {
      source: {
        file: issue.source.filePath,
        ...(issue.source.startLine != null && {
          position: {
            startLine: issue.source.startLine,
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
        }),
      },
    }),
  };
}

function transformGQLTable(table: TableFragment): Table {
  if (!table.header) {
    return {
      ...(table.title && { title: table.title }),
      rows: table.body.map((cells: { content: string }[]) =>
        cells.map((cell: { content: string }) => cell.content),
      ),
    };
  }

  return {
    ...(table.title && { title: table.title }),
    columns: table.header.map(
      (
        { content, alignment }: { content: string; alignment: string },
        idx: number,
      ) => ({
        key: idx.toString(),
        label: content,
        align: lowercase(alignment as 'LEFT' | 'CENTER' | 'RIGHT'),
      }),
    ),
    rows: table.body.map((cells: { content: string }[]) =>
      Object.fromEntries(
        cells.map((cell: { content: string }, idx: number) => [
          idx,
          cell.content,
        ]),
      ),
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
    default:
      throw new Error(
        `Unknown tree type: ${(tree as TreeFragment).__typename}`,
      );
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
        node.customValues.map(
          ({ key, value }: { key: string; value: string }) => [key, value],
        ),
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
        missing: node.values.missing.map(
          (missing: {
            kind?: string;
            name?: string;
            startLine: number;
            startColumn?: number;
            endLine?: number;
            endColumn?: number;
          }) => ({
            ...(missing.kind && { kind: missing.kind }),
            ...(missing.name && { name: missing.name }),
            startLine: missing.startLine,
            ...(missing.startColumn && { startColumn: missing.startColumn }),
            ...(missing.endLine && { endLine: missing.endLine }),
            ...(missing.endColumn && { endColumn: missing.endColumn }),
          }),
        ),
      }),
    },
    ...(node.children && {
      children: node.children.map(transformGQLCoverageTreeNode),
    }),
  };
}
