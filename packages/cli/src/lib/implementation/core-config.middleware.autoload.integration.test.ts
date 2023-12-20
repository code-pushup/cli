import { describe, expect } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware';

describe('configMiddleware-autoload', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env['CP_SERVER'] = 'https://api.codepushup.com';
    process.env['CP_API_KEY'] = 'apiKey';
    process.env['CP_ORGANIZATION'] = 'org';
    process.env['CP_PROJECT'] = 'cli';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });
});
