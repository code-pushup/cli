import { describe, expect, it } from 'vitest';
import {
  type OutputTransform,
  type RunnerConfig,
  type RunnerFunction,
  outputTransformSchema,
  runnerConfigSchema,
  runnerFunctionSchema,
} from './runner-config.js';

describe('runnerConfigSchema', () => {
  it('should accept a valid runner configuration', () => {
    expect(() =>
      runnerConfigSchema.parse({
        command: 'node',
        args: ['-v'],
        outputFile: 'output.json',
        outputTransform: () => [],
      } satisfies RunnerConfig),
    ).not.toThrow();
  });

  it('should accept a minimal runner configuration', () => {
    expect(() =>
      runnerConfigSchema.parse({
        command: 'npm run test',
        outputFile: 'output.json',
      } satisfies RunnerConfig),
    ).not.toThrow();
  });

  it('should throw for a missing outputFile', () => {
    expect(() =>
      runnerConfigSchema.parse({
        command: 'node',
      }),
    ).toThrow('invalid_type');
  });

  it('should throw for an empty outputFile', () => {
    expect(() =>
      runnerConfigSchema.parse({
        command: 'node',
        outputFile: '',
      }),
    ).toThrow('Too small: expected string to have >=1 characters');
  });
});

describe('runnerFunctionSchema', () => {
  it('should accept a valid runner function', () => {
    expect(() =>
      runnerFunctionSchema.parse((() => [
        { slug: 'npm-version', value: 6, score: 1 },
      ]) satisfies RunnerFunction),
    ).not.toThrow();
  });

  it('should accept a runner function that returns empty array', () => {
    expect(() =>
      runnerFunctionSchema.parse((() => []) satisfies RunnerFunction),
    ).not.toThrow();
  });

  it('should throw for a non-function argument', () => {
    expect(() => runnerFunctionSchema.parse({ slug: 'configuration' })).toThrow(
      'Expected function, received object',
    );
  });
});

describe('outputTransformSchema', () => {
  it('should accept a valid outputTransform function', () => {
    expect(() =>
      outputTransformSchema.parse((() => [
        { slug: 'node-version', value: 20, score: 1 },
      ]) satisfies OutputTransform),
    ).not.toThrow();
  });

  it('should accept an outputTransform function that returns empty array', () => {
    expect(() =>
      outputTransformSchema.parse((() => []) satisfies OutputTransform),
    ).not.toThrow();
  });

  it('should throw for a non-function argument', () => {
    expect(() => outputTransformSchema.parse('configuration')).toThrow(
      'Expected function, received string',
    );
  });
});
