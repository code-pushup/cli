import { join } from 'node:path';
import { compareReportFiles } from '@code-pushup/core';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
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
    compareReportFiles: vi.fn(),
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
      join(DEFAULT_PERSIST_OUTPUT_DIR, `${DEFAULT_PERSIST_FILENAME}-diff.json`),
    );
  });
});
