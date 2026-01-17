import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { Profiler, type ProfilerOptions, profiler } from './profiler.js';
import { isLeaderWal } from './wal.js';

describe('Profiler', () => {
  const getProfiler = (overrides?: Partial<ProfilerOptions>) =>
    new Profiler({
      prefix: 'cp',
      track: 'test-track',
      ...overrides,
    });

  let profilerInstance: Profiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;

    profilerInstance = getProfiler();
  });

  it('constructor should initialize with default enabled state from env', () => {
    vi.stubEnv('CP_PROFILING', 'true');
    const profilerWithEnv = getProfiler();

    expect(profilerWithEnv.isEnabled()).toBe(true);
  });

  it('constructor should override enabled state from options', () => {
    vi.stubEnv('CP_PROFILING', 'false');
    const profilerWithOverride = new Profiler({
      prefix: 'cp',
      track: 'test-track',
      enabled: true,
    });

    expect(profilerWithOverride.isEnabled()).toBe(true);
  });

  it('constructor should use defaults for measure', () => {
    const customProfiler = getProfiler({ color: 'secondary' });

    customProfiler.setEnabled(true);

    const result = customProfiler.measure('test-operation', () => 'success');

    expect(result).toBe('success');

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:test-operation:start',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
              color: 'secondary',
            }),
          },
        }),
        expect.objectContaining({
          name: 'cp:test-operation:end',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
              color: 'secondary',
            }),
          },
        }),
      ]),
    );
    expect(measures).toStrictEqual([
      expect.objectContaining({
        name: 'cp:test-operation',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'track-entry',
            track: 'test-track',
            color: 'secondary',
          }),
        },
      }),
    ]);
  });

  it('constructor should setup tracks with defaults merged', () => {
    const profilerWithTracks = new Profiler({
      prefix: 'cp',
      track: 'default-track',
      trackGroup: 'default-group',
      color: 'primary',
      tracks: {
        custom: { track: 'custom-track', color: 'secondary' },
        partial: { color: 'tertiary' },
      },
    });

    expect(profilerWithTracks.tracks).toStrictEqual({
      custom: {
        track: 'custom-track',
        trackGroup: 'default-group',
        color: 'secondary',
        dataType: 'track-entry',
      },
      partial: {
        track: 'default-track',
        trackGroup: 'default-group',
        color: 'tertiary',
        dataType: 'track-entry',
      },
    });
  });

  it('isEnabled should set and get enabled state', () => {
    expect(profilerInstance.isEnabled()).toBe(false);

    profilerInstance.setEnabled(true);
    expect(profilerInstance.isEnabled()).toBe(true);

    profilerInstance.setEnabled(false);
    expect(profilerInstance.isEnabled()).toBe(false);
  });

  it('isEnabled should update environment variable', () => {
    profilerInstance.setEnabled(true);
    expect(process.env.CP_PROFILING).toBe('true');

    profilerInstance.setEnabled(false);
    expect(process.env.CP_PROFILING).toBe('false');
  });

  it('marker should execute without error when enabled', () => {
    profilerInstance.setEnabled(true);

    expect(() => {
      profilerInstance.marker('test-marker', {
        color: 'primary',
        tooltipText: 'Test marker',
        properties: [['key', 'value']],
      });
    }).not.toThrow();

    const marks = performance.getEntriesByType('mark');
    expect(marks).toStrictEqual([
      expect.objectContaining({
        name: 'test-marker',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'marker',
            color: 'primary',
            tooltipText: 'Test marker',
            properties: [['key', 'value']],
          }),
        },
      }),
    ]);
  });

  it('marker should execute without error when disabled', () => {
    profilerInstance.setEnabled(false);

    expect(() => {
      profilerInstance.marker('test-marker');
    }).not.toThrow();

    const marks = performance.getEntriesByType('mark');
    expect(marks).toHaveLength(0);
  });

  it('marker should execute without error when enabled with default color', () => {
    performance.clearMarks();

    const profilerWithColor = getProfiler({ color: 'primary' });
    profilerWithColor.setEnabled(true);

    expect(() => {
      profilerWithColor.marker('test-marker-default-color', {
        tooltipText: 'Test marker with default color',
      });
    }).not.toThrow();

    const marks = performance.getEntriesByType('mark');
    expect(marks).toStrictEqual([
      expect.objectContaining({
        name: 'test-marker-default-color',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'marker',
            color: 'primary', // Should use default color
            tooltipText: 'Test marker with default color',
          }),
        },
      }),
    ]);
  });

  it('marker should execute without error when enabled with no default color', () => {
    const profilerNoColor = getProfiler();
    profilerNoColor.setEnabled(true);

    expect(() => {
      profilerNoColor.marker('test-marker-no-color', {
        color: 'secondary',
        tooltipText: 'Test marker without default color',
        properties: [['key', 'value']],
      });
    }).not.toThrow();

    const marks = performance.getEntriesByType('mark');
    expect(marks).toStrictEqual([
      expect.objectContaining({
        name: 'test-marker-no-color',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'marker',
            color: 'secondary',
            tooltipText: 'Test marker without default color',
            properties: [['key', 'value']],
          }),
        },
      }),
    ]);
  });

  it('measure should execute work and return result when enabled', () => {
    performance.clearMarks();
    performance.clearMeasures();

    profilerInstance.setEnabled(true);

    const workFn = vi.fn(() => 'result');
    const result = profilerInstance.measure('test-event', workFn, {
      color: 'primary',
    });

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:test-event:start',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
            }),
          },
        }),
        expect.objectContaining({
          name: 'cp:test-event:end',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
            }),
          },
        }),
      ]),
    );
    expect(measures).toStrictEqual([
      expect.objectContaining({
        name: 'cp:test-event',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'track-entry',
            track: 'test-track',
          }),
        },
      }),
    ]);
  });

  it('measure should execute work directly when disabled', () => {
    profilerInstance.setEnabled(false);
    const workFn = vi.fn(() => 'result');
    const result = profilerInstance.measure('test-event', workFn);

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toHaveLength(0);
    expect(measures).toHaveLength(0);
  });

  it('measure should propagate errors when enabled', () => {
    profilerInstance.setEnabled(true);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profilerInstance.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measure should propagate errors when disabled', () => {
    profilerInstance.setEnabled(false);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profilerInstance.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measureAsync should handle async operations correctly when enabled', async () => {
    profilerInstance.setEnabled(true);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profilerInstance.measureAsync(
      'test-async-event',
      workFn,
      {
        color: 'primary',
      },
    );

    expect(result).toBe('async-result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:test-async-event:start',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
              color: 'primary',
            }),
          },
        }),
        expect.objectContaining({
          name: 'cp:test-async-event:end',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'test-track',
              color: 'primary',
            }),
          },
        }),
      ]),
    );
    expect(measures).toStrictEqual([
      expect.objectContaining({
        name: 'cp:test-async-event',
        detail: {
          devtools: expect.objectContaining({
            dataType: 'track-entry',
            track: 'test-track',
            color: 'primary',
          }),
        },
      }),
    ]);
  });

  it('measureAsync should execute async work directly when disabled', async () => {
    profilerInstance.setEnabled(false);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profilerInstance.measureAsync(
      'test-async-event',
      workFn,
    );

    expect(result).toBe('async-result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toHaveLength(0);
    expect(measures).toHaveLength(0);
  });

  it('measureAsync should propagate async errors when enabled', async () => {
    profilerInstance.setEnabled(true);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profilerInstance.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measureAsync should propagate async errors when disabled', async () => {
    profilerInstance.setEnabled(false);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profilerInstance.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });
});

