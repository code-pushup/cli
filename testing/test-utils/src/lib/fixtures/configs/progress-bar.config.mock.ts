/**
 * This config file is here to demonstrate the progress bar for plugins
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./testing/test-utils/src/lib/fixtures/configs/progress-bar.config.mock.ts
 */
import path from 'node:path';
import { fileURLToPath } from 'url';

// Small hack to control the number of plugins while debugging
const numPlugins = parseInt(
  process.argv
    .find(arg => arg.includes('numPlugins='))
    ?.split('=')
    .pop() || '6',
);

const outputDir = './tmp';
const pluginProcess = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  '..',
  '..',
  'utils',
  'progress-bar-process.mock.mjs',
);
const pluginSlug = (id: string): string => 'progress-mock-plugin-' + id;
const auditSlug = (pId: string, aId: string): string =>
  pluginSlug(pId) + '-a' + aId;
const pluginTitle = (end: string): string => 'Async Plugin ' + end;
const auditTitle = (end: string): string => 'Async Audit ' + end;
const asyncPlugin = (pId: string, duration = 1000) => {
  const aId = '0';
  const outputFile = path.join(outputDir, `${pluginSlug(pId)}-output.json`);
  return {
    slug: pluginSlug(pId),
    title: pluginTitle(pId),
    icon: 'javascript',
    audits: [{ slug: auditSlug(pId, aId), title: auditTitle(aId) }],
    runner: {
      command: 'node',
      args: [
        pluginProcess,
        `--verbose`,
        `--duration=${duration}`,
        `--steps=${1}`,
        `--throwError=${0}`,
        `--outputDir=${outputDir}`,
        `--pluginPostfix=${pId}`,
        `--auditPostfix=${aId}`,
      ],
      outputFile,
    },
  };
};

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputDir },
  plugins: new Array(numPlugins)
    .fill(0)
    .map((_, idx) => asyncPlugin(idx + '', 300)),
  categories: new Array(numPlugins).fill(0).map((_, idx) => ({
    slug: 'category-' + idx,
    title: 'Category ' + idx,
    refs: [
      {
        type: 'audit',
        slug: auditSlug(idx.toString(), '0'),
        plugin: pluginSlug(idx.toString()),
        weight: 1,
      },
    ],
  })),
};
