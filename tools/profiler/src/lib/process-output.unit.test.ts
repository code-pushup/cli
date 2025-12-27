import { vol } from 'memfs';
import * as fs from 'node:fs';
import path from 'node:path';
import {
  type MockInstance,
  type MockedFunction,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { readTextFile } from '@code-pushup/utils';
import {
  ExitHandlerError,
  type ProcessOutput,
  ProcessOutputError,
  createProcessOutput,
  installExitHandlers,
} from './process-output.js';

describe('createProcessOutput', () => {
  let outInst: ProcessOutput | undefined;

  afterEach(() => {
    if (outInst) {
      outInst.close();
      outInst = undefined;
    }
  });

  it('should have the correct file path', () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    expect(outInst).toHaveProperty('filePath', 'test.txt');
  });

  it('should initialize the file on creation', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');
  });

  it('should takeover existing file on creation', async () => {
    vol.fromJSON({ 'test.txt': 'test' }, MEMFS_VOLUME);
    outInst = createProcessOutput({ filePath: 'test.txt' });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('test');
  });

  it('should write JSON lines immediately without buffering when using writeLineImmediate', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should buffer lines without writing to file until flush is called', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');

    outInst.flush();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should create ProcessOutput with custom buffer size', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt', flushEveryN: 2 });
    outInst.writeLine({ test: 42 });
    outInst.writeLine({ test: 43 });
    outInst.writeLine({ test: 44 });

    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n{"test":43}\n');
  });

  it('should flush the remaining buffer on flush call', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.flush();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });
  it('should close the output and flush remaining buffer', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.close();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should not write to file after closing', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.close();
    outInst.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');
  });

  it('should not write to file using writeLineImmediate after closing', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLineImmediate({ test: 1 });
    outInst.close();
    outInst.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":1}\n');
  });

  it('should handle multiple close calls gracefully', async () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.close();
    expect(() => outInst.close()).not.toThrow();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should throw ProcessOutputError when file initialization fails', () => {
    const mkdirError = new Error('dummy');
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw mkdirError;
    });

    expect(() => createProcessOutput({ filePath: 'test.txt' })).toThrow(
      new ProcessOutputError(
        'Failed to initialize file "test.txt"',
        mkdirError,
      ),
    );

    mkdirSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when writeLineImmediate fails', () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });

    const writeError = new Error('Write failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw writeError;
    });

    expect(() => outInst.writeLineImmediate({ test: 42 })).toThrow(
      new ProcessOutputError(
        'Failed to write to file descriptor for "test.txt"',
        writeError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should silently ignore EBADF errors in writeLineImmediate', () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });

    const ebadfError = Object.assign(new Error('bad file descriptor'), {
      code: 'EBADF',
    });
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw ebadfError;
    });

    expect(() => outInst.writeLineImmediate({ test: 42 })).not.toThrow();

    writeSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when flush fails', () => {
    outInst = createProcessOutput({
      filePath: 'test.txt',
      flushEveryN: 1, // Flush immediately
    });

    const flushError = new Error('Flush failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw flushError;
    });

    expect(() => outInst.writeLine({ test: 42 })).toThrow(
      new ProcessOutputError(
        'Failed to flush buffer to file descriptor for "test.txt"',
        flushError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should silently ignore EBADF errors in flush', () => {
    outInst = createProcessOutput({
      filePath: 'test.txt',
      flushEveryN: 1, // Flush immediately
    });

    const ebadfError = Object.assign(new Error('bad file descriptor'), {
      code: 'EBADF',
    });
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw ebadfError;
    });

    expect(() => outInst.writeLine({ test: 42 })).not.toThrow();

    writeSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when close fails', () => {
    outInst = createProcessOutput({ filePath: 'test.txt' });

    const closeError = new Error('Close failed');
    const closeSyncSpy = vi.spyOn(fs, 'closeSync').mockImplementation(() => {
      throw closeError;
    });

    expect(() => outInst.close()).toThrow(
      new ProcessOutputError(
        'Failed to close file descriptor for "test.txt"',
        closeError,
      ),
    );

    closeSyncSpy.mockRestore();
  });

  describe('ProcessOutputError', () => {
    it('should create ProcessOutputError with cause', () => {
      const cause = new Error('Original error');
      const error = new ProcessOutputError('Test message', cause);

      expect(error.message).toBe('Test message');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ProcessOutputError');
    });

    it('should create ProcessOutputError without cause', () => {
      const error = new ProcessOutputError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.cause).toBeUndefined();
      expect(error.name).toBe('ProcessOutputError');
    });
  });

  describe('ExitHandlerError', () => {
    it('should create ExitHandlerError with type', () => {
      const error = new ExitHandlerError('uncaughtException');

      expect(error.message).toBe('uncaughtException');
      expect(error.name).toBe('ExitHandlerError');
    });
  });

  describe('installExitHandlers', () => {
    let safeCloseSpy: MockedFunction<() => void>;
    let processOnSpy: MockInstance<any, any>;
    let envVarBackup: string | undefined;

    beforeEach(() => {
      safeCloseSpy = vi.fn();
      envVarBackup = process.env['EXIT_HANDLERS'];
      processOnSpy = vi.spyOn(process, 'on');
      // Reset the env var
      delete process.env['EXIT_HANDLERS'];
    });

    afterEach(() => {
      process.env['EXIT_HANDLERS'] = envVarBackup;
      processOnSpy.mockRestore();
    });

    it('should install exit handlers', () => {
      installExitHandlers({ safeClose: safeCloseSpy });

      expect(processOnSpy).toHaveBeenCalledWith(
        'beforeExit',
        expect.any(Function),
      );
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith(
        'SIGTERM',
        expect.any(Function),
      );
      expect(processOnSpy).toHaveBeenCalledWith(
        'uncaughtException',
        expect.any(Function),
      );
      expect(processOnSpy).toHaveBeenCalledWith(
        'unhandledRejection',
        expect.any(Function),
      );
      expect(process.env['EXIT_HANDLERS']).toBe('true');
    });

    it('should not install handlers if already installed', () => {
      process.env['EXIT_HANDLERS'] = 'true';

      installExitHandlers({ safeClose: safeCloseSpy });

      expect(processOnSpy).not.toHaveBeenCalled();
    });

    it('should call safeClose on beforeExit', () => {
      installExitHandlers({ safeClose: safeCloseSpy });

      const beforeExitHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'beforeExit',
      )?.[1];
      beforeExitHandler?.();

      expect(safeCloseSpy).toHaveBeenCalledWith();
    });

    it('should call safeClose on exit', () => {
      installExitHandlers({ safeClose: safeCloseSpy });

      const exitHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'exit',
      )?.[1];
      exitHandler?.();

      expect(safeCloseSpy).toHaveBeenCalledWith();
    });

    it('should call safeClose and exit on SIGINT', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(vi.fn());

      installExitHandlers({ safeClose: safeCloseSpy });

      const sigintHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'SIGINT',
      )?.[1];
      sigintHandler?.();

      expect(safeCloseSpy).toHaveBeenCalledWith();
      expect(exitSpy).toHaveBeenCalledWith(130);

      exitSpy.mockRestore();
    });

    it('should call safeClose and exit on SIGTERM', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(vi.fn());

      installExitHandlers({ safeClose: safeCloseSpy });

      const sigtermHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'SIGTERM',
      )?.[1];
      sigtermHandler?.();

      expect(safeCloseSpy).toHaveBeenCalledWith();
      expect(exitSpy).toHaveBeenCalledWith(143);

      exitSpy.mockRestore();
    });

    it('should call safeClose with ExitHandlerError on uncaughtException', () => {
      installExitHandlers({ safeClose: safeCloseSpy });

      const uncaughtExceptionHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'uncaughtException',
      )?.[1];
      const testError = new Error('Test uncaught exception');

      expect(() => uncaughtExceptionHandler?.(testError)).toThrow(testError);
      expect(safeCloseSpy).toHaveBeenCalledWith(
        new ExitHandlerError('uncaughtException'),
      );
    });

    it('should call safeClose on unhandledRejection', () => {
      installExitHandlers({ safeClose: safeCloseSpy });

      const unhandledRejectionHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'unhandledRejection',
      )?.[1];
      const testReason = 'Test unhandled rejection';

      unhandledRejectionHandler?.(testReason);

      expect(safeCloseSpy).toHaveBeenCalledWith(
        new ExitHandlerError('unhandledRejection'),
      );
    });

    it('should use custom env var', () => {
      const customEnvVar = 'CUSTOM_EXIT_HANDLERS';

      installExitHandlers({ safeClose: safeCloseSpy, envVar: customEnvVar });

      expect(process.env[customEnvVar]).toBe('true');
    });
  });
});
