import { describe, expect, it } from 'vitest';
import {
  type TypescriptPluginOptions,
  typescriptPluginConfigSchema,
} from './config.js';

describe('TypescriptPlugin Configuration', () => {
  const tsConfigPath = 'tsconfig.json';

  describe('typescriptPluginConfigSchema', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          onlyAudits: ['ts-code-1065', 'ts-code-2354'],
        } satisfies TypescriptPluginOptions),
      ).not.toThrow();
    });
  });

  describe('tsConfigPath', () => {
    it('accepts a valid configuration', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
        } satisfies TypescriptPluginOptions),
      ).not.toThrow();
    });

    it('throws for invalid tsConfigPath type', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          onlyAudits: 123,
        }),
      ).toThrow('invalid_type');
    });
  });

  describe('onlyAudits', () => {
    it('accepts a valid `onlyAudits` array', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          onlyAudits: ['ts-code-1065', 'argument-expected-1011'],
        } satisfies TypescriptPluginOptions),
      ).not.toThrow();
    });

    it('accepts empty array for tsCodes', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          onlyAudits: [],
        } satisfies TypescriptPluginOptions),
      ).not.toThrow();
    });

    it('allows tsCodes to be undefined', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
        } satisfies TypescriptPluginOptions),
      ).not.toThrow();
    });

    it('throws for array with non-string elements', () => {
      expect(() =>
        typescriptPluginConfigSchema.parse({
          tsConfigPath,
          onlyAudits: [123, true],
        }),
      ).toThrow('invalid_type');
    });
  });
});
