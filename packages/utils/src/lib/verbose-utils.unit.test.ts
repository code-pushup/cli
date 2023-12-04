import { describe, expect, it } from 'vitest';
import { verboseUtils } from './verbose-utils';

const verboseHelper = verboseUtils(true);
const noVerboseHelper = verboseUtils(false);

describe('verbose-utils', () => {
  it('exec should work verbose', () => {
    const spy = vi.fn();
    verboseHelper.exec(spy);
    expect(spy).toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it('exec should work no-verbose', () => {
    const spy = vi.fn();
    noVerboseHelper.exec(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it('log should work verbose', () => {
    verboseHelper.log('42');
    expect(console.info).toHaveBeenCalledWith('42');
  });

  it('log should work no-verbose', () => {
    noVerboseHelper.log('42');
    expect(console.info).not.toHaveBeenCalled();
  });
});
