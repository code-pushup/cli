import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { osAgnosticAuditOutputs } from '@code-pushup/test-fixtures';
import { lcovResultsToAuditOutputs } from './lcov-runner.js';

describe('lcovResultsToAuditOutputs', () => {
  it('should correctly convert lcov results to AuditOutputs and prepend project paths', async () => {
    /**
     * The stats passed in the fixture are as follows
     * Functions: 2 found, 2 covered (100% coverage)
     * Branches: 10 found, 8 covered (80% coverage) - last value of BRDA
     * Lines: 10 found, 7 covered (70% coverage) - merged into one issue with line range
     */
    const results = await lcovResultsToAuditOutputs(
      [
        {
          resultsPath: path.join(
            fileURLToPath(path.dirname(import.meta.url)),
            '..',
            '..',
            '..',
            '..',
            'mocks',
            'single-record-lcov.info',
          ),
          pathToProject: 'packages/cli',
        },
      ],
      ['branch', 'function', 'line'],
    );
    expect(osAgnosticAuditOutputs(results)).toMatchSnapshot();
  });

  it('should correctly merge all lines for coverage', async () => {
    const results = await lcovResultsToAuditOutputs(
      [
        {
          resultsPath: path.join(
            fileURLToPath(path.dirname(import.meta.url)),
            '..',
            '..',
            '..',
            '..',
            'mocks',
            'no-coverage-lcov.info',
          ),
          pathToProject: 'packages/cli',
        },
      ],
      ['line'],
    );
    expect(osAgnosticAuditOutputs(results)).toMatchSnapshot();
  });

  it('should correctly merge duplicate LCOV records from multiple files', async () => {
    const results = await lcovResultsToAuditOutputs(
      [
        {
          resultsPath: path.join(
            fileURLToPath(path.dirname(import.meta.url)),
            '..',
            '..',
            '..',
            '..',
            'mocks',
            'single-record-lcov.info',
          ),
          pathToProject: 'packages/cli',
        },
        {
          resultsPath: path.join(
            fileURLToPath(path.dirname(import.meta.url)),
            '..',
            '..',
            '..',
            '..',
            'mocks',
            'duplicate-record-lcov.info',
          ),
          pathToProject: 'packages/cli',
        },
      ],
      ['branch', 'function', 'line'],
    );
    expect(osAgnosticAuditOutputs(results)).toMatchSnapshot();
  });
});
