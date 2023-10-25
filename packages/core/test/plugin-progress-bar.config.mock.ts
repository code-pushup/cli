import { PluginConfig } from '@code-pushup/models';

/**
 * This config file is here to demonstrate the progress bar for plugins
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/core/test/plugin-progress-bar.config.mock.ts
 */

const outputDir = 'tmp';
const pluginSlug = (id: string): string => 'async-plugin-' + id;
const auditSlug = (pId: string, aId: string): string =>
  pluginSlug(pId) + '-a' + aId;
const pluginTitle = (end: string): string => 'Async Plugin ' + end;
const auditTitle = (end: string): string => 'Async Audit ' + end;
const asyncPlugin = (pId: string, duration = 1000): PluginConfig => {
  const aId = '1';
  const outputFile = `${outputDir}/${pluginSlug(pId)}-output.json`;
  return {
    slug: pluginSlug(pId),
    title: pluginTitle(pId),
    icon: 'javascript',
    audits: [{ slug: auditSlug(pId, aId), title: auditTitle(aId) }],
    runner: {
      command: 'node',
      args: [
        '-e',
        `setTimeout(() => require('fs').writeFileSync('${outputFile}', '${JSON.stringify(
          [
            {
              slug: auditSlug(pId, aId),
              title: auditTitle(aId),
              value: 0,
              score: 0,
            },
          ],
        )}'), ${duration});`,
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
  plugins: new Array(10).fill(0).map((_, idx) => asyncPlugin(idx + '', 1000)),
  categories: [
    {
      slug: 'category-1',
      title: 'Category 1',
      refs: [],
    },
  ],
};
