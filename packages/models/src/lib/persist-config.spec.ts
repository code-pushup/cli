import { describe, expect, it } from 'vitest';
import { mockPersistConfig } from '../../test';
import { persistConfigSchema } from './persist-config';

describe('persistConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const cfg = mockPersistConfig();
    expect(() => persistConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if outputDir is invalid', () => {
    const cfg = mockPersistConfig({ outputDir: ' ' });

    expect(() => persistConfigSchema.parse(cfg)).toThrow(`path is invalid`);
  });
});
