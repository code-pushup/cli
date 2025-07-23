import { describe, expect, it } from 'vitest';
import type { GlobalSelectionOptions } from '../types.js';
import type { PenaltyConfig } from './audits/details/issues.js';
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
  includeInputs: [],
  includeImports: [],
  includeEntryPoints: [],
  excludeOutputs: [],
  excludeInputs: [],
  excludeImports: [],
  excludeEntryPoints: [],
};

describe('mergeAuditConfigs', () => {
  it('should return empty array when given empty configs', () => {
    expect(mergeAuditConfigs([], {})).toStrictEqual([]);
  });

  it('should preserve original config properties not affected by options', () => {
    const configs = [
      {
        slug: 'test-audit',
        title: 'Test',
        description: 'Test audit',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result[0]).toMatchObject({
      slug: 'test-audit',
      title: 'Test',
      description: 'Test audit',
    });
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

  it('should maintain config order in returned array', () => {
    const configs = [
      {
        slug: 'z-audit',
        title: 'Z',
        selection: emptySelection,
        scoring: testScoring,
      },
      {
        slug: 'a-audit',
        title: 'A',
        selection: emptySelection,
        scoring: testScoring,
      },
      {
        slug: 'm-audit',
        title: 'M',
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const result = mergeAuditConfigs(configs, {});

    expect(result.map(c => c.slug)).toStrictEqual([
      'z-audit',
      'a-audit',
      'm-audit',
    ]);
  });

  it('should set artefactTree property correctly', () => {
    const configs = [
      {
        slug: 'test',
        title: 'Test',
        dependencyTree: { groups: [] },
        selection: emptySelection,
        scoring: testScoring,
      },
    ] as any;
    const options = {
      dependencyTree: {
        groups: [
          { patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule,
        ],
      },
    };
    const result = mergeAuditConfigs(configs, options);

    expect((result[0] as any).artefactTree).toBeDefined();
    expect((result[0] as any).artefactTree?.groups).toHaveLength(1);
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
      selection: { excludeOutputs: ['*.test.js'] } as GlobalSelectionOptions,
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

describe('mergeArtefactTreeConfig', () => {
  it('should return undefined when both global and config are undefined', () => {
    expect(mergeDependencyTreeConfig(undefined, undefined)).toBeUndefined();
  });

  it('should use config when global is undefined', () => {
    const config = {
      groups: [{ patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(config, undefined);

    expect(result?.groups).toHaveLength(1);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.ts'] });
  });

  it('should return undefined when config.enabled is false', () => {
    const config = { enabled: false, groups: [] };
    const global = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };

    expect(mergeDependencyTreeConfig(config, global)).toBeUndefined();
  });

  it('should merge when global options provided and config undefined', () => {
    const global = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(undefined, global);

    expect(result?.groups).toHaveLength(1);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.js'] });
  });

  it('should merge when both global and config options provided', () => {
    const config = {
      groups: [{ patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule],
    };
    const global = {
      groups: [{ patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule],
    };
    const result = mergeDependencyTreeConfig(config, global);

    expect(result?.groups).toHaveLength(2);
    expect(result?.groups?.[0]).toMatchObject({ patterns: ['**/*.js'] });
    expect(result?.groups?.[1]).toMatchObject({ patterns: ['**/*.ts'] });
  });

  it('should overwrite pruning options (config takes precedence)', () => {
    const config = { pruning: { maxDepth: 5 } };
    const global = { pruning: { maxDepth: 3 } };
    const result = mergeDependencyTreeConfig(config, global);

    expect(result?.pruning?.maxDepth).toBe(5);
  });

  it('should provide DEFAULT pruning options when no options provided', () => {
    const config = { groups: [] };
    const result = mergeDependencyTreeConfig(config, undefined);

    expect(result?.pruning).toBeDefined();
  });
});

describe('mergeSelectionConfig', () => {
  it('should overwrite include arrays (config takes precedence)', () => {
    const config = { includeOutputs: ['config.js'] };
    const global = { includeOutputs: ['global.js'] } as GlobalSelectionOptions;
    const result = mergeSelectionConfig(config, global);

    expect(result.includeOutputs).toStrictEqual(['config.js']);
  });

  it('should merge exclude arrays from both sources', () => {
    const config = { excludeOutputs: ['*.test.js'] };
    const global = { excludeOutputs: ['*.spec.js'] } as GlobalSelectionOptions;
    const result = mergeSelectionConfig(config, global);

    expect(result.excludeOutputs).toStrictEqual(['*.spec.js', '*.test.js']);
  });

  it('should handle undefined global selection', () => {
    const config = { includeOutputs: ['main.js'], excludeInputs: ['test/**'] };
    const result = mergeSelectionConfig(config, undefined);

    expect(result).toMatchObject({
      includeOutputs: ['main.js'],
      excludeInputs: ['test/**'],
      excludeOutputs: [],
    });
  });

  it('should handle undefined config selection', () => {
    const global = { excludeOutputs: ['*.map'] } as GlobalSelectionOptions;
    const result = mergeSelectionConfig(undefined, global);

    expect(result).toMatchObject({
      includeOutputs: [],
      excludeOutputs: ['*.map'],
    });
  });

  it('should handle empty arrays in config and global', () => {
    const result = mergeSelectionConfig({ includeOutputs: [] }, {
      excludeOutputs: [],
    } as GlobalSelectionOptions);

    expect(result.includeOutputs).toStrictEqual([]);
    expect(result.excludeOutputs).toStrictEqual([]);
  });

  it('should merge all exclude types (outputs, inputs, imports, entryPoints)', () => {
    const config = {
      excludeOutputs: ['c1'],
      excludeInputs: ['c2'],
      excludeImports: ['c3'],
      excludeEntryPoints: ['c4'],
    };
    const global = {
      excludeOutputs: ['g1'],
      excludeInputs: ['g2'],
      excludeImports: ['g3'],
      excludeEntryPoints: ['g4'],
    } as GlobalSelectionOptions;
    const result = mergeSelectionConfig(config, global);

    expect(result.excludeOutputs).toStrictEqual(['g1', 'c1']);
    expect(result.excludeInputs).toStrictEqual(['g2', 'c2']);
    expect(result.excludeImports).toStrictEqual(['g3', 'c3']);
    expect(result.excludeEntryPoints).toStrictEqual(['g4', 'c4']);
  });
});

describe('mergeScoringConfig', () => {
  it('should return config when config.penalty is false', () => {
    const config = {
      totalSize: [0, 1000] as [number, number],
      penalty: false as const,
    };
    const options = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };

    expect(mergeScoringConfig(config, options)).toStrictEqual({
      totalSize: [0, 1000],
      penalty: false,
    });
  });

  it('should return options when config is undefined', () => {
    const options = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };

    expect(mergeScoringConfig(undefined, options)).toStrictEqual(options);
  });

  it('should merge when both config and options provided', () => {
    const config = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 3,
      } as PenaltyConfig,
    };
    const options = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        threshold: 100,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(config, options);

    expect(result?.penalty).toMatchObject({ factor: 3, threshold: 100 });
  });

  it('should merge penalty blacklists from both sources', () => {
    const config = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        blacklist: ['config-pattern'],
      } as PenaltyConfig,
    };
    const options = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        blacklist: ['global-pattern'],
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(config, options);

    expect((result?.penalty as any)?.blacklist).toStrictEqual([
      'global-pattern',
      'config-pattern',
    ]);
  });

  it('should overwrite other penalty properties (config takes precedence)', () => {
    const config = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 3,
        threshold: 500,
      } as PenaltyConfig,
    };
    const options = {
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
        threshold: 100,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(config, options);

    expect((result?.penalty as any)?.factor).toBe(3);
    expect((result?.penalty as any)?.threshold).toBe(500);
  });

  it('should handle undefined global scoring', () => {
    const config = {
      totalSize: [0, 1000] as [number, number],
      penalty: {
        warningWeight: 0.1,
        errorWeight: 0.2,
        factor: 2,
      } as PenaltyConfig,
    };
    const result = mergeScoringConfig(config, undefined);

    expect((result?.penalty as any)?.factor).toBe(2);
  });
});

describe('mergeInsightsConfig', () => {
  it('should return undefined when config is false', () => {
    const global = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(false, global)).toBeUndefined();
  });

  it('should merge arrays when both global and config provided', () => {
    const config = [
      { patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule,
    ];
    const global = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(config, global)).toHaveLength(2);
  });

  it('should use global when config is undefined', () => {
    const global = [
      { patterns: ['**/*.js'], title: 'JavaScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(undefined, global)).toStrictEqual([
      { patterns: ['**/*.js'], title: 'JavaScript' },
    ]);
  });

  it('should use config when global is undefined', () => {
    const config = [
      { patterns: ['**/*.ts'], title: 'TypeScript' } as GroupingRule,
    ];

    expect(mergeInsightsConfig(config, undefined)).toStrictEqual([
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
