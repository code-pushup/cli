import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { PluginConfig, pluginConfigSchema } from '@code-pushup/models';
import { JS_BENCHMARKING_PLUGIN_SLUG } from './constants';
import { jsBenchmarkingPlugin } from './js-benchmarking.plugin';

const targetPath = join(
  fileURLToPath(dirname(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'perf',
  'dummy-suite',
  'index.ts',
);

describe('jsBenchmarkingPlugin-execution', () => {
  // @TODO move to e2e tests when plugin is released officially
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute', async () => {
    const pluginConfig = await jsBenchmarkingPlugin({
      targets: [targetPath],
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    await expect(executePlugin(pluginConfig)).resolves.toEqual(
      expect.objectContaining({
        slug: JS_BENCHMARKING_PLUGIN_SLUG,
        title: 'JS Benchmarking',
        icon: 'folder-benchmark',
        audits: [
          {
            slug: `${JS_BENCHMARKING_PLUGIN_SLUG}-suite-1`,
            title: 'dummy-suite',
          },
        ],
      } satisfies Omit<PluginConfig, 'runner'>),
    );
  });
});
