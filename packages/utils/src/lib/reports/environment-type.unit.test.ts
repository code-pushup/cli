import { describe, expect, it } from 'vitest';
import { getEnvironmentType } from './environment-type';

describe('getEnvironmentType', () => {
  it.each([
    ['TERM_PROGRAM', 'vscode', 'vscode'],
    ['GITHUB_ACTIONS', 'true', 'github'],
    ['GITLAB_CI', 'true', 'gitlab'],
  ])(
    'should return the environment type when %s environment variable is set',
    (envVarName, envVarValue, expected) => {
      // reset potentially interfering environment variables
      vi.stubEnv('TERM_PROGRAM', '');
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      vi.stubEnv('GITLAB_CI', 'false');

      vi.stubEnv(envVarName, envVarValue);
      expect(getEnvironmentType()).toBe(expected);
    },
  );

  it('should return "other" when no expected environment variables are set', () => {
    // reset potentially interfering environment variables
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'false');

    expect(getEnvironmentType()).toBe('other');
  });
});
