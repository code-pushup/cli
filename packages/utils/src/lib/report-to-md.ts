import {
  AuditReport,
  CategoryConfig,
  Issue,
  PluginReport,
} from '@code-pushup/models';
import { CommitData } from './git';
import {
  NEW_LINE,
  details,
  h2,
  h3,
  headline,
  li,
  link,
  style,
  tableHtml,
  tableMd,
} from './md/';
import {
  FOOTER_PREFIX,
  README_LINK,
  countCategoryAudits,
  detailsTableHeaders,
  formatDuration,
  formatReportScore,
  getRoundScoreMarker,
  getSeverityIcon,
  getSquaredScoreMarker,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableHeaders,
  reportOverviewTableHeaders,
} from './report';
import { EnrichedScoredAuditGroup, ScoredReport } from './scoring';
import { slugify } from './utils';

export function reportToMd(
  report: ScoredReport,
  commitData: CommitData | null,
): string {
  // header section
  let md = reportToHeaderSection() + NEW_LINE;

  // overview section
  md += reportToOverviewSection(report) + NEW_LINE + NEW_LINE;

  // categories section
  md += reportToCategoriesSection(report) + NEW_LINE + NEW_LINE;

  // audits section
  md += reportToAuditsSection(report) + NEW_LINE + NEW_LINE;

  // about section
  md += reportToAboutSection(report, commitData) + NEW_LINE + NEW_LINE;

  // footer section
  md += `${FOOTER_PREFIX} ${link(README_LINK, 'Code PushUp')}`;
  return md;
}

function reportToHeaderSection(): string {
  return headline(reportHeadlineText) + NEW_LINE;
}

function reportToOverviewSection(report: ScoredReport): string {
  const { categories } = report;
  const tableContent: string[][] = [
    reportOverviewTableHeaders,
    ...categories.map(({ title, refs, score }) => [
      link(`#${slugify(title)}`, title),
      `${getRoundScoreMarker(score)} ${style(formatReportScore(score))}`,
      countCategoryAudits(refs, report.plugins).toString(),
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

    const refs = category.refs.reduce((acc, ref) => {
      if (ref.type === 'group') {
        acc += groupRefItemToCategorySection(ref.slug, ref.plugin, plugins);
      } else {
        acc += auditRefItemToCategorySection(ref.slug, ref.plugin, plugins);
      }
      return acc;
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
      NEW_LINE +
      refs
    );
  }, '');

  return h2('🏷 Categories') + NEW_LINE + categoryDetails;
}

function auditRefItemToCategorySection(
  refSlug: string,
  refPlugin: string,
  plugins: ScoredReport['plugins'],
): string {
  const plugin = plugins.find(({ slug }) => slug === refPlugin) as PluginReport;
  const pluginAudit = plugin?.audits.find(({ slug }) => slug === refSlug);

  if (!pluginAudit) {
    throwIsNotPresentError(`Audit ${refSlug}`, plugin?.slug);
  }

  const auditTitle = link(
    `#${slugify(pluginAudit.title)}-${slugify(plugin.title)}`,
    pluginAudit?.title,
  );

  return (
    li(
      `${getSquaredScoreMarker(pluginAudit.score)} ${auditTitle} (_${
        plugin.title
      }_) - ${getAuditResult(pluginAudit)}`,
    ) + NEW_LINE
  );
}

function groupRefItemToCategorySection(
  refSlug: string,
  refPlugin: string,
  plugins: ScoredReport['plugins'],
): string {
  const plugin = plugins.find(({ slug }) => slug === refPlugin) as PluginReport;
  const group = plugin?.groups?.find(
    ({ slug }) => slug === refSlug,
  ) as EnrichedScoredAuditGroup;
  const groupScore = Number(formatReportScore(group?.score || 0));

  if (!group) {
    throwIsNotPresentError(`Group ${refSlug}`, plugin?.slug);
  }

  const groupTitle = li(
    `${getRoundScoreMarker(groupScore)} ${group.title} (_${plugin.title}_)`,
  );
  const foundAudits = group.refs.reduce<AuditReport[]>((acc, ref) => {
    const audit = plugin?.audits.find(
      ({ slug: auditSlugInPluginAudits }) =>
        auditSlugInPluginAudits === ref.slug,
    );
    if (audit) {
      return [...acc, audit];
    }

    return acc;
  }, []);

  const groupAudits = foundAudits.reduce((acc, audit) => {
    const auditTitle = link(
      `#${slugify(audit.title)}-${slugify(plugin.title)}`,
      audit?.title,
    );
    acc += `  ${li(
      `${getSquaredScoreMarker(audit.score)} ${auditTitle} - ${getAuditResult(
        audit,
      )}`,
    )}`;
    acc += NEW_LINE;
    return acc;
  }, '');

  return groupTitle + NEW_LINE + groupAudits;
}

function reportToAuditsSection(report: ScoredReport): string {
  const auditsData = report.plugins.reduce((acc, plugin) => {
    const audits = plugin.audits.reduce((acc, audit) => {
      const auditTitle = `${audit.title} (${plugin.title})`;
      const detailsTitle = `${getSquaredScoreMarker(
        audit.score,
      )} ${getAuditResult(audit, true)} (score: ${formatReportScore(
        audit.score,
      )})`;
      const docsItem = getDocsAndDescription(audit);

      acc += h3(auditTitle);

      acc += NEW_LINE;
      acc += NEW_LINE;

      if (!audit.details?.issues?.length) {
        acc += detailsTitle;
        acc += NEW_LINE;
        acc += NEW_LINE;
        acc += docsItem;
        return acc;
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
          const file = `<code>${issue.source?.file}</code>`;
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

      acc += details(detailsTitle, detailsTable);
      acc += NEW_LINE;
      acc += NEW_LINE;
      acc += docsItem;

      return acc;
    }, '');

    return acc + audits;
  }, '');

  return h2('🛡️ Audits') + NEW_LINE + NEW_LINE + auditsData;
}

function reportToAboutSection(
  report: ScoredReport,
  commitData: CommitData | null,
): string {
  const date = new Date().toString();
  const { duration, version, plugins, categories } = report;
  const commitInfo = commitData
    ? `${commitData.message} (${commitData.hash.slice(0, 7)})`
    : 'N/A';
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
    ...plugins.map(({ title, version, duration, audits }) => [
      title,
      audits.length.toString(),
      style(version || '', ['c']),
      formatDuration(duration),
    ]),
  ];

  return (
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

function throwIsNotPresentError(itemName: string, presentPlace: string): never {
  throw new Error(`${itemName} is not present in ${presentPlace}`);
}
