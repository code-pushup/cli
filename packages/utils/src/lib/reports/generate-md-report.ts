import { AuditReport, Issue, Table } from '@code-pushup/models';
import { formatDate, formatDuration, slugify } from '../formatting';
import { tableToFlatArray } from '../transform';
import {
  FOOTER_PREFIX,
  NEW_LINE,
  README_LINK,
  detailsTableHeaders,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableHeaders,
  reportOverviewTableHeaders,
} from './constants';
import {
  details,
  h2,
  h3,
  headline,
  li,
  link,
  style,
  tableHtml,
  tableMd,
} from './md';
import { ScoredGroup, ScoredReport } from './types';
import {
  countCategoryAudits,
  formatReportScore,
  getPluginNameFromSlug,
  getRoundScoreMarker,
  getSeverityIcon,
  getSortableAuditByRef,
  getSortableGroupByRef,
  getSquaredScoreMarker,
} from './utils';

export function generateMdReport(report: ScoredReport): string {
  const printCategories = report.categories.length > 0;

  return (
    // header section
    // eslint-disable-next-line prefer-template
    reportToHeaderSection() +
    NEW_LINE +
    // categories overview section
    (printCategories
      ? reportToOverviewSection(report) + NEW_LINE + NEW_LINE
      : '') +
    // categories section
    (printCategories
      ? reportToCategoriesSection(report) + NEW_LINE + NEW_LINE
      : '') +
    // audits section
    reportToAuditsSection(report) +
    NEW_LINE +
    NEW_LINE +
    // about section
    reportToAboutSection(report) +
    NEW_LINE +
    NEW_LINE +
    // footer section
    `${FOOTER_PREFIX} ${link(README_LINK, 'Code PushUp')}`
  );
}

function reportToHeaderSection(): string {
  return headline(reportHeadlineText) + NEW_LINE;
}

function reportToOverviewSection(report: ScoredReport): string {
  const { categories, plugins } = report;
  const tableContent: string[][] = [
    reportOverviewTableHeaders,
    ...categories.map(({ title, refs, score }) => [
      link(`#${slugify(title)}`, title),
      `${getRoundScoreMarker(score)} ${style(formatReportScore(score))}`,
      countCategoryAudits(refs, plugins).toString(),
    ]),
  ];

  return tableMd(tableContent, ['l', 'c', 'c']);
}

function reportToCategoriesSection(report: ScoredReport): string {
  const { categories, plugins } = report;

  const categoryDetails = categories.reduce((acc, category) => {
    const categoryTitle = h3(category.title);
    const categoryScore = `${getRoundScoreMarker(
      category.score,
    )} Score:  ${style(formatReportScore(category.score))}`;
    const categoryDocs = getDocsAndDescription(category);
    const categoryMDItems = category.refs.reduce((refAcc, ref) => {
      if (ref.type === 'group') {
        const group = getSortableGroupByRef(ref, plugins);
        const groupAudits = group.refs.map(groupRef =>
          getSortableAuditByRef(
            { ...groupRef, plugin: group.plugin, type: 'audit' },
            plugins,
          ),
        );
        const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
        const mdGroupItem = groupItemToCategorySection(
          group,
          groupAudits,
          pluginTitle,
        );
        return refAcc + mdGroupItem + NEW_LINE;
      } else {
        const audit = getSortableAuditByRef(ref, plugins);
        const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
        const mdAuditItem = auditItemToCategorySection(audit, pluginTitle);
        return refAcc + mdAuditItem + NEW_LINE;
      }
    }, '');

    return (
      acc +
      NEW_LINE +
      categoryTitle +
      NEW_LINE +
      NEW_LINE +
      categoryDocs +
      categoryScore +
      NEW_LINE +
      categoryMDItems
    );
  }, '');

  return h2('🏷 Categories') + NEW_LINE + categoryDetails;
}

function auditItemToCategorySection(
  audit: AuditReport,
  pluginTitle: string,
): string {
  const auditTitle = link(
    `#${slugify(audit.title)}-${slugify(pluginTitle)}`,
    audit.title,
  );
  return li(
    `${getSquaredScoreMarker(
      audit.score,
    )} ${auditTitle} (_${pluginTitle}_) - ${getAuditValue(audit)}`,
  );
}

function groupItemToCategorySection(
  group: ScoredGroup,
  groupAudits: AuditReport[],
  pluginTitle: string,
): string {
  const groupScore = Number(formatReportScore(group.score || 0));
  const groupTitle = li(
    `${getRoundScoreMarker(groupScore)} ${group.title} (_${pluginTitle}_)`,
  );
  const auditTitles = groupAudits.reduce((acc, audit) => {
    const auditTitle = link(
      `#${slugify(audit.title)}-${slugify(pluginTitle)}`,
      audit.title,
    );
    return `${acc}  ${li(
      `${getSquaredScoreMarker(audit.score)} ${auditTitle} - ${getAuditValue(
        audit,
      )}`,
    )}${NEW_LINE}`;
  }, '');

  return groupTitle + NEW_LINE + auditTitles;
}

