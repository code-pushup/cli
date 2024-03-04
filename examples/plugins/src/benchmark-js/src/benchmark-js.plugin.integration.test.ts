import { describe, expect } from 'vitest';
import { PluginConfig, pluginConfigSchema } from '@code-pushup/models';
import { create } from './benchmark-js.plugin';
import { BenchmarkResult } from './suite-helper';

vi.mock('./utils', async () => {
  const examplesPlugins: object = await vi.importActual('./utils');
  return {
    ...examplesPlugins,
    loadSuits: vi.fn().mockImplementation((suiteNames: string[]) =>
      suiteNames.map(
        (suiteName, index) =>
          ({
            suiteName,
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

describe('benchmark-js-create-export-config', () => {
  it('should execute', async () => {
    const pluginConfig = await create({
      targets: ['suite-1', 'suite-2'],
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        slug: 'benchmark-js',
        title: 'Benchmark JS',
        icon: 'flash',
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
