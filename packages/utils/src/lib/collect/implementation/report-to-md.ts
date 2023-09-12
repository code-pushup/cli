import {
  CoreConfig,
  PluginReport,
  Report,
  AuditReport,
} from '@quality-metrics/models';
import { headline } from './md/headline';
import { calcRefs, reportHeadlineText } from './report';
import { NEW_LINE } from './md/constants';
import { style } from './md/font-style';
import { link } from './md/link';
import { li } from './md/list';
import { table } from './md/table';
import { details } from './md/details';

export function reportToMd(report: Report, config: CoreConfig): string {
  const { date, duration, package: packageName, version, plugins } = report;

  // headline
  let md =
    headline(`${reportHeadlineText} - ${packageName}@${version})`) + NEW_LINE;
  // meta
  md +=
    `_Version: ${version}` +
    `_Date: ${new Date(date).toLocaleTimeString()} (${duration}ms)_` +
    `_Plugins: ${config.plugins?.length} Audits: ${config.plugins?.reduce(
      (sum, { audits }) => sum + audits.length,
      0,
    )}_` +
    NEW_LINE +
    NEW_LINE;
  // overview
  md += categoriesToScoreTableMd(report, config) + NEW_LINE + NEW_LINE;
  // details
  md += categoriesToCategoryAuditListMd(report, config) + NEW_LINE;
  // md += plugins.map(pluginReportToMd).join(NEW_LINE + NEW_LINE);
  // footer
  md += 'Code Pushup Cloud ID: [123abc456def]()';
  return md;
}

function categoriesToScoreTableMd(report: Report, config: CoreConfig): string {
  let md = '';

  const tablee = [];
  tablee.push(config.categories.map(({ title }) => title));
  tablee.push(config.categories.flatMap(({ refs }) => calcRefs(refs)));
  md += table(tablee);

  return md;
}

function categoriesToCategoryAuditListMd(
  report: Report,
  config: CoreConfig,
): string {
  let md = '';
  const { categories, plugins } = config;
  categories.forEach(category => {
    const { title, refs } = category;
    md += style(`${title} ${calcRefs(category.refs)}`) + NEW_LINE;

    md +=
      refs
        .map(({ slug: auditSlug, weight, plugin }) => {
          const description =
            plugins
              .find(({ meta }) => meta.slug === plugin)
              ?.audits.find(({ slug }) => slug === auditSlug)?.description ||
            '';
          return li(
            details(`${auditSlug} (${weight})`, `Description:  ${description}`),
          );
        })
        .join(NEW_LINE) +
      NEW_LINE +
      NEW_LINE;
  });
  return md;
}

function auditReportToMd(audit: AuditReport): string {
  const displayValue = audit?.displayValue || audit.value.toString();
  return li(audit.slug + style(displayValue)) + NEW_LINE;
}
