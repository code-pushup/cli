import { describe, expect, it } from 'vitest';
import { type PersistConfig, persistConfigSchema } from './persist-config.js';

describe('persistConfigSchema', () => {
  it('should accept a valid configuration with all information', () => {
    expect(() =>
      persistConfigSchema.parse({
        filename: 'report.json',
        format: ['md'],
        outputDir: 'dist',
      } as PersistConfig),
    ).not.toThrow();
  });

  it('should accept an empty configuration', () => {
    expect(persistConfigSchema.parse({})).toEqual({});
  });

  it('should accept empty format', () => {
    expect(() => persistConfigSchema.parse({ format: [] })).not.toThrow();
  });

  it('should throw for an empty file name', () => {
    expect(() =>
      persistConfigSchema.parse({ filename: ' ' } as PersistConfig),
    ).toThrow('file name is invalid');
  });

  it('should throw for an empty output directory', () => {
    expect(() =>
      persistConfigSchema.parse({ outputDir: ' ' } as PersistConfig),
    ).toThrow('path is invalid');
  });

  it('should throw for an invalid format', () => {
    expect(() => persistConfigSchema.parse({ format: ['html'] })).toThrow(
      'Invalid enum value',
    );
  });
});
