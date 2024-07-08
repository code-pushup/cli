import { describe, expect, it } from 'vitest';
import { uploadConfigSchema } from './upload-config';

describe('uploadConfigSchema', () => {
  it('should accept a valid upload configuration', () => {
    expect(() =>
      uploadConfigSchema().parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'cli',
        server: 'https://cli-server.dev:3800/',
      }),
    ).not.toThrow();
  });

  it('should accept configuration options', () => {
    expect(() =>
      uploadConfigSchema({ optional: { apiKey: true, timeout: true } }).parse({
        organization: 'code-pushup',
        project: 'cli',
        server: 'https://cli-server.dev:3800/',
      }),
    ).not.toThrow();
  });

  it('should throw for an invalid server URL', () => {
    expect(() =>
      uploadConfigSchema().parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'cli',
        server: '-invalid-/url',
      }),
    ).toThrow('Invalid url');
  });

  it('should throw for a PascalCase organization name', () => {
    expect(() =>
      uploadConfigSchema().parse({
        apiKey: 'API-K3Y',
        organization: 'CodePushUp',
        project: 'cli',
        server: '-invalid-/url',
      }),
    ).toThrow('slug has to follow the pattern');
  });

  it('should throw for a project with uppercase letters', () => {
    expect(() =>
      uploadConfigSchema().parse({
        apiKey: 'API-K3Y',
        organization: 'code-pushup',
        project: 'Code-PushUp-CLI',
        server: '-invalid-/url',
      }),
    ).toThrow('slug has to follow the pattern');
  });
});
