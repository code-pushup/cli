import chalk from 'chalk';
import Table from 'cli-table3';
import cliui from 'cliui';
import { countAudits, report } from './mock-report.mjs';

const fmtScore = score => Math.round(score * 100).toString();

const withColor = ({ score, text }) => {
  let str = text ?? fmtScore(score);
  const style = text ? chalk : chalk.bold;
  if (score < 0.5) {
    str = style.red(str);
  } else if (score < 0.9) {
    str = style.yellow(str);
  } else {
    str = style.green(str);
  }
  return str;
};

report.plugins.forEach(plugin => {
  const ui = cliui({ width: 80 });

  console.log(chalk.magentaBright.bold(`${plugin.title} audits`) + '\n');

  const audits = plugin.audits;
  audits.forEach(audit => {
    ui.div(
      {
        text: withColor({ score: audit.score, text: '●' }),
        width: 2,
        padding: [0, 1, 0, 0],
      },
      {
        text: audit.title,
        padding: [0, 3, 0, 0],
      },
      {
        text: chalk.cyanBright(audit.displayValue || `${audit.value}`),
        width: 10,
      },
    );
  });

  console.log(ui.toString());

  console.log('\n');
});

console.log(chalk.magentaBright.bold('Categories') + '\n');

const table = new Table({
  head: ['Category', 'Score', 'Audits'],
  colAligns: ['left', 'right', 'right'],
  style: {
    head: ['cyan'],
  },
});
table.push(
  ...report.categories.map(category => [
    category.title,
    withColor({ score: category.score }),
    countAudits(category, report.plugins),
  ]),
);
console.log(table.toString());
