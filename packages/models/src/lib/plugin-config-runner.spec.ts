import { describe, expect, it } from 'vitest';
import {
  esmRunnerConfig,
  runnerConfig,
} from '../../test/fixtures/runner-config.mock';
import {
  runnerFunctionSchema,
  runnerConfigSchema,
} from './plugin-config-runner';

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

describe('esmRunnerConfig', () => {
  it('should parse if configuration is valid', () => {
    const runnerConfigMock = esmRunnerConfig();
    expect(() => runnerFunctionSchema.parse(runnerConfigMock)).not.toThrow();
  });

  it('should throw if not a function', () => {
    const runnerConfigMock = runnerConfig();
    expect(() => runnerFunctionSchema.parse(runnerConfigMock)).toThrow(
      `Expected function,`,
    );
  });
});
