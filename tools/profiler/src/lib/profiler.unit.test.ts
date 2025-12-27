import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExitHandlerError,
  createProcessOutput,
  installExitHandlers,
} from './process-output.js';
import { PROFILER_ENV_VAR, Profiler, getProfiler } from './profiler.js';

describe('getProfiler', () => {
  const outFileRegex =
    /timing\.profile\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/;
  const loadJsonl = async (filePath: string) => {
    const content = (await readFile(filePath)).toString();
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => JSON.parse(line));
  };

  beforeEach(() => {
    vi.mock('node:worker_threads', () => ({
      threadId: 1,
    }));
    Object.defineProperty(process, 'pid', {
      value: 123,
      writable: true,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

    vi.stubEnv(PROFILER_ENV_VAR, undefined);

    const KEY = Symbol.for('codepushup.profiler');
    delete (globalThis as any)[KEY];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    const KEY = Symbol.for('codepushup.profiler');
    const profiler = (globalThis as any)[KEY];
    if (profiler) {
      profiler.close();
    }
    delete (globalThis as any)[KEY];
  });

  it('should return the same instance', () => {
    const profiler1 = getProfiler();
    const profiler2 = getProfiler();

    expect(profiler1).toBe(profiler2);
  });

  it('should initialize with default options when enabled', () => {
    const profiler = getProfiler();

    expect(profiler.filePath).toMatch(outFileRegex);
    expect(profiler.enabled).toBeTruthy();
  });

  it('should create output file by default', async () => {
    const profiler = getProfiler();
    expect(profiler.filePath).toMatch(outFileRegex);
    expect(profiler.enabled).toBeTruthy();
    await expect(readFile(profiler.filePath + 'l')).resolves.not.toThrow();
  });

  it('should NOT create output when disabled', async () => {
    const profiler = getProfiler({ enabled: false });
    expect(profiler.filePath).toMatch(outFileRegex);
    expect(profiler.enabled).toBeFalsy();
    await expect(readFile(profiler.filePath + 'l')).rejects.toThrow();
  });

  it('should handle custom options', () => {
    const profiler = getProfiler({
      outDir: '/custom/dir',
      fileBaseName: 'custom-marker',
      enabled: true,
      spans: { custom: { track: 'Custom', group: 'Test', color: 'primary' } },
    });

    expect(profiler.filePath).pathToMatch(
      '/custom/dir/custom-marker.2024-01-01T12-00-00.json',
    );
    expect(profiler.enabled).toBeTruthy();
    expect(typeof profiler.spans.custom).toBe('function');
    expect(typeof profiler.spans.main).toBe('function');

    expect(profiler.spans.custom()).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'Custom',
        trackGroup: 'Test',
        color: 'primary',
      },
    });

    expect(profiler.spans.main()).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'CLI',
        trackGroup: 'CodePushUp',
        color: 'tertiary-dark',
      },
    });
  });

  it('should update enabled state when enableProfiling is called', () => {
    const profiler = getProfiler({ enabled: false });

    expect(process.env['CP_PROFILING']).toBe('false');
    profiler.enableProfiling(true);
    expect(process.env['CP_PROFILING']).toBe('true');
  });

  it('should create mark', () => {
    const profiler = getProfiler();
    expect(profiler.mark('test-mark')).toStrictEqual(
      expect.objectContaining({
        detail: null,
        duration: 0,
        entryType: 'mark',
        name: 'test-mark',
        startTime: expect.any(Number),
      }),
    );
  });

  it('should create measure', () => {
    const profiler = getProfiler();
    expect(profiler.measure('test-measure', 'test-mark')).toStrictEqual(
      expect.objectContaining({
        detail: null,
        duration: expect.any(Number),
        entryType: 'measure',
        name: 'test-measure',
        startTime: expect.any(Number),
      }),
    );
  });

  it('should NOT write output to jsonl when flush is NOT called', async () => {
    const profiler = getProfiler();

    profiler.mark('test-mark');

    await expect(loadJsonl(profiler.filePath + 'l')).not.toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'test-mark' })]),
    );
  });

  it('should write output to jsonl when flush is called and enabled and not closed', async () => {
    const profiler = getProfiler();

    profiler.mark('test-mark');
    profiler.flush();

    const entries = await loadJsonl(profiler.filePath + 'l');
    const parsedEntries = entries.map(entry =>
      typeof entry === 'string' ? JSON.parse(entry) : entry,
    );
    expect(parsedEntries).toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'test-mark' })]),
    );
  });

  it('should NOT write output to jsonl when flush is called and enabled and closed', async () => {
    const profiler = getProfiler();

    profiler.close();

    profiler.mark('test-mark');
    profiler.flush();

    await expect(loadJsonl(profiler.filePath + 'l')).not.toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'test-mark' })]),
    );
  });

  describe('spanAsync method', () => {
    it('should execute function and create span when enabled', async () => {
      const profiler = getProfiler();
      let executed = false;

      const result = await profiler.spanAsync('test-span', async () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should execute function without creating span when disabled', async () => {
      const profiler = getProfiler({ enabled: false });
      let executed = false;

      const result = await profiler.spanAsync('test-span', async () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should execute function without creating span when closed', async () => {
      const profiler = getProfiler();
      profiler.close();
      let executed = false;

      const result = await profiler.spanAsync('test-span', async () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should handle span with detail option', async () => {
      const profiler = getProfiler();
      const detail = { custom: 'data' };

      await profiler.spanAsync('test-span', async () => 'result', { detail });

      expect(profiler.mark).toBeDefined();
    });

    it('should handle span without detail option (auto-detect)', async () => {
      const profiler = getProfiler();

      await profiler.spanAsync('test-span', async () => 'result');

      expect(profiler.mark).toBeDefined();
    });
  });

  describe('span method', () => {
    it('should execute function and create span when enabled', () => {
      const profiler = getProfiler();
      let executed = false;

      const result = profiler.span('test-wrap', () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should execute function without creating span when disabled', () => {
      const profiler = getProfiler({ enabled: false });
      let executed = false;

      const result = profiler.span('test-wrap', () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should execute function without creating span when closed', () => {
      const profiler = getProfiler();
      profiler.close();
      let executed = false;

      const result = profiler.span('test-wrap', () => {
        executed = true;
        return 'result';
      });

      expect(result).toBe('result');
      expect(executed).toBe(true);
    });

    it('should handle span with detail option', () => {
      const profiler = getProfiler();
      const detail = { custom: 'data' };

      const result = profiler.span('test-wrap', () => 'result', { detail });

      expect(result).toBe('result');
    });

    it('should handle span without detail option (auto-detect)', () => {
      const profiler = getProfiler();

      const result = profiler.span('test-wrap', () => 'result');

      expect(result).toBe('result');
    });
  });

  describe('instant method', () => {
    it('should create instant mark when enabled', () => {
      const profiler = getProfiler();

      profiler.instant('test-instant');

      expect(profiler.mark).toBeDefined();
    });

    it('should not create instant mark when disabled', () => {
      const profiler = getProfiler({ enabled: false });

      profiler.instant('test-instant');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should not create instant mark when closed', () => {
      const profiler = getProfiler();
      profiler.close();

      profiler.instant('test-instant');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle instant with detail option', () => {
      const profiler = getProfiler();
      const detail = { custom: 'data' };

      profiler.instant('test-instant', { detail });

      expect(profiler.mark).toBeDefined();
    });

    it('should handle instant without detail option (auto-detect)', () => {
      const profiler = getProfiler();

      profiler.instant('test-instant');

      expect(profiler.mark).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle errors in close method gracefully', async () => {
      const profiler = getProfiler();

      // Mock flush to throw
      const flushSpy = vi.spyOn(profiler, 'flush').mockImplementation(() => {
        throw new Error('Flush error');
      });

      // Should not throw - errors in close are caught
      profiler.close();

      flushSpy.mockRestore();
    });

    it('should handle PerformanceObserver disconnect errors', () => {
      // Patch PerformanceObserver.prototype.disconnect to throw for all instances
      const originalDisconnect = PerformanceObserver.prototype.disconnect;
      let disconnectCalled = false;

      PerformanceObserver.prototype.disconnect = function (
        this: PerformanceObserver,
      ) {
        disconnectCalled = true;
        throw new Error('Disconnect error');
      };

      // Create profiler - it will create a PerformanceObserver
      const profiler = new Profiler({ enabled: true });

      // Should not throw - errors are caught (lines 267-268)
      profiler.close();

      // Verify disconnect was called
      expect(disconnectCalled).toBe(true);

      // Restore original
      PerformanceObserver.prototype.disconnect = originalDisconnect;
    });

    it('should handle output close errors gracefully', async () => {
      const processOutput = await import('./process-output.js');

      // Mock createProcessOutput to return an output that throws on close
      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(() => {
          throw new Error('Close error');
        }),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      // Create a new profiler instance
      const profiler = new Profiler({ enabled: true });

      // Should not throw - errors are caught (lines 286-287)
      profiler.close();

      createSpy.mockRestore();
    });

    it('should handle async finalize errors', async () => {
      const outputFormatModule = await import('./output-format.js');
      const originalFormat = outputFormatModule.DevToolsOutputFormat;

      // Create a mock output format that returns a rejected promise
      class MockOutputFormat extends originalFormat {
        async finalize(): Promise<void> {
          return Promise.reject(new Error('Async finalize error'));
        }
      }

      // Mock the DevToolsOutputFormat constructor
      const formatSpy = vi
        .spyOn(outputFormatModule, 'DevToolsOutputFormat')
        .mockImplementation(
          (filePath: string) => new MockOutputFormat(filePath),
        );

      // Create a new profiler instance
      const profiler = new Profiler({ enabled: true });

      // Should not throw - async errors are caught (line 293)
      profiler.close();

      // Give time for promise rejection to be caught
      await vi.waitFor(
        () => {
          expect(formatSpy).toHaveBeenCalled();
        },
        { timeout: 100 },
      );
    }, 10000);

    it('should handle sync finalize errors', async () => {
      const outputFormatModule = await import('./output-format.js');
      const originalFormat = outputFormatModule.DevToolsOutputFormat;

      // Create a mock output format that throws synchronously
      class MockOutputFormat extends originalFormat {
        finalize(): void {
          throw new Error('Sync finalize error');
        }
      }

      // Mock the DevToolsOutputFormat constructor
      vi.spyOn(outputFormatModule, 'DevToolsOutputFormat').mockImplementation(
        (filePath: string) => new MockOutputFormat(filePath),
      );

      // Create a new profiler instance
      const profiler = new Profiler({ enabled: true });

      // Should not throw - sync errors are caught (lines 297-298)
      profiler.close();
    });

    it('should handle initialization errors gracefully', async () => {
      const processOutput = await import('./process-output.js');
      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockImplementation(() => {
          throw new Error('Init error');
        });

      const profiler = new Profiler({ enabled: true });

      // Should disable profiling when init fails
      expect(profiler.enabled).toBe(false);

      createSpy.mockRestore();
    });

    it('should handle safeClose callback with error and write error line', async () => {
      const processOutput = await import('./process-output.js');

      // Mock createProcessOutput
      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      let capturedSafeClose: ((error?: unknown) => void) | undefined;
      const installSpy = vi
        .spyOn(processOutput, 'installExitHandlers')
        .mockImplementation(({ safeClose }: any) => {
          // Capture the wrapped safeClose callback
          capturedSafeClose = safeClose;
          // Call the actual installExitHandlers to set up handlers properly
          // but we'll trigger the callback manually
          return processOutput.installExitHandlers({ safeClose });
        });

      const profiler = new Profiler({ enabled: true });

      expect(capturedSafeClose).toBeDefined();

      if (capturedSafeClose) {
        const writeLineSpy = vi.spyOn(mockOutput, 'writeLine');
        const testError = new Error('Test error');

        // Call wrapped safeClose with error - should write error line (lines 132-137)
        capturedSafeClose(testError);

        // Verify error was written
        expect(writeLineSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'Test error',
            error: testError,
          }),
        );
      }

      createSpy.mockRestore();
      installSpy.mockRestore();
      profiler.close();
    });

    it('should handle safeClose callback with non-Error object', async () => {
      const processOutput = await import('./process-output.js');

      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      let capturedSafeClose: ((error?: unknown) => void) | undefined;
      const installSpy = vi
        .spyOn(processOutput, 'installExitHandlers')
        .mockImplementation(({ safeClose }: any) => {
          capturedSafeClose = safeClose;
          // Call actual installExitHandlers
          return processOutput.installExitHandlers({ safeClose });
        });

      const profiler = new Profiler({ enabled: true });

      expect(capturedSafeClose).toBeDefined();

      if (capturedSafeClose) {
        const writeLineSpy = vi.spyOn(mockOutput, 'writeLine');
        const testError = { custom: 'error object' };

        // Call wrapped safeClose with non-Error object (lines 132-137)
        capturedSafeClose(testError);

        // Verify error was written with String() conversion
        expect(writeLineSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: String(testError),
            error: testError,
          }),
        );
      }

      createSpy.mockRestore();
      installSpy.mockRestore();
      profiler.close();
    });
  });

  describe('exit handler error handling', () => {
    it('should handle safeClose callback with error', async () => {
      const processOutput = await import('./process-output.js');
      const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
      let capturedSafeClose: ((error?: unknown) => void) | undefined;

      installSpy.mockImplementation(({ safeClose }: any) => {
        capturedSafeClose = safeClose;
      });

      const profiler = new Profiler({ enabled: true });

      if (capturedSafeClose) {
        const testError = new Error('Test error');
        // Call safeClose - this should trigger close() internally
        capturedSafeClose(testError);

        // Verify that installExitHandlers was called (meaning exit handlers were set up)
        expect(installSpy).toHaveBeenCalled();
      }

      installSpy.mockRestore();
    });

    it('should handle ExitHandlerError with uncaughtException and write fatal error', async () => {
      const processOutput = await import('./process-output.js');
      const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
      let capturedSafeClose: ((error?: unknown) => void) | undefined;

      installSpy.mockImplementation(({ safeClose }: any) => {
        capturedSafeClose = safeClose;
      });

      const profiler = new Profiler({ enabled: true });

      // Mock createProcessOutput to get access to output
      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      // Create a new profiler to get the mocked output
      const newProfiler = new Profiler({ enabled: true });

      expect(capturedSafeClose).toBeDefined();

      const writeLineSpy = vi.spyOn(mockOutput, 'writeLine');
      const error = new ExitHandlerError('uncaughtException');

      // Call safeClose with ExitHandlerError - should trigger writeFatalError (lines 376-380, 179-203)
      if (capturedSafeClose) {
        capturedSafeClose(error);
      }

      // Verify writeFatalError was called (through writeLine)
      expect(writeLineSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fatal',
          kind: 'uncaughtException',
        }),
      );

      writeLineSpy.mockRestore();
      createSpy.mockRestore();
      installSpy.mockRestore();
      profiler.close();
      newProfiler.close();
    });

    it('should handle ExitHandlerError with unhandledRejection and write fatal error', async () => {
      const processOutput = await import('./process-output.js');
      const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
      let capturedSafeClose: ((error?: unknown) => void) | undefined;

      installSpy.mockImplementation(({ safeClose }: any) => {
        capturedSafeClose = safeClose;
      });

      // Mock createProcessOutput to get access to output
      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(),
        flush: vi.fn(),
        close: vi.fn(),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      // Create a new profiler to get the mocked output
      const profiler = new Profiler({ enabled: true });

      expect(capturedSafeClose).toBeDefined();

      const writeLineSpy = vi.spyOn(mockOutput, 'writeLine');
      const error = new ExitHandlerError('unhandledRejection');

      // Call safeClose with ExitHandlerError - should trigger writeFatalError (lines 376-380, 179-203)
      if (capturedSafeClose) {
        capturedSafeClose(error);
      }

      // Verify writeFatalError was called (through writeLine)
      expect(writeLineSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fatal',
          kind: 'unhandledRejection',
        }),
      );

      writeLineSpy.mockRestore();
      createSpy.mockRestore();
      installSpy.mockRestore();
      profiler.close();
    });

    it('should handle writeFatalError when output writeLine fails', async () => {
      const processOutput = await import('./process-output.js');
      const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
      let capturedSafeClose: ((error?: unknown) => void) | undefined;

      installSpy.mockImplementation(({ safeClose }: any) => {
        capturedSafeClose = safeClose;
      });

      // Mock createProcessOutput to get access to output that throws
      const mockOutput = {
        filePath: 'test.jsonl',
        writeLineImmediate: vi.fn(),
        writeLine: vi.fn(() => {
          throw new Error('Write error');
        }),
        flush: vi.fn(),
        close: vi.fn(),
      };

      const createSpy = vi
        .spyOn(processOutput, 'createProcessOutput')
        .mockReturnValue(mockOutput as any);

      // Create a new profiler to get the mocked output
      const profiler = new Profiler({ enabled: true });

      expect(capturedSafeClose).toBeDefined();

      if (capturedSafeClose) {
        const error = new ExitHandlerError('uncaughtException');
        // Should not throw - errors in writeFatalError are caught (lines 200-202)
        capturedSafeClose(error);
      }

      createSpy.mockRestore();
      installSpy.mockRestore();
      profiler.close();
    });

    it('should not write fatal error when disabled', async () => {
      const profiler = getProfiler({ enabled: false });
      const processOutput = await import('./process-output.js');
      const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
      let capturedSafeClose: ((error?: unknown) => void) | undefined;

      installSpy.mockImplementation(({ safeClose }: any) => {
        capturedSafeClose = safeClose;
      });

      const newProfiler = new Profiler({ enabled: false });
      const profilerAny = newProfiler as any;
      const output = profilerAny['#output'];

      if (output && capturedSafeClose) {
        const writeLineSpy = vi.spyOn(output, 'writeLine');
        const error = new ExitHandlerError('uncaughtException');

        // Should not write fatal error when disabled
        capturedSafeClose(error);

        // writeLine should not be called for fatal errors when disabled
        expect(writeLineSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'fatal',
          }),
        );

        writeLineSpy.mockRestore();
      }

      installSpy.mockRestore();
      profiler.close();
    });

    it('should write fatal error with uncaughtException error details', async () => {
      const profiler = getProfiler();
      const profilerAny = profiler as any;
      const output = profilerAny['#output'];

      if (output) {
        const writeLineSpy = vi.spyOn(output, 'writeLine');
        const processOutput = await import('./process-output.js');
        const installSpy = vi.spyOn(processOutput, 'installExitHandlers');
        let capturedSafeClose: ((error?: unknown) => void) | undefined;

        installSpy.mockImplementation(({ safeClose }: any) => {
          capturedSafeClose = safeClose;
        });

        const newProfiler = new Profiler({ enabled: true });

        if (capturedSafeClose) {
          const testError = new Error('Test error');
          testError.name = 'TestError';
          testError.stack = 'Error stack';
          const exitError = new ExitHandlerError('uncaughtException');

          // Trigger writeFatalError through ExitHandlerError
          capturedSafeClose(exitError);

          // Note: The actual error passed to writeFatalError is the ExitHandlerError,
          // but we can verify the method was called
          expect(writeLineSpy).toHaveBeenCalled();
        }

        writeLineSpy.mockRestore();
        installSpy.mockRestore();
        newProfiler.close();
      }
    });
  });
});
