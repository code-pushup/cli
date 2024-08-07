import { InlineText, MarkdownDocument, md } from 'build-md';
import { AuditReport, Issue, Report } from '@code-pushup/models';
import { formatDate, formatDuration } from '../formatting';
import { HIERARCHY } from '../text-formats';
import { FOOTER_PREFIX, README_LINK, REPORT_HEADLINE_TEXT } from './constants';
import { metaDescription, tableSection } from './formatting';
import {
  categoriesDetailsSection,
  categoriesOverviewSection,
} from './generate-md-report-categoy-section';
import { ScoredReport } from './types';
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

export function generateMdReport(report: ScoredReport): string {
  return new MarkdownDocument()
    .heading(HIERARCHY.level_1, REPORT_HEADLINE_TEXT)
    .$if(report.categories.length > 0, doc =>
      doc.$concat(
        categoriesOverviewSection(report),
        categoriesDetailsSection(report),
      ),
    )
    .$concat(auditsSection(report), aboutSection(report))
    .rule()
    .paragraph(md`${FOOTER_PREFIX} ${md.link(README_LINK, 'Code PushUp')}`)
    .toString();
}

export function auditDetailsIssues(
  issues: Issue[] = [],
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
      // TODO: implement file links, ticket #149
      const file = md.code(source.file);
      if (!source.position) {
        return [severity, message, file];
      }
      const { startLine, endLine } = source.position;
      const line = `${startLine || ''}${
        endLine && startLine !== endLine ? `-${endLine}` : ''
      }`;
      return [severity, message, file, line];
    }),
  );
}

export function auditDetails(audit: AuditReport): MarkdownDocument {
  const { table, issues = [] } = audit.details ?? {};
  const detailsValue = auditDetailsAuditValue(audit);

  // undefined details OR empty details (undefined issues OR empty issues AND empty table)
  if (issues.length === 0 && !table?.rows.length) {
    return new MarkdownDocument().paragraph(detailsValue);
  }

  const tableSectionContent = table && tableSection(table);
  const issuesSectionContent = issues.length > 0 && auditDetailsIssues(issues);

  return new MarkdownDocument().details(
    detailsValue,
    new MarkdownDocument().$concat(tableSectionContent, issuesSectionContent),
  );
}

export function auditsSection({
  plugins,
}: Pick<ScoredReport, 'plugins'>): MarkdownDocument {
  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, '🛡️ Audits')
    .$foreach(
      plugins.flatMap(plugin =>
        plugin.audits.map(audit => ({ ...audit, plugin })),
      ),
      (doc, { plugin, ...audit }) => {
        const auditTitle = `${audit.title} (${plugin.title})`;
        const detailsContent = auditDetails(audit);
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
        categories.length.toString(),
        plugins.reduce((acc, { audits }) => acc + audits.length, 0).toString(),
      ],
    ],
  ];
}
