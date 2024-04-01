import { describe, expect } from 'vitest';
import { PluginConfig, pluginConfigSchema } from '@code-pushup/models';
import { JS_BENCHMARKING_PLUGIN_SLUG } from './constants';
import { jsBenchmarkingPlugin } from './js-benchmarking.plugin';
import { BenchmarkResult } from './runner/types';

vi.mock('./utils', async () => {
  const all: object = await vi.importActual('./utils');
  return {
    ...all,
    loadSuites: vi.fn().mockImplementation((suiteNames: string[]) =>
      suiteNames.map(
        (suiteName, index) =>
          ({
            suiteName: suiteName.replace('.ts', ''),
            name:
              index === 0
                ? 'current-implementation'
                : `implementation-${index}`,
            rme: index === 0 ? 1 : Math.random(),
            hz: index === 0 ? 1 : Math.random(),
            isFastest: index === 0,
            isTarget: index === 0,
            samples: suiteNames.length * 10,
          } satisfies BenchmarkResult),
      ),
    ),
  };
});

describe('jsBenchmarkingPlugin-config-creation', () => {
  it('should create valid config', async () => {
    const pluginConfig = await jsBenchmarkingPlugin({
      targets: ['dummy-suite.ts'],
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        slug: JS_BENCHMARKING_PLUGIN_SLUG,
        title: 'JS Benchmarking',
        icon: 'folder-benchmark',
        audits: [
          {
            slug: `${JS_BENCHMARKING_PLUGIN_SLUG}-dummy-suite`,
            title: 'dummy-suite',
          },
        ],
      } satisfies Omit<PluginConfig, 'runner'>),
    );
  });
});
