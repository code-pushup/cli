import ansis from 'ansis';
import inquirer from 'inquirer';
import { formatBytes } from '@code-pushup/utils';
import { draw, prepareData, showAll } from './render.js';
import {
  U,
  composeFilters,
  formatFilterStatus,
  formatHeader,
  labelList,
} from './unified-utils.js';

// Prompt functions for custom filters
async function promptForPathFilter(): Promise<string | null> {
  const { keyword } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyword',
      message: '🔍 Enter a path filter (e.g., ".ts" or "!node_modules")',
      validate: input => input.length > 0 || 'Please enter a non-empty string',
    },
  ]);
  return keyword;
}

async function promptForSizeFilter(): Promise<number | null> {
  const { size } = await inquirer.prompt([
    {
      type: 'input',
      name: 'size',
      message: '📏 Enter minimum size in bytes (e.g., 1000 for 1KB)',
      validate: input => {
        const num = parseInt(input);
        return (!isNaN(num) && num >= 0) || 'Please enter a valid number >= 0';
      },
      filter: input => parseInt(input),
    },
  ]);
  return size;
}

// Interactive mode with keyboard handling
export const select = (fileList: string[], opts: any): Promise<string> => {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) {
      console.log(ansis.red('❌ Interactive mode requires a TTY'));
      process.exit(1);
    }

    let sel = 0,
      showAllFiles = false,
      pathPattern: string | null = null,
      sizeThreshold: number | null = null;
    process.stdin.setRawMode(true).resume().setEncoding('utf8');

    const exit = () => (
      cleanup(), console.log(ansis.yellow('\nGoodbye! 👋')), process.exit(0)
    );
    const cleanup = () => (
      process.stdin.setRawMode(false), process.stdin.pause()
    );

    // TTY control functions
    const pauseTTY = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const resumeTTY = () => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
    };

    const selectByNumber = (num: number) => {
      if (num <= fileList.length) sel = num - 1;
    };

    const togglePathFilter = () => {
      if (opts.filterByPath) {
        opts.filterByPath = null;
        pathPattern = null;
      } else {
        const patterns = ['!node_modules', '.js', '.ts', '.css'];
        pathPattern = pathPattern
          ? patterns[(patterns.indexOf(pathPattern) + 1) % patterns.length]
          : patterns[0];
        opts.filterByPath = pathPattern.startsWith('!')
          ? (path: string) => !path.includes(pathPattern!.slice(1))
          : (path: string) => path.includes(pathPattern!);
      }
    };

    const customPathFilter = async () => {
      pauseTTY();
      const keyword = await promptForPathFilter();
      resumeTTY();

      if (keyword) {
        pathPattern = keyword;
        opts.filterByPath = keyword.startsWith('!')
          ? (path: string) => !path.includes(keyword.slice(1))
          : (path: string) => path.includes(keyword);
        opts.filter = composeFilters(opts.filterByPath, opts.filterBySize);
        render();
      }
    };

    const toggleSizeFilter = () => {
      if (opts.filterBySize) {
        opts.filterBySize = null;
        sizeThreshold = null;
      } else {
        const sizes = [1000, 10000, 100000, 1000000]; // 1KB, 10KB, 100KB, 1MB
        sizeThreshold = sizeThreshold
          ? sizes[(sizes.indexOf(sizeThreshold) + 1) % sizes.length]
          : sizes[0];
        opts.filterBySize = (bytes: number) => bytes >= sizeThreshold!;
      }
    };

    const customSizeFilter = async () => {
      pauseTTY();
      const size = await promptForSizeFilter();
      resumeTTY();

      if (size !== null) {
        sizeThreshold = size;
        opts.filterBySize = (bytes: number) => bytes >= size;
        opts.filter = composeFilters(opts.filterByPath, opts.filterBySize);
        render();
      }
    };

    const resetFilters = () => {
      opts.sort = true;
      opts.takeFirst = 5;
      opts.takeFirstLevel = 2;
      opts.filterByPath = null;
      opts.filterBySize = null;
      pathPattern = null;
      sizeThreshold = null;
    };

    const showHelp = () => {
      console.log('\n' + ansis.bold.cyan('🔧 Interactive Help:'));
      console.log('');
      console.log(ansis.yellow('Navigation & Selection:'));
      console.log('  ' + ansis.yellow('[1-9]') + '   Select file by number');
      console.log('  ' + ansis.yellow('[Tab]') + '   Next file');
      console.log('  ' + ansis.yellow('[↵]') + '     Confirm selection');
      console.log('  ' + ansis.yellow('[a]') + '     Show all files');
      console.log('  ' + ansis.yellow('[q/Esc]') + ' Quit');
      console.log('');
      console.log(ansis.yellow('View & Data Modes:'));
      console.log(
        '  ' + ansis.yellow('[←/→]') + '   Switch view mode (json/tree)',
      );
      console.log(
        '  ' + ansis.yellow('[↑/↓]') + '   Switch data mode (unified/original)',
      );
      console.log(
        '  ' +
          ansis.yellow('[o]') +
          '     Toggle data mode (unified ↔ original)',
      );
      console.log('');
      console.log(ansis.yellow('Filters & Display:'));
      console.log('  ' + ansis.yellow('[s]') + '     Toggle sort by size');
      console.log('  ' + ansis.yellow('[+/-]') + '   Adjust items per level');
      console.log('  ' + ansis.yellow('[=/_]') + '   Adjust depth levels');
      console.log(
        '  ' +
          ansis.yellow('[p]') +
          '     Cycle path filter (!node_modules, .js, .ts, .css)',
      );
      console.log(
        '  ' + ansis.yellow('[f]') + '     Custom path filter (prompt)',
      );
      console.log(
        '  ' +
          ansis.yellow('[z]') +
          '     Cycle size filter (1KB, 10KB, 100KB, 1MB)',
      );
      console.log(
        '  ' + ansis.yellow('[Z]') + '     Custom size filter (prompt)',
      );
      console.log(
        '  ' + ansis.yellow('[r]') + '     Reset all filters to defaults',
      );
      console.log('');
      console.log(ansis.gray('Press any key to return...'));
    };

    // Simplified keyboard handlers using Map
    const keyHandlers = new Map([
      [
        '\t',
        () =>
          showAllFiles
            ? (showAllFiles = false)
            : (sel = (sel + 1) % fileList.length),
      ],
      [
        '\u001b[Z',
        () =>
          showAllFiles
            ? (showAllFiles = false)
            : (sel = (sel - 1 + fileList.length) % fileList.length),
      ],
      ['\u001b[A', () => (opts.data = U.flip(opts.data, U.MODES.data))],
      ['\u001b[B', () => (opts.data = U.flip(opts.data, U.MODES.data))],
      ['\u001b[C', () => (opts.view = U.flip(opts.view, U.MODES.view))],
      ['\u001b[D', () => (opts.view = U.flip(opts.view, U.MODES.view))],
      ['a', () => (showAllFiles = !showAllFiles)],
      ['A', () => (showAllFiles = !showAllFiles)],
      ['o', () => (opts.data = U.flip(opts.data, U.MODES.data))],
      ['O', () => (opts.data = U.flip(opts.data, U.MODES.data))],
      ['s', () => (opts.sort = !opts.sort)],
      ['+', () => (opts.takeFirst = Math.min(opts.takeFirst + 1, 20))],
      ['-', () => (opts.takeFirst = Math.max(opts.takeFirst - 1, 1))],
      [
        '=',
        () => (opts.takeFirstLevel = Math.min(opts.takeFirstLevel + 1, 10)),
      ],
      ['_', () => (opts.takeFirstLevel = Math.max(opts.takeFirstLevel - 1, 1))],
      ['p', () => togglePathFilter()],
      ['f', () => customPathFilter()],
      ['z', () => toggleSizeFilter()],
      ['Z', () => customSizeFilter()],
      ['r', () => resetFilters()],
      ['1', () => selectByNumber(1)],
      ['2', () => selectByNumber(2)],
      ['3', () => selectByNumber(3)],
      ['4', () => selectByNumber(4)],
      ['5', () => selectByNumber(5)],
      ['6', () => selectByNumber(6)],
      ['7', () => selectByNumber(7)],
      ['8', () => selectByNumber(8)],
      ['9', () => selectByNumber(9)],
      [
        '\r',
        () =>
          showAllFiles
            ? (showAllFiles = false)
            : (cleanup(), resolve(fileList[sel])),
      ],
      [
        '\n',
        () =>
          showAllFiles
            ? (showAllFiles = false)
            : (cleanup(), resolve(fileList[sel])),
      ],
      ['\u001b', exit],
      ['q', exit],
      ['\u0003', exit],
      ['?', () => showHelp()],
    ]);

    const handleKey = (key: string) => {
      if (
        showAllFiles &&
        ![
          'a',
          'A',
          'o',
          'O',
          '\u001b',
          'q',
          '\u0003',
          '\u001b[A',
          '\u001b[B',
          '\u001b[C',
          '\u001b[D',
          '?',
        ].includes(key)
      ) {
        showAllFiles = false;
      } else if (keyHandlers.has(key)) {
        const handler = keyHandlers.get(key)!;
        if (typeof handler === 'function') {
          const result = handler();
          // Handle async functions
          if (result instanceof Promise) {
            result.catch(console.error);
          }
        }
        // Recompose filters after any filter-related changes
        if (['p', 'z', 'r'].includes(key)) {
          opts.filter = composeFilters(opts.filterByPath, opts.filterBySize);
        }
      }
      render();
    };

    const renderInteractiveView = (
      fileList: string[],
      sel: number,
      opts: any,
      showAllFiles: boolean,
    ) => {
      U.clear();
      if (showAllFiles) {
        showAll(fileList, opts);
        return console.log(
          `\n${ansis.gray('Press any key to return... (? for help)')}`,
        );
      }

      if (fileList.length === 0) return;

      const tabs = labelList(fileList, sel);

      // Interactive menu header with current states
      console.log(ansis.bold.cyan('🔧 Bundle Stats'));
      console.log(tabs);
      console.log('');

      // Menu layout with current states
      const viewMode =
        opts.view === 'tree'
          ? ansis.bold.green('tree')
          : ansis.bold.green('json');
      const dataMode =
        opts.data === 'unified'
          ? ansis.bold.green('unified')
          : ansis.bold.green('original');
      const sortStatus = opts.sort ? ansis.green('on') : ansis.red('off');
      const pathFilter = pathPattern
        ? ansis.blue(`"${pathPattern}"`)
        : ansis.gray('none');
      const sizeFilter = sizeThreshold
        ? ansis.blue(`>=${formatBytes(sizeThreshold)}`)
        : ansis.gray('none');

      console.log(
        ansis.yellow('[←/→]') +
          ' View Mode: ' +
          viewMode +
          '     | ' +
          ansis.yellow('[↑/↓]') +
          ' Data Mode: ' +
          dataMode,
      );
      console.log(
        ansis.yellow('[1–9]') +
          ' Select File         | ' +
          ansis.yellow('[↵]') +
          ' Confirm        | ' +
          ansis.yellow('[a]') +
          ' Show All       | ' +
          ansis.yellow('[q]') +
          ' Quit',
      );
      console.log(
        ansis.yellow('[p]') +
          ' path=' +
          pathFilter +
          '            | ' +
          ansis.yellow('[z]') +
          ' size=' +
          sizeFilter +
          '     | ' +
          ansis.yellow('[s]') +
          ' sort=' +
          sortStatus +
          '        | ' +
          ansis.yellow('[+/-]') +
          ' items=' +
          ansis.cyan(opts.takeFirst),
      );
      console.log(
        ansis.yellow('[=/_]') +
          ' levels=' +
          ansis.cyan(opts.takeFirstLevel) +
          '            | ' +
          ansis.yellow('[f]') +
          ' filter         | ' +
          ansis.yellow('[r]') +
          ' Reset          | ' +
          ansis.yellow('[?]') +
          ' Help',
      );
      console.log(ansis.gray('─'.repeat(process.stdout.columns || 100)));

      try {
        const { data, bundler } = prepareData(fileList[sel], opts.data);
        draw(
          data,
          bundler,
          fileList[sel],
          opts.data,
          opts.view === 'tree',
          opts,
          'interactive',
        );
      } catch (err: any) {
        console.log(ansis.red(`❌ Failed to load: ${err.message}`));
      }
    };

    const render = () =>
      renderInteractiveView(fileList, sel, opts, showAllFiles);

    render();
    process.stdin.on('data', handleKey);
  });
};
