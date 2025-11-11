import ansis from 'ansis';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCommand } from './logger.js';

describe('formatCommand', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format complex command with cwd, env, and status', () => {
    vi.spyOn(path, 'relative').mockReturnValue('<CWD>');
    expect(
      formatCommand(
        'npx eslint . --format=json',
        {
          cwd: '<CWD>',
          env: { CP_VERBOSE: true },
        },
        'failure',
      ),
    ).toBe(
      `${ansis.blue('<CWD>')} ${ansis.red('$')} ${ansis.gray('CP_VERBOSE=true')}  npx eslint . --format=json`,
    );
  });

  it.each([
    [undefined, ansis.blue], // default to pending
    ['pending', ansis.blue],
    ['success', ansis.green],
    ['failure', ansis.red],
  ])(`should format command status %s explicitly`, (status, color) => {
    expect(
      formatCommand('npx eslint . --format=json', {}, 'pending'),
    ).toContain(`${color('$')}`);
  });

  it('should include cwd prefix when cwd is provided and different from process.cwd()', () => {
    const mockCwd = path.join(originalCwd, 'src');
    vi.spyOn(path, 'relative').mockReturnValue('src');

    expect(formatCommand('npx -v', { cwd: mockCwd })).toStartWith(
      `${ansis.blue('src')} `,
    );
  });

  it('should not include cwd prefix when cwd is same as process.cwd()', () => {
    vi.spyOn(path, 'relative').mockReturnValue('');
    expect(formatCommand('npx -v', { cwd: originalCwd })).toStartWith(
      `${ansis.blue('$')}`,
    );
  });

  it('should format command with single environment variable', () => {
    const result = formatCommand('npx eslint .', {
      env: { NODE_ENV: 'test' },
    });
    expect(result).toBe(
      `${ansis.blue('$')} ${ansis.gray('NODE_ENV=test')}  npx eslint .`,
    );
  });
});
