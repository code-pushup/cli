import ansis from 'ansis';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsPrintConfigCommandObject } from './print-config-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-fixtures') =
    await vi.importActual('@code-pushup/test-fixtures');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('print-config-command', () => {
  it('should write config to file if output option is given', async () => {
    const outputPath = path.join(MEMFS_VOLUME, 'config.json');
    await yargsCli(['print-config', `--output=${outputPath}`], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsPrintConfigCommandObject()],
    }).parseAsync();

    await expect(readFile(outputPath, 'utf8')).resolves.toContain(
      '"plugins": [',
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Config printed to file ${ansis.bold(outputPath)}`,
    );
  });

  it('should filter out meta arguments and kebab duplicates', async () => {
    const outputPath = path.join(MEMFS_VOLUME, 'config.json');
    await yargsCli(
      [
        'print-config',
        `--output=${outputPath}`,
        '--persist.outputDir=destinationDir',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsPrintConfigCommandObject()],
      },
    ).parseAsync();
    const output = await readFile(outputPath, 'utf8');

    expect(output).not.toContain('"$0":');
    expect(output).not.toContain('"_":');

    expect(output).toContain('"outputDir": "destinationDir"');
    expect(output).not.toContain('"output-dir":');
  });
});
