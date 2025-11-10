import { describe, expect, it } from 'vitest';
import { axePluginOptionsSchema } from './config.js';

describe('axePluginOptionsSchema', () => {
  it('should accept empty options object with default preset', () => {
    expect(axePluginOptionsSchema.parse({}).preset).toBe('wcag21aa');
  });

  it.each(['wcag21aa', 'wcag22aa', 'best-practice', 'all'])(
    'should validate %j as a valid preset value',
    preset => {
      expect(() => axePluginOptionsSchema.parse({ preset })).not.toThrow();
    },
  );

  it('should accept scoreTargets as a number between 0 and 1', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ scoreTargets: 0.99 }),
    ).not.toThrow();
  });

  it('should accept scoreTargets as an audit-specific score map', () => {
    expect(() =>
      axePluginOptionsSchema.parse({
        scoreTargets: { 'color-contrast': 0.99 },
      }),
    ).not.toThrow();
  });

  it('should reject invalid preset values', () => {
    expect(() => axePluginOptionsSchema.parse({ preset: 'wcag3aa' })).toThrow();
  });

  it('should reject scoreTargets values greater than 1', () => {
    expect(() => axePluginOptionsSchema.parse({ scoreTargets: 1.5 })).toThrow();
  });

  it('should reject negative scoreTargets', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ scoreTargets: -0.1 }),
    ).toThrow();
  });
});
