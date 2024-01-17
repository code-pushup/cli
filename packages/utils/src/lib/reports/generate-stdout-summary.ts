import cliui from '@isaacs/cliui';
import chalk from 'chalk';
import Table from 'cli-table3';
import { NEW_LINE, SCORE_COLOR_RANGE, TERMINAL_WIDTH } from './constants';
import { ScoredReport } from './scoring';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  countCategoryAudits,
  formatReportScore,
  reportHeadlineText,
  reportRawOverviewTableHeaders,
} from './utils';

function addLine(line = ''): string {
  return line + NEW_LINE;
}

export function generateStdoutSummary(report: ScoredReport): string {
  return (
    addLine(reportToHeaderSection(report)) +
    addLine() +
    addLine(reportToDetailSection(report)) +
    addLine(reportToOverviewSection(report)) +
    addLine(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`)
  );
}

function reportToHeaderSection(report: ScoredReport): string {
  const { packageName, version } = report;
  return `${chalk.bold(reportHeadlineText)} - ${packageName}@${version}`;
}

function reportToDetailSection(report: ScoredReport): string {
  const { plugins } = report;

  return plugins.reduce((acc, plugin) => {
    const { title, audits } = plugin;
    const ui = cliui({ width: TERMINAL_WIDTH });

    audits.forEach(({ score, title, displayValue, value }) => {
      ui.div(
        {
          text: withColor({ score, text: '●' }),
          width: 2,
          padding: [0, 1, 0, 0],
        },
        {
          text: title,
          // eslint-disable-next-line no-magic-numbers
          padding: [0, 3, 0, 0],
        },
        {
          text: chalk.cyanBright(displayValue || `${value}`),
          padding: [0, 0, 0, 0],
        },
      );
    });
    return (
      acc +
      addLine() +
      addLine(chalk.magentaBright.bold(`${title} audits`)) +
      addLine() +
      addLine(ui.toString()) +
      addLine()
    );
  }, '');
}

function reportToOverviewSection({
  categories,
  plugins,
}: ScoredReport): string {
  const table = new Table({
    /* eslint-disable no-magic-numbers */
    colWidths: [51, 8, 8],
    /* eslint-enable no-magic-numbers */
    head: reportRawOverviewTableHeaders,
    colAligns: ['left', 'right', 'left'],
    style: {
      head: ['cyan'],
    },
  });

  table.push(
    ...categories.map(({ title, score, refs }) => [
      title,
      withColor({ score }),
      countCategoryAudits(refs, plugins),
    ]),
  );

  return (
    addLine(chalk.magentaBright.bold('Categories')) +
    addLine() +
    addLine(table.toString())
  );
}

function withColor({ score, text }: { score: number; text?: string }) {
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