function reportToAuditsSection(report: ScoredReport): string {
  const auditsSection = report.plugins.reduce((pluginAcc, plugin) => {
    const auditsData = plugin.audits.reduce((auditAcc, audit) => {
      const auditTitle = `${audit.title} (${getPluginNameFromSlug(
        plugin.slug,
        report.plugins,
      )})`;

      return (
        auditAcc +
        h3(auditTitle) +
        NEW_LINE +
        NEW_LINE +
        reportToDetailsSection(audit) +
        NEW_LINE +
        NEW_LINE +
        getDocsAndDescription(audit)
      );
    }, '');
    return pluginAcc + auditsData;
  }, '');

  return h2('🛡️ Audits') + NEW_LINE + NEW_LINE + auditsSection;
}

export function renderDetailsAuditValue(audit: AuditReport) {
  return `${getSquaredScoreMarker(audit.score)} ${getAuditValue(
    audit,
    true,
  )} (score: ${formatReportScore(audit.score)})`;
}

export function renderTableSection(table: Table | undefined) {
  if (table == null) {
    return '';
  }
  const tableData = tableToFlatArray(table);
  return `<h4>Additional Information</h4>${NEW_LINE}${tableHtml(tableData)}`;
}

export function renderIssuesSection(issues: Issue[] = []) {
  if (issues.length === 0) {
    return '';
  }
  const detailsTableData = [
    detailsTableHeaders,
    ...issues.map((issue: Issue) => {
      const severity = `${getSeverityIcon(issue.severity)} <i>${
        issue.severity
      }</i>`;
      const message = issue.message;

      if (!issue.source) {
        return [severity, message, '', ''];
      }
      // TODO: implement file links, ticket #149
      const file = `<code>${issue.source.file}</code>`;
      if (!issue.source.position) {
        return [severity, message, file, ''];
      }
      const { startLine, endLine } = issue.source.position;
      const line = `${startLine || ''}${
        endLine && startLine !== endLine ? `-${endLine}` : ''
      }`;

      return [severity, message, file, line];
    }),
  ];
  return `<h4>Issues</h4>${NEW_LINE}${tableHtml(detailsTableData)}`;
}

export function reportToDetailsSection(audit: AuditReport) {
  const detailsValue = renderDetailsAuditValue(audit);

  if (!audit.details) {
    return detailsValue;
  }

  // eslint-disable-next-line functional/no-let
  let md = '';
  const { table, issues } = audit.details;

  if (table != null) {
    md += renderTableSection(table);
  }

  if (issues && issues.length > 0) {
    md += renderIssuesSection(issues);
  }

  return details(detailsValue, md);
}

export function reportToAboutSection(
  report: Omit<ScoredReport, 'packageName'>,
): string {
  const { date, duration, version, commit, plugins, categories } = report;

  const formattedDate = formatDate(new Date(date));
  const commitInfo = commit ? `${commit.message} (${commit.hash})` : 'N/A';
  const reportMetaTable: string[][] = [
    reportMetaTableHeaders,
    [
      commitInfo,
      style(version || '', ['c']),
      formatDuration(duration),
      plugins.length.toString(),
      categories.length.toString(),
      plugins.reduce((acc, { audits }) => acc + audits.length, 0).toString(),
    ],
  ];

  const pluginMetaTable = [
    pluginMetaTableHeaders,
    ...plugins.map(plugin => [
      plugin.title,
      plugin.audits.length.toString(),
      style(plugin.version || '', ['c']),
      formatDuration(plugin.duration),
    ]),
  ];

  return (
    // eslint-disable-next-line prefer-template
    h2('About') +
    NEW_LINE +
    NEW_LINE +
    `Report was created by [Code PushUp](${README_LINK}) on ${formattedDate}.` +
    NEW_LINE +
    NEW_LINE +
    tableMd(reportMetaTable, ['l', 'c', 'c', 'c', 'c', 'c']) +
    NEW_LINE +
    NEW_LINE +
    'The following plugins were run:' +
    NEW_LINE +
    NEW_LINE +
    tableMd(pluginMetaTable, ['l', 'c', 'c', 'c'])
  );
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function getDocsAndDescription({
  docsUrl,
  description,
}: Pick<AuditReport, 'docsUrl' | 'description'>): string {
  const endingNewLine = NEW_LINE + NEW_LINE;
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return docsLink + endingNewLine;
    }
    // @TODO introduce NEW_LINE at the end of a code block
    if (description.endsWith('```')) {
      // when description ends in code block, link must be moved to next paragraph
      return description + NEW_LINE + NEW_LINE + docsLink + endingNewLine;
    }
    return `${description} ${docsLink}${endingNewLine}`;
  }
  if (description) {
    return description + endingNewLine;
  }
  return '';
}

export function getAuditValue(audit: AuditReport, isHtml = false): string {
  const { displayValue, value } = audit;
  const text = displayValue || value.toString();
  return isHtml ? `<b>${text}</b>` : style(text);
}
