import { describe, expect, it } from 'vitest';
import {
  createCliCommandObject,
  createCliCommandString,
  objectToCliArgs,
} from './cli.js';

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

describe('createCliCommandString', () => {
  it('should create command out of object for arguments', () => {
    const result = createCliCommandString({ args: { verbose: true } });
    expect(result).toBe('npx @code-pushup/cli --verbose');
  });

  it('should create command out of object for arguments with positional', () => {
    const result = createCliCommandString({
      args: { _: 'autorun', verbose: true },
    });
    expect(result).toBe('npx @code-pushup/cli autorun --verbose');
  });
});

describe('createCliCommandObject', () => {
  it('should create command out of object for arguments', () => {
    expect(createCliCommandObject({ args: { verbose: true } })).toStrictEqual({
      args: ['@code-pushup/cli', '--verbose'],
      command: 'npx',
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });

  it('should create command out of object for arguments with positional', () => {
    expect(
      createCliCommandObject({
        args: { _: 'autorun', verbose: true },
      }),
    ).toStrictEqual({
      args: ['@code-pushup/cli', 'autorun', '--verbose'],
      command: 'npx',
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });

  it('should create command out of object for arguments with bin', () => {
    expect(
      createCliCommandObject({
        bin: 'node_modules/@code-pushup/cli/src/bin.js',
      }),
    ).toStrictEqual({
      args: ['node_modules/@code-pushup/cli/src/bin.js'],
      command: 'npx',
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });
});
