import chalk from 'chalk';
import { compareReportFiles } from '@code-pushup/core';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsCompareCommandObject } from './compare-command';

vi.mock('@code-pushup/core', async () => {
  const core: object = await vi.importActual('@code-pushup/core');
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  return {
    ...core,
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    compareReportFiles: vi
      .fn()
      .mockResolvedValue([
        '.code-pushup/report-diff.json',
        '.code-pushup/report-diff.md',
      ]),
  };
});

describe('compare-command', () => {
  it('should parse input paths from command line and output path from persist config', async () => {
    await yargsCli(
      ['compare', '--before=source-report.json', '--after=target-report.json'],
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsCompareCommandObject()] },
    ).parseAsync();

    expect(compareReportFiles).toHaveBeenCalledWith<
      Parameters<typeof compareReportFiles>
    >(
      { before: 'source-report.json', after: 'target-report.json' },
      {
        outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
        filename: DEFAULT_PERSIST_FILENAME,
        format: DEFAULT_PERSIST_FORMAT,
      },
    );
  });

  it('should log output paths to stdout', async () => {
    await yargsCli(
      ['compare', '--before=source-report.json', '--after=target-report.json'],
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsCompareCommandObject()] },
    ).parseAsync();

    expect(getLogMessages(ui().logger).at(-1)).toContain(
      `Reports diff written to ${chalk.bold(
        '.code-pushup/report-diff.json',
      )} and ${chalk.bold('.code-pushup/report-diff.md')}`,
    );
  });
});
