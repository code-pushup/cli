import { describe, expect, it, vi } from 'vitest';
import type { PluginSelectionOptions } from '../types.js';
import type { PenaltyConfig } from './audits/scoring.js';
import type { SelectionConfig } from './audits/selection.js';
import {
  mergeAuditConfigs,
  mergeDependencyTreeConfig,
  mergeInsightsConfig,
  mergeScoringConfig,
  mergeSelectionConfig,
} from './bundle-stats-runner.js';
import type { GroupingRule } from './types.js';

const testScoring = {
  totalSize: [0, 1000] as [number, number],
  penalty: { warningWeight: 0.1, errorWeight: 0.2 } as PenaltyConfig,
};
const emptySelection: SelectionConfig = {
  includeOutputs: [],
  excludeOutputs: [],
  includeInputs: [],
  excludeInputs: [],
  includeImports: [],
  excludeImports: [],
  includeEntryPoints: [],
  excludeEntryPoints: [],
};

describe('mergeDependencyTreeConfig', () => {
  it('should return undefined when both global and config are undefined', () => {
    expect(mergeDependencyTreeConfig(undefined, undefined)).toBeUndefined();
  });

  it('should use config when global is undefined', () => {
    const auditConfig = {
      groups: [{ patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(auditConfig, undefined);

    expect(result?.groups).toHaveLength(1);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.ts'] });
  });

  it('should return undefined when config.enabled is false', () => {
    const auditConfig = { enabled: false, groups: [] };
    const pluginOptions = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };

    expect(
      mergeDependencyTreeConfig(auditConfig, pluginOptions),
    ).toBeUndefined();
  });

  it('should merge when global options provided and config undefined', () => {
    const pluginOptions = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(undefined, pluginOptions);

    expect(result?.groups).toHaveLength(1);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.js'] });
  });

  it('should merge when both global and config options provided', () => {
    const auditConfig = {
      groups: [{ patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule],
    };
    const pluginOptions = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(auditConfig, pluginOptions);

    expect(result?.groups).toHaveLength(2);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.js'] });
    expect(result?.groups?.[1]).toMatchObject({ patterns: ['**/*.ts'] });
  });

  it('should overwrite pruning options (config takes precedence)', () => {
    const auditConfig = { pruning: { maxDepth: 5 } };
    const pluginOptions = { pruning: { maxDepth: 3 } };
    const result = mergeDependencyTreeConfig(auditConfig, pluginOptions);

    expect(result?.pruning?.maxDepth).toBe(5);
  });

  it('should provide DEFAULT pruning options when no options provided', () => {
    const auditConfig = { groups: [] };
    const result = mergeDependencyTreeConfig(auditConfig, undefined);

    expect(result?.pruning).toBeDefined();
  });
});

describe('mergeSelectionConfig', () => {
  it('should merge plugin and audit selection patterns', () => {
    const auditConfig = {
      includeOutputs: ['main.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
    const pluginOptions = {
      excludeOutputs: ['*.map'],
      excludeInputs: [],
      excludeImports: [],
      excludeEntryPoints: [],
    } as PluginSelectionOptions;
    const result = mergeSelectionConfig(auditConfig, pluginOptions);

    expect(result).toMatchObject({
      includeOutputs: ['main.js'],
      excludeOutputs: ['*.map'],
    });
  });

  it('should handle empty plugin options', () => {
    const auditConfig = {
      includeOutputs: [],
      excludeOutputs: ['dev.js'],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
    const result = mergeSelectionConfig(auditConfig);

    expect(result).toMatchObject({
      excludeOutputs: ['dev.js'],
    });
  });

  it('should merge multiple arrays correctly', () => {
    const auditConfig = {
      includeOutputs: ['main.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: ['temp.js'],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
    const pluginOptions = {
      excludeOutputs: ['*.map'],
      excludeInputs: ['test/**'],
      excludeImports: [],
      excludeEntryPoints: [],
    } as PluginSelectionOptions;
    const result = mergeSelectionConfig(auditConfig, pluginOptions);

    expect(result).toMatchObject({
      includeOutputs: ['main.js'],
      excludeOutputs: ['*.map'],
      excludeInputs: ['test/**', 'temp.js'],
    });
  });

  it('should handle undefined config selection', () => {
    const pluginOptions = {
      excludeOutputs: ['*.map'],
      excludeInputs: [],
      excludeImports: [],
      excludeEntryPoints: [],
    } as PluginSelectionOptions;
    const result = mergeSelectionConfig(undefined, pluginOptions);

    expect(result).toMatchObject({
      includeOutputs: [],
      excludeOutputs: ['*.map'],
    });
  });

  it('should handle empty exclude arrays', () => {
    const auditConfig = {
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
    const pluginOptions = {
      excludeOutputs: [],
      excludeInputs: [],
      excludeImports: [],
      excludeEntryPoints: [],
    } as PluginSelectionOptions;
    const result = mergeSelectionConfig(auditConfig, pluginOptions);

    expect(result).toMatchObject(emptySelection);
  });

  it('should merge exclude patterns correctly', () => {
    const auditConfig = emptySelection;
    const pluginOptions = {
      excludeOutputs: ['*.map'],
      excludeInputs: ['*.test.js'],
      excludeImports: ['dev/**'],
      excludeEntryPoints: ['debug.js'],
    } as PluginSelectionOptions;
    const result = mergeSelectionConfig(auditConfig, pluginOptions);

    expect(result.excludeOutputs).toStrictEqual(['*.map']);
    expect(result.excludeInputs).toStrictEqual(['*.test.js']);
    expect(result.excludeImports).toStrictEqual(['dev/**']);
    expect(result.excludeEntryPoints).toStrictEqual(['debug.js']);
  });
});

describe('mergeScoringConfig', () => {
  it('should return config when config.penalty is false', () => {
    const auditConfig = {
      totalSize: [0, 1000] as [number, number],
      penalty: false as const,
    };
    const pluginOptions = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };

    expect(mergeScoringConfig(auditConfig, pluginOptions)).toStrictEqual({
      totalSize: [0, 1000],
      penalty: false,
    });
  });

  it('should return options when config is undefined', () => {
    const pluginOptions = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };

    expect(mergeScoringConfig(undefined, pluginOptions)).toStrictEqual(
      pluginOptions,
    );
  });

  it('should merge when both config and options provided', () => {
    const auditConfig = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 3,
      } as PenaltyConfig,
    };
    const pluginOptions = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        threshold: 100,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(auditConfig, pluginOptions);

    expect(result?.penalty).toMatchObject({ factor: 3, threshold: 100 });
  });

  it('should merge penalty blacklists from both sources', () => {
    const auditConfig = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        blacklist: ['config-pattern'],
      } as PenaltyConfig,
    };
    const pluginOptions = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        blacklist: ['global-pattern'],
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(auditConfig, pluginOptions);

    expect((result?.penalty as any)?.blacklist).toStrictEqual([
      'global-pattern',
      'config-pattern',
    ]);
  });

  it('should overwrite other penalty properties (config takes precedence)', () => {
    const auditConfig = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 3,
        threshold: 500,
      } as PenaltyConfig,
    };
    const pluginOptions = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
        threshold: 100,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(auditConfig, pluginOptions);

    expect((result?.penalty as any)?.factor).toBe(3);
    expect((result?.penalty as any)?.threshold).toBe(500);
  });

  it('should handle undefined global scoring', () => {
    const auditConfig = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(auditConfig, undefined);

    expect((result?.penalty as any)?.factor).toBe(2);
  });
});

describe('mergeInsightsConfig', () => {
  it('should return undefined when config is false', () => {
    const pluginOptions = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(false, pluginOptions)).toBeUndefined();
  });

  it('should merge arrays when both global and config provided', () => {
    const auditConfig = [
      { patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule,
    ];
    const pluginOptions = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(auditConfig, pluginOptions)).toHaveLength(2);
  });

  it('should use global when config is undefined', () => {
    const pluginOptions = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(undefined, pluginOptions)).toStrictEqual([
      { patterns: ['**/*.js'], title: 'JavaScript' },
    ]);
  });

  it('should use config when global is undefined', () => {
    const auditConfig = [
      { patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(auditConfig, undefined)).toStrictEqual([
      { patterns: ['**/*.ts'], title: 'TypeScript' },
    ]);
  });

  it('should return undefined when both are undefined', () => {
    expect(mergeInsightsConfig(undefined, undefined)).toStrictEqual([]);
  });

  it('should handle empty arrays in global and config', () => {
    expect(mergeInsightsConfig([], [])).toStrictEqual([]);
  });
});

