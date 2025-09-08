import { describe, expect, it } from 'vitest';
import { createCliCommandObject } from './cli.js';

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
