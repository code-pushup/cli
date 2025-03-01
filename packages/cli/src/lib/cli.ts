import { commands } from './commands.js';
import { CLI_NAME, CLI_SCRIPT_NAME } from './constants.js';
import { middlewares } from './middlewares.js';
import { groups, options } from './options.js';
import { yargsCli } from './yargs-cli.js';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: CLI_NAME,
    scriptName: CLI_SCRIPT_NAME,
    options,
    groups,
    examples: [
      [
        'code-pushup',
        'Run collect followed by upload based on configuration from code-pushup.config.* file.',
      ],
      [
        'code-pushup collect --tsconfig=tsconfig.base.json',
        'Run collect using custom tsconfig to parse code-pushup.config.ts file.',
      ],
      [
        'code-pushup collect --onlyPlugins=coverage',
        'Run collect with only coverage plugin, other plugins from config file will be skipped.',
      ],
      [
        'code-pushup collect --skipPlugins=coverage',
        'Run collect skipping the coverage plugin, other plugins from config file will be included.',
      ],
      [
        'code-pushup upload --persist.outputDir=dist --upload.apiKey=$CP_API_KEY',
        'Upload dist/report.json to portal using API key from environment variable',
      ],
      [
        'code-pushup print-config --config code-pushup.config.test.js',
        'Print resolved config object parsed from custom config location',
      ],
    ],
    middlewares,
    commands,
  });
