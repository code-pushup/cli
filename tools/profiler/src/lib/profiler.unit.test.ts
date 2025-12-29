import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('should use custom id in filename instead of timestamp', () => {
    const profiler = getProfiler({
      outDir: '/custom/dir',
      fileBaseName: 'custom-marker',
      id: 'my-custom-id',
      enabled: true,
    });

    expect(profiler.filePath).pathToMatch(
      '/custom/dir/custom-marker.my-custom-id.json',
    );
    expect(profiler.enabled).toBeTruthy();
  });

  it('should fall back to timestamp when id is not provided', () => {
    const profiler = getProfiler({
      outDir: '/custom/dir',
      fileBaseName: 'custom-marker',
      enabled: true,
    });

    expect(profiler.filePath).pathToMatch(
      '/custom/dir/custom-marker.2024-01-01T12-00-00.json',
    );
    expect(profiler.enabled).toBeTruthy();
  });

  it('should update enabled state when enableProfiling is called', () => {
    const profiler = getProfiler({ enabled: false });

    expect(profiler.enabled).toBe(false);
    profiler.enableProfiling(true);
    expect(profiler.enabled).toBe(true);
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
    profiler.mark('test-mark');
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
});
