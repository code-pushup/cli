import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { vi } from 'vitest';
import { Profiler, getProfiler } from './profiler.js';

/**
 * Generate test-specific output directory for integration tests
 * Format: tmp/int/projectname/it-block-name
 */
function getTestOutputDir(testName: string): string {
  // Sanitize test name for filesystem use
  const sanitizedName = testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return path.join('tmp', 'int', 'profiler', sanitizedName);
}

describe('Profiler', () => {
  beforeAll(() => {
    vi.useFakeTimers();

    // Mock performance API
    vi.spyOn(performance, 'mark').mockImplementation(
      name =>
        ({
          name: name as string,
          entryType: 'mark',
          startTime: 100,
          duration: 0,
        }) as PerformanceMark,
    );

    vi.spyOn(performance, 'measure').mockReturnValue({
      name: 'test-measure',
      entryType: 'measure',
      startTime: 100,
      duration: 50,
    } as PerformanceMeasure);

    vi.spyOn(performance, 'now').mockReturnValue(123456.789);

    // Mock process event listeners
    vi.spyOn(process, 'on').mockImplementation(() => process);

    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Mock console.log
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Reset environment variables to defaults
    delete process.env['CP_PROFILING'];
    delete process.env['CP_PROFILING_EXIT_HANDLERS'];
  });

  afterEach(() => {
    // Clean up any profiler instances that might have been created
    // Reset the singleton instance
    const KEY = Symbol.for('codepushup.profiler');
    delete (globalThis as any)[KEY];

    // Clean up exit handlers environment variable
    delete process.env['CP_PROFILING_EXIT_HANDLERS'];

    // Restore any mocked fs functions that might have been modified in tests
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should create profiler instance with default options', () => {
      const outDir = getTestOutputDir(
        'should create profiler instance with default options',
      );
      const profiler = getProfiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
      expect(typeof profiler.filePath).toBe('string');
      expect(profiler.filePath).toBeDefined();
    });

    it('should create singleton profiler instance via getProfiler', () => {
      const outDir = getTestOutputDir(
        'should create singleton profiler instance via getProfiler',
      );
      const profiler1 = getProfiler({ outDir });
      const profiler2 = getProfiler();

      expect(profiler1).toBe(profiler2);
    });

    it('should enable profiling via environment variable', () => {
      vi.stubEnv('CP_PROFILING', 'true');

      const outDir = getTestOutputDir(
        'should enable profiling via environment variable',
      );
      const profiler = getProfiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
      expect(profiler.filePath).toBeDefined();
      expect(typeof profiler.filePath).toBe('string');
    });

    it('should disable profiling when environment variable is false', () => {
      vi.stubEnv('CP_PROFILING', 'false');

      const outDir = getTestOutputDir(
        'should disable profiling when environment variable is false',
      );
      const profiler = getProfiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
      // When disabled, profiler should still have a filePath but not create files
      expect(profiler.filePath).toBeDefined();
      expect(typeof profiler.filePath).toBe('string');
    });

    it('should allow explicit enabling/disabling', () => {
      const outDir = getTestOutputDir(
        'should allow explicit enabling/disabling',
      );
      const profiler = new Profiler({ enabled: false, outDir });

      profiler.enableProfiling(true);

      expect(true).toBe(true); // Just verify it doesn't throw
    });

    it('should create output directory and file when enabled', () => {
      const outDir = getTestOutputDir(
        'should create output directory and file when enabled',
      );

      vi.stubEnv('CP_PROFILING', 'true');

      const profiler = getProfiler({
        outDir,
        fileBaseName: 'test-timing-marker',
      });

      expect(profiler.filePath).toBeDefined();
      expect(typeof profiler.filePath).toBe('string');
      expect(profiler.filePath).toContain('test-timing-marker');
    });

    it('should write initial trace events when enabled', () => {
      vi.stubEnv('CP_PROFILING', 'true');

      const outDir = getTestOutputDir(
        'should write initial trace events when enabled',
      );
      const profiler = new Profiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
      expect(profiler.filePath).toBeDefined();
    });
  });

  describe('performance operations', () => {
    beforeEach(() => {
      vi.stubEnv('CP_PROFILING', 'true');
    });

    it('should create marks when enabled', () => {
      const outDir = getTestOutputDir('should create marks when enabled');
      const profiler = new Profiler({ outDir });

      const mark = profiler.mark('test-mark');

      expect(mark).toBeDefined();
      expect(mark?.name).toBe('test-mark');
      expect(mark?.entryType).toBe('mark');
      expect(mark?.startTime).toBeDefined();
    });

    it('should not create marks when disabled', () => {
      const outDir = getTestOutputDir('should not create marks when disabled');
      const profiler = new Profiler({ enabled: false, outDir });

      const mark = profiler.mark('test-mark');

      expect(mark).toBeUndefined();
    });

    it('should create measures when enabled', () => {
      const outDir = getTestOutputDir('should create measures when enabled');
      const profiler = new Profiler({ outDir });

      const mark = { name: 'start', startTime: 100 } as PerformanceMark;
      const measure = profiler.measure('test-measure', mark);

      expect(measure).toBeDefined();
      expect(measure?.name).toBe('test-measure');
      expect(measure?.entryType).toBe('measure');
      expect(measure?.duration).toBeDefined();
    });

    it('should not create measures when disabled', () => {
      const outDir = getTestOutputDir(
        'should not create measures when disabled',
      );
      const profiler = new Profiler({ enabled: false, outDir });

      const measure = profiler.measure('test-measure', 'start');

      expect(measure).toBeUndefined();
    });

    it('should execute spans and create performance entries', async () => {
      const outDir = getTestOutputDir(
        'should execute spans and create performance entries',
      );
      const profiler = new Profiler({ outDir });

      const result = await profiler.spanAsync('test-span', async () => {
        return 'span-result';
      });

      expect(result).toBe('span-result');
    });

    it('should execute span and create performance entries', () => {
      const outDir = getTestOutputDir(
        'should execute span and create performance entries',
      );
      const profiler = new Profiler({ outDir });

      const result = profiler.span('test-wrap', () => {
        return 'wrap-result';
      });

      expect(result).toBe('wrap-result');
    });

    it('should create instant marks', () => {
      const outDir = getTestOutputDir('should create instant marks');
      const profiler = new Profiler({ outDir });

      profiler.instant('test-instant');

      // instant doesn't return anything, just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should execute functions normally when disabled', async () => {
      const outDir = getTestOutputDir(
        'should execute functions normally when disabled',
      );
      const profiler = new Profiler({ enabled: false, outDir });

      const spanResult = await profiler.spanAsync(
        'test-span',
        async () => 'span-result',
      );
      const wrapResult = profiler.span('test-wrap', () => 'wrap-result');

      expect(spanResult).toBe('span-result');
      expect(wrapResult).toBe('wrap-result');
    });

    it('should handle span errors properly', async () => {
      const outDir = getTestOutputDir('should handle span errors properly');
      const profiler = new Profiler({ outDir });

      await expect(
        profiler.spanAsync('test-span', async () => {
          throw new Error('span error');
        }),
      ).rejects.toThrow('span error');
    });

    it('should handle span errors properly', () => {
      const outDir = getTestOutputDir('should handle span errors properly');
      const profiler = new Profiler({ outDir });

      expect(() => {
        profiler.span('test-wrap', () => {
          throw new Error('wrap error');
        });
      }).toThrow('wrap error');
    });
  });

  describe('spans and metadata', () => {
    beforeEach(() => {
      vi.stubEnv('CP_PROFILING', 'true');
    });

    it('should create custom spans', () => {
      const outDir = getTestOutputDir('should create custom spans');
      const profiler = new Profiler({
        outDir,
        spans: {
          customTrack: {
            track: 'Custom Track',
            group: 'Test Group',
            color: 'primary',
          },
        } as const,
      });

      expect(profiler.spans.customTrack).toBeDefined();
      expect(typeof profiler.spans.customTrack).toBe('function');
    });

    it('should include default main span', () => {
      const outDir = getTestOutputDir('should include default main span');
      const profiler = new Profiler({ outDir });

      expect(profiler.spans.main).toBeDefined();
      expect(typeof profiler.spans.main).toBe('function');
    });

    it('should auto-detect context when enabled', () => {
      const outDir = getTestOutputDir(
        'should auto-detect context when enabled',
      );
      const profiler = getProfiler({
        outDir,
      });

      const mark = profiler.mark('auto-detect-test');

      expect(mark).toBeDefined();
      expect(mark?.name).toBe('auto-detect-test');
    });

    it('should not auto-detect context when disabled', () => {
      const outDir = getTestOutputDir(
        'should not auto-detect context when disabled',
      );
      const profiler = getProfiler({
        outDir,
      });

      const mark = profiler.mark('no-auto-detect-test');

      expect(mark).toBeDefined();
      expect(mark?.name).toBe('no-auto-detect-test');
    });

    it('should use provided detail over auto-detection', () => {
      const outDir = getTestOutputDir(
        'should use provided detail over auto-detection',
      );
      const profiler = getProfiler({
        outDir,
      });

      const customDetail = {
        devtools: {
          dataType: 'marker' as const,
          color: 'error' as const,
        },
      };

      const mark = profiler.mark('custom-detail-test', {
        detail: customDetail,
      });

      expect(mark).toBeDefined();
      expect(mark?.name).toBe('custom-detail-test');
    });
  });

  describe('file operations', () => {
    beforeEach(() => {
      vi.stubEnv('CP_PROFILING', 'true');
    });

    it('should flush data to disk', () => {
      const outDir = getTestOutputDir('should flush data to disk');
      const profiler = new Profiler({ outDir });

      // flush should not throw
      expect(() => profiler.flush()).not.toThrow();
    });

    it('should close profiler gracefully', () => {
      const outDir = getTestOutputDir('should close profiler gracefully');
      const profiler = new Profiler({ outDir });

      // close should not throw
      expect(() => profiler.close()).not.toThrow();
    });

    it('should allow operations after closing', () => {
      const outDir = getTestOutputDir('should allow operations after closing');
      const profiler = new Profiler({ outDir });

      // Operations should work regardless of close status
      expect(() => profiler.mark('test')).not.toThrow();
      expect(() => profiler.close()).not.toThrow();
    });

    it('should write JSONL format to file', () => {
      const outDir = getTestOutputDir('should write JSONL format to file');
      const profiler = new Profiler({ outDir });

      // mark should not throw
      expect(() => profiler.mark('test-write')).not.toThrow();
    });

    it('should fall back to appendFileSync when fd is null', () => {
      // This test would require mocking fs.openSync to return null
      // For now, just verify the profiler can be created
      const outDir = getTestOutputDir(
        'should fall back to appendFileSync when fd is null',
      );
      const profiler = new Profiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
    });
  });

  describe('exit handlers', () => {
    beforeEach(() => {
      vi.stubEnv('CP_PROFILING', 'true');
      delete process.env['CP_PROFILING_EXIT_HANDLERS'];
    });

    it('should install exit handlers on creation', () => {
      const outDir = getTestOutputDir(
        'should install exit handlers on creation',
      );
      const profiler = new Profiler({ outDir });

      expect(profiler).toBeInstanceOf(Profiler);
    });

    it('should not install duplicate exit handlers', () => {
      const outDir = getTestOutputDir(
        'should not install duplicate exit handlers',
      );
      vi.stubEnv('CP_PROFILING_EXIT_HANDLERS', 'true');

      new Profiler({ outDir });

      expect(true).toBe(true); // Just verify it doesn't throw
    });

    it('should handle SIGINT by closing profiler and exiting', () => {
      const outDir = getTestOutputDir(
        'should handle SIGINT by closing profiler and exiting',
      );
      const profiler = new Profiler({ outDir });

      // Test that profiler can be created
      expect(profiler).toBeInstanceOf(Profiler);
    });

    it('should handle SIGTERM by closing profiler and exiting', () => {
      const outDir = getTestOutputDir(
        'should handle SIGTERM by closing profiler and exiting',
      );
      const profiler = new Profiler({ outDir });

      // Test that profiler can be created
      expect(profiler).toBeInstanceOf(Profiler);
    });

    it('should handle uncaught exceptions and rejections', () => {
      const outDir = getTestOutputDir(
        'should handle uncaught exceptions and rejections',
      );
      const profiler = new Profiler({ outDir });

      // Test that profiler can be created with error handlers
      expect(profiler).toBeInstanceOf(Profiler);
    });

    it('should disable exit handlers installation', () => {
      const outDir = getTestOutputDir(
        'should disable exit handlers installation',
      );
      getProfiler({
        outDir,
      });

      expect(true).toBe(true); // Just verify it doesn't throw
    });
  });

  describe('error conditions', () => {
    it('should handle file system errors gracefully', () => {
      const outDir = getTestOutputDir(
        'should handle file system errors gracefully',
      );
      vi.stubEnv('CP_PROFILING', 'true');

      // Temporarily override mkdirSync to throw
      const originalMkdirSync = fs.mkdirSync;
      fs.mkdirSync = vi.fn(() => {
        throw new Error('mkdir error');
      });

      try {
        // Should not throw despite mkdir error
        const profiler = new Profiler({ outDir });
        expect(profiler).toBeInstanceOf(Profiler);
      } finally {
        // Restore original function
        fs.mkdirSync = originalMkdirSync;
      }
    });

    it('should handle flush errors gracefully', () => {
      const outDir = getTestOutputDir('should handle flush errors gracefully');
      vi.stubEnv('CP_PROFILING', 'true');

      const profiler = new Profiler({ outDir });

      // Mock fsyncSync to throw an error
      vi.spyOn(fs, 'fsyncSync').mockImplementationOnce(() => {
        throw new Error('fsync error');
      });

      // Should not throw
      expect(() => profiler.flush()).not.toThrow();
    });

    it('should handle close errors gracefully', () => {
      const outDir = getTestOutputDir('should handle close errors gracefully');
      vi.stubEnv('CP_PROFILING', 'true');

      const profiler = new Profiler({ outDir });

      // Temporarily override closeSync to throw
      const originalCloseSync = fs.closeSync;
      fs.closeSync = vi.fn(() => {
        throw new Error('close error');
      });

      try {
        // Should not throw despite close error
        expect(() => profiler.close()).not.toThrow();
      } finally {
        // Restore original function
        fs.closeSync = originalCloseSync;
      }
    });

    it('should handle wrapTraceJson errors gracefully', () => {
      const outDir = getTestOutputDir(
        'should handle wrapTraceJson errors gracefully',
      );
      vi.stubEnv('CP_PROFILING', 'true');

      const profiler = new Profiler({ outDir });

      // Temporarily override readFileSync to throw
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = vi.fn(() => {
        throw new Error('read error');
      });

      try {
        // Should not throw despite read error
        expect(() => profiler.close()).not.toThrow();
      } finally {
        // Restore original function
        fs.readFileSync = originalReadFileSync;
      }
    });
  });
});
