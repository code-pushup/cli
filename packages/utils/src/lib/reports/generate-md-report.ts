import { AuditReport, CategoryConfig, Issue } from '@code-pushup/models';
import { formatDate, formatDuration, slugify } from '../formatting';
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
    )} ${auditTitle} (_${pluginTitle}_) - ${getAuditResult(audit)}`,
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
      `${getSquaredScoreMarker(audit.score)} ${auditTitle} - ${getAuditResult(
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

function reportToDetailsSection(audit: AuditReport) {
  const detailsTitle = `${getSquaredScoreMarker(audit.score)} ${getAuditResult(
    audit,
    true,
  )} (score: ${formatReportScore(audit.score)})`;

  if (!audit.details?.issues.length) {
    return detailsTitle;
  }

  const detailsTableData = [
    detailsTableHeaders,
    ...audit.details.issues.map((issue: Issue) => {
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
  const detailsTable = `<h4>Issues</h4>${tableHtml(detailsTableData)}`;
  return details(detailsTitle, detailsTable);
}

function reportToAboutSection(report: ScoredReport): string {
  const date = formatDate(new Date());

  const { duration, version, commit, plugins, categories } = report;
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
    `Report was created by [Code PushUp](${README_LINK}) on ${date}.` +
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

function getDocsAndDescription({
  docsUrl,
  description,
}: AuditReport | CategoryConfig): string {
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return docsLink + NEW_LINE + NEW_LINE;
    }
    if (description.endsWith('```')) {
      // when description ends in code block, link must be moved to next paragraph
      return description + NEW_LINE + NEW_LINE + docsLink + NEW_LINE + NEW_LINE;
    }
    return `${description} ${docsLink}${NEW_LINE}${NEW_LINE}`;
  }
  if (description) {
    return description + NEW_LINE + NEW_LINE;
  }
  return '';
}

function getAuditResult(audit: AuditReport, isHtml = false): string {
  const { displayValue, value } = audit;
  return isHtml
    ? `<b>${displayValue || value}</b>`
    : style(String(displayValue || value));
}
