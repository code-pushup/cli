import cliui from '@isaacs/cliui';
import ansis from 'ansis';
import type { AuditReport } from '@code-pushup/models';
import { logger } from '../logger.js';
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
  scoreTargetIcon,
} from './utils.js';

export function logStdoutSummary(report: ScoredReport): void {
  const { plugins, categories, packageName, version } = report;
  logger.info(reportToHeaderSection({ packageName, version }));
  logger.newline();
  logPlugins(plugins);
  if (categories && categories.length > 0) {
    logCategories({ plugins, categories });
  }
  logger.info(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);
  logger.newline();
}

function reportToHeaderSection({
  packageName,
  version,
}: Pick<ScoredReport, 'packageName' | 'version'>): string {
  return `${ansis.bold(REPORT_HEADLINE_TEXT)} - ${packageName}@${version}`;
}

export function logPlugins(plugins: ScoredReport['plugins']): void {
  plugins.forEach(plugin => {
    const { title, audits } = plugin;
    const filteredAudits =
      logger.isVerbose() || audits.length === 1
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
    logger.newline();
  });
}

function logAudits(pluginTitle: string, audits: AuditReport[]): void {
  logger.newline();
  logger.info(ansis.bold.magentaBright(`${pluginTitle} audits`));
  logger.newline();
  audits.forEach(({ score, title, displayValue, value }) => {
    logRow(score, title, displayValue || `${value}`);
  });
}

function logRow(score: number, title: string, value?: string): void {
  const ui = cliui({ width: TERMINAL_WIDTH });
  ui.div(
    {
      text: applyScoreColor({ score, text: '●' }),
      width: 2,
      padding: [0, 1, 0, 0],
    },
    {
      text: title,
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      padding: [0, 3, 0, 0],
    },
    ...(value
      ? [
          {
            text: ansis.cyanBright(value),
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            width: 20,
            padding: [0, 0, 0, 0],
          },
        ]
      : []),
  );
  logger.info(ui.toString());
}

export function logCategories({
  plugins,
  categories,
}: Required<Pick<ScoredReport, 'plugins' | 'categories'>>): void {
  const hAlign = (idx: number) => (idx === 0 ? 'left' : 'right');

  const rows = categories.map(({ title, score, scoreTarget, refs }) => [
    title,
    `${binaryIconPrefix(score, scoreTarget)}${applyScoreColor({ score })}`,
    countCategoryAudits(refs, plugins),
  ]);
  // TODO: replace @poppinss/cliui
  const table = ui().table();
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  table.columnWidths([TERMINAL_WIDTH - 9 - 10 - 4, 9, 10]);
  table.head(
    REPORT_RAW_OVERVIEW_TABLE_HEADERS.map((heading, idx) => ({
      content: ansis.cyan(heading),
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

  logger.info(ansis.bold.magentaBright('Categories'));
  logger.newline();
  table.render();
  logger.newline();
}

export function binaryIconPrefix(
  score: number,
  scoreTarget: number | undefined,
): string {
  return scoreTargetIcon(score, scoreTarget, {
    passIcon: ansis.bold(ansis.green('✓')),
    failIcon: ansis.bold(ansis.red('✗')),
    postfix: ' ',
  });
}
