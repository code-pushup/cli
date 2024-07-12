import { describe, expect } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('should parse empty env vars', () => {
    expect(parseEnv({})).toEqual({});
  });

  it('should parse process.env.CP_SERVER option', () => {
    expect(parseEnv({ CP_SERVER: 'https://portal.code.pushup.dev' })).toEqual(
      expect.objectContaining({ server: 'https://portal.code.pushup.dev' }),
    );
  });

  it('should parse process.env.CP_ORGANIZATION option', () => {
    expect(parseEnv({ CP_ORGANIZATION: 'code-pushup' })).toEqual(
      expect.objectContaining({ organization: 'code-pushup' }),
    );
  });

  it('should parse process.env.CP_PROJECT option', () => {
    expect(parseEnv({ CP_PROJECT: 'cli-utils' })).toEqual(
      expect.objectContaining({ project: 'cli-utils' }),
    );
  });

  it('should parse process.env.CP_TIMEOUT option', () => {
    expect(parseEnv({ CP_TIMEOUT: '3' })).toEqual(
      expect.objectContaining({ timeout: 3 }),
    );
  });

  it('should throw for process.env.CP_TIMEOUT option < 0', () => {
    expect(() => parseEnv({ CP_TIMEOUT: '-1' })).toThrow('Invalid');
  });

  it('should throw for invalid URL in process.env.CP_SERVER option', () => {
    expect(() => parseEnv({ CP_SERVER: 'httptpt' })).toThrow('Invalid url');
  });
});
