import { describe, expect, it } from 'vitest';
import { axePluginOptionsSchema } from './config.js';

describe('axePluginOptionsSchema', () => {
  it('should accept empty options object with default preset', () => {
    expect(axePluginOptionsSchema.parse({}).preset).toBe('wcag21aa');
  });

  it('should accept wcag21aa preset', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ preset: 'wcag21aa' }),
    ).not.toThrow();
  });

  it('should accept wcag22aa preset', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ preset: 'wcag22aa' }),
    ).not.toThrow();
  });

  it('should accept best-practice preset', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ preset: 'best-practice' }),
    ).not.toThrow();
  });

  it('should accept all preset', () => {
    expect(() => axePluginOptionsSchema.parse({ preset: 'all' })).not.toThrow();
  });

  it('should accept number scoreTargets', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ scoreTargets: 0.99 }),
    ).not.toThrow();
  });

  it('should accept object scoreTargets', () => {
    expect(() =>
      axePluginOptionsSchema.parse({
        scoreTargets: { 'color-contrast': 0.99 },
      }),
    ).not.toThrow();
  });

  it('should throw for invalid preset', () => {
    expect(() => axePluginOptionsSchema.parse({ preset: 'wcag3aa' })).toThrow();
  });

  it('should throw for invalid scoreTargets value', () => {
    expect(() => axePluginOptionsSchema.parse({ scoreTargets: 1.5 })).toThrow();
  });

  it('should throw for negative scoreTargets', () => {
    expect(() =>
      axePluginOptionsSchema.parse({ scoreTargets: -0.1 }),
    ).toThrow();
  });
});
