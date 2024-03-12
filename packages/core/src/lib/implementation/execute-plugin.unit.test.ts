import { vol } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_PLUGIN_CONFIG_MOCK,
  getLogMessages,
} from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import {
  PluginOutputMissingAuditError,
  executePlugin,
  executePlugins,
} from './execute-plugin';

describe('executePlugin', () => {
  it('should execute a valid plugin config', async () => {
    const pluginResult = await executePlugin(MINIMAL_PLUGIN_CONFIG_MOCK);
    expect(pluginResult.audits[0]?.slug).toBe('node-version');
  });

  it('should yield audit outputs for valid runner config', async () => {
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

    const pluginResult = await executePlugin({
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: {
        command: 'node',
        args: ['-v'],
        outputFile: 'output.json',
      },
    });
    expect(pluginResult.audits[0]?.slug).toBe('node-version');
  });

  it('should yield audit outputs for a valid runner function', async () => {
    const pluginResult = await executePlugin({
      ...MINIMAL_PLUGIN_CONFIG_MOCK,
      runner: () => [
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ],
    });
    expect(pluginResult.audits).toEqual([
      expect.objectContaining({
        slug: 'node-version',
        title: 'Node version',
        score: 0.3,
        value: 16,
      }),
    ]);
  });

  it('should throw when plugin slug is invalid', async () => {
    await expect(() =>
      executePlugin({
        ...MINIMAL_PLUGIN_CONFIG_MOCK,
        audits: [{ slug: '-invalid-slug', title: 'Invalid audit' }],
      }),
    ).rejects.toThrow(new PluginOutputMissingAuditError('node-version'));
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
    expect(pluginResult[0]?.audits[0]?.slug).toBe('node-version');
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
      runner: vi
        .fn()
        .mockRejectedValue('Audit metadata not found for slug node-version'),
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
      'Plugins failed: 2 errors: Audit metadata not found for slug node-version, plugin 3 error',
    );
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toBe('[ yellow(warn) ] Plugins failed: ');
    expect(logs[1]).toBe(
      '[ yellow(warn) ] Audit metadata not found for slug node-version',
    );

    expect(pluginConfig.runner).toHaveBeenCalled();
    expect(pluginConfig2.runner).toHaveBeenCalled();
    expect(pluginConfig3.runner).toHaveBeenCalled();
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
                  slug: (outputs as AuditOutputs)[0]!.slug,
                  score: 0.3,
                  value: 16,
                  displayValue: '16.0.0',
                },
              ]),
          },
        },
      ],
      { progress: false },
    );
    expect(pluginResult[0]?.audits[0]?.slug).toBe('node-version');
    expect(pluginResult[0]?.audits[0]?.displayValue).toBe('16.0.0');
  });
});
