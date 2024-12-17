import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('docCoveragePluginConfigSchema', () => {
  it('accepts a documentation coverage configuration with all entities', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        coverageToolCommand: {
          command: 'npx @compodoc/compodoc',
          args: ['-p', 'tsconfig.json'],
        },
        outputPath: 'documentation/custom-doc.json',
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts a minimal documentation coverage configuration', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({} satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('uses default output path when not provided', () => {
    const config = {} satisfies DocCoveragePluginConfig;
    const parsed = docCoveragePluginConfigSchema.parse(config);

    expect(parsed.outputPath).toBe('documentation/documentation.json');
  });

  it('throws for missing command in coverageToolCommand', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        coverageToolCommand: {
          args: ['-p', 'tsconfig.json'],
        },
      }),
    ).toThrow('invalid_type');
  });

  it('accepts empty args in coverageToolCommand', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        coverageToolCommand: {
          command: 'npx @compodoc/compodoc',
        },
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });
});
