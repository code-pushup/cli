import { describe, expect, it } from 'vitest';
import { persistConfig } from '../../test';
import { persistConfigSchema } from './persist-config';

describe('persistConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const persistConfigMock = persistConfig();
    expect(() => persistConfigSchema.parse(persistConfigMock)).not.toThrow();
  });

  it('should throw if outputDir is invalid', () => {
    const persistConfigMock = persistConfig(' ');

    expect(() => persistConfigSchema.parse(persistConfigMock)).toThrow(
      `path is invalid`,
    );
  });
});
