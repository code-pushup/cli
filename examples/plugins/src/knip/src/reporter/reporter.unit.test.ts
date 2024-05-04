import type { ReporterOptions } from 'knip';
import { fs } from 'memfs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME, getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { rawReport } from '../../../../mocks/knip-raw';
import { KNIP_REPORT_NAME } from '../constants';
import { CustomReporterOptions } from './model';
import { knipReporter } from './reporter';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    getGitRoot: vi.fn().mockResolvedValue('User/projects/code-pushup-cli/'),
  };
});

describe('knipReporter', () => {
  it('should saves report to file system by default', async () => {
    await expect(
      knipReporter({
        report: {
          files: true,
        },
        issues: {
          files: new Set(['main.js']),
        },
      } as ReporterOptions),
    ).resolves.toBeUndefined();

    expect(getLogMessages(ui().logger)).toStrictEqual([
      '[ blue(info) ] Saved report to knip-code-pushup-report.json',
    ]);
  });

  it('should accept outputFile', async () => {
    await expect(
      knipReporter({
        report: {
          files: true,
        },
        issues: {
          files: new Set(['main.js']),
        },
        options: JSON.stringify({
          outputFile: 'report.json',
        } satisfies CustomReporterOptions),
      } as ReporterOptions),
    ).resolves.toBeUndefined();

    expect(getLogMessages(ui().logger)).toStrictEqual([
      '[ blue(info) ] Saved report to report.json',
    ]);
  });

  it('should accept rawOutputFile', async () => {
    await expect(
      knipReporter({
        report: {
          files: true,
        },
        issues: {
          files: new Set(['main.js']),
        },
        options: JSON.stringify({
          rawOutputFile: 'raw-report.json',
        } satisfies CustomReporterOptions),
      } as ReporterOptions),
    ).resolves.toBeUndefined();

    expect(getLogMessages(ui().logger).at(0)).toBe(
      '[ blue(info) ] Saved raw report to raw-report.json',
    );
  });

  it('should produce valid audit outputsass', async () => {
    await expect(knipReporter(rawReport)).resolves.toBeUndefined();

    const auditOutputsContent = await fs.promises.readFile(
      join(MEMFS_VOLUME, KNIP_REPORT_NAME),
      { encoding: 'utf8' },
    );
    const auditOutputsJson = JSON.parse(auditOutputsContent.toString());
    expect(auditOutputsJson).toMatchSnapshot();
  });
});
