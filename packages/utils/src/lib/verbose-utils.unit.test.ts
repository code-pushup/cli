import { describe, expect, it, vi } from 'vitest';
import { ui } from './logging.js';
import { verboseUtils } from './verbose-utils.js';

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
    expect(ui()).not.toHaveLogged();
  });

  it('should not print any logs when verbose is off', () => {
    verboseUtils(false).log('42');
    expect(ui()).not.toHaveLogged();
  });

  it('should log when verbose is on', () => {
    verboseUtils(true).log('42');
    expect(ui()).toHaveLoggedMessageContaining('42');
  });
});
