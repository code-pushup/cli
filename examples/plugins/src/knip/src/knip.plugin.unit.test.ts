import { describe, expect, it } from 'vitest';
import { runnerConfigSchema } from '@code-pushup/models';
import { runnerConfig } from './knip.plugin';

describe('runnerConfig', () => {
  it('should return correct runner config object', () => {
    expect(() => runnerConfigSchema.parse(runnerConfig())).not.toThrow();
  });
});
