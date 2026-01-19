import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeProcessExit } from '../exit-process.js';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { NodeJsProfiler, Profiler, type ProfilerOptions } from './profiler.js';

// Spy on subscribeProcessExit to capture handlers
vi.mock('../exit-process.js');

describe('Profiler', () => {
  const getProfiler = (overrides?: Partial<ProfilerOptions>) =>
    new Profiler({
      prefix: 'cp',
      track: 'test-track',
      ...overrides,
    });

  let profiler: Profiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;

    profiler = getProfiler();
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
    expect(profiler.isEnabled()).toBe(false);

    profiler.setEnabled(true);
    expect(profiler.isEnabled()).toBe(true);

    profiler.setEnabled(false);
    expect(profiler.isEnabled()).toBe(false);
  });

  it('isEnabled should update environment variable', () => {
    profiler.setEnabled(true);
    expect(process.env.CP_PROFILING).toBe('true');

    profiler.setEnabled(false);
    expect(process.env.CP_PROFILING).toBe('false');
  });

  it('marker should execute without error when enabled', () => {
    profiler.setEnabled(true);

    expect(() => {
      profiler.marker('test-marker', {
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
    profiler.setEnabled(false);

    expect(() => {
      profiler.marker('test-marker');
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

    profiler.setEnabled(true);

    const workFn = vi.fn(() => 'result');
    const result = profiler.measure('test-event', workFn, { color: 'primary' });

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
    profiler.setEnabled(false);
    const workFn = vi.fn(() => 'result');
    const result = profiler.measure('test-event', workFn);

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toHaveLength(0);
    expect(measures).toHaveLength(0);
  });

  it('measure should propagate errors when enabled', () => {
    profiler.setEnabled(true);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measure should propagate errors when disabled', () => {
    profiler.setEnabled(false);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measureAsync should handle async operations correctly when enabled', async () => {
    profiler.setEnabled(true);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profiler.measureAsync('test-async-event', workFn, {
      color: 'primary',
    });

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
    profiler.setEnabled(false);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profiler.measureAsync('test-async-event', workFn);

    expect(result).toBe('async-result');
    expect(workFn).toHaveBeenCalled();

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toHaveLength(0);
    expect(measures).toHaveLength(0);
  });

  it('measureAsync should propagate async errors when enabled', async () => {
    profiler.setEnabled(true);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profiler.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measureAsync should propagate async errors when disabled', async () => {
    profiler.setEnabled(false);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profiler.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });
});
describe('NodeJsProfiler', () => {
  const mockSubscribeProcessExit = vi.mocked(subscribeProcessExit);

  let capturedOnError:
    | ((
        error: unknown,
        kind: 'uncaughtException' | 'unhandledRejection',
      ) => void)
    | undefined;
  let capturedOnExit:
    | ((code: number, reason: import('../exit-process.js').CloseReason) => void)
    | undefined;
  const createProfiler = (overrides?: Partial<ProfilerOptions>) =>
    new NodeJsProfiler({
      prefix: 'cp',
      track: 'test-track',
      format: {
        encode: v => JSON.stringify(v),
      },
      ...overrides,
    });

  let profiler: NodeJsProfiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    capturedOnError = undefined;
    capturedOnExit = undefined;

    mockSubscribeProcessExit.mockImplementation(options => {
      capturedOnError = options?.onError;
      capturedOnExit = options?.onExit;
      return vi.fn();
    });

    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;
  });

  it('installs exit handlers on construction', () => {
    expect(() => createProfiler()).not.toThrow();

    expect(mockSubscribeProcessExit).toHaveBeenCalledWith({
      onError: expect.any(Function),
      onExit: expect.any(Function),
    });
  });

  it('setEnabled toggles profiler state', () => {
    profiler = createProfiler({ enabled: true });
    expect(profiler.isEnabled()).toBe(true);

    profiler.setEnabled(false);
    expect(profiler.isEnabled()).toBe(false);

    profiler.setEnabled(true);
    expect(profiler.isEnabled()).toBe(true);
  });

  it('marks fatal errors and shuts down profiler on uncaughtException', () => {
    profiler = createProfiler({ enabled: true });

    const testError = new Error('Test fatal error');
    capturedOnError?.call(profiler, testError, 'uncaughtException');

    expect(performance.getEntriesByType('mark')).toStrictEqual([
      {
        name: 'Fatal Error',
        detail: {
          devtools: {
            color: 'error',
            dataType: 'marker',
            properties: [
              ['Error Type', 'Error'],
              ['Error Message', 'Test fatal error'],
            ],
            tooltipText: 'uncaughtException caused fatal error',
          },
        },
        duration: 0,
        entryType: 'mark',
        startTime: 0,
      },
    ]);
  });

  it('marks fatal errors and shuts down profiler on unhandledRejection', () => {
    profiler = createProfiler({ enabled: true });
    expect(profiler.isEnabled()).toBe(true);

    capturedOnError?.call(
      profiler,
      new Error('Test fatal error'),
      'unhandledRejection',
    );

    expect(performance.getEntriesByType('mark')).toStrictEqual([
      {
        name: 'Fatal Error',
        detail: {
          devtools: {
            color: 'error',
            dataType: 'marker',
            properties: [
              ['Error Type', 'Error'],
              ['Error Message', 'Test fatal error'],
            ],
            tooltipText: 'unhandledRejection caused fatal error',
          },
        },
        duration: 0,
        entryType: 'mark',
        startTime: 0,
      },
    ]);
  });
  it('shutdown method shuts down profiler', () => {
    profiler = createProfiler({ enabled: true });
    const setEnabledSpy = vi.spyOn(profiler, 'setEnabled');
    const sinkCloseSpy = vi.spyOn((profiler as any).sink, 'close');
    expect(profiler.isEnabled()).toBe(true);

    (profiler as any).shutdown();

    expect(setEnabledSpy).toHaveBeenCalledTimes(1);
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
    expect(sinkCloseSpy).toHaveBeenCalledTimes(1);
    expect(profiler.isEnabled()).toBe(false);
  });
  it('exit handler shuts down profiler', () => {
    profiler = createProfiler({ enabled: true });
    const shutdownSpy = vi.spyOn(profiler, 'shutdown' as any);
    expect(profiler.isEnabled()).toBe(true);

    capturedOnExit?.(0, { kind: 'exit' });

    expect(profiler.isEnabled()).toBe(false);
    expect(shutdownSpy).toHaveBeenCalledTimes(1);
  });

  it('close method shuts down profiler', () => {
    profiler = createProfiler({ enabled: true });
    const shutdownSpy = vi.spyOn(profiler, 'shutdown' as any);
    expect(profiler.isEnabled()).toBe(true);

    profiler.close();

    expect(shutdownSpy).toHaveBeenCalledTimes(1);
    expect(profiler.isEnabled()).toBe(false);
  });

  it('error handler does nothing when profiler is disabled', () => {
    profiler = createProfiler({ enabled: false }); // Start disabled
    expect(profiler.isEnabled()).toBe(false);

    const testError = new Error('Test error');
    capturedOnError?.call(profiler, testError, 'uncaughtException');

    // Should not create any marks when disabled
    expect(performance.getEntriesByType('mark')).toHaveLength(0);
  });

  it('exit handler does nothing when profiler is disabled', () => {
    profiler = createProfiler({ enabled: false }); // Start disabled
    expect(profiler.isEnabled()).toBe(false);

    // Should not call shutdown when disabled
    const shutdownSpy = vi.spyOn(profiler, 'shutdown' as any);
    capturedOnExit?.(0, { kind: 'exit' });

    expect(shutdownSpy).not.toHaveBeenCalled();
  });
});
