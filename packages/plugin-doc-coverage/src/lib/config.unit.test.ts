import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('docCoveragePluginConfigSchema', () => {
  it('accepts a documentation coverage configuration with all entities', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        language: 'typescript',
        sourceGlob: 'src/**/*.{ts,tsx}',
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts minimal configuration with only language', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        language: 'javascript',
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts configuration without sourceGlob', () => {
    const config = {
      language: 'typescript',
    } satisfies DocCoveragePluginConfig;
    const parsed = docCoveragePluginConfigSchema.parse(config);

    expect(parsed.sourceGlob).toBeUndefined();
  });

  it('throws for missing language', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        sourceGlob: 'src/**/*.ts',
      }),
    ).toThrow('invalid_type');
  });

  it('throws for invalid language', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        language: 'python',
        sourceGlob: 'src/**/*.py',
      }),
    ).toThrow('Invalid enum value');
  });

  it('accepts both typescript and javascript as valid languages', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        language: 'typescript',
      }),
    ).not.toThrow();

    expect(() =>
      docCoveragePluginConfigSchema.parse({
        language: 'javascript',
      }),
    ).not.toThrow();
  });
});
