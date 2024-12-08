import { bold, cyan, cyanBright, green, red } from 'ansis';
import type { AuditReport } from '@code-pushup/models';
import { ui } from '../logging.js';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  REPORT_HEADLINE_TEXT,
  REPORT_RAW_OVERVIEW_TABLE_HEADERS,
  TERMINAL_WIDTH,
} from './constants.js';
import type { ScoredReport } from './types.js';
import {
  applyScoreColor,
  countCategoryAudits,
  targetScoreIcon,
} from './utils.js';

function log(msg = ''): void {
  ui().logger.log(msg);
}

export function logStdoutSummary(report: ScoredReport, verbose = false): void {
  const { plugins, categories, packageName, version } = report;
  log(reportToHeaderSection({ packageName, version }));
  log();
  logPlugins(plugins, verbose);
  if (categories && categories.length > 0) {
    logCategories({ plugins, categories });
  }
  log(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);
  log();
}

function reportToHeaderSection({
  packageName,
  version,
}: Pick<ScoredReport, 'packageName' | 'version'>): string {
  return `${bold(REPORT_HEADLINE_TEXT)} - ${packageName}@${version}`;
}

export function logPlugins(
  plugins: ScoredReport['plugins'],
  verbose: boolean,
): void {
  plugins.forEach(plugin => {
    const { title, audits } = plugin;
    const filteredAudits =
      verbose || audits.length === 1
        ? audits
        : audits.filter(({ score }) => score !== 1);
    const diff = audits.length - filteredAudits.length;

    logAudits(title, filteredAudits);

    if (diff > 0) {
      const notice =
        filteredAudits.length === 0
          ? `... All ${diff} audits have perfect scores ...`
          : `... ${diff} audits with perfect scores omitted for brevity ...`;
      logRow(1, notice);
    }
    log();
  });
}

function logAudits(pluginTitle: string, audits: AuditReport[]): void {
  log();
  log(bold.magentaBright(`${pluginTitle} audits`));
  log();
  audits.forEach(({ score, title, displayValue, value }) => {
    logRow(score, title, displayValue || `${value}`);
  });
}

function logRow(score: number, title: string, value?: string): void {
  ui().row([
    {
      text: applyScoreColor({ score, text: '●' }),
      width: 2,
      padding: [0, 1, 0, 0],
    },
    {
      text: title,
      // eslint-disable-next-line no-magic-numbers
      padding: [0, 3, 0, 0],
    },
    ...(value
      ? [
          {
            text: cyanBright(value),
            // eslint-disable-next-line no-magic-numbers
            width: 20,
            padding: [0, 0, 0, 0],
          },
        ]
      : []),
  ]);
}

export function logCategories({
  plugins,
  categories,
}: Required<Pick<ScoredReport, 'plugins' | 'categories'>>): void {
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
