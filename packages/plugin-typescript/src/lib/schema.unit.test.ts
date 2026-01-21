import { describe, expect, it } from 'vitest';
import {
  type TypescriptPluginOptions,
  typescriptPluginConfigSchema,
} from './schema.js';

describe('typescriptPluginConfigSchema', () => {
  const tsconfig = 'tsconfig.json';

  it('accepts a empty configuration', () => {
    expect(() => typescriptPluginConfigSchema.parse({})).not.toThrow();
  });

  it('accepts a configuration with tsconfig set', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('transforms a single tsconfig string to an array', () => {
    expect(
      typescriptPluginConfigSchema.parse({ tsconfig }).tsconfig,
    ).toStrictEqual([tsconfig]);
  });

  it('accepts an array of tsconfig paths', () => {
    const tsconfigs = ['tsconfig.lib.json', 'tsconfig.spec.json'];
    expect(
      typescriptPluginConfigSchema.parse({ tsconfig: tsconfigs }).tsconfig,
    ).toStrictEqual(tsconfigs);
  });

  it('throws for empty tsconfig array', () => {
    expect(() => typescriptPluginConfigSchema.parse({ tsconfig: [] })).toThrow(
      'too_small',
    );
  });

  it('accepts a configuration with tsconfig and empty onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: [],
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('accepts a configuration with tsconfig and full onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: [
          'syntax-errors',
          'semantic-errors',
          'configuration-errors',
        ],
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('throws for invalid onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        onlyAudits: 123,
      }),
    ).toThrow('invalid_type');
  });

  it('throws for invalid onlyAudits items', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: [123, true],
      }),
    ).toThrow(
      String.raw`Invalid option: expected one of \"syntax-errors\"|\"semantic-errors\"|`,
    );
  });

  it('throws for unknown audit slug', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: ['unknown-audit'],
      }),
    ).toThrow(
      String.raw`Invalid option: expected one of \"syntax-errors\"|\"semantic-errors\"|`,
    );
  });

  it('should accept valid score targets', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        scoreTargets: { 'no-implicit-any-errors': 0.9 },
      }),
    ).not.toThrow();
  });
});
