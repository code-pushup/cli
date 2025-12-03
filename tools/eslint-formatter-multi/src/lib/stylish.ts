/* COPY OF https://github.com/eslint/eslint/blob/a355a0e5b2e6a47cda099b31dc7d112cfb5c4315/lib/cli-engine/formatters/stylish.js */

/**
 * @fileoverview Stylish reporter
 * @author Sindre Sorhus
 */
import ansis from 'ansis';
import type { ESLint } from 'eslint';
import { stripVTControlCharacters } from 'node:util';
import { textTable } from './text-table.js';

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {number} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// eslint-disable-next-line max-lines-per-function
export function stylishFormatter(results: ESLint.LintResult[]): string {
  // eslint-disable-next-line functional/no-let
  let output = '\n',
    errorCount = 0,
    warningCount = 0,
    fixableErrorCount = 0,
    fixableWarningCount = 0,
    summaryColor = 'yellow';

  results.forEach(result => {
    const messages = result.messages;

    if (messages.length === 0) {
      return;
    }

    errorCount += result.errorCount;
    warningCount += result.warningCount;
    fixableErrorCount += result.fixableErrorCount;
    fixableWarningCount += result.fixableWarningCount;

    output += `${ansis.underline(result.filePath)}\n`;

    output += `${textTable(
      messages.map(message => {
        // eslint-disable-next-line functional/no-let
        let messageType;

        if (message.fatal || message.severity === 2) {
          messageType = ansis.red('error');
          summaryColor = 'red';
        } else {
          messageType = ansis.yellow('warning');
        }

        return [
          '',
          String(message.line || 0),
          String(message.column || 0),
          messageType,
          message.message.replace(/([^ ])\.$/u, '$1'),
          ansis.dim(message.ruleId || ''),
        ];
      }),
      {
        align: ['', 'r', 'l'],
        stringLength(str: string) {
          return stripVTControlCharacters(str).length;
        },
      },
    )
      .split('\n')
      .map(el =>
        el.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => ansis.dim(`${p1}:${p2}`)),
      )
      .join('\n')}\n\n`;
  });

  const total = errorCount + warningCount;

  if (total > 0) {
    const colorFn = summaryColor === 'red' ? ansis.red : ansis.yellow;
    output += ansis.bold(
      colorFn(
        [
          '\u2716 ',
          total,
          pluralize(' problem', total),
          ' (',
          errorCount,
          pluralize(' error', errorCount),
          ', ',
          warningCount,
          pluralize(' warning', warningCount),
          ')\n',
        ].join(''),
      ),
    );

    if (fixableErrorCount > 0 || fixableWarningCount > 0) {
      output += ansis.bold(
        colorFn(
          [
            '  ',
            fixableErrorCount,
            pluralize(' error', fixableErrorCount),
            ' and ',
            fixableWarningCount,
            pluralize(' warning', fixableWarningCount),
            ' potentially fixable with the `--fix` option.\n',
          ].join(''),
        ),
      );
    }
  }

  // Resets output color, for prevent change on top level
  return total > 0 ? ansis.reset(output) : '';
}
