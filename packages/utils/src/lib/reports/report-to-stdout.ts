import cliui from '@isaacs/cliui';
import chalk from 'chalk';
import Table from 'cli-table3';
import { NEW_LINE, SCORE_COLOR_RANGE } from './constants';
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

export function reportToStdout(report: ScoredReport): string {
  let output = '';

  output += addLine(reportToHeaderSection(report));
  output += addLine();
  output += addLine(reportToDetailSection(report));
  output += addLine(reportToOverviewSection(report));
  output += addLine(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);

  return output;
}

function reportToHeaderSection(report: ScoredReport): string {
  const { packageName, version } = report;
  return `${chalk.bold(reportHeadlineText)} - ${packageName}@${version}`;
}

function reportToDetailSection(report: ScoredReport): string {
  const { plugins } = report;

  let output = '';

  plugins.forEach(({ title, audits }) => {
    output += addLine();
    output += addLine(chalk.magentaBright.bold(`${title} audits`));
    output += addLine();

    const ui = cliui({ width: 80 });

    audits.forEach(({ score, title, displayValue, value }) => {
      ui.div(
        {
          text: withColor({ score, text: '●' }),
          width: 2,
          padding: [0, 1, 0, 0],
        },
        {
          text: title,
          padding: [0, 3, 0, 0],
        },
        {
          text: chalk.cyanBright(displayValue || `${value}`),
          width: 10,
          padding: [0, 0, 0, 0],
        },
      );
    });

    output += addLine(ui.toString());
    output += addLine();
  });

  return output;
}

function reportToOverviewSection({
  categories,
  plugins,
}: ScoredReport): string {
  let output = addLine(chalk.magentaBright.bold('Categories'));
  output += addLine();

  const table = new Table({
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

  output += addLine(table.toString());

  return output;
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
