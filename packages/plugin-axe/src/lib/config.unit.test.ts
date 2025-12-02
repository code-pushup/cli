import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { axePluginOptionsSchema } from './config.js';

describe('axePluginOptionsSchema', () => {
  it('should accept empty options object with default preset and timeout', () => {
    const parsed = axePluginOptionsSchema.parse({});

    expect(parsed.preset).toBe('wcag21aa');
    expect(parsed.timeout).toBe(30_000);
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
    expect(() => axePluginOptionsSchema.parse({ preset: 'wcag3aa' })).toThrow(
      ZodError,
    );
  });

  it('should reject scoreTargets values greater than 1', () => {
    expect(() => axePluginOptionsSchema.parse({ scoreTargets: 1.5 })).toThrow(
      ZodError,
    );
  });

  it('should reject negative scoreTargets', () => {
    expect(() => axePluginOptionsSchema.parse({ scoreTargets: -0.1 })).toThrow(
      ZodError,
    );
  });

  it('should accept custom timeout value', () => {
    expect(axePluginOptionsSchema.parse({ timeout: 60_000 }).timeout).toBe(
      60_000,
    );
  });

  it('should reject non-positive timeout values', () => {
    expect(() => axePluginOptionsSchema.parse({ timeout: 0 })).toThrow(
      ZodError,
    );
    expect(() => axePluginOptionsSchema.parse({ timeout: -1000 })).toThrow(
      ZodError,
    );
  });

  it('should reject non-integer timeout values', () => {
    expect(() => axePluginOptionsSchema.parse({ timeout: 1000.5 })).toThrow(
      ZodError,
    );
  });
});
