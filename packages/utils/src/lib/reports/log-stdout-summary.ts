import { bold, cyan, cyanBright, green, red } from 'ansis';
import type { AuditReport } from '@code-pushup/models';
import { ui } from '../logging';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  REPORT_HEADLINE_TEXT,
  REPORT_RAW_OVERVIEW_TABLE_HEADERS,
  TERMINAL_WIDTH,
} from './constants';
import type { ScoredReport } from './types';
import { applyScoreColor, countCategoryAudits, targetScoreIcon } from './utils';

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
  return `${bold(REPORT_HEADLINE_TEXT)} - ${packageName}@${version}`;
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
          // eslint-disable-next-line no-magic-numbers
          width: 20,
          padding: [0, 0, 0, 0],
        },
      ]);
    });
    log();
  });
}

export function logCategories({ categories, plugins }: ScoredReport): void {
  const hAlign = (idx: number) => (idx === 0 ? 'left' : 'right');

  const rows = categories.map(({ title, score, refs, isBinary }) => [
    title,
    `${binaryIconPrefix(score, isBinary)}${applyScoreColor({ score })}`,
    countCategoryAudits(refs, plugins),
  ]);
  const table = ui().table();
  // eslint-disable-next-line no-magic-numbers
  table.columnWidths([TERMINAL_WIDTH - 9 - 10 - 4, 9, 10]);
  table.head(
    REPORT_RAW_OVERVIEW_TABLE_HEADERS.map((heading, idx) => ({
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

// @TODO refactor `isBinary: boolean` to `targetScore: number` #713
export function binaryIconPrefix(
  score: number,
  isBinary: boolean | undefined,
): string {
  return targetScoreIcon(score, isBinary ? 1 : undefined, {
    passIcon: bold(green('✓')),
    failIcon: bold(red('✗')),
    postfix: ' ',
  });
}
