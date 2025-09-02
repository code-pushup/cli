import type {
  AuditReport as PortalAudit,
  CategoryConfig as PortalCategory,
  CategoryConfigRefType as PortalCategoryRefType,
  GroupConfig as PortalGroup,
  AuditReportIssue as PortalIssue,
  IssueSeverity as PortalIssueSeverity,
  IssueSourceType as PortalIssueSourceType,
  PluginReport as PortalPlugin,
  AuditReportTable as PortalTable,
  TableAlignment as PortalTableAlignment,
  AuditReportTableCell as PortalTableCell,
  AuditReportTableColumn as PortalTableColumn,
  AuditReportTree as PortalTree,
  AuditReportTreeNode as PortalTreeNode,
  TreeType as PortalTreeType,
  SaveReportMutationVariables,
} from '@code-pushup/portal-client';
import type {
  AuditReport,
  BasicTree,
  BasicTreeNode,
  CategoryConfig,
  CategoryRef,
  CoverageTree,
  CoverageTreeNode,
  Group,
  Issue,
  IssueSeverity,
  PluginReport,
  Report,
  Table,
  TableAlignment,
  Tree,
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
    categories: (report.categories ?? []).map(categoryToGQL),
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
  const { issues, table, trees } = details ?? {};
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
        ...(trees && { trees: trees.map(treeToGQL) }),
      },
    }),
  };
}

export function issueToGQL(issue: Issue): PortalIssue {
  return {
    message: issue.message,
    severity: issueSeverityToGQL(issue.severity),
    ...(issue.source?.file && {
      sourceType: safeEnum<PortalIssueSourceType>('SourceCode'),
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

export function treeToGQL(tree: Tree): PortalTree {
  if (tree.type === 'coverage') {
    return coverageTreeToGQL(tree);
  }
  return basicTreeToGQL(tree);
}

function basicTreeToGQL(tree: BasicTree): PortalTree {
  return {
    type: safeEnum<PortalTreeType>('Basic'),
    ...(tree.title && { title: tree.title }),
    root: basicTreeNodeToGQL(tree.root),
  };
}

function basicTreeNodeToGQL(node: BasicTreeNode): PortalTreeNode {
  return {
    name: node.name,
    ...(node.values && {
      values: Object.entries(node.values).map(([key, value]) => ({
        key,
        value: value.toString(),
      })),
    }),
    ...(node.children?.length && {
      children: node.children.map(basicTreeNodeToGQL),
    }),
  };
}

function coverageTreeToGQL(tree: CoverageTree): PortalTree {
  return {
    type: safeEnum<PortalTreeType>('Coverage'),
    ...(tree.title && { title: tree.title }),
    root: coverageTreeNodeToGQL(tree.root),
  };
}

function coverageTreeNodeToGQL(node: CoverageTreeNode): PortalTreeNode {
  return {
    name: node.name,
    coverage: node.values.coverage,
    ...(node.values.missing?.length && {
      missing: node.values.missing,
    }),
    ...(node.children?.length && {
      children: node.children.map(coverageTreeNodeToGQL),
    }),
  };
}

function categoryToGQL(category: CategoryConfig): PortalCategory {
  return {
    slug: category.slug,
    title: category.title,
    description: category.description,
    ...(category.scoreTarget && { scoreTarget: category.scoreTarget }),
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
      return safeEnum<PortalCategoryRefType>('Audit');
    case 'group':
      return safeEnum<PortalCategoryRefType>('Group');
  }
}

function issueSeverityToGQL(severity: IssueSeverity): PortalIssueSeverity {
  switch (severity) {
    case 'info':
      return safeEnum<PortalIssueSeverity>('Info');
    case 'error':
      return safeEnum<PortalIssueSeverity>('Error');
    case 'warning':
      return safeEnum<PortalIssueSeverity>('Warning');
  }
}

function tableAlignmentToGQL(alignment: TableAlignment): PortalTableAlignment {
  switch (alignment) {
    case 'left':
      return safeEnum<PortalTableAlignment>('Left');
    case 'center':
      return safeEnum<PortalTableAlignment>('Center');
    case 'right':
      return safeEnum<PortalTableAlignment>('Right');
  }
}

// validates enum value string, workaround for nominal typing
function safeEnum<
  T extends
    | PortalCategoryRefType
    | PortalIssueSeverity
    | PortalIssueSourceType
    | PortalTableAlignment
    | PortalTreeType,
>(value: `${T}`): T {
  return value as T;
}
