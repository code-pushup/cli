import { describe, expect, it, vi } from 'vitest';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from './logging';
import { verboseUtils } from './verbose-utils';

describe('verbose-utils', () => {
  it('exec should be off by default', () => {
    const spy = vi.fn();
    verboseUtils().exec(spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('exec should work no-verbose', () => {
    const spy = vi.fn();
    verboseUtils(false).exec(spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('exec should work verbose', () => {
    const spy = vi.fn();
    verboseUtils(true).exec(spy);
    expect(spy).toHaveBeenCalled();
  });

  it('logs should be off by default', () => {
    verboseUtils(false).log('42');
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should not print any logs when verbose is off', () => {
    verboseUtils(false).log('42');
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should log when verbose is on', () => {
    verboseUtils(true).log('42');
    expect(getLogMessages(ui().logger)[0]).toContain('42');
  });
});
