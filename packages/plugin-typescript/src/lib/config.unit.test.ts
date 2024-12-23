import { describe, expect, it } from 'vitest';
import {
  type TypescriptPluginConfig,
  typescriptPluginConfigSchema,
} from './config.js';

describe('TypescriptPlugin Configuration', () => {
  const tsConfigPath = 'tsconfig.json';

  describe('typescriptPluginConfigSchema', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          tsCodes: [1000, 1002],
        } satisfies TypescriptPluginConfig),
      ).not.toThrow();
    });
  });

  describe('tsConfigPath', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
        } satisfies TypescriptPluginConfig),
      ).not.toThrow();
    });

    it('throws for invalid tsConfigPath type', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath: 123,
        }),
      ).toThrow('Expected string');
    });
  });

  describe('tsCodes', () => {
    it('accepts a valid `tsCodes` array', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          tsCodes: [1000, 1002],
        }),
      ).not.toThrow();
    });

    it('accepts empty array for tsCodes', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          tsCodes: [],
        }),
      ).not.toThrow();
    });

    it('allows tsCodes to be undefined', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
        }),
      ).not.toThrow();
    });

    it('throws for invalid tsCodes type', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          tsCodes: 'invalidCodes',
        }),
      ).toThrow('Expected array');
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          tsCodes: [123, true],
        }),
      ).toThrow('Expected number, received boolean');
    });
  });
});
