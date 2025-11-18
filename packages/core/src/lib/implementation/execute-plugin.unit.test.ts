import ansis from 'ansis';
import { vol } from 'memfs';
import { type MockInstance, describe, expect, it, vi } from 'vitest';
import {
  type AuditOutputs,
  DEFAULT_PERSIST_CONFIG,
  type PluginConfig,
} from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_PLUGIN_CONFIG_MOCK,
} from '@code-pushup/test-utils';
import { executePlugin, executePlugins } from './execute-plugin.js';
import * as runnerModule from './runner.js';

describe('executePlugin', () => {
  let readRunnerResultsSpy: MockInstance<
    Parameters<(typeof runnerModule)['readRunnerResults']>,
    ReturnType<(typeof runnerModule)['readRunnerResults']>
  >;
  let executePluginRunnerSpy: MockInstance<
    Parameters<(typeof runnerModule)['executePluginRunner']>,
    ReturnType<(typeof runnerModule)['executePluginRunner']>
  >;

  beforeAll(() => {
    readRunnerResultsSpy = vi.spyOn(runnerModule, 'readRunnerResults');
    executePluginRunnerSpy = vi.spyOn(runnerModule, 'executePluginRunner');
  });

  afterEach(() => {
    readRunnerResultsSpy.mockRestore();
    executePluginRunnerSpy.mockRestore();
  });

  it('should execute a valid plugin config and pass runner params', async () => {
    const executePluginRunnerSpy = vi.spyOn(
      runnerModule,
      'executePluginRunner',
    );

    await expect(
      executePlugin(MINIMAL_PLUGIN_CONFIG_MOCK, {
        persist: {},
        cache: { read: false, write: false },
      }),
    ).resolves.toStrictEqual({
      slug: 'node',
      title: 'Node',
      icon: 'javascript',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.arrayContaining([
        expect.objectContaining({
          ...MINIMAL_PLUGIN_CONFIG_MOCK.audits.at(0),
          title: 'Node version',
          description: 'Returns node version',
          docsUrl: 'https://nodejs.org/',
        }),
      ]),
    });

    expect(executePluginRunnerSpy).toHaveBeenCalledWith(
      MINIMAL_PLUGIN_CONFIG_MOCK,
      { persist: DEFAULT_PERSIST_CONFIG },
    );
  });

  it('should try to read cache if cache.read is true', async () => {
    const readRunnerResultsSpy = vi.spyOn(runnerModule, 'readRunnerResults');

    const validRunnerResult = {
      duration: 0, // readRunnerResults now automatically sets this to 0 for cache hits
      date: new Date().toISOString(), // readRunnerResults sets this to current time
      audits: [
        {
          slug: 'node-version', // Must match the plugin config audit slug for enrichment
          score: 0.3,
          value: 16,
        },
      ],
    };
    readRunnerResultsSpy.mockResolvedValue(validRunnerResult);

    await expect(
      executePlugin(MINIMAL_PLUGIN_CONFIG_MOCK, {
        persist: { outputDir: 'dummy-path-result-is-mocked' },
        cache: { read: true, write: false },
      }),
    ).resolves.toStrictEqual({
      slug: 'node',
      title: 'Node',
      icon: 'javascript',
      duration: 0,
      date: expect.any(String),
      audits: expect.arrayContaining([
        expect.objectContaining({
          ...validRunnerResult.audits.at(0),
          title: 'Node version',
          description: 'Returns node version',
          docsUrl: 'https://nodejs.org/',
        }),
      ]),
    });
  });

  it('should try to execute runner if cache.read is true and file not present', async () => {
    const readRunnerResultsSpy = vi.spyOn(runnerModule, 'readRunnerResults');
    const executePluginRunnerSpy = vi.spyOn(
      runnerModule,
      'executePluginRunner',
    );

    readRunnerResultsSpy.mockResolvedValue(null);
    const runnerResult = {
      duration: 1000,
      date: '2021-01-01',
      audits: [
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ],
    };
    executePluginRunnerSpy.mockResolvedValue(runnerResult);

    await expect(
      executePlugin(MINIMAL_PLUGIN_CONFIG_MOCK, {
        persist: { outputDir: MEMFS_VOLUME },
        cache: { read: true, write: false },
      }),
    ).resolves.toStrictEqual({
      slug: 'node',
      title: 'Node',
      icon: 'javascript',
      ...runnerResult,
      audits: [
        {
          ...runnerResult.audits.at(0),
          title: 'Node version',
          description: 'Returns node version',
          docsUrl: 'https://nodejs.org/',
        },
      ],
    });

    expect(executePluginRunnerSpy).toHaveBeenCalledWith(
      MINIMAL_PLUGIN_CONFIG_MOCK,
      { persist: { ...DEFAULT_PERSIST_CONFIG, outputDir: MEMFS_VOLUME } },
    );
  });

  it('should apply a single score target to all audits', async () => {
    const pluginConfig: PluginConfig = {
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      scoreTargets: 0.8,
      audits: [
        {
          slug: 'speed-index',
          title: 'Speed Index',
        },
        {
          slug: 'total-blocking-time',
          title: 'Total Blocking Time',
        },
      ],
      runner: () => [
        { slug: 'speed-index', score: 0.9, value: 1300 },
        { slug: 'total-blocking-time', score: 0.3, value: 600 },
      ],
    };

    const result = await executePlugin(pluginConfig, {
      persist: { outputDir: '' },
      cache: { read: false, write: false },
    });

    expect(result.audits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'speed-index',
          score: 1,
          scoreTarget: 0.8,
        }),
        expect.objectContaining({
          slug: 'total-blocking-time',
          score: 0.3,
          scoreTarget: 0.8,
        }),
      ]),
    );
  });

  it('should apply per-audit score targets', async () => {
    const pluginConfig: PluginConfig = {
      ...MINIMAL_PLUGIN_CONFIG_MOCK, // returns node-version audit with score 0.3
      scoreTargets: {
        'node-version': 0.2,
      },
    };

    const result = await executePlugin(pluginConfig, {
      persist: { outputDir: '' },
      cache: { read: false, write: false },
    });

    expect(result.audits[0]).toMatchObject({
      slug: 'node-version',
      score: 1,
      scoreTarget: 0.2,
    });
  });
});

