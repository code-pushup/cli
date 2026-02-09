import os from 'node:os';
import process from 'node:process';
import { SIGNAL_EXIT_CODES, subscribeProcessExit } from './exit-process.js';

describe('subscribeProcessExit', () => {
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
    expect(() => subscribeProcessExit({ onError, onExit })).not.toThrow();

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
    expect(() => subscribeProcessExit({ onError })).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      testError,
      'uncaughtException',
    );
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onError with reason and kind for unhandledRejection', () => {
    expect(() => subscribeProcessExit({ onError })).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      testReason,
      'unhandledRejection',
    );
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onExit with correct code and reason for SIGINT', () => {
    expect(() =>
      subscribeProcessExit({ onExit, exitOnSignal: true }),
    ).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGINT);
  });

  it('should call onExit with correct code and reason for SIGTERM', () => {
    expect(() =>
      subscribeProcessExit({ onExit, exitOnSignal: true }),
    ).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(
      SIGNAL_EXIT_CODES().SIGTERM,
      {
        kind: 'signal',
        signal: 'SIGTERM',
      },
    );
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGTERM);
  });

  it('should call onExit with correct code and reason for SIGQUIT', () => {
    expect(() =>
      subscribeProcessExit({ onExit, exitOnSignal: true }),
    ).not.toThrow();

    (process as any).emit('SIGQUIT');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(
      SIGNAL_EXIT_CODES().SIGQUIT,
      {
        kind: 'signal',
        signal: 'SIGQUIT',
      },
    );
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(SIGNAL_EXIT_CODES().SIGQUIT);
  });

  it('should not exit process when exitOnSignal is false', () => {
    expect(() =>
      subscribeProcessExit({ onExit, exitOnSignal: false }),
    ).not.toThrow();

    (process as any).emit('SIGINT');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should not exit process when exitOnSignal is not set', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrow();

    (process as any).emit('SIGTERM');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(
      SIGNAL_EXIT_CODES().SIGTERM,
      {
        kind: 'signal',
        signal: 'SIGTERM',
      },
    );
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call onExit with exit code and reason for normal exit', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrow();

    const exitCode = 42;
    (process as any).emit('exit', exitCode);

    expect(onExit).toHaveBeenCalledExactlyOnceWith(exitCode, { kind: 'exit' });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call onExit with fatal reason when exitOnFatal is true', () => {
    expect(() =>
      subscribeProcessExit({ onError, onExit, exitOnFatal: true }),
    ).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      testError,
      'uncaughtException',
    );
    expect(onExit).toHaveBeenCalledExactlyOnceWith(1, {
      kind: 'fatal',
      fatal: 'uncaughtException',
    });
  });

  it('should use custom fatalExitCode when exitOnFatal is true', () => {
    expect(() =>
      subscribeProcessExit({
        onError,
        onExit,
        exitOnFatal: true,
        fatalExitCode: 42,
      }),
    ).not.toThrow();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      testError,
      'uncaughtException',
    );
    expect(onExit).toHaveBeenCalledExactlyOnceWith(42, {
      kind: 'fatal',
      fatal: 'uncaughtException',
    });
  });

  it('should call onExit with fatal reason for unhandledRejection when exitOnFatal is true', () => {
    expect(() =>
      subscribeProcessExit({ onError, onExit, exitOnFatal: true }),
    ).not.toThrow();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      testReason,
      'unhandledRejection',
    );
    expect(onExit).toHaveBeenCalledExactlyOnceWith(1, {
      kind: 'fatal',
      fatal: 'unhandledRejection',
    });
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

  it('should call onExit only once even when close is called multiple times', () => {
    expect(() =>
      subscribeProcessExit({ onExit, exitOnSignal: true }),
    ).not.toThrow();

    (process as any).emit('SIGINT');
    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    onExit.mockClear();
    (process as any).emit('SIGTERM');
    expect(onExit).not.toHaveBeenCalled();
    (process as any).emit('exit', 0);
    expect(onExit).not.toHaveBeenCalled();
  });
});
