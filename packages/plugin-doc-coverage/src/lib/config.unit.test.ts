import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('docCoveragePluginConfigSchema', () => {
  describe('sourceGlob', () => {
    it('accepts a valid source glob pattern', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          sourceGlob: ['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts'],
        } satisfies DocCoveragePluginConfig),
      ).not.toThrow();
    });

    it('uses default value for missing sourceGlob', () => {
      const result = docCoveragePluginConfigSchema.parse({});
      expect(result.sourceGlob).toEqual([
        'src/**/*.{ts,tsx}',
        '!**/*.spec.ts',
        '!**/*.test.ts',
      ]);
    });

    it('throws for invalid sourceGlob type', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          sourceGlob: 123,
        }),
      ).toThrow('Expected array');
    });
  });

  describe('onlyAudits', () => {
    it('accepts valid audit slugs array', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: ['functions-coverage', 'classes-coverage'],
          sourceGlob: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for onlyAudits', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: [],
          sourceGlob: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('allows onlyAudits to be undefined', () => {
      const result = docCoveragePluginConfigSchema.parse({});
      expect(result.onlyAudits).toBeUndefined();
    });

    it('throws for invalid onlyAudits type', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: 'functions-coverage',
        }),
      ).toThrow('Expected array');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: [123, true],
        }),
      ).toThrow('Expected string');
    });
  });

  it('accepts a complete valid configuration', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        sourceGlob: ['src/**/*.ts'],
        onlyAudits: ['functions-coverage'],
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });
});
