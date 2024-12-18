import { describe, expect, it } from 'vitest';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';

describe('docCoveragePluginConfigSchema', () => {
  it('accepts a valid source glob pattern', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        sourceGlob: 'src/**/*.{ts,tsx}',
      } satisfies DocCoveragePluginConfig),
    ).not.toThrow();
  });

  it('not throws for missing sourceGlob', () => {
    expect(() => docCoveragePluginConfigSchema.parse({})).not.toThrow();
  });

  it('throws for invalid sourceGlob type', () => {
    expect(() =>
      docCoveragePluginConfigSchema.parse({
        sourceGlob: 123,
      }),
    ).toThrow('Expected string');
  });
});
