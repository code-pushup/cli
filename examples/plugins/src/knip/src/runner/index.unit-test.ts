import { describe, expect, it } from 'vitest';
import { runnerConfigSchema } from '@code-pushup/models';
import { createRunnerConfig } from './index';

describe('runnerConfig', () => {
  it('should return correct runner config object', () => {
    expect(() => runnerConfigSchema.parse(createRunnerConfig())).not.toThrow();
  });
});
