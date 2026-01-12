import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installExitHandlers } from './exit-process.js';

describe('exit-process tests', () => {
  const onFatal = vi.fn();
  const onClose = vi.fn();
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
    expect(() => installExitHandlers({ onFatal, onClose })).not.toThrow();

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

  it('should call onFatal with error and kind for uncaughtException', () => {
    expect(() => installExitHandlers({ onFatal })).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onFatal).toHaveBeenCalledWith(testError, 'uncaughtException');
    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onFatal with reason and kind for unhandledRejection', () => {
    expect(() => installExitHandlers({ onFatal })).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onFatal).toHaveBeenCalledWith(testReason, 'unhandledRejection');
    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose and exit with code 0 for SIGINT', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith();
    expect(onFatal).not.toHaveBeenCalled();
  });

  it('should call onClose and exit with code 0 for SIGTERM', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith();
    expect(onFatal).not.toHaveBeenCalled();
  });

  it('should call onClose and exit with code 0 for SIGQUIT', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    (process as any).emit('SIGQUIT');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith();
    expect(onFatal).not.toHaveBeenCalled();
  });

  it('should call onClose for normal exit', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    (process as any).emit('exit');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith();
    expect(onFatal).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});
