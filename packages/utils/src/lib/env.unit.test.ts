import { coerceBooleanValue, isEnvVarEnabled } from './env.js';
import { ui } from './logging.js';

describe('isEnvVarEnabled', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should consider missing variable disabled', () => {
    vi.stubEnv('CP_VERBOSE', undefined!);
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(false);
  });

  it('should consider "true" enabled', () => {
    vi.stubEnv('CP_VERBOSE', 'true');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(true);
  });

  it('should consider "false" disabled', () => {
    vi.stubEnv('CP_VERBOSE', 'false');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(false);
  });

  it('should consider "1" enabled', () => {
    vi.stubEnv('CP_VERBOSE', '1');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(true);
  });

  it('should consider "0" disabled', () => {
    vi.stubEnv('CP_VERBOSE', '0');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(false);
  });

  it('should log a warning for unexpected values', () => {
    vi.stubEnv('CP_VERBOSE', 'unexpected');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBe(false);
    expect(ui()).toHaveLogged(
      'warn',
      'Environment variable CP_VERBOSE expected to be a boolean (true/false/1/0), but received value unexpected. Treating it as disabled.',
    );
  });
});

describe('coerceBooleanValue', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['True', true],
    ['False', false],
    ['TRUE', true],
    ['FALSE', false],
    ['on', true],
    ['off', false],
    ['yes', true],
    ['no', false],
    ['1', true],
    ['0', false],
    ['42', true],
    ['unknown', undefined],
    [null, undefined],
    [undefined, undefined],
  ])('should coerce value %j to %j', (input, expected) => {
    expect(coerceBooleanValue(input)).toBe(expected);
  });
});
