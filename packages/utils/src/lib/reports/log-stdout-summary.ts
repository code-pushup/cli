import { bold, cyan, cyanBright, green, red, yellow } from 'ansis';
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
  return `${bold(reportHeadlineText)} - ${packageName}@${version}`;
}

function logPlugins(report: ScoredReport): void {
  const { plugins } = report;

  plugins.forEach(plugin => {
    const { title, audits } = plugin;
    log();
    log(bold.magentaBright(`${title} audits`));
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
          text: cyanBright(audit.displayValue || `${audit.value}`),
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
      content: cyan(heading),
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

  log(bold.magentaBright('Categories'));
  log();
  table.render();
  log();
}

function applyScoreColor({ score, text }: { score: number; text?: string }) {
  const formattedScore = text ?? formatReportScore(score);

  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return text ? green(formattedScore) : bold.green(formattedScore);
  }

  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return text ? yellow(formattedScore) : bold.yellow(formattedScore);
  }

  return text ? red(formattedScore) : bold.red(formattedScore);
}