describe('mergeAuditConfigs', () => {
  it('should return empty array when given empty configs', () => {
    expect(mergeAuditConfigs([], {})).toStrictEqual([]);
  });

  it('should map over multiple configs correctly', () => {
    const configs = [
      {
        slug: 'audit-1',
        title: 'First',
        selection: emptySelection,
        scoring: testScoring,
      },
      {
        slug: 'audit-2',
        title: 'Second',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result).toHaveLength(2);
    expect(result[0]?.slug).toBe('audit-1');
    expect(result[1]?.slug).toBe('audit-2');
  });

  it('should set selection property correctly', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const options = {
      selection: { excludeOutputs: ['*.test.js'] } as PluginSelectionOptions,
    };
    const result = mergeAuditConfigs(configs, options);

    expect(result[0]?.selection).toBeDefined();
    expect(result[0]?.selection.excludeOutputs).toStrictEqual(['*.test.js']);
  });

  it('should set scoring property correctly', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const options = {
      scoring: {
        penalty: {
          warningWeight: 0.1,
          errorWeight: 0.2,
        } satisfies PenaltyConfig,
      },
    };
    const result = mergeAuditConfigs(configs, options);

    expect(result[0]?.scoring).toBeDefined();
  });

  it('should include insightsTable when config.insightsTable is not false', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        insightsTable: [
          { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
        ],
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result[0]).toHaveProperty('insightsTable');
    expect(result[0]?.insightsTable).toHaveLength(1);
  });

  it('should exclude insightsTable when config.insightsTable is false', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        insightsTable: false,
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result[0]).not.toHaveProperty('insightsTable');
  });

  it('should handle empty options object', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result[0]).toMatchObject({
      slug: 'test',
      selection: {
        includeOutputs: [],
        includeInputs: [],
        includeImports: [],
        includeEntryPoints: [],
        excludeOutputs: [],
        excludeInputs: [],
        excludeImports: [],
        excludeEntryPoints: [],
      },
    });
    expect((result[0] as any).artefactTree).toBeUndefined();
  });

  it('should handle partial options object', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const options = {
      scoring: {
        penalty: {
          warningWeight: 0.1,
          errorWeight: 0.2,
          factor: 1.5,
        } as PenaltyConfig,
      },
    };
    const result = mergeAuditConfigs(configs, options);

    expect(result[0]).toMatchObject({
      slug: 'test',
      scoring: expect.any(Object),
    });
    expect((result[0] as any).artefactTree).toBeUndefined();
  });
});
