import { AuditReport, PluginReport } from '@code-pushup/models';
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
import { CODE_PUSHUP_DOMAIN, FOOTER_PREFIX, countWeightedRefs } from './report';
import { ScoredReport } from './scoring';
import {
  detailsTableHeaders,
  formatReportScore,
  getRoundScoreMarker,
  getSeverityIcon,
  getSquaredScoreMarker,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableHeaders,
  reportOverviewTableHeaders,
  toUnixPath,
} from './utils';

export function reportToMd(report: ScoredReport): string {
  // header section
  let md = reportToHeaderSection() + NEW_LINE;

  // overview section
  md += reportToOverviewSection(report) + NEW_LINE + NEW_LINE;

  // categories section
  md += reportToCategoriesSection(report) + NEW_LINE + NEW_LINE;

  // audits section
  md += reportToAuditsSection(report) + NEW_LINE + NEW_LINE;

  // about section
  md += reportToAboutSection(report) + NEW_LINE + NEW_LINE;

  // // footer section
  md += `${FOOTER_PREFIX} ${link(CODE_PUSHUP_DOMAIN)}`;
  return md;
}

function reportToHeaderSection(): string {
  return headline(reportHeadlineText) + NEW_LINE;
}

function reportToOverviewSection(report: ScoredReport): string {
  const { categories } = report;
  const tableContent: string[][] = [
    reportOverviewTableHeaders,
    ...categories.map(({ title, refs, score, slug }) => [
      link(`#${slug}`, title),
      `${formatReportScore(score)} ${getRoundScoreMarker(score)}`,
      refs
        .reduce((acc, ref) => {
          if (ref.type === 'group') {
            const groupRefs = categories.find(
              ({ slug }) => slug === ref.slug,
            )?.refs;

            if (!groupRefs) {
              throwIsNotPresentError(
                `Category refs ${ref.slug}`,
                'config.categories',
              );
            }

            return acc + countWeightedRefs(groupRefs);
          } else {
            return acc + 1;
          }
        }, 0)
        .toString(),
    ]),
  ];

  return tableMd(tableContent, ['l', 'c', 'c']);
}

function reportToCategoriesSection(report: ScoredReport): string {
  const { categories, plugins } = report;

  const categoryDetails = categories.reduce((acc, category) => {
    const categoryTitle =
      style(
        `<a name="${category.slug}"></a>${getRoundScoreMarker(
          category.score,
        )} ${category.title}: ${formatReportScore(category.score)}`,
      ) +
      NEW_LINE +
      NEW_LINE;

    const refs = category.refs.reduce((acc, ref) => {
      if (ref.type === 'group') {
        acc += groupRefItemToCategorySection(ref.slug, ref.plugin, plugins);
      } else {
        acc += auditRefItemToCategorySection(ref.slug, ref.plugin, plugins);
      }
      return acc;
    }, '');

    return acc + categoryTitle + NEW_LINE + NEW_LINE + refs;
  }, '');

  return (
    h2('🏷 Categories') +
    NEW_LINE +
    NEW_LINE +
    categoryDetails +
    NEW_LINE +
    NEW_LINE
  );
}

function auditRefItemToCategorySection(
  refSlug: string,
  refPlugin: string,
  plugins: ScoredReport['plugins'],
): string {
  const plugin = plugins.find(({ slug }) => slug === refPlugin) as PluginReport;
  const pluginAudit = plugin?.audits.find(
    ({ slug: auditSlugInPluginAudits }) => auditSlugInPluginAudits === refSlug,
  );

  if (!pluginAudit) {
    throwIsNotPresentError(`Audit ${refSlug}`, plugin?.slug);
  }

  const auditTitle = link(`#${pluginAudit.slug}`, pluginAudit?.title);

  return (
    li(
      `${getSquaredScoreMarker(pluginAudit.score)} ${auditTitle} (_${
        plugin.title
      }_) - **${getAuditResult(pluginAudit)}**`,
    ) +
    NEW_LINE +
    NEW_LINE
  );
}

