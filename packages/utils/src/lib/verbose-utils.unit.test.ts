import { describe, expect, it } from 'vitest';
import { verboseUtils } from './verbose-utils';

describe('verbose-utils', () => {
  it('exec should off by default', () => {
    const spy = vi.fn();
    verboseUtils().exec(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it('exec should work no-verbose', () => {
    const spy = vi.fn();
    verboseUtils(false).exec(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it('exec should work verbose', () => {
    const spy = vi.fn();
    verboseUtils(true).exec(spy);
    expect(spy).toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it('logs should be off by default', () => {
    verboseUtils(false).log('42');
    expect(console.info).not.toHaveBeenCalled();
  });

  it('log should work no-verbose', () => {
    verboseUtils(false).log('42');
    expect(console.info).not.toHaveBeenCalled();
  });

  it('log should work verbose', () => {
    verboseUtils(true).log('42');
    expect(console.info).toHaveBeenCalledWith('42');
  });
});
