import ansis from 'ansis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatBytes } from '@code-pushup/utils';
import { unifyEsbuild, unifyRsbuild, unifyWebpack } from '../unify.js';

// Unified utilities and constants
export const U = {
  DIR: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '__snapshots__',
  ),
  MODES: { view: ['json', 'tree'], data: ['unified', 'original'] },
  icons: {
    webpack: '📦',
    vite: '⚡',
    rollup: '🎯',
    esbuild: '🚀',
    bun: '🧄',
    rolldown: '🎪',
    rsbuild: '🏗️',
  },
  unify: {
    esbuild: unifyEsbuild,
    webpack: unifyWebpack,
    rsbuild: unifyRsbuild,
  },
  files: () =>
    fs
      .readdirSync(U.DIR)
      .filter(f => f.endsWith('.json'))
      .sort(),
  read: f => JSON.parse(fs.readFileSync(path.join(U.DIR, f), 'utf-8')),
  getType: f => f.replace(/\.stats\.json$/, ''),
  bundlerType: f =>
    ['esbuild', 'webpack', 'rsbuild', 'vite', 'rollup', 'bun'].find(t =>
      f.toLowerCase().includes(t),
    ) || U.getType(f),
  icon: t => U.icons[t] || '📄',
  flip: (v, [a, b]) => (v === a ? b : a),
  clear: () => (process.stdout.write('\x1B[2J\x1B[3J\x1B[H'), console.clear()),
};

// Filter composition utility
export const composeFilters =
  (...filters) =>
  item =>
    filters.filter(Boolean).every(f => f(item));

// Label rendering utility - shows numbers and basenames
export const label = (file, index, selected) => {
  const basename = U.getType(file);
  return selected
    ? ansis.bold.green(`[${index + 1}. ${basename}]`)
    : ansis.gray(`[${index + 1}. ${basename}]`);
};

export const labelList = (files, sel) =>
  files.map((f, i) => label(f, i, i === sel)).join(' ');

// Header formatting utility
export const formatHeader = opts => {
  const viewOpts = U.MODES.view
    .map(v => (opts.view === v ? ansis.bold.green(v) : ansis.gray(v)))
    .join('/');
  const dataOpts = U.MODES.data
    .map(d => (opts.data === d ? ansis.bold.green(d) : ansis.gray(d)))
    .join('/');
  return { viewOpts, dataOpts };
};

// Fuzzy file matching utility
export const findFile = (fileList, pattern) => {
  // Exact match first
  let target = fileList.find(f => U.getType(f) === pattern);
  if (target) return target;

  // Fuzzy/substring match
  target = fileList.find(f => U.getType(f).includes(pattern));
  if (target) return target;

  // Case-insensitive match
  return fileList.find(f =>
    U.getType(f).toLowerCase().includes(pattern.toLowerCase()),
  );
};

// Filter status formatting
export const formatFilterStatus = (opts, pathPattern, sizeThreshold) => {
  const filters = [];
  if (!opts.sort) filters.push(ansis.red('unsorted'));
  if (pathPattern) filters.push(ansis.blue(`path:${pathPattern}`));
  if (sizeThreshold)
    filters.push(ansis.green(`size:≥${formatBytes(sizeThreshold)}`));

  const settings = `${ansis.yellow(opts.takeFirst)}items/${ansis.yellow(opts.takeFirstLevel)}lvls`;
  return filters.length > 0 ? `${settings} | ${filters.join(' ')}` : settings;
};
