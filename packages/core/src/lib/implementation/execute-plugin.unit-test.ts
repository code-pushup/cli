import { vol } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_PLUGIN_CONFIG_MOCK,
} from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import {
  PluginOutputMissingAuditError,
  executePlugin,
  executePlugins,
} from './execute-plugin';

const nodePluginSlug = MINIMAL_PLUGIN_CONFIG_MOCK.slug;

// eslint-disable-next-line max-lines-per-function
describe('executePlugin', () => {
  it('should execute a valid plugin config', async () => {
    const pluginResult = await executePlugin(MINIMAL_PLUGIN_CONFIG_MOCK);
    expect(pluginResult.audits[0]?.slug).toBe(nodePluginSlug);
  });

  it('should yield audit outputs for valid runner config', async () => {
    vol.fromJSON(
      {
        'output.json': JSON.stringify([
          {
            slug: nodePluginSlug,
            score: 1,
            value: 2,
          },
        ]),
      },
      MEMFS_VOLUME,
    );

    const pluginResult = await executePlugin({
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: {
        command: 'node',
        args: ['-v'],
        outputFile: 'output.json',
      },
    });
    expect(pluginResult.audits[0]?.slug).toBe(nodePluginSlug);
  });

  it('should yield audit outputs for a valid runner function', async () => {
    const pluginResult = await executePlugin({
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: () => [
        {
          slug: nodePluginSlug,
          score: 0,
          value: 1,
        },
      ],
    });
    expect(pluginResult.audits).toEqual([
      expect.objectContaining({
        slug: nodePluginSlug,
        title: 'Node version',
        score: 0,
        value: 2,
      }),
    ]);
  });

  it('should throw when plugin slug is invalid', async () => {
    await expect(() =>
      executePlugin({
        ...MINIMAL_PLUGIN_CONFIG_MOCK,
        audits: [{ slug: '-invalid-slug', title: 'Invalid audit' }],
      }),
    ).rejects.toThrow(new PluginOutputMissingAuditError(nodePluginSlug));
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    await expect(() =>
      executePlugin({
        ...MINIMAL_PLUGIN_CONFIG_MOCK,
        runner: () => [
          {
            slug: '-invalid-audit-slug',
            score: 0,
            value: 0,
          },
        ],
      }),
    ).rejects.toThrow('The slug has to follow the pattern');
  });
});

// eslint-disable-next-line max-lines-per-function
describe('executePlugins', () => {
  it('should execute valid plugins', async () => {
    const pluginResult = await executePlugins(
      [
        MINIMAL_PLUGIN_CONFIG_MOCK,
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          icon: 'nodejs',
        },
      ],
      { progress: false },
    );

    expect(pluginResult[0]?.icon).toBe('javascript');
    expect(pluginResult[1]?.icon).toBe('nodejs');
    expect(pluginResult[0]?.audits[0]?.slug).toBe(nodePluginSlug);
  });

  it('should throw for invalid plugins', async () => {
    await expect(() =>
      executePlugins(
        [
          MINIMAL_PLUGIN_CONFIG_MOCK,
          {
            ...MINIMAL_PLUGIN_CONFIG_MOCK,
            audits: [{ slug: '-invalid-slug', title: 'Invalid audit' }],
          },
        ] satisfies PluginConfig[],
        { progress: false },
      ),
    ).rejects.toThrow(
      /Plugins failed: 1 errors:.*Audit metadata not found for slug node-version/,
    );
  });

  it('should print invalid plugin errors and throw', async () => {
    const pluginConfig = {
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: vi.fn().mockRejectedValue('plugin 1 error'),
    };
    const pluginConfig2 = {
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: vi.fn().mockResolvedValue([]),
    };
    const pluginConfig3 = {
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: vi.fn().mockRejectedValue('plugin 3 error'),
    };

    await expect(() =>
      executePlugins([pluginConfig, pluginConfig2, pluginConfig3], {
        progress: false,
      }),
    ).rejects.toThrow(
      'Plugins failed: 2 errors: plugin 1 error, plugin 3 error',
    );
    const logs = ui()
      .logger.getRenderer()
      .getLogs()
      .map(({ message }) => message);
    expect(logs[0]).toBe('[ yellow(warn) ] Plugins failed: ');
    expect(logs[1]).toBe('[ yellow(warn) ] plugin 1 error');
    expect(logs[2]).toBe('[ yellow(warn) ] plugin 3 error');
    expect(pluginConfig.runner).toHaveBeenCalled();
    expect(pluginConfig2.runner).toHaveBeenCalled();
    expect(pluginConfig3.runner).toHaveBeenCalled();
  });

  it('should use outputTransform if provided', async () => {
    vol.fromJSON(
      {
        'output.json': JSON.stringify([
          {
            slug: nodePluginSlug,
            score: 1,
            value: 2,
          },
        ]),
      },
      MEMFS_VOLUME,
    );

    const pluginResult = await executePlugins(
      [
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          runner: {
            command: 'node',
            args: ['-v'],
            outputFile: 'output.json',
            outputTransform: (outputs: unknown): Promise<AuditOutputs> =>
              Promise.resolve([
                {
                  slug: (outputs as AuditOutputs)[0]?.slug || '',
                  score: 1,
                  value: 2,
                  displayValue: '2.0.0',
                },
              ]),
          },
        },
      ],
      { progress: false },
    );
    expect(pluginResult[0]?.audits[0]?.slug).toBe(nodePluginSlug);
    expect(pluginResult[0]?.audits[0]?.displayValue).toBe('2.0.0');
  });
});