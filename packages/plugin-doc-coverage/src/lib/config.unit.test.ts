import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('DocCoveragePlugin Configuration', () => {
  describe('docCoveragePluginConfigSchema', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          patterns: ['src/**/*.ts'],
          onlyAudits: ['functions-coverage'],
        } satisfies DocCoveragePluginConfig),
      ).not.toThrow();
    });

    it('throws when skipAudits and onlyAudits are defined', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          patterns: ['src/**/*.ts'],
          skipAudits: ['functions-coverage'],
          onlyAudits: ['classes-coverage'],
        }),
      ).toThrow(
        "You can't define 'skipAudits' and 'onlyAudits' simultaneously",
      );
    });
  });

  describe('patterns', () => {
    it('accepts a valid patterns array', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          patterns: ['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts'],
        } satisfies DocCoveragePluginConfig),
      ).not.toThrow();
    });

    it('accepts a valid patterns array directly', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse([
          'src/**/*.{ts,tsx}',
          '!**/*.spec.ts',
          '!**/*.test.ts',
        ]),
      ).not.toThrow();
    });

    it('throws for invalid patterns type', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          patterns: 123,
        }),
      ).toThrow('Expected array');
    });
  });

  describe('onlyAudits', () => {
    it('accepts a valid `onlyAudits` array', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: ['functions-coverage', 'classes-coverage'],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for onlyAudits', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: [],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('allows onlyAudits to be undefined', () => {
      const result = docCoveragePluginConfigSchema.parse({
        patterns: ['src/**/*.ts'],
      });
      expect(result.onlyAudits).toBeUndefined();
    });

    it('throws for invalid onlyAudits type', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: 'functions-coverage',
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Expected array');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          onlyAudits: [123, true],
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Expected string, received number');
    });
  });

  describe('skipAudits', () => {
    it('accepts valid audit slugs array', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          skipAudits: ['functions-coverage', 'classes-coverage'],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for skipAudits', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          skipAudits: [],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('allows skipAudits to be undefined', () => {
      const result = docCoveragePluginConfigSchema.parse({
        patterns: ['src/**/*.ts'],
      });
      expect(result.skipAudits).toBeUndefined();
    });

    it('throws for invalid skipAudits type', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          skipAudits: 'functions-coverage',
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Expected array');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        docCoveragePluginConfigSchema.parse({
          skipAudits: [123, true],
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Expected string');
    });
  });
});
