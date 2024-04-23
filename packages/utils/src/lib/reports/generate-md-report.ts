import { AuditReport, Issue, Report, Table } from '@code-pushup/models';
import { formatDate, formatDuration } from '../formatting';
import {
  FOOTER_PREFIX,
  README_LINK,
  issuesTableHeadings,
  pluginMetaTableAlignment,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableAlignment,
  reportMetaTableHeaders,
} from './constants';
import { metaDescription, tableSection } from './formatting';
import {
  categoriesDetailsSection,
  categoriesOverviewSection,
} from './generate-md-report-categoy-section';
import { details } from './html/details';
import { style as htmlFontStyle } from './html/font-style';
import {
  SPACE,
  h1,
  h2,
  h3,
  lines,
  link,
  paragraphs,
  section,
  style,
} from './md';
import { ScoredReport } from './types';
import {
  formatReportScore,
  getPluginNameFromSlug,
  scoreMarker,
  severityMarker,
} from './utils';

export function auditDetailsAuditValue({
  score,
  value,
  displayValue,
}: AuditReport) {
  return `${scoreMarker(score, 'square')} ${htmlFontStyle(
    String(displayValue ?? value),
  )} (score: ${formatReportScore(score)})`;
}

export function generateMdReport(report: ScoredReport): string {
  const printCategories = report.categories.length > 0;

  return lines(
    h1(reportHeadlineText),
    printCategories ? categoriesOverviewSection(report) : '',
    printCategories ? categoriesDetailsSection(report) : '',
    auditsSection(report),
    aboutSection(report),
    `${FOOTER_PREFIX}${SPACE}${link(README_LINK, 'Code PushUp')}`,
  );
}

export function auditDetailsIssues(issues: Issue[] = []) {
  if (issues.length === 0) {
    return '';
  }
  const detailsTableData = {
    headings: issuesTableHeadings,
    rows: issues.map(
      ({ severity: severityVal, message, source: sourceVal }: Issue) => {
        const severity = `${severityMarker(severityVal)} <i>${severityVal}</i>`;

        if (!sourceVal) {
          return { severity, message, file: '', line: '' };
        }
        // TODO: implement file links, ticket #149
        const file = `<code>${sourceVal.file}</code>`;
        if (!sourceVal.position) {
          return { severity, message, file, line: '' };
        }
        const { startLine, endLine } = sourceVal.position;
        const line = `${startLine || ''}${
          endLine && startLine !== endLine ? `-${endLine}` : ''
        }`;
        return { severity, message, file, line };
      },
    ),
  };

  return tableSection(detailsTableData, { heading: 'Issues' });
}

export function auditDetails(audit: AuditReport) {
  const { table, issues = [] } = audit.details ?? {};
  const detailsValue = auditDetailsAuditValue(audit);

  // undefined details OR empty details (undefined issues OR empty issues AND empty table)
  if (issues.length === 0 && table == null) {
    return section(detailsValue);
  }

  const tableSectionContent =
    table == null
      ? ''
      : tableSection(table, { heading: 'Additional Information' });
  const issuesSectionContent =
    issues.length > 0 ? auditDetailsIssues(issues) : '';

  return details(
    detailsValue,
    lines(tableSectionContent, issuesSectionContent),
  );
}

export function auditsSection({
  plugins,
}: Pick<ScoredReport, 'plugins'>): string {
  const content = plugins.flatMap(({ slug, audits }) =>
    audits.flatMap(audit => {
      const auditTitle = `${audit.title}${SPACE}(${getPluginNameFromSlug(
        slug,
        plugins,
      )})`;
      const detailsContent = auditDetails(audit);
      const descriptionContent = metaDescription(audit);
      return [h3(auditTitle), detailsContent, descriptionContent];
    }),
  );

  return section(h2('🛡️ Audits'), ...content);
}

export function aboutSection(
  report: Omit<ScoredReport, 'packageName'>,
): string {
  const { date, plugins } = report;
  const reportMetaTable = reportMetaData(report);
  const pluginMetaTable = reportPluginMeta({ plugins });
  const level = 3;
  return lines(
    h2('About'),
    section(
      `Report was created by [Code PushUp](${README_LINK}) on ${formatDate(
        new Date(date),
      )}.`,
    ),
    tableSection(reportMetaTable, { heading: 'Report overview:', level }),
    tableSection(pluginMetaTable, { heading: 'Plugins overview:', level }),
  );
}

export function reportPluginMeta({ plugins }: Pick<Report, 'plugins'>) {
  return {
    headings: pluginMetaTableHeaders,
    rows: plugins.map(
      ({
        title: pluginTitle,
        audits,
        version: pluginVersion,
        duration: pluginDuration,
      }) => ({
        plugin: pluginTitle,
        audits: audits.length.toString(),
        version: style(pluginVersion || '', ['c']),
        duration: formatDuration(pluginDuration),
      }),
    ),
    alignment: pluginMetaTableAlignment,
  };
}

export function reportMetaData({
  commit,
  version,
  duration,
  plugins,
  categories,
}: Pick<
  ScoredReport,
  'date' | 'duration' | 'version' | 'commit' | 'plugins' | 'categories'
>): Table {
  const commitInfo = commit
    ? `${commit.message}${SPACE}(${commit.hash})`
    : 'N/A';

  return {
    headings: reportMetaTableHeaders,
    rows: [
      {
        commit: commitInfo,
        version: style(version || '', ['c']),
        duration: formatDuration(duration),
        plugins: plugins.length,
        categories: categories.length,
        audits: plugins
          .reduce((acc, { audits }) => acc + audits.length, 0)
          .toString(),
      },
    ],
    alignment: reportMetaTableAlignment,
  };
}
