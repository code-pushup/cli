import { describe, expect, it } from 'vitest';
import { createCliCommand, objectToCliArgs } from './cli';

describe('objectToCliArgs', () => {
  it('should empty params', () => {
    const result = objectToCliArgs();
    expect(result).toEqual([]);
  });

  it('should handle the "_" argument as script', () => {
    const params = { _: 'bin.js' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js']);
  });

  it('should handle the "_" argument with multiple values', () => {
    const params = { _: ['bin.js', '--help'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js', '--help']);
  });

  it('should handle shorthands arguments', () => {
    const params = {
      e: `test`,
    };
    const result = objectToCliArgs(params);
    expect(result).toEqual([`-e="${params.e}"`]);
  });

  it('should handle string arguments', () => {
    const params = { name: 'Juanita' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--name="Juanita"']);
  });

  it('should handle number arguments', () => {
    const params = { parallel: 5 };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--parallel=5']);
  });

  it('should handle boolean arguments', () => {
    const params = { progress: true };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--progress']);
  });

  it('should handle negated boolean arguments', () => {
    const params = { progress: false };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--no-progress']);
  });

  it('should handle array of string arguments', () => {
    const params = { format: ['json', 'md'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--format="json"', '--format="md"']);
  });

  it('should handle objects', () => {
    const params = { format: { json: 'simple' } };
    const result = objectToCliArgs(params);
    expect(result).toStrictEqual(['--format.json="simple"']);
  });

  it('should handle nested objects', () => {
    const params = { persist: { format: ['json', 'md'], verbose: false } };
    const result = objectToCliArgs(params);
    expect(result).toEqual([
      '--persist.format="json"',
      '--persist.format="md"',
      '--no-persist.verbose',
    ]);
  });

  it('should handle objects with undefined', () => {
    const params = { format: undefined };
    const result = objectToCliArgs(params);
    expect(result).toStrictEqual([]);
  });

  it('should throw error for unsupported type', () => {
    expect(() => objectToCliArgs({ param: Symbol('') })).toThrow(
      'Unsupported type',
    );
  });
});

describe('createCliCommand', () => {
  it('should create command out of command name and an object for arguments', () => {
    const result = createCliCommand('autorun', { verbose: true });
    expect(result).toBe('npx @code-pushup/cli autorun --verbose');
  });
});
