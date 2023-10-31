import { readFileSync } from 'fs';
import { vol } from 'memfs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Report, reportNameFromReport } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  minimalConfig,
  minimalReport,
  persistConfig,
} from '@code-pushup/models/testing';
import { CODE_PUSHUP_DOMAIN, FOOTER_PREFIX } from '@code-pushup/utils';
import { mockConsole, unmockConsole } from '../../../test/console.mock';
import { persistReport } from './persist';

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;
const getFilename = () =>
  reportNameFromReport({ date: new Date().toISOString() });
const readReport = (name: string, format: 'json' | 'md' = 'json') => {
  const reportContent = readFileSync(join(outputDir, name)).toString();
  if (format === 'json') {
    return JSON.parse(reportContent);
  } else {
    return reportContent;
  }
};

const dummyReport = minimalReport();
const dummyConfig = minimalConfig(outputDir);
let logs: string[] = [];

const resetFiles = async () => {
  vol.reset();
  vol.fromJSON({}, MEMFS_VOLUME);
};
const setupConsole = async () => {
  logs = [];
  mockConsole(msg => logs.push(msg));
};
const teardownConsole = async () => {
  logs = [];
  unmockConsole();
};

// @TODO refactor away from snapshots in favour of disc space and readability
describe('persistReport', () => {
  beforeEach(async () => {
    resetFiles();
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should stdout as format by default`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    await persistReport(dummyReport, dummyConfig);
    expect(logs).toContain(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);

    expect(() => readReport(`${filename}.json`, 'json')).not.toThrow();
    expect(() => readReport(`${filename}.md`, 'md')).toThrow(
      'no such file or directory',
    );
  });

  it('should log to console when format is stdout`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    const persist = persistConfig({ outputDir, format: ['stdout'], filename });

    await persistReport(dummyReport, {
      ...dummyConfig,
      persist,
    });
    expect(logs).toContain(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);

    expect(() => readReport(`${filename}.json`, 'json')).not.toThrow(
      'no such file or directory',
    );
    expect(() => readReport(`${filename}.md`, 'md')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist json format`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    const persist = persistConfig({ outputDir, format: ['json'], filename });
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist,
    });
    const jsonReport: Report = readReport(`${filename}.json`, 'json');
    expect(jsonReport.packageName).toBe('@code-pushup/core');

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist md format`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    const persist = persistConfig({ outputDir, format: ['md'], filename });
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist,
    });
    const mdReport = readReport(`${filename}.md`, 'md').toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [${CODE_PUSHUP_DOMAIN}](${CODE_PUSHUP_DOMAIN})`,
    );

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readReport(`${filename}.json`, 'json')).not.toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    const persist = persistConfig({
      outputDir,
      format: ['json', 'md', 'stdout'],
      filename,
    });
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist,
    });

    const jsonReport: Report = readReport(`${filename}.json`, 'json');
    expect(jsonReport.packageName).toBe('@code-pushup/core');

    const mdReport = readReport(`${filename}.md`, 'md').toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [${CODE_PUSHUP_DOMAIN}](${CODE_PUSHUP_DOMAIN})`,
    );

    expect(logs).toContain(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);
  });

  it('should persist some formats`', async () => {
    const filename = getFilename();
    dummyConfig.persist.filename = filename;
    const persist = persistConfig({
      outputDir,
      format: ['md', 'stdout'],
      filename,
    });
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist,
    });

    expect(() => readReport(`${filename}.json`, 'json')).not.toThrow(
      'no such file or directory',
    );

    const mdReport = readReport(`${filename}.md`, 'md').toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [${CODE_PUSHUP_DOMAIN}](${CODE_PUSHUP_DOMAIN})`,
    );

    expect(logs).toContain(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`);
  });

  // @TODO: should throw PersistDirError
  // @TODO: should throw PersistError
});
