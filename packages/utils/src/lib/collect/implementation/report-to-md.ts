import {
  AuditResult,
  CoreConfig,
  PluginReport,
  Report,
} from '@quality-metrics/models';
import { headline } from './md/headline';
import { calcRefs, reportHeadlineText } from './report';
import { NEW_LINE } from './md/constants';
import { style } from './md/font-style';
import { link } from './md/link';
import { li } from './md/list';
import { table } from './md/table';

export function reportToMd(report: Report, config: CoreConfig): string {
  const { date, duration, package: packageName, version, plugins } = report;

  let md =
    headline(`${reportHeadlineText} - ${packageName}@${version})`) + NEW_LINE;
  md +=
    `Date: ${new Date(date).toLocaleTimeString()} (${duration}ms)` +
    NEW_LINE +
    NEW_LINE;
  md += categoriesToScoreTableMd(report, config) + NEW_LINE + NEW_LINE;
  md += categoriesToCategoryAuditListMd(report, config) + NEW_LINE;

  md += plugins.map(pluginReportToMd).join(NEW_LINE + NEW_LINE);

  return md;
}

function categoriesToScoreTableMd(report: Report, config: CoreConfig): string {
  let md = '';

  const tablee = [];
  tablee.push(config.categories.map(({ slug }) => slug));
  tablee.push(config.categories.flatMap(({ refs, slug }) => calcRefs(refs)));
  md += table(tablee);

  return md;
}

function categoriesToCategoryAuditListMd(
  report: Report,
  config: CoreConfig,
): string {
  let md = '';
  config.categories.forEach(category => {
    const { title, refs, slug } = category;
    md += headline(title, 2) + NEW_LINE;
    md +=
      refs
        .map(
          ({ slug: slugg, plugin, weight, type }) =>
            `${plugin}#${slugg} (${weight})`,
        )
        .join(NEW_LINE) +
      NEW_LINE +
      NEW_LINE;
  });
  return md;
}

function pluginReportToMd(plugin: PluginReport): string {
  const slugWithDocsLink = ({ docsUrl, name }: PluginReport['meta']) =>
    docsUrl ? link(name, docsUrl) : name;

  let md = headline(slugWithDocsLink(plugin.meta)) + NEW_LINE;
  md += plugin.audits.map(auditResultToMd).join(NEW_LINE + NEW_LINE);

  return md;
}

function auditResultToMd(audit: AuditResult): string {
  const displayValue = audit?.displayValue || audit.value.toString();
  return li(audit.slug + style(displayValue)) + NEW_LINE;
}
