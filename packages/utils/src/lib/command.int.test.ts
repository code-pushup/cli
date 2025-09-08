import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { formatCommandLog } from './command.js';

describe('formatCommandLog', () => {
  it('should format simple command', () => {
    const result = removeColorCodes(
      formatCommandLog({ command: 'npx', args: ['command', '--verbose'] }),
    );

    expect(result).toBe('$ npx command --verbose');
  });

  it('should format simple command with explicit process.cwd()', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command', '--verbose'],
        cwd: process.cwd(),
      }),
    );

    expect(result).toBe('$ npx command --verbose');
  });

  it('should format simple command with relative cwd', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command', '--verbose'],
        cwd: './wololo',
      }),
    );

    expect(result).toBe(`wololo $ npx command --verbose`);
  });

  it('should format simple command with absolute non-current path converted to relative', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command', '--verbose'],
        cwd: path.join(process.cwd(), 'tmp'),
      }),
    );
    expect(result).toBe('tmp $ npx command --verbose');
  });

  it('should format simple command with relative cwd in parent folder', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command', '--verbose'],
        cwd: '..',
      }),
    );

    expect(result).toBe(`.. $ npx command --verbose`);
  });

  it('should format simple command using relative path to parent directory', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command', '--verbose'],
        cwd: path.dirname(process.cwd()),
      }),
    );

    expect(result).toBe('.. $ npx command --verbose');
  });

  it('should format command with environment variables', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command'],
        cwd: process.cwd(),
        env: {
          NODE_ENV: 'production',
          DEBUG: 'true',
        },
      }),
    );

    expect(result).toBe('$ NODE_ENV=production DEBUG=true npx command');
  });

  it('should handle environment variables with quotes in values', () => {
    const result = removeColorCodes(
      formatCommandLog({
        command: 'npx',
        args: ['command'],
        cwd: process.cwd(),
        env: {
          MESSAGE: 'Hello "world"',
        },
      }),
    );

    expect(result).toBe('$ MESSAGE="Hello world" npx command');
  });
});