describe('executePlugins', () => {
  it('should execute valid plugins', async () => {
    const pluginResult = await executePlugins({
      plugins: [
        MINIMAL_PLUGIN_CONFIG_MOCK,
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          icon: 'nodejs',
        },
      ],
      persist: { outputDir: '.code-pushup' },
      cache: { read: false, write: false },
    });

    expect(pluginResult[0]?.icon).toBe('javascript');
    expect(pluginResult[1]?.icon).toBe('nodejs');
    expect(pluginResult[0]?.audits[0]?.slug).toBe('node-version');
  });

  it('should throw for invalid audit output', async () => {
    const slug = 'simulate-invalid-audit-slug';
    const title = 'Simulate an invalid audit slug in outputs';
    await expect(() =>
      executePlugins({
        plugins: [
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug,
            title,
            runner: () => [
              {
                slug: 'invalid-audit-slug-',
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
        ] satisfies PluginConfig[],
        persist: { outputDir: '.code-pushup' },
        cache: { read: false, write: false },
      }),
    ).rejects.toThrow(
      `Executing 1 plugin failed.\n\n- Plugin ${ansis.bold(
        title,
      )} (${ansis.bold(slug)}) produced the following error:\n  - Audit output is invalid`,
    );
  });

  it('should throw for one failing plugin', async () => {
    const missingAuditSlug = 'missing-audit-slug';
    await expect(() =>
      executePlugins({
        plugins: [
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug: 'plg1',
            title: 'plg1',
            runner: () => [
              {
                slug: `${missingAuditSlug}-a`,
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
        ] satisfies PluginConfig[],
        persist: { outputDir: '.code-pushup' },
        cache: { read: false, write: false },
      }),
    ).rejects.toThrow('Executing 1 plugin failed.\n\n');
  });

  it('should throw for multiple failing plugins', async () => {
    const missingAuditSlug = 'missing-audit-slug';
    await expect(() =>
      executePlugins({
        plugins: [
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug: 'plg1',
            title: 'plg1',
            runner: () => [
              {
                slug: `${missingAuditSlug}-a`,
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug: 'plg2',
            title: 'plg2',
            runner: () => [
              {
                slug: `${missingAuditSlug}-b`,
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
        ] satisfies PluginConfig[],
        persist: { outputDir: '.code-pushup' },
        cache: { read: false, write: false },
      }),
    ).rejects.toThrow('Executing 2 plugins failed.\n\n');
  });

  it('should throw with indentation in message', async () => {
    const missingAuditSlug = 'missing-audit-slug';

    await expect(() =>
      executePlugins({
        plugins: [
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug: 'plg1',
            title: 'plg1',
            runner: () => [
              {
                slug: `${missingAuditSlug}-a`,
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            slug: 'plg2',
            title: 'plg2',
            runner: () => [
              {
                slug: `${missingAuditSlug}-b`,
                score: 0.3,
                value: 16,
                displayValue: '16.0.0',
              },
            ],
          },
        ] satisfies PluginConfig[],
        persist: { outputDir: '.code-pushup' },
        cache: { read: false, write: false },
      }),
    ).rejects.toThrow(
      `- Plugin ${ansis.bold('plg1')} (${ansis.bold(
        'plg1',
      )}) produced the following error:\n  - Audit metadata not present in plugin config. Missing slug: ${ansis.bold(
        'missing-audit-slug-a',
      )}\n- Plugin ${ansis.bold('plg2')} (${ansis.bold(
        'plg2',
      )}) produced the following error:\n  - Audit metadata not present in plugin config. Missing slug: ${ansis.bold(
        'missing-audit-slug-b',
      )}\n\n`,
    );
  });

  it('should use outputTransform if provided', async () => {
    vol.fromJSON(
      {
        'output.json': JSON.stringify([
          {
            slug: 'node-version',
            score: 0.3,
            value: 16,
          },
        ]),
      },
      MEMFS_VOLUME,
    );

    const pluginResult = await executePlugins({
      plugins: [
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          runner: {
            command: 'echo',
            args: ['16'],
            outputFile: 'output.json',
            outputTransform: (outputs: unknown): Promise<AuditOutputs> =>
              Promise.resolve([
                {
                  slug: (outputs as AuditOutputs)[0]!.slug,
                  score: 0.3,
                  value: 16,
                  displayValue: '16.0.0',
                },
              ]),
          },
        },
      ],
      persist: { outputDir: MEMFS_VOLUME },
      cache: { read: false, write: false },
    });
    expect(pluginResult[0]?.audits[0]?.slug).toBe('node-version');
    expect(pluginResult[0]?.audits[0]?.displayValue).toBe('16.0.0');
  });
});
