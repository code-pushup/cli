import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGNAL_EXIT_CODES, installExitHandlers } from './exit-process.js';

describe('installExitHandlers', () => {
  const onError = vi.fn();
  const onExit = vi.fn();
  const processOnSpy = vi.spyOn(process, 'on');
  const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    [
      'uncaughtException',
      'unhandledRejection',
      'SIGINT',
      'SIGTERM',
      'SIGQUIT',
      'exit',
    ].forEach(event => {
      process.removeAllListeners(event);
    });
  });

  it('should install event listeners for all expected events', () => {
    expect(() => installExitHandlers({ onError, onExit })).not.toThrow();

    expect(processOnSpy).toHaveBeenCalledWith(
      'uncaughtException',
      expect.any(Function),
    );
    expect(processOnSpy).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function),
    );
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGQUIT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));
  });

  it('should call onError with error and kind for uncaughtException', () => {
    expect(() => installExitHandlers({ onError })).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledWith(testError, 'uncaughtException');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onError with reason and kind for unhandledRejection', () => {
    expect(() => installExitHandlers({ onError })).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledWith(testReason, 'unhandledRejection');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGINT', () => {
    expect(() => installExitHandlers({ onExit })).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGTERM', () => {
    expect(() => installExitHandlers({ onExit })).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGTERM, {
      kind: 'signal',
      signal: 'SIGTERM',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGQUIT', () => {
    expect(() => installExitHandlers({ onExit })).not.toThrow();

    (process as any).emit('SIGQUIT');

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGQUIT, {
      kind: 'signal',
      signal: 'SIGQUIT',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit for normal exit', () => {
    expect(() => installExitHandlers({ onExit })).not.toThrow();

    (process as any).emit('exit');

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(undefined, { kind: 'exit' });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});
