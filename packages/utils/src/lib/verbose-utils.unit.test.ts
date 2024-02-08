import { beforeAll, describe, expect, it } from 'vitest';
import { ui } from './logging';
import { verboseUtils } from './verbose-utils';

describe('verbose-utils', () => {
  beforeAll(() => {
    ui().switchMode('raw');
  });
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
    expect(ui().logger.getRenderer().getLogs()).toHaveLength(0);
  });

  it('log should work no-verbose', () => {
    verboseUtils(false).log('42');
    expect(ui().logger.getRenderer().getLogs()).toHaveLength(0);
  });

  it('log should work verbose', () => {
    verboseUtils(true).log('42');
    expect(ui().logger.getRenderer().getLogs()[0]?.message).toContain('42');
  });
});
