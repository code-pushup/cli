import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('docCoveragePluginConfigSchema', () => {
  it('accepts a valid configuration', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        sourceGlob: ['src/**/*.ts'],
        onlyAudits: ['functions-coverage'],
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('throws when skipAudits and onlyAudits are defined', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        skipAudits: ['functions-coverage'],
        onlyAudits: ['classes-coverage'],
      }),
    ).toThrow("You can't define 'skipAudits' and 'onlyAudits' simultaneously");
  });
});

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
  it('accepts a valid `onlyAudits` array', () => {
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

describe('skipAudits', () => {
  it('accepts valid audit slugs array', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        skipAudits: ['functions-coverage', 'classes-coverage'],
        sourceGlob: ['src/**/*.ts'],
      }),
    ).not.toThrow();
  });

  it('throws for array with non-string elements', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        skipAudits: [123, true],
      }),
    ).toThrow('Expected string');
  });
});
