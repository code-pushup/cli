import cliui from '@isaacs/cliui';
import chalk from 'chalk';
import CliTable3 from 'cli-table3';
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

    audits.forEach(audit => {
      ui.div(
        {
          text: withColor({ score: audit.score, text: '●' }),
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
  const table = new CliTable3({
    // eslint-disable-next-line no-magic-numbers
    colWidths: [TERMINAL_WIDTH - 7 - 8 - 4, 7, 8],
    head: reportRawOverviewTableHeaders,
    colAligns: ['left', 'right', 'right'],
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
