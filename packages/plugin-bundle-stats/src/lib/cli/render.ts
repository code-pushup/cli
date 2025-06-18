import ansis from 'ansis';
import {
  processTree,
  renderBundleStatsTree,
  scrubPaths,
} from '../unified-tree.js';
import { U } from './unified-utils.js';

// Data preparation utility
export const prepareData = (file: string, dataMode: string) => {
  const stats = U.read(file);
  const bundler = U.bundlerType(file);
  const data = dataMode === 'original' ? stats : U.unify[bundler]?.(stats);
  return { data, bundler };
};

// Core rendering - accepts pre-processed data
export const draw = (
  data: any,
  bundler: string,
  file: string,
  dataMode: string,
  isTree: boolean,
  opts: any = {},
  mode = 'static',
) => {
  if (!data)
    return console.log(
      `${U.icon(bundler)} ${ansis.yellow(bundler)} - ${ansis.red('no unifier')}`,
    );

  const processedData =
    data?.type === 'basic' && !isTree ? processTree(data, opts) : data;
  const content =
    isTree && data?.type === 'basic'
      ? renderBundleStatsTree(data, opts)
      : scrubPaths(JSON.stringify(processedData, null, 2));

  let lines = content.split('\n');

  // Apply different truncation based on mode
  if (!isTree && opts.takeFirst) {
    const maxLines =
      mode === 'interactive'
        ? Math.min(Math.pow(opts.takeFirst, opts.takeFirstLevel ?? 2), 50) // Limit preview
        : Math.pow(opts.takeFirst, opts.takeFirstLevel ?? 2);
    if (lines.length > maxLines) {
      lines = lines
        .slice(0, maxLines)
        .concat(['...', `// Truncated after ${maxLines} lines`]);
    }
  }

  // Hard limit of 150 total lines
  if (lines.length > 150) {
    lines = lines
      .slice(0, 150)
      .concat([
        '...',
        `// Output truncated at 150 lines (was ${lines.length + 2} lines)`,
      ]);
  }

  const modeLabel = dataMode === 'unified' ? 'Unified' : 'Original';
  const title = `${U.icon(bundler)} ${ansis.yellow(bundler.toUpperCase())} - ${ansis.gray(file)} [${modeLabel}]`;
  console.log(ansis.bold.green(title), '\n', lines.join('\n'));
};

export const show = (file: string, opts: any, idx = '') => {
  if (!file) return console.log(ansis.red('❌ File not found'));
  try {
    const { data, bundler } = prepareData(file, opts.data);
    idx && console.log(ansis.gray('─'.repeat(60)));
    draw(data, bundler, file, opts.data, opts.view === 'tree', opts);
  } catch (err: any) {
    const bundler = U.bundlerType(file);
    console.log(
      `${idx}${U.icon(bundler)} ${ansis.yellow(bundler)} - ${ansis.red(`error: ${err.message}`)}`,
    );
  }
};

export const showAll = (fileList: string[], opts: any) => {
  console.log(
    ansis.bold.cyan('🔧 All Bundle Stats'),
    '\n',
    ansis.gray('─'.repeat(60)),
  );
  fileList.length === 0
    ? console.log(ansis.red('❌ No snapshot files found.'))
    : fileList.forEach((f, i) =>
        show(f, opts, `\n${ansis.bold.white(`${i + 1}.`)} `),
      );
};
