import os from 'node:os';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGNAL_EXIT_CODES, installExitHandlers } from './exit-process.js';

describe('exit-process tests', () => {
  const onError = vi.fn();
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
    expect(() => installExitHandlers({ onError, onClose })).not.toThrow();

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
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onError with reason and kind for unhandledRejection', () => {
    expect(() => installExitHandlers({ onError })).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledWith(testReason, 'unhandledRejection');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose with correct code and reason for SIGINT', () => {
    expect(() =>
      installExitHandlers({ onClose, signalExit: true }),
    ).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT);
  });

  it('should call onClose with correct code and reason for SIGTERM', () => {
    expect(() =>
      installExitHandlers({ onClose, signalExit: true }),
    ).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGTERM, {
      kind: 'signal',
      signal: 'SIGTERM',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGTERM);
  });

  it('should call onClose with correct code and reason for SIGQUIT', () => {
    expect(() =>
      installExitHandlers({ onClose, signalExit: true }),
    ).not.toThrow();

    (process as any).emit('SIGQUIT');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGQUIT, {
      kind: 'signal',
      signal: 'SIGQUIT',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGQUIT);
  });

  it('should not exit process when signalExit is false', () => {
    expect(() =>
      installExitHandlers({ onClose, signalExit: false }),
    ).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should not exit process when signalExit is not set', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGTERM, {
      kind: 'signal',
      signal: 'SIGTERM',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call onClose with exit code and reason for normal exit', () => {
    expect(() => installExitHandlers({ onClose })).not.toThrow();

    const exitCode = 42;
    (process as any).emit('exit', exitCode);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(exitCode, { kind: 'exit' });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call onClose with fatal reason when fatalExit is true', () => {
    expect(() =>
      installExitHandlers({ onError, onClose, fatalExit: true }),
    ).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledWith(testError, 'uncaughtException');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(1, {
      kind: 'fatal',
      fatal: 'uncaughtException',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should use custom fatalExitCode when fatalExit is true', () => {
    expect(() =>
      installExitHandlers({
        onError,
        onClose,
        fatalExit: true,
        fatalExitCode: 42,
      }),
    ).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledWith(testError, 'uncaughtException');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(42, {
      kind: 'fatal',
      fatal: 'uncaughtException',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose with fatal reason for unhandledRejection when fatalExit is true', () => {
    expect(() =>
      installExitHandlers({ onError, onClose, fatalExit: true }),
    ).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledWith(testReason, 'unhandledRejection');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(1, {
      kind: 'fatal',
      fatal: 'unhandledRejection',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct SIGINT exit code on Windows', () => {
    const osSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');
    const exitCodes = SIGNAL_EXIT_CODES();
    expect(exitCodes.SIGINT).toBe(2);
    osSpy.mockRestore();
  });

  it('should have correct SIGINT exit code on Unix-like systems', () => {
    const osSpy = vi.spyOn(os, 'platform').mockReturnValue('linux');
    const exitCodes = SIGNAL_EXIT_CODES();
    expect(exitCodes.SIGINT).toBe(130);
    osSpy.mockRestore();
  });

  it('should calculate Windows exit codes correctly when platform is mocked to Windows', () => {
    const osSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');

    const exitCodes = SIGNAL_EXIT_CODES();

    expect(exitCodes.SIGINT).toBe(2); // SIGINT_CODE = 2 on Windows
    expect(exitCodes.SIGTERM).toBe(143); // 128 + 15 = 143
    expect(exitCodes.SIGQUIT).toBe(131); // 128 + 3 = 131

    osSpy.mockRestore();
  });

  it('should call onClose only once even when close is called multiple times', () => {
    expect(() =>
      installExitHandlers({ onClose, signalExit: true }),
    ).not.toThrow();

    (process as any).emit('SIGINT');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    onClose.mockClear();
    (process as any).emit('SIGTERM');
    expect(onClose).not.toHaveBeenCalled();
    (process as any).emit('exit', 0);
    expect(onClose).not.toHaveBeenCalled();
  });
});
