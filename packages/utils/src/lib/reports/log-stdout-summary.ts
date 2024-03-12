import chalk from 'chalk';
import { AuditReport } from '@code-pushup/models';
import { ui } from '../logging';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  SCORE_COLOR_RANGE,
  TERMINAL_WIDTH,
  reportHeadlineText,
  reportRawOverviewTableHeaders,
} from './constants';
import { ScoredReport } from './types';
import { countCategoryAudits, formatReportScore } from './utils';

function log(msg = ''): void {
  ui().logger.log(msg);
}

export function logStdoutSummary(report: ScoredReport): void {
  const printCategories = report.categories.length > 0;

  log(reportToHeaderSection(report));
  log();
  logPlugins(report);
  if (printCategories) {
    logCategories(report);
  }
  log(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);
  log();
}

function reportToHeaderSection(report: ScoredReport): string {
  const { packageName, version } = report;
  return `${chalk.bold(reportHeadlineText)} - ${packageName}@${version}`;
}

function logPlugins(report: ScoredReport): void {
  const { plugins } = report;

  plugins.forEach(plugin => {
    const { title, audits } = plugin;
    log();
    log(chalk.magentaBright.bold(`${title} audits`));
    log();
    audits.forEach((audit: AuditReport) => {
      ui().row([
        {
          text: applyScoreColor({ score: audit.score, text: '●' }),
          width: 2,
          padding: [0, 1, 0, 0],
        },
        {
          text: audit.title,
          // eslint-disable-next-line no-magic-numbers
          padding: [0, 3, 0, 0],
        },
        {
          text: chalk.cyanBright(audit.displayValue || `${audit.value}`),
          width: 10,
          padding: [0, 0, 0, 0],
        },
      ]);
    });
    log();
  });
}

function logCategories({ categories, plugins }: ScoredReport): void {
  const hAlign = (idx: number) => (idx === 0 ? 'left' : 'right');
  const rows = categories.map(({ title, score, refs }) => [
    title,
    applyScoreColor({ score }),
    countCategoryAudits(refs, plugins),
  ]);
  const table = ui().table();
  // eslint-disable-next-line no-magic-numbers
  table.columnWidths([TERMINAL_WIDTH - 9 - 10 - 4, 9, 10]);
  table.head(
    reportRawOverviewTableHeaders.map((heading, idx) => ({
      content: chalk.cyan(heading),
      hAlign: hAlign(idx),
    })),
  );
  rows.forEach(row =>
    table.row(
      row.map((content, idx) => ({
        content: content.toString(),
        hAlign: hAlign(idx),
      })),
    ),
  );

  log(chalk.magentaBright.bold('Categories'));
  log();
  table.render();
  log();
}

function applyScoreColor({ score, text }: { score: number; text?: string }) {
  const formattedScore = text ?? formatReportScore(score);
  const style = text ? chalk : chalk.bold;

  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return style.green(formattedScore);
  }

  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return style.yellow(formattedScore);
  }

  return style.red(formattedScore);
}
