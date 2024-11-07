import { type InlineText, MarkdownDocument, md } from 'build-md';
import type { AuditReport, Issue, Report } from '@code-pushup/models';
import { formatDate, formatDuration } from '../formatting';
import { HIERARCHY } from '../text-formats';
import { FOOTER_PREFIX, README_LINK, REPORT_HEADLINE_TEXT } from './constants';
import {
  formatSourceLine,
  linkToLocalSourceForIde,
  metaDescription,
  tableSection,
} from './formatting';
import {
  categoriesDetailsSection,
  categoriesOverviewSection,
} from './generate-md-report-categoy-section';
import type {
  MdReportOptions,
  ScoredCategoryConfig,
  ScoredReport,
} from './types';
import { formatReportScore, scoreMarker, severityMarker } from './utils';

export function auditDetailsAuditValue({
  score,
  value,
  displayValue,
}: AuditReport): InlineText {
  return md`${scoreMarker(score, 'square')} ${md.bold(
    String(displayValue ?? value),
  )} (score: ${formatReportScore(score)})`;
}

function hasCategories(
  report: ScoredReport,
): report is ScoredReport & { categories: ScoredCategoryConfig[] } {
  return !!report.categories && report.categories.length > 0;
}

export function generateMdReport(
  report: ScoredReport,
  options?: MdReportOptions,
): string {
  return new MarkdownDocument()
    .heading(HIERARCHY.level_1, REPORT_HEADLINE_TEXT)
    .$concat(
      ...(hasCategories(report)
        ? [categoriesOverviewSection(report), categoriesDetailsSection(report)]
        : []),
      auditsSection(report, options),
      aboutSection(report),
    )
    .rule()
    .paragraph(md`${FOOTER_PREFIX} ${md.link(README_LINK, 'Code PushUp')}`)
    .toString();
}

export function auditDetailsIssues(
  issues: Issue[] = [],
  options?: MdReportOptions,
): MarkdownDocument | null {
  if (issues.length === 0) {
    return null;
  }
  return new MarkdownDocument().heading(HIERARCHY.level_4, 'Issues').table(
    [
      { heading: 'Severity', alignment: 'center' },
      { heading: 'Message', alignment: 'left' },
      { heading: 'Source file', alignment: 'left' },
      { heading: 'Line(s)', alignment: 'center' },
    ],
    issues.map(({ severity: level, message, source }: Issue) => {
      const severity = md`${severityMarker(level)} ${md.italic(level)}`;

      if (!source) {
        return [severity, message];
      }
      const file = linkToLocalSourceForIde(source, options);
      if (!source.position) {
        return [severity, message, file];
      }
      const line = formatSourceLine(source.position);
      return [severity, message, file, line];
    }),
  );
}

export function auditDetails(
  audit: AuditReport,
  options?: MdReportOptions,
): MarkdownDocument {
  const { table, issues = [] } = audit.details ?? {};
  const detailsValue = auditDetailsAuditValue(audit);

  // undefined details OR empty details (undefined issues OR empty issues AND empty table)
  if (issues.length === 0 && !table?.rows.length) {
    return new MarkdownDocument().paragraph(detailsValue);
  }

  const tableSectionContent = table && tableSection(table);
  const issuesSectionContent =
    issues.length > 0 && auditDetailsIssues(issues, options);

  return new MarkdownDocument().details(
    detailsValue,
    new MarkdownDocument().$concat(tableSectionContent, issuesSectionContent),
  );
}

export function auditsSection(
  { plugins }: Pick<ScoredReport, 'plugins'>,
  options?: MdReportOptions,
): MarkdownDocument {
  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, '🛡️ Audits')
    .$foreach(
      plugins.flatMap(plugin =>
        plugin.audits.map(audit => ({ ...audit, plugin })),
      ),
      (doc, { plugin, ...audit }) => {
        const auditTitle = `${audit.title} (${plugin.title})`;
        const detailsContent = auditDetails(audit, options);
        const descriptionContent = metaDescription(audit);

        return doc
          .heading(HIERARCHY.level_3, auditTitle)
          .$concat(detailsContent)
          .paragraph(descriptionContent);
      },
    );
}

export function aboutSection(
  report: Omit<ScoredReport, 'packageName'>,
): MarkdownDocument {
  const { date, plugins } = report;
  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, 'About')
    .paragraph(
      md`Report was created by ${md.link(
        README_LINK,
        'Code PushUp',
      )} on ${formatDate(new Date(date))}.`,
    )
    .table(...pluginMetaTable({ plugins }))
    .table(...reportMetaTable(report));
}

export function pluginMetaTable({
  plugins,
}: Pick<Report, 'plugins'>): Parameters<MarkdownDocument['table']> {
  return [
    [
      { heading: 'Plugin', alignment: 'left' },
      { heading: 'Audits', alignment: 'center' },
      { heading: 'Version', alignment: 'center' },
      { heading: 'Duration', alignment: 'right' },
    ],
    plugins.map(({ title, audits, version = '', duration }) => [
      title,
      audits.length.toString(),
      version && md.code(version),
      formatDuration(duration),
    ]),
  ];
}

export function reportMetaTable({
  commit,
  version,
  duration,
  plugins,
  categories,
}: Pick<
  ScoredReport,
  'date' | 'duration' | 'version' | 'commit' | 'plugins' | 'categories'
>): Parameters<MarkdownDocument['table']> {
  return [
    [
      { heading: 'Commit', alignment: 'left' },
      { heading: 'Version', alignment: 'center' },
      { heading: 'Duration', alignment: 'right' },
      { heading: 'Plugins', alignment: 'center' },
      { heading: 'Categories', alignment: 'center' },
      { heading: 'Audits', alignment: 'center' },
    ],
    [
      [
        commit ? `${commit.message} (${commit.hash})` : 'N/A',
        md.code(version),
        formatDuration(duration),
        plugins.length.toString(),
        (categories?.length ?? 0).toString(),
        plugins.reduce((acc, { audits }) => acc + audits.length, 0).toString(),
      ],
    ],
  ];
}
