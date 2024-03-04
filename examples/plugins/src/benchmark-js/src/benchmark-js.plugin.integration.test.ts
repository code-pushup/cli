import { describe, expect } from 'vitest';
import { PluginConfig, pluginConfigSchema } from '@code-pushup/models';
import { create } from './benchmark-js.plugin';
import { BenchmarkResult } from './suit-helper';

vi.mock('./utils', async () => {
  const examplesPlugins: object = await vi.importActual('./utils');
  return {
    ...examplesPlugins,
    loadSuits: vi.fn().mockImplementation((suitNames: string[]) =>
      suitNames.map(
        (suitName, index) =>
          ({
            suitName: suitName,
            name:
              index === 0
                ? 'current-implementation'
                : `implementation-${index}`,
            rme: index === 0 ? 1 : Math.random(),
            hz: index === 0 ? 1 : Math.random(),
            isFastest: index === 0,
            isTarget: index === 0,
            samples: suitNames.length * 10,
          } satisfies BenchmarkResult),
      ),
    ),
  };
});

describe('benchmark-js-create-export-config', () => {
  it('should execute', async () => {
    const pluginConfig = await create({
      targets: ['suit-1', 'suit-2'],
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        slug: 'benchmark-js',
        title: 'Benchmark JS',
        icon: 'flash',
        audits: [
          {
            slug: 'suit-1-benchmark-js',
            title: 'suit-1 Benchmark JS',
          },
          {
            slug: 'suit-2-benchmark-js',
            title: 'suit-2 Benchmark JS',
          },
        ],
      } satisfies Omit<PluginConfig, 'runner'>),
    );
  });
});
