import { describe, expect, it } from 'vitest';
import { persistConfig } from '../../test';
import { persistConfigSchema } from './persist-config';

describe('persistConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const persistConfigMock = persistConfig();
    expect(() => persistConfigSchema.parse(persistConfigMock)).not.toThrow();
  });

  it('should fill defaults', () => {
    const persistConfigMock = persistConfigSchema.parse(persistConfig());
    expect(persistConfigMock.filename).toBe('report');
  });

  it('should throw if outputDir is invalid', () => {
    const persistConfigMock = persistConfig();
    persistConfigMock.outputDir = ' ';

    expect(() => persistConfigSchema.parse(persistConfigMock)).toThrow(
      `path is invalid`,
    );
  });

  it('should throw if filename is invalid', () => {
    const persistConfigMock = persistConfig();
    persistConfigMock.filename = ' ';
    expect(() => persistConfigSchema.parse(persistConfigMock)).toThrow(
      `The filename cant include / : * ? \\" < > |`,
    );
  });
});
