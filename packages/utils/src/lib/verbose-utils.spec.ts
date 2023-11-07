import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, unmockConsole } from '../../test';
import { verboseUtils } from './verbose-utils';

const verboseHelper = verboseUtils(true);
const noVerboseHelper = verboseUtils(false);
describe('verbose-utils', () => {
  let logs: string[] = [];
  beforeEach(() => {
    mockConsole(args => logs.push(args));
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('exec should work verbose', () => {
    const spy = vi.fn();
    verboseHelper.exec(spy);
    expect(spy).toHaveBeenCalled();
    expect(logs).toHaveLength(0);
  });

  it('exec should work no-verbose', () => {
    const spy = vi.fn();
    noVerboseHelper.exec(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(logs).toHaveLength(0);
  });

  it('log should work verbose', () => {
    verboseHelper.log('42');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toBe('42');
  });

  it('log should work no-verbose', () => {
    noVerboseHelper.log('42');
    expect(logs).toHaveLength(0);
  });
});
