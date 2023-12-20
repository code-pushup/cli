import { describe, expect } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware';

describe('configMiddleware-autoload', () => {
  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });
});
