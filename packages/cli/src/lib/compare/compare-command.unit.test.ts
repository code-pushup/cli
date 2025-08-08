import { bold } from 'ansis';
import { compareReportFiles } from '@code-pushup/core';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsCompareCommandObject } from './compare-command.js';

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
      {
        persist: {
          outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
          filename: DEFAULT_PERSIST_FILENAME,
          format: DEFAULT_PERSIST_FORMAT,
          report: true,
        },
        upload: {
          apiKey: 'dummy-api-key',
          organization: 'code-pushup',
          project: 'cli',
          server: 'https://example.com/api',
        },
      },
      {
        before: 'source-report.json',
        after: 'target-report.json',
        label: undefined,
      },
    );
  });

  it('should forward label from command line', async () => {
    await yargsCli(
      [
        'compare',
        '--before=source-report.json',
        '--after=target-report.json',
        '--label=core',
      ],
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsCompareCommandObject()] },
    ).parseAsync();

    expect(compareReportFiles).toHaveBeenCalledWith<
      Parameters<typeof compareReportFiles>
    >(expect.any(Object), {
      before: 'source-report.json',
      after: 'target-report.json',
      label: 'core',
    });
  });

  it('should log output paths to stdout', async () => {
    await yargsCli(['compare'], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsCompareCommandObject()],
    }).parseAsync();

    expect(ui()).toHaveLogged(
      'info',
      `Reports diff written to ${bold(
        '.code-pushup/report-diff.json',
      )} and ${bold('.code-pushup/report-diff.md')}`,
    );
  });
});
