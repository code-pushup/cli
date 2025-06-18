import { describe, expect, it } from 'vitest';
import type { BasicTree } from '../../../models/src/lib/tree.js';
import { type BundleStatsConfig, filterUnifiedTreeByConfig } from './utils.js';

describe('filterUnifiedTreeByConfig', () => {
  const mockUnifiedTree: BasicTree = {
    title: 'Test Bundle',
    type: 'basic',
    root: {
      name: 'bundle',
      values: {},
      children: [
        {
          name: 'inputs',
          values: { files: '4' },
          children: [
            {
              name: 'src/main.ts',
              values: { bytes: '2000', imports: '3' },
              children: [
                { name: '→ src/app/core.ts', values: {} },
                { name: '→ src/app/auth/auth.module.ts', values: {} },
                { name: '→ src/app/products/products.module.ts', values: {} },
              ],
            },
            {
              name: 'src/app/core.ts',
              values: { bytes: '1500', imports: '1' },
              children: [{ name: '→ src/shared/utils.ts', values: {} }],
            },
            {
              name: 'src/app/auth/auth.service.ts',
              values: { bytes: '800', imports: '0' },
            },
            {
              name: 'src/app/auth/auth.module.ts',
              values: { bytes: '300', imports: '1' },
              children: [
                { name: '→ src/app/auth/auth.service.ts', values: {} },
              ],
            },
            {
              name: 'src/app/products/products.component.ts',
              values: { bytes: '1200', imports: '2' },
              children: [
                { name: '→ src/app/products/products.service.ts', values: {} },
                { name: '→ src/app/products/shared/utils.ts', values: {} },
              ],
            },
            {
              name: 'src/app/products/products.service.ts',
              values: { bytes: '600', imports: '0' },
            },
            {
              name: 'src/app/products/shared/utils.ts',
              values: { bytes: '200', imports: '0' },
            },
          ],
        },
        {
          name: 'outputs',
          values: { files: '1' },
          children: [
            {
              name: 'dist/main.js',
              values: { bytes: '6600' },
              children: [
                { name: '← src/main.ts', values: { bytes: '2000' } },
                { name: '← src/app/core.ts', values: { bytes: '1500' } },
                {
                  name: '← src/app/auth/auth.service.ts',
                  values: { bytes: '800' },
                },
                {
                  name: '← src/app/auth/auth.module.ts',
                  values: { bytes: '300' },
                },
                {
                  name: '← src/app/products/products.component.ts',
                  values: { bytes: '1200' },
                },
                {
                  name: '← src/app/products/products.service.ts',
                  values: { bytes: '600' },
                },
                {
                  name: '← src/app/products/shared/utils.ts',
                  values: { bytes: '200' },
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const testConfigs: BundleStatsConfig[] = [
    {
      name: 'Main App Core',
      include: ['src/main.ts', 'src/app/**'],
    },
    {
      name: 'Auth Module',
      include: ['src/app/auth/**'],
    },
    {
      name: 'Lazy Products',
      include: ['src/app/products/**', '!src/app/products/shared/**'],
    },
  ];

  it('should filter tree based on include patterns', () => {
    const result = filterUnifiedTreeByConfig(mockUnifiedTree, testConfigs);

    expect(result).toHaveLength(3);

    // Check Main App Core tree
    const mainAppCore = result[0]!;
    expect(mainAppCore.title).toBe('Main App Core');
    expect(mainAppCore.root.name).toBe('Main App Core');

    // Check Auth Module tree
    const authModule = result[1]!;
    expect(authModule.title).toBe('Auth Module');
    expect(authModule.root.name).toBe('Auth Module');

    // Check Lazy Products tree
    const lazyProducts = result[2]!;
    expect(lazyProducts.title).toBe('Lazy Products');
    expect(lazyProducts.root.name).toBe('Lazy Products');
  });

  it('should include all matching files based on patterns', () => {
    const config: BundleStatsConfig[] = [
      {
        name: 'All Source Files',
        include: ['src/**'],
      },
    ];

    const result = filterUnifiedTreeByConfig(mockUnifiedTree, config);

    expect(result).toHaveLength(1);
    const tree = result[0]!;

    const inputs = tree.root.children?.find(child => child.name === 'inputs');
    const inputFiles = inputs?.children?.map(child => child.name) || [];

    expect(inputFiles).toContain('src/main.ts');
    expect(inputFiles).toContain('src/app/core.ts');
    expect(inputFiles).toContain('src/app/auth/auth.service.ts');
    expect(inputFiles).toContain('src/app/auth/auth.module.ts');
    expect(inputFiles).toContain('src/app/products/products.component.ts');
    expect(inputFiles).toContain('src/app/products/products.service.ts');
    expect(inputFiles).toContain('src/app/products/shared/utils.ts');
  });

  it('should handle negation patterns correctly', () => {
    const configWithNegation: BundleStatsConfig[] = [
      {
        name: 'Products Excluding Shared',
        include: ['src/app/products/**', '!src/app/products/shared/**'],
      },
    ];

    const result = filterUnifiedTreeByConfig(
      mockUnifiedTree,
      configWithNegation,
    );

    expect(result).toHaveLength(1);
    const tree = result[0]!;

    const inputs = tree.root.children?.find(child => child.name === 'inputs');
    const inputFiles = inputs?.children?.map(child => child.name) || [];

    // Should include products files but exclude shared
    expect(inputFiles).toContain('src/app/products/products.component.ts');
    expect(inputFiles).toContain('src/app/products/products.service.ts');
    expect(inputFiles).not.toContain('src/app/products/shared/utils.ts');
  });

  it('should handle specific file patterns', () => {
    const specificFileConfig: BundleStatsConfig[] = [
      {
        name: 'Main Entry Point',
        include: ['src/main.ts'],
      },
    ];

    const result = filterUnifiedTreeByConfig(
      mockUnifiedTree,
      specificFileConfig,
    );

    expect(result).toHaveLength(1);
    const tree = result[0]!;

    const inputs = tree.root.children?.find(child => child.name === 'inputs');
    const inputFiles = inputs?.children?.map(child => child.name) || [];

    expect(inputFiles).toContain('src/main.ts');
    expect(inputFiles).not.toContain('src/app/core.ts');
    expect(inputFiles).not.toContain('src/app/auth/auth.service.ts');
  });

  it('should preserve tree structure with outputs', () => {
    const config: BundleStatsConfig[] = [
      {
        name: 'Auth Files',
        include: ['src/app/auth/**'],
      },
    ];

    const result = filterUnifiedTreeByConfig(mockUnifiedTree, config);

    expect(result).toHaveLength(1);
    const tree = result[0]!;

    // Should have both inputs and outputs sections
    const rootChildren = tree.root.children?.map(child => child.name) || [];
    expect(rootChildren).toContain('inputs');
    expect(rootChildren).toContain('outputs');

    // Check outputs contain matching files
    const outputs = tree.root.children?.find(child => child.name === 'outputs');
    const outputFile = outputs?.children?.[0];
    const outputContributions =
      outputFile?.children?.map(child => child.name) || [];

    expect(outputContributions).toContain('← src/app/auth/auth.service.ts');
    expect(outputContributions).toContain('← src/app/auth/auth.module.ts');
  });
});
