import { AuditReport, Issue, Report, Table } from '@code-pushup/models';
import { formatDate, formatDuration } from '../formatting';
import { SPACE, html, md } from '../text-formats';
import {
  FOOTER_PREFIX,
  README_LINK,
  issuesTableHeadings,
  reportHeadlineText,
} from './constants';
import { metaDescription, tableSection } from './formatting';
import {
  categoriesDetailsSection,
  categoriesOverviewSection,
} from './generate-md-report-categoy-section';
import { ScoredReport } from './types';
import {
  formatReportScore,
  getPluginNameFromSlug,
  scoreMarker,
  severityMarker,
} from './utils';

const { h1, h2, h3, lines, link, section, code: codeMd } = md;
const { bold: boldHtml, details } = html;

export function auditDetailsAuditValue({
  score,
  value,
  displayValue,
}: AuditReport) {
  return `${scoreMarker(score, 'square')} ${boldHtml(
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
    title: 'Issues',
    columns: issuesTableHeadings,
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

  return tableSection(detailsTableData);
}

export function auditDetails(audit: AuditReport) {
  const { table, issues = [] } = audit.details ?? {};
  const detailsValue = auditDetailsAuditValue(audit);

  // undefined details OR empty details (undefined issues OR empty issues AND empty table)
  if (issues.length === 0 && table == null) {
    return section(detailsValue);
  }

  const tableSectionContent = table == null ? '' : tableSection(table);
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
  const reportMetaTable: Table = reportMetaData(report);
  const pluginMetaTable: Table = reportPluginMeta({ plugins });
  return lines(
    h2('About'),
    section(
      `Report was created by [Code PushUp](${README_LINK}) on ${formatDate(
        new Date(date),
      )}.`,
    ),
    tableSection(pluginMetaTable),
    tableSection(reportMetaTable),
  );
}

export function reportPluginMeta({ plugins }: Pick<Report, 'plugins'>): Table {
  return {
    columns: [
      {
        key: 'plugin',
        align: 'left',
      },
      {
        key: 'audits',
      },
      {
        key: 'version',
      },
      {
        key: 'duration',
      },
    ],
    rows: plugins.map(
      ({
        title: pluginTitle,
        audits,
        version: pluginVersion,
        duration: pluginDuration,
      }) => ({
        plugin: pluginTitle,
        audits: audits.length.toString(),
        version: codeMd(pluginVersion || ''),
        duration: formatDuration(pluginDuration),
      }),
    ),
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
    columns: [
      {
        key: 'commit',
        align: 'left',
      },
      {
        key: 'version',
      },
      {
        key: 'duration',
      },
      {
        key: 'plugins',
      },
      {
        key: 'categories',
      },
      {
        key: 'audits',
      },
    ],
    rows: [
      {
        commit: commitInfo,
        version: codeMd(version || ''),
        duration: formatDuration(duration),
        plugins: plugins.length,
        categories: categories.length,
        audits: plugins
          .reduce((acc, { audits }) => acc + audits.length, 0)
          .toString(),
      },
    ],
  };
}
