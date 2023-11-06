import { describe, expect, it } from 'vitest';
import { runnerConfig } from '../../test/fixtures/runner-config.mock';
import { runnerConfigSchema } from './plugin-config-runner';

describe('runnerConfig', () => {
  it('should parse if configuration is valid', () => {
    const runnerConfigMock = runnerConfig();
    expect(() => runnerConfigSchema.parse(runnerConfigMock)).not.toThrow();
  });

  it('should throw if a invalid config is passed', () => {
    const runnerConfigMock = { commmand: '' };
    expect(() => runnerConfigSchema.parse(runnerConfigMock)).toThrow(
      `Required`,
    );
  });

  it('should throw if outputFile is invalid', () => {
    const runnerConfigMock = runnerConfig();
    runnerConfigMock.outputFile = ' ';
    expect(() => runnerConfigSchema.parse(runnerConfigMock)).toThrow(
      `path is invalid`,
    );
  });
});
