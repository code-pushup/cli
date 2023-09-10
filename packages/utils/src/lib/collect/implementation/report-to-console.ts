import { CoreConfig, PluginConfig, Report } from '@quality-metrics/models';
import chalk from 'chalk';
import { NEW_LINE } from './md/constants';
import { calcRefs, reportHeadlineText } from './report';

// used to distinguish from normal (debug) logs
const print = console.log;

export function reportToConsole(report: Report, config: CoreConfig): void {
  const { date, duration, package: packageName, version } = report;
  print(`${chalk.bold(reportHeadlineText)} - ${packageName}@${version}`);
  print(
    chalk.gray(
      `Date: ${new Date(date).toLocaleDateString()} ${new Date(
        date,
      ).toLocaleTimeString()} (${duration}ms)`,
    ),
  );

  print(chalk.gray('---------------------------'));
  print(
    config.categories
      .map(({ title, refs }) => `${title}: ${chalk.bold(calcRefs(refs))}`)
      .join(NEW_LINE),
  );
  print(chalk.gray('---------------------------' + NEW_LINE));

  config.categories.forEach(({ title, refs }) => {
    const pluginCfg = refs
      .map(({ plugin }) =>
        config.plugins.find(({ meta }) => meta.slug === plugin),
      )
      .filter(v => v)
      .pop();
    const pluginSlug = pluginCfg?.meta.slug;
    if (!pluginCfg) {
      throw new Error('should not happen.');
    }
    const auditSlugs = getAudits(
      pluginCfg,
      refs.map(({ slug }) => slug),
    );
    print(`${chalk.bold(title)} (${refs.length}/${refs.length})`);
    print(
      auditSlugs
        ?.map(({ slug }) => {
          const auditMeta = report.plugins
            .find(p => p.meta.slug === pluginSlug)
            ?.audits.find(a => a.slug === slug);
          const icon = auditMeta?.score ? ' ❌ ' : ' ✓ ';
          return `- ${chalk.bold(
            chalk.bgGreenBright(icon + pluginSlug + '#' + slug + ' '),
          )} (${auditMeta?.score}/${auditMeta?.score})`;
        })
        .join(NEW_LINE) + NEW_LINE,
    );
  });
}

function getAudits(plugin: PluginConfig, auditSlugs: string[]) {
  return plugin?.audits?.filter(({ slug }) => auditSlugs.includes(slug));
}
