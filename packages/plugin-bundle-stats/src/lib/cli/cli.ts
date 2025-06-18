#!/usr/bin/env npx tsx
import ansis from 'ansis';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { select } from './interactive.js';
import { show, showAll } from './render.js';
import { U, composeFilters, findFile } from './unified-utils.js';

// Main CLI function
export const main = async () => {
  try {
    const fileList = U.files();
    if (fileList.length === 0)
      return console.log(ansis.red('❌ No snapshot files found.'));

    const argv = await yargs(hideBin(process.argv))
      .scriptName('tsx print-unified.js')
      .version('1.0.0')
      .option('view', {
        alias: 'v',
        choices: U.MODES.view,
        default: 'json',
        description: 'Output format',
      })
      .option('data', {
        alias: 'd',
        choices: U.MODES.data,
        default: 'unified',
        description: 'Data source',
      })
      .option('file', {
        alias: 'f',
        type: 'string',
        description: 'File to analyze (supports fuzzy matching)',
      })
      .option('list', { type: 'boolean', description: 'List available files' })
      .option('no-interactive', {
        type: 'boolean',
        description: 'Non-interactive mode',
      })
      .option('take-first', {
        alias: 't',
        type: 'number',
        default: 5,
        description: 'Items per level',
      })
      .option('take-first-level', {
        alias: 'l',
        type: 'number',
        default: 2,
        description: 'Levels to limit',
      })
      .option('sort', {
        alias: 's',
        type: 'boolean',
        default: true,
        description: 'Sort by size',
      })
      .option('filter-by-path', {
        alias: 'p',
        type: 'string',
        description: 'Path filter pattern',
      })
      .option('filter-by-size', {
        alias: 'z',
        type: 'number',
        description: 'Min size in bytes',
      })
      .example(
        '$0 -f esbuild -v tree -t 3',
        'Show esbuild tree with 3 items per level',
      )
      .example(
        '$0 -p "!node_modules" -z 1000',
        'Filter out node_modules, min 1KB',
      )
      .help('h')
      .alias('help', 'h').argv;

    // List files if requested
    if (argv.list) {
      console.log(ansis.bold.cyan('📁 Available Files:'));
      fileList.forEach((f, i) => {
        const bundler = U.bundlerType(f);
        console.log(
          `  ${ansis.yellow(i + 1)}. ${ansis.gray(bundler)} - ${ansis.gray(f)}`,
        );
      });
      return;
    }

    // Streamlined CLI arg processing with filter composition
    const pathFilter = argv.filterByPath
      ? (path: string) =>
          argv.filterByPath!.startsWith('!')
            ? !path.includes(argv.filterByPath!.slice(1))
            : path.includes(argv.filterByPath!)
      : null;
    const sizeFilter = argv.filterBySize
      ? (bytes: number) => bytes >= argv.filterBySize!
      : null;

    const {
      takeFirst = 5,
      takeFirstLevel = 2,
      sort = true,
      ...restArgv
    } = argv;
    const opts = {
      ...restArgv,
      takeFirst,
      takeFirstLevel,
      sort,
      filterByPath: pathFilter,
      filterBySize: sizeFilter,
      filter: composeFilters(pathFilter, sizeFilter),
    };

    if (argv.noInteractive) {
      // Non-interactive mode: show results and exit
      if (argv.file === 'all') {
        showAll(fileList, opts);
        return process.exit(0);
      }
      if (argv.file) {
        const target = findFile(fileList, argv.file);
        if (!target) {
          console.log(
            ansis.red(`❌ File not found: ${argv.file}`),
            '\n',
            ansis.gray('Available:'),
            fileList.map(U.getType).join(', '),
          );
          return process.exit(1);
        }
        show(target, opts);
        return process.exit(0);
      }
      // Default to show all if no specific file
      showAll(fileList, opts);
      return process.exit(0);
    }

    // Interactive mode (default behavior)
    // If a specific file is requested, show it first, then enter interactive mode
    if (argv.file === 'all') {
      showAll(fileList, opts);
      console.log(ansis.gray('\nPress any key to enter interactive mode...'));
    } else if (argv.file) {
      const target = findFile(fileList, argv.file);
      if (target) {
        show(target, opts);
        console.log(ansis.gray('\nPress any key to enter interactive mode...'));
      } else {
        console.log(
          ansis.red(`❌ File not found: ${argv.file}`),
          '\n',
          ansis.gray('Available:'),
          fileList.map(U.getType).join(', '),
        );
        console.log(ansis.gray('\nEntering interactive mode...'));
      }
    }

    const selected = await select(fileList, opts);
    U.clear();
    console.log(ansis.bold.green(`✅ Selected: ${selected}`));
    console.log(ansis.yellow('Goodbye! 👋'));
  } catch (err: any) {
    U.clear();
    console.error(ansis.red(`❌ Error: ${err.message}`));
    process.exit(1);
  }
};

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(ansis.red(`Fatal error: ${err.message}`));
    process.exit(1);
  });
}
