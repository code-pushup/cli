import { CoreConfig, Report } from '@quality-metrics/models';
import { NEW_LINE, headline, style, li, table, details, link } from './md/';
import {
  countWeightedRefs,
  sumRefs,
  reportHeadlineText,
  reportOverviewTableHeaders,
} from './utils';

export function reportToMd(report: Report, config: CoreConfig): string {
  // header section
  let md = reportToHeaderSection() + NEW_LINE;

  // meta section
  md += reportToMetaSection(report, config) + NEW_LINE + NEW_LINE;

  // overview section
  md += reportToOverviewSection(report, config) + NEW_LINE + NEW_LINE;

  // details section
  md += reportToDetailSection(report, config) + NEW_LINE;

  // footer section
  md += 'Made with ❤️ by [code-pushup.dev](code-pushup.dev)';
  return md;
}

function reportToHeaderSection(): string {
  return headline(reportHeadlineText) + NEW_LINE;
}

function reportToMetaSection(report: Report, config: CoreConfig): string {
  const { date, duration, version, packageName } = report;
  const { plugins } = config;
  return (
    `---` +
    NEW_LINE +
    `_Package Name: ${packageName}_` +
    NEW_LINE +
    `_Version: ${version}_` +
    NEW_LINE +
    `_Commit: feat(cli): add logic for markdown report - 7eba125ad5643c2f90cb21389fc3442d786f43f9_` +
    NEW_LINE +
    `_Date: ${new Date(date).toString()}_` +
    NEW_LINE +
    `_Duration: ${duration}ms_` +
    NEW_LINE +
    `_Plugins: ${plugins?.length}_` +
    NEW_LINE +
    `_Audits: ${plugins?.reduce(
      (sum, { audits }) => sum + audits.length,
      0,
    )}_` +
    NEW_LINE +
    `---` +
    NEW_LINE
  );
}

function reportToOverviewSection(report: Report, config: CoreConfig): string {
  const { categories } = config;
  const tableContent: string[][] = [
    reportOverviewTableHeaders,
    ...categories.map(({ title, refs }) => [
      title,
      sumRefs(refs).toString(),
      refs.length.toString() + '/' + countWeightedRefs(refs),
    ]),
  ];
  return table(tableContent);
}

function reportToDetailSection(report: Report, config: CoreConfig): string {
  let md = '';
  const { categories, plugins } = config;

  categories.forEach(category => {
    const { title, refs } = category;

    md += style(`${title} ${sumRefs(refs)}`) + NEW_LINE;

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
              throw new Error(`No audit found for ${auditSlugInCategoryRefs}`);
            }
          },
        )
        .join(NEW_LINE) + NEW_LINE;
  });

  return md;
}
