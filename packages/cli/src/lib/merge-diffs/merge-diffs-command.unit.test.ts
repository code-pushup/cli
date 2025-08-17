import { bold } from 'ansis';
import { mergeDiffs } from '@code-pushup/core';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsMergeDiffsCommandObject } from './merge-diffs-command.js';

vi.mock('@code-pushup/core', async () => {
  const core: object = await vi.importActual('@code-pushup/core');
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  return {
    ...core,
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    mergeDiffs: vi.fn().mockResolvedValue('.code-pushup/report-diff.md'),
  };
});

describe('merge-diffs-command', () => {
  it('should parse input paths from command line and output path from persist config', async () => {
    await yargsCli(
      [
        'merge-diffs',
        '--files',
        'frontoffice/report-diff.json',
        'backoffice/report-diff.json',
        'api/report-diff.json',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsMergeDiffsCommandObject()],
      },
    ).parseAsync();

    expect(mergeDiffs).toHaveBeenCalledWith<Parameters<typeof mergeDiffs>>(
      [
        'frontoffice/report-diff.json',
        'backoffice/report-diff.json',
        'api/report-diff.json',
      ],
      {
        outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
        filename: DEFAULT_PERSIST_FILENAME,
        format: DEFAULT_PERSIST_FORMAT,
        skipReports: false,
      },
    );
  });

  it('should log output path to stdout', async () => {
    await yargsCli(
      [
        'merge-diffs',
        '--files=frontoffice/report-diff.json',
        '--files=backoffice/report-diff.json',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsMergeDiffsCommandObject()],
      },
    ).parseAsync();

    expect(ui()).toHaveLogged(
      'info',
      `Reports diff written to ${bold('.code-pushup/report-diff.md')}`,
    );
  });
});
