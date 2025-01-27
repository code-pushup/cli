import type { SyncExpectationResult } from '@vitest/expect';
import { expect } from 'vitest';

export type CustomMarkdownTableMatchers = {
  toContainMarkdownTableRow: (cells: string[]) => void;
};

expect.extend({
  toContainMarkdownTableRow: assertMarkdownTableRow,
});

function assertMarkdownTableRow(
  actual: string,
  expected: string[],
): SyncExpectationResult {
  const rows = actual
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'))
    .map(line =>
      line
        .slice(1, -1)
        .split(/(?<!\\)\|/)
        .map(cell => cell.replace(/\\\|/g, '|').trim()),
    );

  const pass = rows.some(
    row =>
      row.length === expected.length &&
      row.every((cell, i) => cell === expected[i]),
  );
  return pass
    ? {
        pass,
        message: () =>
          `Expected markdown not to contain a table row with cells: ${expected.join(', ')}`,
      }
    : {
        pass,
        message: () =>
          `Expected markdown to contain a table row with cells: ${expected.join(', ')}`,
      };
}
