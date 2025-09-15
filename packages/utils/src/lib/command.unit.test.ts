import { describe, expect, it } from 'vitest';
import {
  buildCommandString,
  escapeCliArgs,
  filePathToCliArg,
  objectToCliArgs,
} from './command.js';

describe('filePathToCliArg', () => {
  it('should wrap path in quotes', () => {
    expect(filePathToCliArg('My Project/index.js')).toBe(
      '"My Project/index.js"',
    );
  });
});

describe('escapeCliArgs', () => {
  it('should return empty array for empty input', () => {
    const args: string[] = [];
    const result = escapeCliArgs(args);
    expect(result).toEqual([]);
  });

  it('should return arguments unchanged when no special characters', () => {
    const args = ['simple', 'arguments', '--flag', 'value'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['simple', 'arguments', '--flag', 'value']);
  });

  it('should escape arguments containing spaces', () => {
    const args = ['file with spaces.txt', 'normal'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"file with spaces.txt"', 'normal']);
  });

  it('should escape arguments containing double quotes', () => {
    const args = ['say "hello"', 'normal'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"say \\"hello\\""', 'normal']);
  });

  it('should escape arguments containing single quotes', () => {
    const args = ["don't", 'normal'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"don\'t"', 'normal']);
  });

  it('should escape arguments containing both quote types', () => {
    const args = ['mixed "double" and \'single\' quotes'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"mixed \\"double\\" and \'single\' quotes"']);
  });

  it('should escape arguments containing multiple spaces', () => {
    const args = ['multiple   spaces   here'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"multiple   spaces   here"']);
  });

  it('should handle empty string arguments', () => {
    const args = ['', 'normal', ''];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['', 'normal', '']);
  });

  it('should handle arguments with only spaces', () => {
    const args = ['   ', 'normal'];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"   "', 'normal']);
  });

  it('should handle complex mix of arguments', () => {
    const args = [
      'simple',
      'with spaces',
      'with"quotes',
      "with'apostrophe",
      '--flag',
      'value',
    ];
    const result = escapeCliArgs(args);
    expect(result).toEqual([
      'simple',
      '"with spaces"',
      '"with\\"quotes"',
      '"with\'apostrophe"',
      '--flag',
      'value',
    ]);
  });

  it('should handle arguments with consecutive quotes', () => {
    const args = ['""""', "''''"];
    const result = escapeCliArgs(args);
    expect(result).toEqual(['"\\"\\"\\"\\""', "\"''''\""]);
  });
});

describe('objectToCliArgs', () => {
  it('should handle undefined', () => {
    const params = { unsupported: undefined as any };
    expect(objectToCliArgs(params)).toStrictEqual([]);
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

  it('should handle nested objects', () => {
    const params = { persist: { format: ['json', 'md'], verbose: false } };
    const result = objectToCliArgs(params);
    expect(result).toEqual([
      '--persist.format="json"',
      '--persist.format="md"',
      '--no-persist.verbose',
    ]);
  });

  it('should throw error for unsupported type', () => {
    expect(() => objectToCliArgs({ param: Symbol('') })).toThrow(
      'Unsupported type',
    );
  });
});

describe('buildCommandString', () => {
  it('should return command only when no arguments provided', () => {
    const command = 'npm';
    const result = buildCommandString(command);
    expect(result).toBe('npm');
  });

  it('should return command only when empty arguments array provided', () => {
    const command = 'npm';
    const result = buildCommandString(command, []);
    expect(result).toBe('npm');
  });

  it('should handle simple arguments without special characters', () => {
    const command = 'npm';
    const args = ['install', '--save-dev', 'vitest'];
    const result = buildCommandString(command, args);
    expect(result).toBe('npm install --save-dev vitest');
  });

  it('should handle arguments containing spaces', () => {
    const command = 'code';
    const args = ['My Project/index.js'];
    const result = buildCommandString(command, args);
    expect(result).toBe('code My Project/index.js');
  });

  it('should handle arguments containing double quotes', () => {
    const command = 'echo';
    const args = ['Hello "World"'];
    const result = buildCommandString(command, args);
    expect(result).toBe('echo Hello "World"');
  });

  it('should handle arguments containing single quotes', () => {
    const command = 'echo';
    const args = ["Hello 'World'"];
    const result = buildCommandString(command, args);
    expect(result).toBe("echo Hello 'World'");
  });

  it('should handle mixed arguments with and without special characters', () => {
    const command = 'mycommand';
    const args = ['simple', 'with spaces', '--flag', 'with "quotes"'];
    const result = buildCommandString(command, args);
    expect(result).toBe('mycommand simple with spaces --flag with "quotes"');
  });

  it('should handle arguments with multiple types of quotes', () => {
    const command = 'test';
    const args = ['arg with "double" and \'single\' quotes'];
    const result = buildCommandString(command, args);
    expect(result).toBe('test arg with "double" and \'single\' quotes');
  });

  it('should handle objects with undefined', () => {
    const params = { format: undefined };
    const result = objectToCliArgs(params);
    expect(result).toStrictEqual([]);
  });

  it('should handle empty string arguments', () => {
    const command = 'test';
    const args = ['', 'normal'];
    const result = buildCommandString(command, args);
    expect(result).toBe('test  normal');
  });

  it('should handle arguments with only spaces', () => {
    const command = 'test';
    const args = ['   '];
    const result = buildCommandString(command, args);
    expect(result).toBe('test    ');
  });
});
