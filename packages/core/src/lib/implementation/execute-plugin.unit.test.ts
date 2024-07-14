import { vol } from 'memfs';
import pc from 'picocolors';
import { describe, expect, it } from 'vitest';
import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_PLUGIN_CONFIG_MOCK,
} from '@code-pushup/test-utils';
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

  it('should throw when audit slug is invalid', async () => {
    await expect(() =>
      executePlugin({
        ...MINIMAL_PLUGIN_CONFIG_MOCK,
        audits: [{ slug: '-invalid-slug', title: 'Invalid audit' }],
      }),
    ).rejects.toThrow(new PluginOutputMissingAuditError('node-version'));
  });

  it('should throw for missing audit', async () => {
    const missingSlug = 'missing-audit-slug';
    await expect(() =>
      executePlugin({
        ...MINIMAL_PLUGIN_CONFIG_MOCK,
        runner: () => [
          {
            slug: missingSlug,
            score: 0,
            value: 0,
          },
        ],
      }),
    ).rejects.toThrow(
      `Audit metadata not present in plugin config. Missing slug: ${pc.bold(
        missingSlug,
      )}`,
    );
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

  it('should throw for invalid audit output', async () => {
    const slug = 'simulate-invalid-audit-slug';
    const title = 'Simulate an invalid audit slug in outputs';
    await expect(() =>
      executePlugins(
        [
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
        { progress: false },
      ),
    ).rejects.toThrow(`Executing 1 plugin failed.\n\nError: - Plugin ${pc.bold(
      title,
    )} (${pc.bold(slug)}) produced the following error:
  - Audit output is invalid: [
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "The slug has to follow the pattern [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug",
    "path": [
      0,
      "slug"
    ]
  }
]
`);
  });

  it('should throw for one failing plugin', async () => {
    const missingAuditSlug = 'missing-audit-slug';
    await expect(() =>
      executePlugins(
        [
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
        { progress: false },
      ),
    ).rejects.toThrow('Executing 1 plugin failed.\n\n');
  });

  it('should throw for multiple failing plugins', async () => {
    const missingAuditSlug = 'missing-audit-slug';
    await expect(() =>
      executePlugins(
        [
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
        { progress: false },
      ),
    ).rejects.toThrow('Executing 2 plugins failed.\n\n');
  });

  it('should throw with indentation in message', async () => {
    const missingAuditSlug = 'missing-audit-slug';

    await expect(() =>
      executePlugins(
        [
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
        { progress: false },
      ),
    ).rejects.toThrow(
      `Error: - Plugin ${pc.bold('plg1')} (${pc.bold(
        'plg1',
      )}) produced the following error:\n  - Audit metadata not present in plugin config. Missing slug: ${pc.bold(
        'missing-audit-slug-a',
      )}\nError: - Plugin ${pc.bold('plg2')} (${pc.bold(
        'plg2',
      )}) produced the following error:\n  - Audit metadata not present in plugin config. Missing slug: ${pc.bold(
        'missing-audit-slug-b',
      )}`,
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