describe('NodeProfiler', () => {
  it('should export profiler instance with NodeProfiler methods', () => {
    expect(profiler).toBeDefined();
    expect(profiler).toBeInstanceOf(Profiler);
    expect(typeof profiler.getFinalPath).toBe('function');
    expect(profiler.getFinalPath()).toBe('trace.json');
  });
});

describe('Profiler constructor - origin PID initialization', () => {
  const originalEnv = { ...process.env };
  const mockPid = 12345;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.unstubAllEnvs();
    // eslint-disable-next-line functional/immutable-data
    process.env = { ...originalEnv };
    // Mock process.pid for consistent testing
    vi.spyOn(process, 'pid', 'get').mockReturnValue(mockPid);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set CP_PROFILER_ORIGIN_PID if not already set', () => {
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILER_ORIGIN_PID;

    new Profiler({ prefix: 'test', track: 'test-track' });

    expect(process.env.CP_PROFILER_ORIGIN_PID).toBe(String(mockPid));
  });

  it('should not override existing CP_PROFILER_ORIGIN_PID', () => {
    const existingPid = '99999';
    vi.stubEnv('CP_PROFILER_ORIGIN_PID', existingPid);

    new Profiler({ prefix: 'test', track: 'test-track' });

    expect(process.env.CP_PROFILER_ORIGIN_PID).toBe(existingPid);
  });
});

describe('isLeaderWal', () => {
  const originalEnv = { ...process.env };
  const mockPid = 12345;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.unstubAllEnvs();
    // eslint-disable-next-line functional/immutable-data
    process.env = { ...originalEnv };
    // Mock process.pid for consistent testing
    vi.spyOn(process, 'pid', 'get').mockReturnValue(mockPid);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when CP_PROFILER_ORIGIN_PID matches current process PID', () => {
    vi.stubEnv('CP_PROFILER_ORIGIN_PID', String(mockPid));

    expect(isLeaderWal('CP_PROFILER_ORIGIN_PID')).toBe(true);
  });

  it('should return false when CP_PROFILER_ORIGIN_PID does not match current process PID', () => {
    vi.stubEnv('CP_PROFILER_ORIGIN_PID', '99999'); // Different PID

    expect(isLeaderWal('CP_PROFILER_ORIGIN_PID')).toBe(false);
  });

  it('should return false when CP_PROFILER_ORIGIN_PID is not set', () => {
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILER_ORIGIN_PID;

    expect(isLeaderWal('CP_PROFILER_ORIGIN_PID')).toBe(false);
  });

  it('should handle string PID values correctly', () => {
    vi.stubEnv('CP_PROFILER_ORIGIN_PID', String(mockPid));

    expect(isLeaderWal('CP_PROFILER_ORIGIN_PID')).toBe(true);
  });
});
