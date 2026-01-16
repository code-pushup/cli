import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockSink } from '../../../mocks/sink.mock';
import {
  type PerformanceEntryEncoder,
  PerformanceObserverSink,
} from '../performance-observer';
import type { Recoverable, Sink } from '../sink-source.type.js';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import {
  NodejsProfiler,
  type NodejsProfilerOptions,
  Profiler,
  type ProfilerOptions,
} from './profiler.js';

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

// Mock sink that extends MockSink with Recoverable interface
class MockRecoverableSink extends MockSink implements Recoverable {
  recover(): {
    records: unknown[];
    errors: { lineNo: number; line: string; error: Error }[];
    partialTail: string | null;
  } {
    return {
      records: this.getWrittenItems(),
      errors: [],
      partialTail: null,
    };
  }

  repack(): void {
    // Mock implementation - no-op
  }

  finalize(): void {
    // Mock implementation - no-op
  }
}

// Simple string encoder for testing
const simpleEncoder: PerformanceEntryEncoder<string> = entry => {
  if (entry.entryType === 'measure') {
    return [`${entry.name}:${entry.duration.toFixed(2)}ms`];
  }
  return [];
};

describe('NodejsProfiler', () => {
  const getNodejsProfiler = (
    overrides?: Partial<
      NodejsProfilerOptions<Record<string, ActionTrackEntryPayload>, string>
    >,
  ) => {
    const sink = new MockRecoverableSink();
    const perfObserverSink = new PerformanceObserverSink({
      sink,
      encodePerfEntry: simpleEncoder,
    });

    // Spy on methods
    vi.spyOn(perfObserverSink, 'subscribe');
    vi.spyOn(perfObserverSink, 'unsubscribe');
    vi.spyOn(sink, 'open');
    vi.spyOn(sink, 'close');

    const profiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      sink,
      encodePerfEntry: simpleEncoder,
      ...overrides,
    });

    return { sink, perfObserverSink, profiler };
  };

  it('should export NodejsProfiler class', () => {
    expect(typeof NodejsProfiler).toBe('function');
  });

  it('should have required static structure', () => {
    const proto = NodejsProfiler.prototype;
    expect(typeof proto.measure).toBe('function');
    expect(typeof proto.measureAsync).toBe('function');
    expect(typeof proto.marker).toBe('function');
    expect(typeof proto.setEnabled).toBe('function');
    expect(typeof proto.isEnabled).toBe('function');
  });

  it('should inherit from Profiler', () => {
    expect(Object.getPrototypeOf(NodejsProfiler.prototype)).toBe(
      Profiler.prototype,
    );
  });

  describe('constructor and initialization', () => {
    it('should initialize with sink opened when enabled is true', () => {
      const { sink, perfObserverSink } = getNodejsProfiler({ enabled: true });
      expect(sink.isClosed()).toBe(false);
      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should initialize with sink closed when enabled is false', () => {
      const { sink, perfObserverSink } = getNodejsProfiler({ enabled: false });
      expect(sink.isClosed()).toBe(true);
      expect(sink.open).not.toHaveBeenCalled();
      expect(perfObserverSink.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('setEnabled', () => {
    it('should open sink and subscribe observer when enabling', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: false,
      });

      profiler.setEnabled(true);

      expect(profiler.isEnabled()).toBe(true);
      expect(sink.isClosed()).toBe(false);
      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should close sink and unsubscribe observer when disabling', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      profiler.setEnabled(false);

      expect(profiler.isEnabled()).toBe(false);
      expect(sink.isClosed()).toBe(true);
      expect(sink.close).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent - no-op when setting same state', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      // Should still have the same call counts as initialization
      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

      profiler.setEnabled(true); // Set same state - should not change counts

      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('measurement operations', () => {
    it('should perform measurements when enabled', () => {
      const { sink, profiler } = getNodejsProfiler({ enabled: true });

      const result = profiler.measure('test-op', () => 'success');
      expect(result).toBe('success');

      expect(sink.getWrittenItems()).toHaveLength(1);
    });

    it('should skip sink operations when disabled', () => {
      const { sink, profiler } = getNodejsProfiler({ enabled: false });

      const result = profiler.measure('disabled-op', () => 'success');
      expect(result).toBe('success');

      expect(sink.getWrittenItems()).toHaveLength(0);
    });
  });
});
