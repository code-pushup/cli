import { describe, expect, it } from 'vitest';
import { auditReport } from '../../test/fixtures/plugin-config.mock';
import { runnerConfig } from '../../test/fixtures/runner-config.mock';
import { runnerConfigSchema, runnerFunctionSchema } from './runner-config';

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

describe('runnerFunction', () => {
  it('should parse if configuration is valid', () => {
    const runnerConfigMock = () => Promise.resolve([auditReport()]);
    expect(() => runnerFunctionSchema.parse(runnerConfigMock)).not.toThrow();
  });

  it('should throw if not a function', () => {
    const runnerConfigMock = runnerConfig();
    expect(() => runnerFunctionSchema.parse(runnerConfigMock)).toThrow(
      `Expected function,`,
    );
  });
});
