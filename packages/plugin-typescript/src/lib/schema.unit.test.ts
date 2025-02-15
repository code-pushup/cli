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

  it('accepts a configuration with tsConfigPath set', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('accepts a configuration with tsConfigPath and empty onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: [],
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('accepts a configuration with tsConfigPath and full onlyAudits', () => {
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
    ).toThrow('invalid_type');
  });

  it('throws for unknown audit slug', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsconfig,
        onlyAudits: ['unknown-audit'],
      }),
    ).toThrow(/unknown-audit/);
  });
});
