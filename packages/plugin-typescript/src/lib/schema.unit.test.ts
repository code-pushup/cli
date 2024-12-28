import { describe, expect, it } from 'vitest';
import {
  type TypescriptPluginOptions,
  typescriptPluginConfigSchema,
} from './schema.js';

describe('typescriptPluginConfigSchema', () => {
  const tsConfigPath = 'tsconfig.json';

  it('accepts a empty configuration', () => {
    expect(() => typescriptPluginConfigSchema.parse({})).not.toThrow();
  });

  it('accepts a configuration with tsConfigPath set', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsConfigPath,
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('accepts a configuration with tsConfigPath and empty onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsConfigPath,
        onlyAudits: [],
      } satisfies TypescriptPluginOptions),
    ).not.toThrow();
  });

  it('accepts a configuration with tsConfigPath and full onlyAudits', () => {
    expect(() =>
      typescriptPluginConfigSchema.parse({
        tsConfigPath,
        onlyAudits: ['no-implicit-any', 'jsx', 'strict-function-types'],
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
        tsConfigPath,
        onlyAudits: [123, true],
      }),
    ).toThrow('invalid_type');
  });

  it('throws for unknown audit slug', () => {
    expect(
      () =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          onlyAudits: ['unknown-audit'],
        }),
      // Message too large because enums validation
      // eslint-disable-next-line vitest/require-to-throw-message
    ).toThrow();
  });
});
