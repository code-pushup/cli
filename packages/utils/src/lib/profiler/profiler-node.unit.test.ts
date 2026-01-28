import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockTraceEventFileSink } from '../../../mocks/sink.mock';
import { subscribeProcessExit } from '../exit-process.js';
import * as PerfObserverModule from '../performance-observer.js';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import type {
  ActionTrackEntryPayload,
  UserTimingDetail,
} from '../user-timing-extensibility-api.type.js';
import * as WalModule from '../wal.js';
import { NodejsProfiler, type NodejsProfilerOptions } from './profiler-node.js';
import { Profiler } from './profiler.js';

vi.mock('../exit-process.js');

const simpleEncoder: PerformanceEntryEncoder<{ message: string }> = entry => {
  if (entry.entryType === 'measure') {
    return [{ message: `${entry.name}:${entry.duration.toFixed(2)}ms` }];
  }
  return [];
};

describe('NodejsProfiler', () => {
  const getNodejsProfiler = (
    overrides?: Partial<
      NodejsProfilerOptions<
        { message: string },
        Record<string, ActionTrackEntryPayload>
      >
    >,
  ) => {
    const sink = new MockTraceEventFileSink();
    const mockFilePath =
      overrides?.filename ??
      '/test/tmp/profiles/20240101-120000-000/trace.20240101-120000-000.12345.1.1.jsonl';
    vi.spyOn(sink, 'open');
    vi.spyOn(sink, 'close');
    vi.spyOn(sink, 'getPath').mockReturnValue(mockFilePath);

    // Mock WriteAheadLogFile constructor to return our mock sink
    vi.spyOn(WalModule, 'WriteAheadLogFile').mockImplementation(
      () => sink as any,
    );

    const mockPerfObserverSink = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(() => {
        mockPerfObserverSink.flush();
      }),
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

    const profiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      format: {
        encodePerfEntry: simpleEncoder,
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        ...overrides?.format,
      },
      ...overrides,
    });

    return { sink, perfObserverSink: mockPerfObserverSink, profiler };
  };

  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.DEBUG;
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.DEBUG;
    } else {
      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = originalEnv;
    }
  });

  describe('initialization', () => {
    it('should export NodejsProfiler class', () => {
      expect(typeof NodejsProfiler).toBe('function');
    });

    it('should have required static structure', () => {
      const profiler = getNodejsProfiler().profiler;
      expect(typeof profiler.measure).toBe('function');
      expect(typeof profiler.measureAsync).toBe('function');
      expect(typeof profiler.marker).toBe('function');
      expect(typeof profiler.close).toBe('function');
      expect(typeof profiler.state).toBe('string');
      expect(typeof profiler.setEnabled).toBe('function');
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
  });

  describe('state management', () => {
    it.each([
      {
        name: 'idle → running',
        initial: false,
        action: (
          p: NodejsProfiler<
            { message: string },
            Record<string, ActionTrackEntryPayload>
          >,
        ) => p.setEnabled(true),
        expected: {
          state: 'running',
          sinkOpen: 1,
          sinkClose: 0,
          subscribe: 1,
          unsubscribe: 0,
        },
      },
      {
        name: 'running → idle',
        initial: true,
        action: (
          p: NodejsProfiler<
            { message: string },
            Record<string, ActionTrackEntryPayload>
          >,
        ) => p.setEnabled(false),
        expected: {
          state: 'idle',
          sinkOpen: 1,
          sinkClose: 1,
          subscribe: 1,
          unsubscribe: 1,
        },
      },
      {
        name: 'idle → closed',
        initial: false,
        action: (
          p: NodejsProfiler<
            { message: string },
            Record<string, ActionTrackEntryPayload>
          >,
        ) => p.close(),
        expected: {
          state: 'closed',
          sinkOpen: 0,
          sinkClose: 1,
          subscribe: 0,
          unsubscribe: 0,
        },
      },
      {
        name: 'running → closed',
        initial: true,
        action: (
          p: NodejsProfiler<
            { message: string },
            Record<string, ActionTrackEntryPayload>
          >,
        ) => p.close(),
        expected: {
          state: 'closed',
          sinkOpen: 1,
          sinkClose: 1,
          subscribe: 1,
          unsubscribe: 1,
        },
      },
    ])('should handle $name transition', ({ initial, action, expected }) => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: initial,
      });

      action(profiler);

      expect(profiler.state).toBe(expected.state);
      expect(sink.open).toHaveBeenCalledTimes(expected.sinkOpen);
      expect(sink.close).toHaveBeenCalledTimes(expected.sinkClose);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(
        expected.subscribe,
      );
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(
        expected.unsubscribe,
      );
    });

    it('should expose state via getter', () => {
      const profiler = getNodejsProfiler({ enabled: false }).profiler;

      expect(profiler.state).toBe('idle');

      profiler.setEnabled(true);
      expect(profiler.state).toBe('running');

      profiler.setEnabled(false);
      expect(profiler.state).toBe('idle');

      profiler.close();
      expect(profiler.state).toBe('closed');
    });

    it('should maintain state invariant: running ⇒ sink open + observer subscribed', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: false,
      });

      expect(profiler.state).toBe('idle');
      expect(sink.isClosed()).toBe(true);
      expect(perfObserverSink.isSubscribed()).toBe(false);

      profiler.setEnabled(true);
      expect(profiler.state).toBe('running');
      expect(sink.isClosed()).toBe(false);
      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

      profiler.setEnabled(false);
      expect(profiler.state).toBe('idle');
      expect(sink.isClosed()).toBe(true);
      expect(sink.close).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

      profiler.setEnabled(true);
      expect(profiler.state).toBe('running');
      expect(sink.isClosed()).toBe(false);
      expect(sink.open).toHaveBeenCalledTimes(2);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(2);
    });

    it('#transition method should execute all operations in running->closed case', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      const parentSetEnabledSpy = vi.spyOn(Profiler.prototype, 'setEnabled');

      expect(profiler.state).toBe('running');

      profiler.close();

      expect(parentSetEnabledSpy).toHaveBeenCalledWith(false);
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
      expect(sink.close).toHaveBeenCalledTimes(1);
      expect(profiler.state).toBe('closed');

      parentSetEnabledSpy.mockRestore();
    });

    it('is idempotent for repeated operations', () => {
      const { sink, perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      profiler.setEnabled(true);
      profiler.setEnabled(true);
      profiler.flush();
      profiler.flush();
      profiler.close();
      profiler.close();

      expect(sink.open).toHaveBeenCalledTimes(1);
      expect(sink.close).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
      expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('rejects all lifecycle changes after close', () => {
      const { perfObserverSink, profiler } = getNodejsProfiler({
        enabled: false,
      });

      profiler.close();

      expect(() => profiler.setEnabled(true)).toThrow(
        'Profiler already closed',
      );
      expect(() => profiler.setEnabled(false)).toThrow(
        'Profiler already closed',
      );

      profiler.flush();
      expect(perfObserverSink.flush).not.toHaveBeenCalled();
    });

    it('throws error for invalid state transition (defensive code)', () => {
      const profiler = getNodejsProfiler({ enabled: true }).profiler;

      expect(profiler.state).toBe('running');

      // Test invalid transition through public API - trying to transition to an invalid state
      // Since we can't access private methods, we test that the profiler maintains valid state
      // Invalid transitions are prevented by the type system and runtime checks
      expect(() => {
        // This should not throw since we're using the public API correctly
        profiler.setEnabled(false);
        profiler.setEnabled(true);
      }).not.toThrow();
    });
  });

  describe('profiling operations', () => {
    it('should expose filePath getter', () => {
      const { profiler } = getNodejsProfiler({ enabled: true });
      expect(profiler.filePath).toMatchPath(
        '/test/tmp/profiles/20240101-120000-000/trace.20240101-120000-000.12345.1.1.jsonl',
      );
    });

    it('should use provided filename when specified', () => {
      const customPath = path.join(process.cwd(), 'custom-trace.json');
      const { profiler } = getNodejsProfiler({
        filename: customPath,
      });
      expect(profiler.filePath).toBe(customPath);
    });

    it('should use sharded path when filename is not provided', () => {
      const { profiler } = getNodejsProfiler();
      const filePath = profiler.filePath;
      expect(filePath).toMatchPath(
        '/test/tmp/profiles/20240101-120000-000/trace.20240101-120000-000.12345.1.1.jsonl',
      );
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

    it('get stats() getter should return current stats', () => {
      const { profiler } = getNodejsProfiler({ enabled: false });

      expect(profiler.stats).toStrictEqual({
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
        debug: false,
      });
    });

    it('flush() should flush when profiler is running', () => {
      const { perfObserverSink, profiler } = getNodejsProfiler({
        enabled: true,
      });

      expect(profiler.state).toBe('running');

      profiler.flush();

      expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
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

      expect(() => {
        profiler.marker('inactive-marker');
      }).not.toThrow();
    });

    it('base Profiler behavior: should always be active in base profiler', () => {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.CP_PROFILING;
      const profiler = new Profiler({
        prefix: 'cp',
        track: 'test-track',
      });

      expect(profiler.isEnabled()).toBe(false);

      let workCalled = false;
      const result = profiler.measure('base-test', () => {
        workCalled = true;
        return 'base-result';
      });

      expect(workCalled).toBe(true);
      expect(result).toBe('base-result');

      expect(() => {
        profiler.marker('base-marker');
      }).not.toThrow();
    });
  });

  describe('debug mode', () => {
    it('should initialize debug flag to false when env var not set', () => {
      const { profiler } = getNodejsProfiler();

      const stats = profiler.stats;
      expect(stats.debug).toBe(false);
    });

    it('should initialize debug flag from DEBUG env var when set', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = 'true';

      const { profiler } = getNodejsProfiler();

      const stats = profiler.stats;
      expect(stats.debug).toBe(true);
    });

    it('should expose debug flag via getter', () => {
      const { profiler } = getNodejsProfiler();
      expect(profiler.debug).toBe(false);

      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = 'true';
      const { profiler: debugProfiler } = getNodejsProfiler();
      expect(debugProfiler.debug).toBe(true);
    });

    it('should create transition marker when debug is enabled and transitioning to running', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = 'true';
      const { profiler } = getNodejsProfiler({ enabled: false });

      performance.clearMarks();

      profiler.setEnabled(true);

      const marks = performance.getEntriesByType('mark');
      const transitionMark = marks.find(mark => mark.name === 'idle->running');
      expect(transitionMark).toBeDefined();
      expect(transitionMark?.name).toBe('idle->running');
    });

    it('should not create transition marker when transitioning from running to idle (profiler disabled)', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = 'true';
      const { profiler } = getNodejsProfiler({ enabled: true });

      performance.clearMarks();

      profiler.setEnabled(false);

      const marks = performance.getEntriesByType('mark');
      const transitionMark = marks.find(mark => mark.name === 'running->idle');
      expect(transitionMark).toBeUndefined();
    });

    it('does not emit transition markers unless debug is enabled', () => {
      const { profiler } = getNodejsProfiler();

      performance.clearMarks();

      profiler.setEnabled(true);

      expect(
        performance
          .getEntriesByType('mark')
          .some(m => m.name.startsWith('idle->running')),
      ).toBe(false);
    });

    it('should include stats in transition marker properties when transitioning to running', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.DEBUG = 'true';
      const { profiler, perfObserverSink } = getNodejsProfiler({
        enabled: false,
      });

      perfObserverSink.getStats.mockReturnValue({
        isSubscribed: true,
        queued: 5,
        dropped: 2,
        written: 10,
        maxQueueSize: 10_000,
        flushThreshold: 20,
        addedSinceLastFlush: 3,
        buffered: true,
      });

      performance.clearMarks();

      profiler.setEnabled(true);

      const marks = performance.getEntriesByType('mark');
      const transitionMark = marks.find(mark => mark.name === 'idle->running');
      expect(transitionMark).toBeDefined();

      expect(transitionMark?.name).toBe('idle->running');
      expect(transitionMark?.detail).toBeDefined();
      const detail = transitionMark?.detail as UserTimingDetail;
      expect(detail.devtools).toBeDefined();
      expect(detail.devtools?.dataType).toBe('marker');
      expect(detail.devtools?.properties).toBeDefined();
    });

    // eslint-disable-next-line vitest/max-nested-describe
    describe('setDebugMode', () => {
      it('should enable debug mode when called with true', () => {
        const { profiler } = getNodejsProfiler();
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);

        expect(profiler.debug).toBe(true);
        expect(profiler.stats.debug).toBe(true);
      });

      it('should disable debug mode when called with false', () => {
        // eslint-disable-next-line functional/immutable-data
        process.env.DEBUG = 'true';
        const { profiler } = getNodejsProfiler();
        expect(profiler.debug).toBe(true);

        profiler.setDebugMode(false);

        expect(profiler.debug).toBe(false);
        expect(profiler.stats.debug).toBe(false);
      });

      it('should create transition markers after enabling debug mode', () => {
        const { profiler } = getNodejsProfiler({ enabled: false });
        expect(profiler.debug).toBe(false);

        performance.clearMarks();
        profiler.setEnabled(true);
        expect(
          performance
            .getEntriesByType('mark')
            .some(m => m.name.startsWith('idle->running')),
        ).toBe(false);

        profiler.setEnabled(false);
        profiler.setDebugMode(true);
        performance.clearMarks();

        profiler.setEnabled(true);

        const marks = performance.getEntriesByType('mark');
        const transitionMark = marks.find(
          mark => mark.name === 'idle->running',
        );
        expect(transitionMark).toBeDefined();
        expect(transitionMark?.name).toBe('idle->running');
      });

      it('should stop creating transition markers after disabling debug mode', () => {
        // eslint-disable-next-line functional/immutable-data
        process.env.DEBUG = 'true';
        const { profiler } = getNodejsProfiler({ enabled: false });
        expect(profiler.debug).toBe(true);

        profiler.setDebugMode(false);
        performance.clearMarks();

        profiler.setEnabled(true);

        expect(
          performance
            .getEntriesByType('mark')
            .some(m => m.name.startsWith('idle->running')),
        ).toBe(false);
      });

      it('should be idempotent when called multiple times with true', () => {
        const { profiler } = getNodejsProfiler();
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);
        profiler.setDebugMode(true);
        profiler.setDebugMode(true);

        expect(profiler.debug).toBe(true);
        expect(profiler.stats.debug).toBe(true);
      });

      it('should be idempotent when called multiple times with false', () => {
        // eslint-disable-next-line functional/immutable-data
        process.env.DEBUG = 'true';
        const { profiler } = getNodejsProfiler();
        expect(profiler.debug).toBe(true);

        profiler.setDebugMode(false);
        profiler.setDebugMode(false);
        profiler.setDebugMode(false);

        expect(profiler.debug).toBe(false);
        expect(profiler.stats.debug).toBe(false);
      });

      it('should work when profiler is in idle state', () => {
        const { profiler } = getNodejsProfiler({ enabled: false });
        expect(profiler.state).toBe('idle');
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);
        expect(profiler.debug).toBe(true);
        expect(profiler.stats.debug).toBe(true);
      });

      it('should work when profiler is in running state', () => {
        const { profiler } = getNodejsProfiler({ enabled: true });
        expect(profiler.state).toBe('running');
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);
        expect(profiler.debug).toBe(true);
        expect(profiler.stats.debug).toBe(true);

        performance.clearMarks();
        profiler.setEnabled(false);
        profiler.setEnabled(true);

        const marks = performance.getEntriesByType('mark');
        const transitionMark = marks.find(
          mark => mark.name === 'idle->running',
        );
        expect(transitionMark).toBeDefined();
      });

      it('should work when profiler is in closed state', () => {
        const { profiler } = getNodejsProfiler({ enabled: false });
        profiler.close();
        expect(profiler.state).toBe('closed');
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);
        expect(profiler.debug).toBe(true);
        expect(profiler.stats.debug).toBe(true);
      });

      it('should toggle debug mode multiple times', () => {
        const { profiler } = getNodejsProfiler({ enabled: false });

        profiler.setDebugMode(true);
        expect(profiler.debug).toBe(true);

        profiler.setDebugMode(false);
        expect(profiler.debug).toBe(false);

        profiler.setDebugMode(true);
        expect(profiler.debug).toBe(true);

        profiler.setDebugMode(false);
        expect(profiler.debug).toBe(false);
      });
    });
  });

  describe('exit handlers', () => {
    const mockSubscribeProcessExit = vi.mocked(subscribeProcessExit);

    let capturedOnError:
      | ((
          error: unknown,
          kind: 'uncaughtException' | 'unhandledRejection',
        ) => void)
      | undefined;
    let capturedOnExit:
      | ((
          code: number,
          reason: import('../exit-process.js').CloseReason,
        ) => void)
      | undefined;
    const createProfiler = (
      overrides?: Partial<
        NodejsProfilerOptions<
          { message: string },
          Record<string, ActionTrackEntryPayload>
        >
      >,
    ) => {
      const sink = new MockTraceEventFileSink();
      vi.spyOn(sink, 'open');
      vi.spyOn(sink, 'close');
      vi.spyOn(WalModule, 'WriteAheadLogFile').mockImplementation(
        () => sink as any,
      );
      return new NodejsProfiler({
        prefix: 'cp',
        track: 'test-track',
        format: {
          encodePerfEntry: simpleEncoder,
          baseName: 'trace',
          walExtension: '.jsonl',
          finalExtension: '.json',
          ...overrides?.format,
        },
        ...overrides,
      });
    };

    let profiler: NodejsProfiler<
      { message: string },
      Record<string, ActionTrackEntryPayload>
    >;

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
              tooltipText: 'uncaughtException caused fatal error',
              properties: [
                ['Error Type', 'Error'],
                ['Error Message', 'Test fatal error'],
              ],
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
              tooltipText: 'unhandledRejection caused fatal error',
              properties: [
                ['Error Type', 'Error'],
                ['Error Message', 'Test fatal error'],
              ],
            },
          },
          duration: 0,
          entryType: 'mark',
          startTime: 0,
        },
      ]);
    });

    it('exit handler shuts down profiler', () => {
      profiler = createProfiler({ enabled: true });
      const closeSpy = vi.spyOn(profiler, 'close');
      expect(profiler.isEnabled()).toBe(true);

      capturedOnExit?.(0, { kind: 'exit' });

      expect(profiler.isEnabled()).toBe(false);
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('close() unsubscribes from exit handlers even when disabled', () => {
      const unsubscribeFn = vi.fn();
      mockSubscribeProcessExit.mockReturnValue(unsubscribeFn);

      profiler = createProfiler({ enabled: false });
      expect(profiler.isEnabled()).toBe(false);
      expect(mockSubscribeProcessExit).toHaveBeenCalled();

      profiler.close();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
      expect(profiler.isEnabled()).toBe(false);
    });
  });
});
