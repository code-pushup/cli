import { describe, expect, it } from 'vitest';
import { mockPersistConfig } from './implementation/helpers.mock';
import { persistConfigSchema } from './persist-config';

describe('persistConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const cfg = mockPersistConfig();
    expect(() => persistConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if outputPath is invalid', () => {
    const invalidPath = '/folder/../file';
    const cfg = mockPersistConfig({ outputPath: invalidPath });

    expect(() => persistConfigSchema.parse(cfg)).toThrow(`path is invalid`);
  });
});
