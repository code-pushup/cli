import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  AuditResult,
  CategoryConfig,
  CoreConfig,
  PluginReport,
  Report,
} from '@quality-metrics/models';
import { headline } from './md/headline';
import { style } from './md/font-style';
import { NEW_LINE } from './md/constants';
import { li } from './md/list';
import { link } from './md/link';
import chalk from 'chalk';

export class PersistDirError extends Error {
  constructor(outputPath: string) {
    super(`outPath: ${outputPath} is no directory`);
  }
}

export class PersistError extends Error {
  constructor(fileName: string) {
    super(`fileName: ${fileName} could not be saved`);
  }
}

export async function persistReport(report: Report, config: CoreConfig) {
  const { persist } = config;
  const outputPath = persist.outputPath;
  let { format } = persist;
  format = format && format.length !== 0 ? format : ['stdout'];

  if (!existsSync(outputPath)) {
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (e) {
      throw new PersistDirError(outputPath);
    }
  }

  // collect format outputs
  const results: { format: string; out: string }[] = [];

  if (format.includes('json')) {
    results.push({ format: 'json', out: JSON.stringify(report, null, 2) });
  }

  let _mdReport: string | undefined = undefined;
  if (format.includes('md')) {
    _mdReport = reportToMd(report, config);
    results.push({ format: 'md', out: _mdReport });
  }

  if (format.includes('stdout')) {
    reportToConsole(report, config);
  }

  // write format outputs
  return Promise.allSettled(
    results.map(({ format, out }) => {
      const filePath = join(`${outputPath}.${format}`);
      return writeFile(filePath, out)
        .then(() => filePath)
        .catch(() => {
          throw new PersistError(filePath);
        });
    }),
  );
}

const reportHeadlineText = 'Code Pushup Report';

function reportToConsole(report: Report, config: CoreConfig): string {
  const { date, duration } = report;

  console.log(chalk.bold(reportHeadlineText));
  console.log(chalk.gray(`Date: ${date}`));
  console.log(chalk.gray(`Duration: ${duration}${NEW_LINE}`));

  console.log(
    config.categories
      .map(({ title, refs }) => {
        return (
          title +
          ': ' +
          refs.reduce((sum, { weight }) => sum + weight, refs.length)
        );
      })
      .join(NEW_LINE),
  );

  return reportToMd(report, config);
}

function reportToMd(report: Report, config: CoreConfig): string {
  const { plugins, date, duration } = report;
  const { categories } = config;

  let md = headline(reportHeadlineText, 1) + NEW_LINE;
  md += style(`Date: ${date}`) + NEW_LINE + NEW_LINE;
  md += style(`Duration: ${duration}`) + NEW_LINE + NEW_LINE;
  md += categories.map(categoriesToScoreTableMd);
  md += plugins.map(pluginReportToMd).join(NEW_LINE + NEW_LINE);

  return md;
}

function categoriesToScoreTableMd(categorie: CategoryConfig): string {
  const { title, refs, slug } = categorie;

  let md = headline(categorie.slug) + NEW_LINE;
  md += title + NEW_LINE;
  md += refs
    .map(
      ({ slug: slugg, plugin, weight, type }) =>
        `${slug}#${slugg}-${plugin}-${type}-${weight}`,
    )
    .join(NEW_LINE + NEW_LINE);

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