function groupRefItemToCategorySection(
  refSlug: string,
  refPlugin: string,
  plugins: ScoredReport['plugins'],
): string {
  const plugin = plugins.find(({ slug }) => slug === refPlugin) as PluginReport;
  const group = plugin?.groups?.find(
    ({ slug: groupSlugInPluginGroups }) => groupSlugInPluginGroups === refSlug,
  );

  if (!group) {
    throwIsNotPresentError(`Group ${refSlug}`, plugin?.slug);
  }

  const groupTitle = li(
    `${getRoundScoreMarker(100)} ${group.title} (_${plugin.title}_)`,
  );
  const foundAudits = group.refs.reduce((acc, ref) => {
    const audit = plugin?.audits.find(
      ({ slug: auditSlugInPluginAudits }) =>
        auditSlugInPluginAudits === ref.slug,
    );
    if (audit) {
      acc.push(audit);
    }
    return acc;
  }, [] as AuditReport[]);

  const groupAudits = foundAudits.reduce((acc, audit) => {
    const auditTitle = link(`#${audit.slug}`, audit?.title);
    acc += `  ${li(
      `${getSquaredScoreMarker(audit.score)} ${auditTitle} - **${getAuditResult(
        audit,
      )}**`,
    )}`;
    acc += NEW_LINE;
    acc += NEW_LINE;
    return acc;
  }, '');

  return groupTitle + NEW_LINE + NEW_LINE + groupAudits + NEW_LINE + NEW_LINE;
}

function reportToAuditsSection(report: ScoredReport): string {
  const auditsData = report.plugins.reduce((acc, plugin) => {
    const audits = plugin.audits.reduce((acc, audit) => {
      const auditTitle = `<a name="${audit.slug}"></a>${audit.title} (${plugin.title})`;
      const detailsTitle = `${getSquaredScoreMarker(
        audit.score,
      )} ${getAuditResult(audit)} (score: ${formatReportScore(audit.score)})`;

      acc += h3(auditTitle);
      acc += NEW_LINE;
      acc += NEW_LINE;

      if (!audit.details?.issues?.length) {
        acc += details(detailsTitle, 'No details');
        acc += NEW_LINE;
        acc += NEW_LINE;
        return acc;
      }

      const detailsTable = [
        detailsTableHeaders,
        ...audit.details.issues.map(issue => [
          `${getSeverityIcon(issue.severity)} <i>${issue.severity}</i>`,
          issue.message,
          `<a href="${toUnixPath(issue.source?.file as string, {
            toRelative: true,
          })}">
             <code>${issue.source?.file}</code>
           </a>`,
          String(issue.source?.position?.startLine),
        ]),
      ];

      const docsItem = audit.docsUrl
        ? `${audit.description} ${link(audit.docsUrl, '📖 Docs')}` +
          NEW_LINE +
          NEW_LINE
        : '';

      acc += details(detailsTitle, tableHtml(detailsTable));
      acc += NEW_LINE;
      acc += NEW_LINE;
      acc += docsItem;

      return acc;
    }, '');

    return acc + audits;
  }, '');

  return (
    h2('🛡️ Audits') + NEW_LINE + NEW_LINE + auditsData + NEW_LINE + NEW_LINE
  );
}

function reportToAboutSection(report: ScoredReport): string {
  const date = new Date().toString();
  const { duration, version, plugins, categories } = report;
  const commitData =
    '_Implement todos list_ ([3ac01d1](https://github.com/flowup/todos-app/commit/3ac01d192698e0a923bd410f79594371480a6e4c))';
  const readmeUrl = 'https://github.com/flowup/quality-metrics-cli#readme';
  const reportMetaTable: string[][] = [
    reportMetaTableHeaders,
    [
      commitData,
      version as string,
      (duration / 1000).toFixed(2) + ' s',
      plugins?.length.toString(),
      categories?.length.toString(),
      plugins?.reduce((acc, { audits }) => acc + audits.length, 0).toString(),
    ],
  ];

  const pluginMetaTable = [
    pluginMetaTableHeaders,
    ...plugins.map(({ title, version, duration, audits }) => [
      title,
      audits.length.toString(),
      version as string,
      (duration / 1000).toFixed(2) + ' s',
    ]),
  ];

  return (
    h2('About') +
    NEW_LINE +
    NEW_LINE +
    `Report was created by [Code PushUp](${readmeUrl}) on ${date}` +
    NEW_LINE +
    NEW_LINE +
    tableMd(reportMetaTable) +
    NEW_LINE +
    NEW_LINE +
    'The following plugins were run:' +
    NEW_LINE +
    NEW_LINE +
    tableMd(pluginMetaTable)
  );
}

function getAuditResult(audit: AuditReport): string {
  const { displayValue, value } = audit;
  return displayValue || value.toString();
}

function throwIsNotPresentError(itemName: string, presentPlace: string): never {
  throw new Error(`${itemName} is not present in ${presentPlace}`);
}
