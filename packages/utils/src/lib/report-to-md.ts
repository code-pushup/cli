import { NEW_LINE, details, h2, headline, li, link, style, table } from './md/';
import { CODE_PUSHUP_DOMAIN, FOOTER_PREFIX, countWeightedRefs } from './report';
import { ScoredReport } from './scoring';
import {
  formatReportScore,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableHeaders,
  reportOverviewTableHeaders,
} from './utils';

export function reportToMd(report: ScoredReport): string {
  // header section
  let md = reportToHeaderSection() + NEW_LINE;

  // overview section
  md += reportToOverviewSection(report) + NEW_LINE + NEW_LINE;

  // details section
  md += reportToDetailSection(report) + NEW_LINE;

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
    ...categories.map(({ title, refs, score }) => [
      title,
      formatReportScore(score),
      refs.length.toString() + '/' + countWeightedRefs(refs),
    ]),
  ];
  console.log(tableContent);
  return table(tableContent);
}

function reportToDetailSection(report: ScoredReport): string {
  let md = '';
  const { categories, plugins } = report;

  categories.forEach(category => {
    const { title, refs, score } = category;

    md += style(`${title} ${score}`) + NEW_LINE;

    md +=
      refs
        .map(
          ({ slug: auditSlugInCategoryRefs, weight, plugin: pluginSlug }) => {
            const plugin = plugins.find(({ slug }) => slug === pluginSlug);

            if (!plugin) {
              // this should never happen
              throw new Error(
                `plugin ${pluginSlug} not present in config.plugins`,
              );
            }

            const pluginAudit = plugin?.audits.find(
              ({ slug: auditSlugInPluginAudits }) =>
                auditSlugInPluginAudits === auditSlugInCategoryRefs,
            );

            if (pluginAudit !== undefined) {
              let content = ``;
              const reportAudit = report.plugins
                .find(p => p.slug === pluginSlug)
                ?.audits.find(a => a.slug === pluginAudit.slug);

              if (!reportAudit) {
                // this should never happen
                throw new Error(
                  `audit ${pluginAudit.slug} not present in result.plugins[${pluginSlug}].audits`,
                );
              }

              content += `${reportAudit?.displayValue}` + NEW_LINE;
              content += `${pluginAudit?.description}` + NEW_LINE;
              if (pluginAudit?.docsUrl) {
                content +=
                  link(pluginAudit?.docsUrl + '', 'Documentation') + NEW_LINE;
              }
              return li(
                details(
                  `${pluginAudit?.title} (${weight}) ${plugin?.title}`,
                  content,
                ),
              );
            } else {
              // this should never happen
              console.error(`No audit found for ${auditSlugInCategoryRefs}`);
              return '';
            }
          },
        )
        .join(NEW_LINE) + NEW_LINE;
  });

  return md;
}

function reportToAboutSection(report: ScoredReport): string {
  const date = new Date().toString();
  const { duration, version, plugins, categories } = report;
  const commitData =
    'Implement todos list ([3ac01d1](https://github.com/flowup/todos-app/commit/3ac01d192698e0a923bd410f79594371480a6e4c))';
  const reportMetaTable: string[][] = [
    reportMetaTableHeaders,
    [
      commitData,
      version as string,
      (duration / 1000).toFixed(2) + 's',
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
      (duration / 1000).toFixed(2) + 's',
    ]),
  ];

  return (
    h2('About') +
    NEW_LINE +
    NEW_LINE +
    `Report was created by [Code PushUp](https://github.com/flowup/quality-metrics-cli#readme) on ${date}` +
    NEW_LINE +
    NEW_LINE +
    table(reportMetaTable) +
    NEW_LINE +
    NEW_LINE +
    'The following plugins were run:' +
    NEW_LINE +
    NEW_LINE +
    table(pluginMetaTable)
  );
}
