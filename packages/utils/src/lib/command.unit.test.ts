import ansis from 'ansis';
import path from 'node:path';
import process from 'node:process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCommandStatus } from './command.js';

describe('formatCommand', () => {
  it('should format complex command with cwd, env, and status', () => {
    expect(
      formatCommandStatus(
        'npx eslint . --format=json',
        {
          cwd: '<CWD>',
          env: { CP_VERBOSE: true },
        },
        'failure',
      ),
    ).toBe(
      `${ansis.blue('<CWD>')} ${ansis.red('$')} ${ansis.gray('CP_VERBOSE="true"')} npx eslint . --format=json`,
    );
  });

  it.each([
    [undefined, ansis.blue], // default to pending
    ['pending' as const, ansis.blue],
    ['success' as const, ansis.green],
    ['failure' as const, ansis.red],
  ])(`should format command status %s explicitly`, (status, color) => {
    expect(
      formatCommandStatus('npx eslint . --format=json', {}, status),
    ).toContain(`${color('$')}`);
  });

  it('should not include cwd prefix when cwd is same as process.cwd()', () => {
    vi.spyOn(path, 'relative').mockReturnValue('');
    expect(formatCommandStatus('npx -v', { cwd: process.cwd() })).toStartWith(
      `${ansis.blue('$')}`,
    );
  });

  it('should format command with multiple environment variables', () => {
    const result = formatCommandStatus('npx eslint .', {
      env: { NODE_ENV: 'test', NODE_OPTIONS: '--import tsx' },
    });
    expect(result).toStartWith(
      `${ansis.blue('$')} ${ansis.gray('NODE_ENV="test"')} ${ansis.gray('NODE_OPTIONS="--import tsx"')}`,
    );
  });

  it('should format command with environment variable containing spaces', () => {
    const result = formatCommandStatus('node packages/cli/src/index.ts', {
      env: { NODE_OPTIONS: '--import tsx' },
    });
    expect(result).toBe(
      `${ansis.blue('$')} ${ansis.gray('NODE_OPTIONS="--import tsx"')} node packages/cli/src/index.ts`,
    );
  });
});
