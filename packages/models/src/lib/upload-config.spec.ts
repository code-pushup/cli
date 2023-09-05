import { describe, expect, it } from 'vitest';
import { mockUploadConfig } from './implementation/helpers.mock';
import { uploadConfigSchema } from './upload-config';

describe('uploadConfigSchema', () => {
  it('should parse if configuration is valid', () => {
    const cfg = mockUploadConfig();
    expect(() => uploadConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if plugin URL is invalid', () => {
    const invalidUrl = '-invalid-/url';
    const cfg = mockUploadConfig({ server: invalidUrl });

    expect(() => uploadConfigSchema.parse(cfg)).toThrow(`Invalid url`);
  });
});
