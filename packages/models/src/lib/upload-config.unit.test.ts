import { describe, expect, it } from 'vitest';
import { type UploadConfig, uploadConfigSchema } from './upload-config.js';

describe('uploadConfigSchema', () => {
  it('should accept a valid upload configuration', () => {
    expect(() =>
      uploadConfigSchema.parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'cli',
        server: 'https://cli-server.dev:3800/',
      } satisfies UploadConfig),
    ).not.toThrow();
  });

  it('should throw for an invalid server URL', () => {
    expect(() =>
      uploadConfigSchema.parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'cli',
        server: '-invalid-/url',
      } satisfies UploadConfig),
    ).toThrow('Invalid url');
  });

  it('should throw for a PascalCase organization name', () => {
    expect(() =>
      uploadConfigSchema.parse({
        apiKey: 'API-K3Y',
        organization: 'CodePushUp',
        project: 'cli',
        server: '-invalid-/url',
      } satisfies UploadConfig),
    ).toThrow('slug has to follow the pattern');
  });

  it('should throw for a project with uppercase letters', () => {
    expect(() =>
      uploadConfigSchema.parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'Code-PushUp-CLI',
        server: '-invalid-/url',
      } satisfies UploadConfig),
    ).toThrow('slug has to follow the pattern');
  });
});
