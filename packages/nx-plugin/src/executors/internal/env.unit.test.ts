import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('should parse CP_API_KEY environment variable', () => {
    expect(parseEnv({ CP_API_KEY: 'cp_0123456789' })).toStrictEqual({
      apiKey: 'cp_0123456789',
    });
  });

  it('should not parse API key if missing CP_API_KEY in environment', () => {
    expect(parseEnv({})).toStrictEqual({});
  });

  it('should ignore CP_API_KEY if empty string', () => {
    expect(parseEnv({ CP_API_KEY: '' })).toStrictEqual({});
  });

  it('should ignore other environment variables', () => {
    expect(
      parseEnv({ CP_SERVER: 'https://api.code-pushup.example.com/graphql' }),
    ).toStrictEqual({});
  });
});
