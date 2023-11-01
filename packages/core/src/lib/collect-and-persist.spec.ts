import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, vi } from 'vitest';
import { ReportFragment } from '@code-pushup/portal-client';
import { Report, reportNameFromReport } from '@code-pushup/models';
import { minimalConfig } from '@code-pushup/models/testing';
import { mockConsole, unmockConsole } from '../../test';
import { DEFAULT_TESTING_CLI_OPTIONS } from '../../test/constants';
import { collectAndPersistReports } from './collect-and-persist';

// This in needed to mock the API client used inside the upload function
vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () => ({ packageName: 'dummy-package' } as ReportFragment),
    ),
  };
});

const outputDir = 'tmp';
const getFilename = () =>
  reportNameFromReport({ date: new Date().toISOString() });
const reportPath = (filename: string, format: 'json' | 'md' = 'json') =>
  join(outputDir, `${filename}.${format}`);

describe('collectAndPersistReports', () => {
  beforeEach(async () => {
    mockConsole();
  });
  afterEach(async () => {
    unmockConsole();
  });

  test('should work', async () => {
    const cfg = minimalConfig(outputDir);
    const filename = getFilename();
    cfg.persist.filename = filename;
    await collectAndPersistReports({
      ...DEFAULT_TESTING_CLI_OPTIONS,
      ...cfg,
    });
    const result = JSON.parse(
      readFileSync(reportPath(filename)).toString(),
    ) as Report;
    expect(result.plugins[0]?.audits[0]?.slug).toBe('audit-1');
  });

  // @TODO should work if persist.outputDir does not exist
});
