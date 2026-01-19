import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockTraceEventFileSink } from '../../../mocks/sink.mock.js';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import * as PerfObserverModule from '../performance-observer.js';
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
      enabled: false,
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

  it('should create profiler instances', () => {
    const testProfiler = new Profiler({
      prefix: 'cp',
      track: 'test-track',
    });

    expect(testProfiler).toBeDefined();
    expect(typeof testProfiler.measure).toBe('function');
    expect(typeof testProfiler.marker).toBe('function');
  });

  it('constructor should use defaults for measure', () => {
    const customProfiler = getProfiler({ color: 'secondary', enabled: true });

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

  it('base profiler should be active when enabled', () => {
    const enabledProfiler = getProfiler({ enabled: true });
    expect(typeof enabledProfiler.measure).toBe('function');
    expect(typeof enabledProfiler.marker).toBe('function');
    expect(enabledProfiler.isEnabled()).toBe(true);
  });

  it('marker should execute without error when enabled', () => {
    const enabledProfiler = getProfiler({ enabled: true });
    expect(() => {
      enabledProfiler.marker('test-marker', {
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

  it('marker should execute without error when enabled with default color', () => {
    performance.clearMarks();

    const profilerWithColor = getProfiler({ color: 'primary', enabled: true });

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
            color: 'primary',
            tooltipText: 'Test marker with default color',
          }),
        },
      }),
    ]);
  });

  it('marker should execute without error when enabled with no default color', () => {
    const profilerNoColor = getProfiler({ enabled: true });

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

    const enabledProfiler = getProfiler({ enabled: true });
    const workFn = vi.fn(() => 'result');
    const result = enabledProfiler.measure('test-event', workFn, {
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

  it('measure should always execute work function', () => {
    const workFn = vi.fn(() => 'result');
    const result = profiler.measure('test-event', workFn);

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();
  });

  it('measure should propagate errors when enabled', () => {
    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measure should propagate errors', () => {
    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('measureAsync should handle async operations correctly when enabled', async () => {
    const enabledProfiler = getProfiler({ enabled: true });
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await enabledProfiler.measureAsync(
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

  it('measureAsync should propagate async errors when enabled', async () => {
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

const simpleEncoder: PerformanceEntryEncoder<string> = entry => {
  if (entry.entryType === 'measure') {
    return [`${entry.name}:${entry.duration.toFixed(2)}ms`];
  }
  return [];
};

describe('NodejsProfiler', () => {
  const getNodejsProfiler = (
    overrides?: Partial<
      NodejsProfilerOptions<string, Record<string, ActionTrackEntryPayload>>
    >,
  ) => {
    const sink = new MockTraceEventFileSink();

    const mockPerfObserverSink = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn().mockReturnValue(false),
      encode: vi.fn(),
      flush: vi.fn(),
      getStats: vi.fn().mockReturnValue({
        isSubscribed: false,
        queued: 0,
        dropped: 0,
        written: 0,
        maxQueueSize: 10_000,
        flushThreshold: 20,
        addedSinceLastFlush: 0,
        buffered: true,
      }),
    };
    vi.spyOn(PerfObserverModule, 'PerformanceObserverSink').mockReturnValue(
      mockPerfObserverSink as any,
    );

    vi.spyOn(sink, 'open');
    vi.spyOn(sink, 'close');

    const profiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      sink,
      encodePerfEntry: simpleEncoder,
      ...overrides,
    });

    return { sink, perfObserverSink: mockPerfObserverSink, profiler };
  };

  it('should export NodejsProfiler class', () => {
    expect(typeof NodejsProfiler).toBe('function');
  });

  it('should have required static structure', () => {
    const profiler = getNodejsProfiler().profiler;
    expect(typeof profiler.measure).toBe('function');
    expect(typeof profiler.measureAsync).toBe('function');
    expect(typeof profiler.marker).toBe('function');
    expect(typeof profiler.start).toBe('function');
    expect(typeof profiler.stop).toBe('function');
    expect(typeof profiler.close).toBe('function');
    expect(typeof profiler.state).toBe('string');
  });

  it('should inherit from Profiler', () => {
    expect(Object.getPrototypeOf(NodejsProfiler.prototype)).toBe(
      Profiler.prototype,
    );
  });

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

  it('should open sink and subscribe observer when starting', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    profiler.start();

    expect(profiler.state).toBe('running');
    expect(sink.isClosed()).toBe(false);
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
  });

  it('should close sink and unsubscribe observer when stopping', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    profiler.stop();

    expect(profiler.isRunning()).toBe(false);
    expect(profiler.activeat()).toBe(false);
    expect(sink.isClosed()).toBe(true);
    expect(sink.close).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should be idempotent - no-op when setting same state', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    profiler.start();

    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
  });

  it('should perform measurements when enabled', () => {
    const { profiler } = getNodejsProfiler({ enabled: true });

    const result = profiler.measure('test-op', () => 'success');
    expect(result).toBe('success');
  });

  it('should skip sink operations when disabled', () => {
    const { sink, profiler } = getNodejsProfiler({ enabled: false });

    const result = profiler.measure('disabled-op', () => 'success');
    expect(result).toBe('success');

    expect(sink.getWrittenItems()).toHaveLength(0);
  });

  it('should flush buffered performance data to sink', () => {
    const { perfObserverSink, profiler } = getNodejsProfiler({ enabled: true });

    profiler.flush();

    expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
  });

  it('getStats should return current stats', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    expect(profiler.getStats()).toStrictEqual({
      state: 'idle',
      walOpen: false,
      isSubscribed: false,
      queued: 0,
      dropped: 0,
      written: 0,
      maxQueueSize: 10_000,
      flushThreshold: 20,
      addedSinceLastFlush: 0,
      buffered: true,
    });
  });

  describe.todo('state transitions', () => {
    it.todo(
      'should handle full transition matrix: idle → running → idle → closed',
      () => {
        const { sink, perfObserverSink, profiler } = getNodejsProfiler({
          enabled: false,
        });

        // Initial state: idle
        expect(profiler.isRunning()).toBe(false);
        expect(profiler.activeat()).toBe(false);
        expect(sink.isClosed()).toBe(true);
        expect(perfObserverSink.subscribe).not.toHaveBeenCalled();

        // idle → running
        profiler.start();
        expect(profiler.state).toBe('running');
        expect(sink.isClosed()).toBe(false);
        expect(sink.open).toHaveBeenCalledTimes(1);
        expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

        // running → idle
        profiler.stop();
        expect(profiler.isRunning()).toBe(false);
        expect(profiler.activeat()).toBe(false);
        expect(sink.close).toHaveBeenCalledTimes(1);
        expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

        // idle → closed (terminal)
        profiler.close();
        expect(sink.close).toHaveBeenCalledTimes(2); // close called again
        expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(2); // unsubscribe called again
        expect(perfObserverSink.flush).toHaveBeenCalledTimes(1); // flush called once

        // Verify closed state - operations should throw or be idempotent
        expect(() => profiler.start()).toThrow('Profiler already closed');
        expect(() => profiler.stop()).not.toThrow(); // stop is idempotent in closed state
        profiler.close(); // Should be idempotent
      },
    );

    it.todo('should expose state via getter', () => {
      const profiler = getNodejsProfiler({ enabled: false }).profiler;

      expect(profiler.state).toBe('idle');

      profiler.start();
      expect(profiler.state).toBe('running');

      profiler.stop();
      expect(profiler.state).toBe('idle');

      profiler.close();
      expect(profiler.state).toBe('closed');
    });

    it.todo(
      'should maintain state invariant: running ⇒ sink open + observer subscribed',
      () => {
        const { sink, perfObserverSink, profiler } = getNodejsProfiler({
          enabled: false,
        });

        // Initially idle - sink closed, observer not subscribed
        expect(profiler.state).toBe('idle');
        expect(sink.isClosed()).toBe(true);
        expect(perfObserverSink.isSubscribed).toHaveBeenCalledWith(false);

        // Start - should open sink and subscribe observer
        profiler.start();
        expect(profiler.state).toBe('running');
        expect(sink.isClosed()).toBe(false);
        expect(sink.open).toHaveBeenCalledTimes(1);
        expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

        // Stop - should close sink and unsubscribe observer
        profiler.stop();
        expect(profiler.state).toBe('idle');
        expect(sink.close).toHaveBeenCalledTimes(1);
        expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

        // Start again - should open and subscribe again
        profiler.start();
        expect(profiler.state).toBe('running');
        expect(sink.isClosed()).toBe(false);
        expect(sink.open).toHaveBeenCalledTimes(2);
        expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(2);
      },
    );

    it.todo('should handle running → closed transition', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      // Initial state: running
      expect(profiler.state).toBe('running');

      // running → closed
      profiler.close();
      expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
      expect(sink.close).toHaveBeenCalledTimes(1);
    });

    it.todo('should prevent invalid transitions when closed', () => {
      const { profiler } = getNodejsProfiler({ enabled: false });

      // idle → closed
      profiler.close();

      // Should throw for start
      expect(() => profiler.start()).toThrow('Profiler already closed');

      // stop should be safe when closed
      expect(() => profiler.stop()).not.toThrow();
    });

    it('should handle flush when closed (no-op)', () => {
      const { perfObserverSink, profiler } = getNodejsProfiler({
        enabled: false,
      });

      // Close profiler
      profiler.close();

      // flush should be no-op when closed
      profiler.flush();
      expect(perfObserverSink.flush).not.toHaveBeenCalled();
    });

    it('should handle flush when running', () => {
      const { perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      // Should flush when running
      profiler.flush();
      expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent - no-op when transitioning to same state', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      // Already running, start again should be no-op
      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

      profiler.start(); // Should be no-op

      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from measure work function', () => {
      const { profiler } = getNodejsProfiler({ enabled: true });

      const error = new Error('Test error');
      expect(() => {
        profiler.measure('error-test', () => {
          throw error;
        });
      }).toThrow(error);
    });

    it('should propagate errors from measureAsync work function', async () => {
      const { profiler } = getNodejsProfiler({ enabled: true });

      const error = new Error('Async test error');
      await expect(async () => {
        await profiler.measureAsync('async-error-test', async () => {
          throw error;
        });
      }).rejects.toThrow(error);
    });

    it('should skip measurement when profiler is not active', () => {
      const { profiler } = getNodejsProfiler({ enabled: false });

      let workCalled = false;
      const result = profiler.measure('inactive-test', () => {
        workCalled = true;
        return 'result';
      });

      expect(workCalled).toBe(true);
      expect(result).toBe('result');
    });

    it('should skip async measurement when profiler is not active', async () => {
      const { profiler } = getNodejsProfiler({ enabled: false });

      let workCalled = false;
      const result = await profiler.measureAsync(
        'inactive-async-test',
        async () => {
          workCalled = true;
          return 'async-result';
        },
      );

      expect(workCalled).toBe(true);
      expect(result).toBe('async-result');
    });

    it('should skip marker when profiler is not active', () => {
      const { profiler } = getNodejsProfiler({ enabled: false });

      // Should not throw, just return early
      expect(() => {
        profiler.marker('inactive-marker');
      }).not.toThrow();
    });

    describe('base Profiler behavior', () => {
      it('should always be active in base profiler', () => {
        const profiler = new Profiler({
          prefix: 'cp',
          track: 'test-track',
        });

        expect(profiler.isRunning()).toBe(true);
        expect(profiler.activeat()).toBe(true);

        // measure should always execute work
        let workCalled = false;
        const result = profiler.measure('base-test', () => {
          workCalled = true;
          return 'base-result';
        });

        expect(workCalled).toBe(true);
        expect(result).toBe('base-result');

        // marker should always work
        expect(() => {
          profiler.marker('base-marker');
        }).not.toThrow();
      });
    });
  });
});
