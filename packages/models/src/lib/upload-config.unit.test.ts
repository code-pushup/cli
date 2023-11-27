import { describe, expect, it } from 'vitest';
import { uploadConfig } from '../../test';
import { uploadConfigSchema } from './upload-config';

describe('uploadConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const uploadConfigMock = uploadConfig();
    expect(() => uploadConfigSchema.parse(uploadConfigMock)).not.toThrow();
  });

  it('should throw if plugin URL is invalid', () => {
    const invalidUrl = '-invalid-/url';
    const uploadConfigMock = uploadConfig();
    uploadConfigMock.server = invalidUrl;

    expect(() => uploadConfigSchema.parse(uploadConfigMock)).toThrow(
      `Invalid url`,
    );
  });
});
