import ansis from 'ansis';
import {
  formatAsciiLink,
  formatAsciiSticker,
  logger,
} from '@code-pushup/utils';

export function printCliCommand(command: string): void {
  logger.debug(`Running ${ansis.bold(command)} command`);
}

export function renderCategoriesHint(): void {
  logger.info(
    formatAsciiSticker([
      ansis.bold.gray('💡 Configure categories'),
      '',
      ansis.gray('❯ Aggregate audit scores to get a high-level overview'),
      `${ansis.gray('❯')} ${formatAsciiLink('https://www.npmjs.com/package/@code-pushup/cli')}`,
    ]),
  );
}

export function renderPortalHint(): void {
  logger.info(
    formatAsciiSticker([
      ansis.bold.gray('💡 Upload report to Portal'),
      '',
      ansis.gray('❯ Visualize reports in an interactive UI'),
      ansis.gray('❯ Track long-term progress via reports history'),
      `${ansis.gray('❯')} ${formatAsciiLink('https://code-pushup.dev/')}`,
    ]),
  );
}

export function renderUploadHint(): void {
  logger.info(
    formatAsciiSticker([
      ansis.bold.gray('💡 Upload report to Portal'),
      '',
      `${ansis.gray('❯')} npx code-pushup upload`,
    ]),
  );
}
