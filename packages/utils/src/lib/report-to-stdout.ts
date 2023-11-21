import chalk from 'chalk';
import Table from 'cli-table3';
import cliui from 'cliui';
import { NEW_LINE } from './md';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  countCategoryAudits,
  formatReportScore,
  reportHeadlineText,
  reportRawOverviewTableHeaders,
  sortAudits,
} from './report';
import { EnrichedAuditReport, ScoredReport } from './scoring';

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

function reportToDetailSection(report: ScoredReport): string {
  const { plugins } = report;

  let output = '';

  plugins.forEach(({ title, audits }) => {
    output += addLine();
    output += addLine(chalk.magentaBright.bold(`${title} audits`));
    output += addLine();

    const ui = cliui({ width: 80 });

    audits
      .sort((a: EnrichedAuditReport, b: EnrichedAuditReport) =>
        sortAudits(a, b),
      )
      .forEach(({ score, title, displayValue, value }) => {
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

function withColor({ score, text }: { score: number; text?: string }) {
  let str = text ?? formatReportScore(score);
  const style = text ? chalk : chalk.bold;
  if (score < 0.5) {
    str = style.red(str);
  } else if (score < 0.9) {
    str = style.yellow(str);
  } else {
    str = style.green(str);
  }
  return str;
}
