import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { formatCommandLog } from './format-command-log.js';

describe('formatCommandLog', () => {
  it('should format simple command', () => {
    const result = removeColorCodes(
      formatCommandLog('npx', ['command', '--verbose']),
    );

    expect(result).toBe('$ npx command --verbose');
  });

  it('should format simple command with explicit process.cwd()', () => {
    const result = removeColorCodes(
      formatCommandLog('npx', ['command', '--verbose'], process.cwd()),
    );

    expect(result).toBe('$ npx command --verbose');
  });

  it('should format simple command with relative cwd', () => {
    const result = removeColorCodes(
      formatCommandLog('npx', ['command', '--verbose'], './wololo'),
    );

    expect(result).toBe(`wololo $ npx command --verbose`);
  });

  it('should format simple command with absolute non-current path converted to relative', () => {
    const result = removeColorCodes(
      formatCommandLog(
        'npx',
        ['command', '--verbose'],
        path.join(process.cwd(), 'tmp'),
      ),
    );
    expect(result).toBe('tmp $ npx command --verbose');
  });

  it('should format simple command with relative cwd in parent folder', () => {
    const result = removeColorCodes(
      formatCommandLog('npx', ['command', '--verbose'], '..'),
    );

    expect(result).toBe(`.. $ npx command --verbose`);
  });

  it('should format simple command using relative path to parent directory', () => {
    const result = removeColorCodes(
      formatCommandLog(
        'npx',
        ['command', '--verbose'],
        path.dirname(process.cwd()),
      ),
    );

    expect(result).toBe('.. $ npx command --verbose');
  });
});
