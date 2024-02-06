import chalk from 'chalk';

export function link(text: string) {
  return chalk.underline(chalk.blueBright(text));
}
