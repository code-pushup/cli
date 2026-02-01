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
    expect(() => subscribeProcessExit({ onError, onExit })).not.toThrowError();

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
    expect(() => subscribeProcessExit({ onError })).not.toThrowError();

    const testError = new Error('Test uncaught exception');

    (process as any).emit('uncaughtException', testError);

    expect(onError).toHaveBeenCalledExactlyOnceWith(testError, 'uncaughtException');
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onError with reason and kind for unhandledRejection', () => {
    expect(() => subscribeProcessExit({ onError })).not.toThrowError();

    const testReason = 'Test unhandled rejection';

    (process as any).emit('unhandledRejection', testReason);

    expect(onError).toHaveBeenCalledExactlyOnceWith(testReason, 'unhandledRejection');
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGINT', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrowError();

    (process as any).emit('SIGINT');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGINT, {
      kind: 'signal',
      signal: 'SIGINT',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGTERM', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrowError();

    (process as any).emit('SIGTERM');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGTERM, {
      kind: 'signal',
      signal: 'SIGTERM',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit and exit with code 0 for SIGQUIT', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrowError();

    (process as any).emit('SIGQUIT');

    expect(onExit).toHaveBeenCalledExactlyOnceWith(SIGNAL_EXIT_CODES().SIGQUIT, {
      kind: 'signal',
      signal: 'SIGQUIT',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call onExit for successful process termination with exit code 0', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrowError();

    (process as any).emit('exit', 0);

    expect(onExit).toHaveBeenCalledExactlyOnceWith(0, { kind: 'exit' });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call onExit for failed process termination with exit code 1', () => {
    expect(() => subscribeProcessExit({ onExit })).not.toThrowError();

    (process as any).emit('exit', 1);

    expect(onExit).toHaveBeenCalledExactlyOnceWith(1, { kind: 'exit' });
    expect(onError).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});
