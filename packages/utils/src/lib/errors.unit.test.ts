import { stringifyError } from './errors';

describe('stringifyError', () => {
  it('should use only message from plain Error instance', () => {
    expect(stringifyError(new Error('something went wrong'))).toBe(
      'something went wrong',
    );
  });

  it('should use class name and message from Error extensions', () => {
    expect(stringifyError(new TypeError('invalid value'))).toBe(
      'TypeError: invalid value',
    );
  });

  it('should keep strings "as is"', () => {
    expect(stringifyError('something went wrong')).toBe('something went wrong');
  });

  it('should format objects as JSON', () => {
    expect(stringifyError({ status: 400, statusText: 'Bad Request' })).toBe(
      '{"status":400,"statusText":"Bad Request"}',
    );
  });
});
