import { describe, expect } from 'vitest';
import { PluginConfig, pluginConfigSchema } from '@code-pushup/models';
import { jsBenchmarkingPlugin } from './benchmark-js.plugin';
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

describe('jsBenchmarkingPlugin-config', () => {
  it('should execute', async () => {
    const pluginConfig = await jsBenchmarkingPlugin({
      targets: ['suite-1.ts', 'suite-2.ts'],
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        slug: 'benchmark-js',
        title: 'Benchmark JS',
        icon: 'folder-benchmark',
        audits: [
          {
            slug: 'benchmark-js-suite-1',
            title: 'suite-1',
          },
          {
            slug: 'benchmark-js-suite-2',
            title: 'suite-2',
          },
        ],
      } satisfies Omit<PluginConfig, 'runner'>),
    );
  });
});
