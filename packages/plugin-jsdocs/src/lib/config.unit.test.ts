import { describe, expect, it } from 'vitest';
import { type JsDocsPluginConfig, jsDocsPluginConfigSchema } from './config.js';

describe('JsDocsPlugin Configuration', () => {
  describe('jsDocsPluginConfigSchema', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          patterns: ['src/**/*.ts'],
          onlyAudits: ['functions-coverage'],
        } satisfies JsDocsPluginConfig),
      ).not.toThrow();
    });

    it('throws when skipAudits and onlyAudits are defined', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
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
        jsDocsPluginConfigSchema.parse({
          patterns: ['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts'],
        } satisfies JsDocsPluginConfig),
      ).not.toThrow();
    });

    it('accepts a valid patterns array directly', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse([
          'src/**/*.{ts,tsx}',
          '!**/*.spec.ts',
          '!**/*.test.ts',
        ]),
      ).not.toThrow();
    });

    it('throws for invalid patterns type', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          patterns: 123,
        }),
      ).toThrow('Invalid input');
    });
  });

  describe('onlyAudits', () => {
    it('accepts a valid `onlyAudits` array', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          onlyAudits: ['functions-coverage', 'classes-coverage'],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for onlyAudits', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          onlyAudits: [],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('allows onlyAudits to be undefined', () => {
      const result = jsDocsPluginConfigSchema.parse({
        patterns: ['src/**/*.ts'],
      });
      expect(result.onlyAudits).toBeUndefined();
    });

    it('throws for invalid onlyAudits type', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          onlyAudits: 'functions-coverage',
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Invalid input');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          onlyAudits: [123, true],
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Invalid input');
    });
  });

  describe('skipAudits', () => {
    it('accepts valid audit slugs array', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          skipAudits: ['functions-coverage', 'classes-coverage'],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for skipAudits', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          skipAudits: [],
          patterns: ['src/**/*.ts'],
        }),
      ).not.toThrow();
    });

    it('allows skipAudits to be undefined', () => {
      const result = jsDocsPluginConfigSchema.parse({
        patterns: ['src/**/*.ts'],
      });
      expect(result.skipAudits).toBeUndefined();
    });

    it('throws for invalid skipAudits type', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          skipAudits: 'functions-coverage',
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Invalid input');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          skipAudits: [123, true],
          patterns: ['src/**/*.ts'],
        }),
      ).toThrow('Invalid input');
    });
  });

  describe('scoreTargets', () => {
    it('should accept valid score targets', () => {
      expect(() =>
        jsDocsPluginConfigSchema.parse({
          patterns: ['src/**/*.ts'],
          scoreTargets: { 'functions-coverage': 0.9 },
        }),
      ).not.toThrow();
    });
  });
});
