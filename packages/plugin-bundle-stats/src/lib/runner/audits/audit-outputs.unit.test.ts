import { describe, expect, it } from 'vitest';
import type { Issue } from '@code-pushup/models';
import type { BundleStatsConfig } from '../types.js';
import type { UnifiedStats } from '../unify/unified-stats.types.js';
import {
  calculateTotalBytes,
  createAuditOutput,
  generateAuditOutputs,
} from './audit-outputs.js';

describe('calculateTotalBytes', () => {
  it('should calculate total bytes from empty stats', () => {
    expect(calculateTotalBytes({})).toBe(0);
  });

  it('should calculate total bytes from multiple outputs', () => {
    expect(
      calculateTotalBytes({
        'bundle.js': {
          path: 'bundle.js',
          bytes: 1000,
        },
        'vendor.js': {
          path: 'vendor.js',
          bytes: 2500,
        },
        'styles.css': {
          path: 'styles.css',
          bytes: 500,
        },
      }),
    ).toBe(4000);
  });
});

describe('createAuditOutput', () => {
  it('should create audit output with empty stats', () => {
    expect(
      createAuditOutput(
        {},
        {
          title: 'Bundle Size',
          slug: 'bundle-size',
          description: 'Bundle size analysis',
          selection: { includeOutputs: ['**/*.js'] },
          thresholds: { totalSize: [1000, 10000] },
        },
      ),
    ).toStrictEqual({
      slug: 'bundle-size',
      score: 0,
      value: 0,
      displayValue: '0 B (0 files)',
      details: {
        issues: [],
      },
    });
  });

  it('should create audit output with basic configuration', () => {
    expect(
      createAuditOutput(
        {
          'main.js': {
            path: 'main.js',
            bytes: 5000,
          },
        },
        {
          title: 'Bundle Size',
          slug: 'bundle-size',
          description: 'Bundle size analysis',
          selection: { includeOutputs: ['**/*.js'] },
          thresholds: { totalSize: [1000, 10000] },
        },
      ),
    ).toStrictEqual({
      slug: 'bundle-size',
      score: 1.0,
      value: 5000,
      displayValue: '4.88 kB (1 file)',
      details: {
        issues: [],
      },
    });
  });

  it('should create audit output with penalty configuration', () => {
    expect(
      createAuditOutput(
        {
          'main.js': {
            path: 'main.js',
            bytes: 5000,
          },
        },
        {
          title: 'Bundle Size',
          slug: 'bundle-size',
          description: 'Bundle size analysis',
          selection: { includeOutputs: ['**/*.js'] },
          thresholds: { totalSize: [1000, 10000] },
          penalty: {
            errorWeight: 0.5,
            warningWeight: 0.2,
            blacklist: ['main.js'],
          },
        },
      ).score,
    ).toBe(0.5);
  });
});

describe('generateAuditOutputs', () => {
  it('should return empty array for empty configs', () => {
    expect(
      generateAuditOutputs(
        {
          'main.js': { path: 'main.js', bytes: 1000 },
        },
        [],
      ),
    ).toStrictEqual([]);
  });

  it('should generate empty audit when no artifacts match selection', () => {
    expect(
      generateAuditOutputs(
        {
          'main.css': { path: 'main.css', bytes: 1000 },
        },
        [
          {
            title: 'JS Bundle',
            slug: 'js-bundle',
            description: 'JS bundle analysis',
            selection: {
              includeOutputs: ['**/*.js'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
              includeEntryPoints: [],
              excludeEntryPoints: [],
            },
            thresholds: { totalSize: [1000, 10000] },
          },
        ],
      ),
    ).toStrictEqual([
      expect.objectContaining({
        slug: 'js-bundle',
        score: 0,
        value: 0,
        displayValue: '0 B',
      }),
    ]);
  });

  it('should generate audit output when artifacts match selection', () => {
    expect(
      generateAuditOutputs(
        {
          'main.js': { path: 'main.js', bytes: 3000 },
          'vendor.js': { path: 'vendor.js', bytes: 2000 },
        },
        [
          {
            title: 'JS Bundle',
            slug: 'js-bundle',
            description: 'JS bundle analysis',
            selection: {
              includeOutputs: ['**/*.js'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
              includeEntryPoints: [],
              excludeEntryPoints: [],
            },
            thresholds: { totalSize: [1000, 10000] },
          },
        ],
      ),
    ).toStrictEqual([
      expect.objectContaining({
        slug: 'js-bundle',
        score: 1.0,
        value: 5000,
      }),
    ]);
  });

  it('should handle multiple configs with mixed results', () => {
    expect(
      generateAuditOutputs(
        {
          'main.js': { path: 'main.js', bytes: 3000 },
          'styles.css': { path: 'styles.css', bytes: 1000 },
        },
        [
          {
            title: 'JS Bundle',
            slug: 'js-bundle',
            description: 'JS bundle analysis',
            selection: {
              includeOutputs: ['**/*.js'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
              includeEntryPoints: [],
              excludeEntryPoints: [],
            },
            thresholds: { totalSize: [1000, 10000] },
          },
          {
            title: 'CSS Bundle',
            slug: 'css-bundle',
            description: 'CSS bundle analysis',
            selection: {
              includeOutputs: ['**/*.css'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
              includeEntryPoints: [],
              excludeEntryPoints: [],
            },
            thresholds: { totalSize: [1000, 10000] },
          },
          {
            title: 'Image Assets',
            slug: 'image-assets',
            description: 'Image asset analysis',
            selection: {
              includeOutputs: ['**/*.png'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
              includeEntryPoints: [],
              excludeEntryPoints: [],
            },
            thresholds: { totalSize: [1000, 10000] },
          },
        ],
      ),
    ).toStrictEqual([
      expect.objectContaining({ slug: 'js-bundle', value: 3000 }),
      expect.objectContaining({ slug: 'css-bundle', value: 1000 }),
      expect.objectContaining({ slug: 'image-assets', value: 0 }),
    ]);
  });
});
