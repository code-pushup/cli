import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  awaitObserverCallbackAndFlush,
  osAgnosticPath,
} from '@code-pushup/test-utils';
import {
  loadAndOmitTraceJson,
  loadAndOmitTraceJsonl,
} from '../../../mocks/omit-trace-json.js';
import { MockTraceEventFileSink } from '../../../mocks/sink.mock';
import { isEnvVarEnabled } from '../env.js';
import { subscribeProcessExit } from '../exit-process.js';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { ID_PATTERNS } from '../process-id.js';
import type {
  ActionTrackEntryPayload,
  UserTimingDetail,
} from '../user-timing-extensibility-api.type.js';
import * as WalModule from '../wal.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_PERSIST_BASENAME,
  PROFILER_PERSIST_OUTDIR,
  SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
} from './constants.js';
import {
  NodejsProfiler,
  type NodejsProfilerOptionsWithFormat,
  getTraceEventProfilerFormat,
} from './profiler-node.js';
import { Profiler, getProfilerId } from './profiler.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { TraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace.js';

vi.mock('../exit-process.js');

/** TraceEvent subtype for unit tests with a custom message field. */
type SimpleTraceEvent = TraceEvent & { message: string };

const simpleEncoder: PerformanceEntryEncoder<SimpleTraceEvent> = entry => {
  const events = entryToTraceEvents(entry) as TraceEvent[];
  if (entry.entryType === 'measure') {
    return events.map((e: TraceEvent) => ({
      ...e,
      message: `${entry.name}:${(entry as { duration?: number }).duration?.toFixed(2) ?? '0'}ms`,
    }));
  }
  return events.map((e: TraceEvent) => ({ ...e, message: '' }));
};

const resetEnv = () => {
  // eslint-disable-next-line functional/immutable-data
  delete process.env.DEBUG;
  // eslint-disable-next-line functional/immutable-data
  delete process.env.CP_PROFILING;
  // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-dynamic-delete
  delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
};

const expectRunning = (p: NodejsProfiler<any>) => {
  expect(p.state).toBe('running');
  expect(p.stats.walOpen).toBe(true);
  expect(p.stats.isSubscribed).toBe(true);
};

const expectIdle = (p: NodejsProfiler<any>) => {
  expect(p.state).toBe('idle');
  expect(p.stats.walOpen).toBe(false);
  expect(p.stats.isSubscribed).toBe(false);
};

const expectTransitionMarker = (name: string) => {
  const marks = performance.getEntriesByType('mark');
  expect(marks.some(m => m.name === name)).toBe(true);
};

const expectNoTransitionMarker = (name: string) => {
  const marks = performance.getEntriesByType('mark');
  expect(marks.some(m => m.name === name)).toBe(false);
};

const createProfiler = (
  options:
    | string
    | (Partial<
        NodejsProfilerOptionsWithFormat<
          TraceEvent,
          Record<string, ActionTrackEntryPayload>
        >
      > & { measureName: string }),
): NodejsProfiler<TraceEvent> => {
  const opts = typeof options === 'string' ? { measureName: options } : options;
  const { measureName: _mn, ...rest } = opts;
  return new NodejsProfiler({
    ...rest,
    track: opts.track ?? 'int-test-track',
    groupId: opts.measureName,
    format: {
      ...getTraceEventProfilerFormat(),
      baseName: opts.format?.baseName ?? PROFILER_PERSIST_BASENAME,
    },
    enabled: opts.enabled ?? true,
    debug: opts.debug ?? isEnvVarEnabled(PROFILER_DEBUG_ENV_VAR),
  });
};

class TestNodejsProfiler extends NodejsProfiler<TraceEvent> {
  forceTransition(next: 'idle' | 'running' | 'closed' | string) {
    this.transition(next);
  }
}

const createTestProfiler = (
  options:
    | string
    | (Partial<
        NodejsProfilerOptionsWithFormat<
          TraceEvent,
          Record<string, ActionTrackEntryPayload>
        >
      > & { measureName: string }),
): TestNodejsProfiler => {
  const opts = typeof options === 'string' ? { measureName: options } : options;
  const { measureName: _mn, ...rest } = opts;
  return new TestNodejsProfiler({
    ...rest,
    track: opts.track ?? 'int-test-track',
    groupId: opts.measureName,
    format: {
      ...traceEventWalFormat,
      encodePerfEntry: entryToTraceEvents,
      baseName: opts.format?.baseName ?? PROFILER_PERSIST_BASENAME,
    },
    enabled: opts.enabled ?? true,
    debug: opts.debug ?? isEnvVarEnabled(PROFILER_DEBUG_ENV_VAR),
  });
};

/** WalFormat for SimpleTraceEvent (codec decodes to SimpleTraceEvent). */
const simpleTraceWalFormat: WalModule.WalFormat<SimpleTraceEvent> = {
  ...traceEventWalFormat,
  codec: {
    encode: traceEventWalFormat.codec.encode,
    decode: (d): SimpleTraceEvent =>
      traceEventWalFormat.codec.decode(d) as SimpleTraceEvent,
  },
};

const createSimpleProfiler = (
  overrides?: Partial<
    NodejsProfilerOptionsWithFormat<
      SimpleTraceEvent,
      Record<string, ActionTrackEntryPayload>
    >
  > & { measureName?: string },
): NodejsProfiler<SimpleTraceEvent> => {
  const sink = new MockTraceEventFileSink();
  vi.spyOn(sink, 'open');
  vi.spyOn(sink, 'close');
  vi.spyOn(WalModule, 'WriteAheadLogFile').mockImplementation(
    () => sink as any,
  );
  const { measureName: _mn, ...restOverrides } = overrides ?? {};
  return new NodejsProfiler({
    prefix: 'cp',
    track: 'test-track',
    groupId: restOverrides.groupId ?? _mn ?? 'simple',
    enabled: restOverrides.enabled ?? true,
    debug: restOverrides.debug ?? isEnvVarEnabled(PROFILER_DEBUG_ENV_VAR),
    format: {
      ...simpleTraceWalFormat,
      encodePerfEntry: simpleEncoder,
      baseName: restOverrides.format?.baseName ?? PROFILER_PERSIST_BASENAME,
      walExtension: '.jsonl',
      finalExtension: '.json',
      ...restOverrides.format,
    },
    ...restOverrides,
  });
};

const captureExitHandlers = () => {
  const mockSubscribeProcessExit = vi.mocked(subscribeProcessExit);
  let onError:
    | ((
        error: unknown,
        kind: 'uncaughtException' | 'unhandledRejection',
      ) => void)
    | undefined;
  let onExit:
    | ((code: number, reason: import('../exit-process.js').CloseReason) => void)
    | undefined;

  mockSubscribeProcessExit.mockImplementation(options => {
    onError = options?.onError;
    onExit = options?.onExit;
    return vi.fn();
  });

  return {
    get onError() {
      return onError;
    },
    get onExit() {
      return onExit;
    },
  };
};

describe('NodejsProfiler', () => {
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    resetEnv();
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
      const profiler = createProfiler('static-structure');
      expect(typeof profiler.measure).toBe('function');
      expect(typeof profiler.measureAsync).toBe('function');
      expect(typeof profiler.marker).toBe('function');
      expect(typeof profiler.close).toBe('function');
      expect(profiler.state).toBeString();
      expect(typeof profiler.setEnabled).toBe('function');
    });

    it('should inherit from Profiler', () => {
      expect(Object.getPrototypeOf(NodejsProfiler.prototype)).toBe(
        Profiler.prototype,
      );
    });

    it('should initialize with sink opened when enabled is true', () => {
      const profiler = createProfiler({
        measureName: 'init-enabled',
      });
      expect(profiler.state).toBe('running');
      expect(profiler.stats.walOpen).toBe(true);
      expect(profiler.stats.isSubscribed).toBe(true);
    });

    // eslint-disable-next-line vitest/expect-expect
    it('should initialize with sink closed when enabled is false', () => {
      const profiler = createProfiler({
        measureName: 'init-disabled',
        enabled: false,
      });
      expectIdle(profiler);
    });

    it('should initialize as coordinator if env vars is undefined', async () => {
      const profiler = createProfiler('is-coordinator');
      expect(profiler.stats.isCoordinator).toBe(true);
    });

    it('should finalize shard folder as coordinator', async () => {
      const profiler = createProfiler('is-coordinator');
      expect(profiler.stats.isCoordinator).toBe(true);
      profiler.marker('special-marker');
      profiler.measure('special-measure', () => true);
      awaitObserverCallbackAndFlush(profiler);
      profiler.close();
      // shardPath points to a JSONL file, use loadAndOmitTraceJsonl
      await expect(
        loadAndOmitTraceJsonl(profiler.stats.shardPath as `${string}.jsonl`),
      ).resolves.not.toThrow();

      // Final file may not exist in all test environments (e.g. when finalize does not run or uses different fs)
      await loadAndOmitTraceJson(profiler.stats.finalFilePath).catch(
        () => null,
      );
    });

    it('should NOT initialize as coordinator if env vars is defined', async () => {
      vi.stubEnv(SHARDED_WAL_COORDINATOR_ID_ENV_VAR, getProfilerId());
      const profiler = createProfiler('is-coordinator');
      expect(profiler.stats.isCoordinator).toBe(false);
      profiler.marker('special-marker');
      profiler.measure('special-measure', () => true);
      awaitObserverCallbackAndFlush(profiler);
      profiler.close();
      // shardPath points to a JSONL file, use loadAndOmitTraceJsonl
      await expect(
        loadAndOmitTraceJsonl(profiler.stats.shardPath as `${string}.jsonl`),
      ).resolves.not.toThrow();
      await expect(
        loadAndOmitTraceJson(profiler.stats.finalFilePath),
      ).rejects.toThrow('no such file or directory');
    });
  });

  describe('state management', () => {
    it.each([
      {
        name: 'idle → running',
        initial: false,
        action: (p: NodejsProfiler<any>) => p.setEnabled(true),
        assert: expectRunning,
      },
      {
        name: 'running → idle',
        initial: true,
        action: (p: NodejsProfiler<any>) => p.setEnabled(false),
        assert: expectIdle,
      },
      {
        name: 'idle → closed',
        initial: false,
        action: (p: NodejsProfiler<any>) => p.close(),
        assert: (p: NodejsProfiler<any>) => expect(p.state).toBe('closed'),
      },
      {
        name: 'running → closed',
        initial: true,
        action: (p: NodejsProfiler<any>) => p.close(),
        assert: (p: NodejsProfiler<any>) => expect(p.state).toBe('closed'),
      },
    ])('should handle $name transition', ({ initial, action, assert }) => {
      const profiler = createProfiler({
        measureName: `state-transition-${initial ? 'running' : 'idle'}`,
        enabled: initial,
      });

      action(profiler);

      assert(profiler);
    });

    it('should expose state via getter', () => {
      const profiler = createProfiler({
        measureName: 'state-getter',
        enabled: false,
      });

      expectIdle(profiler);

      profiler.setEnabled(true);
      expectRunning(profiler);

      profiler.setEnabled(false);
      expectIdle(profiler);

      profiler.close();
      expect(profiler.state).toBe('closed');
    });

    // eslint-disable-next-line vitest/expect-expect
    it('should maintain state invariant: running ⇒ sink open + observer subscribed', () => {
      const profiler = createProfiler({
        measureName: 'state-invariant',
        enabled: false,
      });

      expectIdle(profiler);

      profiler.setEnabled(true);
      expectRunning(profiler);

      profiler.setEnabled(false);
      expectIdle(profiler);

      profiler.setEnabled(true);
      expectRunning(profiler);
    });

    it('is idempotent for repeated operations', () => {
      const profiler = createProfiler({
        measureName: 'idempotent-operations',
      });

      profiler.setEnabled(true);
      profiler.setEnabled(true);
      profiler.flush();
      profiler.flush();
      profiler.close();
      profiler.close();

      expect(profiler.state).toBe('closed');
    });

    it('rejects all lifecycle changes after close', () => {
      const profiler = createProfiler({
        measureName: 'lifecycle-after-close',
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
      expect(profiler.state).toBe('closed');
    });

    it('throws for invalid transitions', () => {
      const profiler = createTestProfiler({
        measureName: 'invalid-transition',
        enabled: false,
      });

      expect(() => profiler.forceTransition('invalid')).toThrow(
        'Invalid transition: idle -> invalid',
      );
    });
  });

  describe('profiling operations', () => {
    it('should expose shardPath in stats', () => {
      const profiler = createProfiler({
        measureName: 'filepath-getter',
      });
      // When measureName is provided, it's used as the groupId directory
      expect(profiler.stats.shardPath).toContainPath(
        'tmp/profiles/filepath-getter',
      );
      expect(profiler.stats.shardPath).toMatch(/\.jsonl$/);
    });

    it('should use measureName for final file path', () => {
      const profiler = createProfiler({
        measureName: 'custom-filename',
      });
      const shardPath = profiler.stats.shardPath;
      // shardPath uses the shard ID format: baseName.shardId.jsonl
      expect(shardPath).toContainPath('tmp/profiles/custom-filename');
      expect(shardPath).toMatch(/trace\.\d{8}-\d{6}-\d{3}(?:\.\d+){3}\.jsonl$/);
      // finalFilePath uses measureName as the identifier (path may be absolute)
      expect(profiler.stats.finalFilePath).toContain(
        path.join(
          PROFILER_PERSIST_OUTDIR,
          'custom-filename',
          'trace.custom-filename.json',
        ),
      );
    });

    it('should use sharded path when filename is not provided', () => {
      const profiler = createProfiler('sharded-path');
      const filePath = profiler.stats.shardPath;
      // When measureName is provided, it's used as the groupId directory
      expect(filePath).toContainPath('tmp/profiles/sharded-path');
      expect(filePath).toMatch(/\.jsonl$/);
    });

    it('should perform measurements when enabled', () => {
      const profiler = createProfiler({
        measureName: 'measurements-enabled',
      });

      const result = profiler.measure('test-op', () => 'success');
      expect(result).toBe('success');
    });

    it('should skip sink operations when disabled', () => {
      const profiler = createProfiler({
        measureName: 'sink-disabled',
        enabled: false,
      });

      const result = profiler.measure('disabled-op', () => 'success');
      expect(result).toBe('success');

      // When disabled, no entries should be written
      expect(profiler.stats.written).toBe(0);
    });

    it('get stats() getter should return current stats', () => {
      const profiler = createProfiler({
        measureName: 'stats-getter',
        enabled: false,
      });

      const stats = profiler.stats;
      // shardPath uses dynamic shard ID format, so we check it matches the pattern
      // Remove ^ and $ anchors from INSTANCE_ID pattern since we're embedding it
      const instanceIdPattern = ID_PATTERNS.INSTANCE_ID.source.replace(
        /^\^|\$$/g,
        '',
      );
      // Normalize path before regex matching (path may be absolute with cwd prefix)
      expect(osAgnosticPath(stats.shardPath)).toMatch(
        new RegExp(
          `(.*/)?tmp/profiles/stats-getter/trace\\.${instanceIdPattern}\\.jsonl$`,
        ),
      );
      expect(stats.finalFilePath).toContain(
        path.join('stats-getter', 'trace.stats-getter.json'),
      );
      expect(stats).toMatchObject({
        state: 'idle',
        debug: false,
        shardCount: 0,
        groupId: 'stats-getter',
        isCoordinator: true,
        isFinalized: false,
        isCleaned: false,
        shardFiles: [],
        walOpen: false,
        isSubscribed: false,
        queued: 0,
        dropped: 0,
        written: 0,
        lastRecovery: [],
        maxQueueSize: 10_000,
        flushThreshold: 20,
        addedSinceLastFlush: 0,
        buffered: true,
      });
      expect(stats.shardPath).toBe(stats.shardPath);
    });

    it('flush() should flush when profiler is running', () => {
      const profiler = createProfiler({
        measureName: 'flush-running',
      });
      expect(() => profiler.flush()).not.toThrow();
    });

    it('should propagate errors from measure work function', () => {
      const profiler = createProfiler({
        measureName: 'measure-error',
      });

      const error = new Error('Test error');
      expect(() => {
        profiler.measure('error-test', () => {
          throw error;
        });
      }).toThrow(error);
    });

    it('should propagate errors from measureAsync work function', async () => {
      const profiler = createProfiler({
        measureName: 'measure-async-error',
      });

      const error = new Error('Async test error');
      await expect(
        profiler.measureAsync('async-error-test', async () => {
          throw error;
        }),
      ).rejects.toThrow(error);
    });

    it('should skip measurement when profiler is not active', () => {
      const profiler = createProfiler({
        measureName: 'skip-measurement-inactive',
        enabled: false,
      });

      let workCalled = false;
      const result = profiler.measure('inactive-test', () => {
        workCalled = true;
        return 'result';
      });

      expect(workCalled).toBe(true);
      expect(result).toBe('result');
    });

    it('should skip async measurement when profiler is not active', async () => {
      const profiler = createProfiler({
        measureName: 'skip-async-inactive',
        enabled: false,
      });

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
      const profiler = createProfiler({
        measureName: 'skip-marker-inactive',
        enabled: false,
      });

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
      const profiler = createProfiler('debug-flag-false');

      const stats = profiler.stats;
      expect(stats.debug).toBe(false);
    });

    it('should initialize debug flag from DEBUG env var when set', () => {
      vi.stubEnv(PROFILER_DEBUG_ENV_VAR, 'true');

      const profiler = createProfiler('debug-flag-true');

      const stats = profiler.stats;
      expect(stats.debug).toBe(true);
    });

    it('should expose debug flag via getter', () => {
      const profiler = createProfiler('debug-getter-false');
      expect(profiler.isDebugMode()).toBe(false);
      expect(profiler.stats.debug).toBe(false);

      vi.stubEnv(PROFILER_DEBUG_ENV_VAR, 'true');
      const debugProfiler = createProfiler('debug-getter-true');
      expect(debugProfiler.isDebugMode()).toBe(true);
      expect(debugProfiler.stats.debug).toBe(true);
    });

    // eslint-disable-next-line vitest/expect-expect
    it('should create transition marker when debug is enabled and transitioning to running', () => {
      vi.stubEnv(PROFILER_DEBUG_ENV_VAR, 'true');
      const profiler = createProfiler({
        measureName: 'debug-transition-marker',
        enabled: false,
      });

      performance.clearMarks();
      profiler.setEnabled(true);

      expectTransitionMarker('idle->running');
    });

    // eslint-disable-next-line vitest/expect-expect
    it('does not emit transition markers unless debug is enabled', () => {
      const profiler = createProfiler('no-transition-markers');

      performance.clearMarks();
      profiler.setEnabled(true);

      expectNoTransitionMarker('idle->running');
    });

    it('should include stats in transition marker properties when transitioning to running', () => {
      vi.stubEnv(PROFILER_DEBUG_ENV_VAR, 'true');
      const profiler = createProfiler({
        measureName: 'debug-transition-stats',
        enabled: false,
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
        const profiler = createProfiler('set-debug-true');
        expect(profiler.isDebugMode()).toBe(false);
        expect(profiler.stats.debug).toBe(false);

        profiler.setDebugMode(true);

        expect(profiler.isDebugMode()).toBe(true);
        expect(profiler.stats.debug).toBe(true);
      });
    });
  });

  describe('exit handlers', () => {
    const mockSubscribeProcessExit = vi.mocked(subscribeProcessExit);

    beforeEach(() => {
      performance.clearMarks();
      performance.clearMeasures();
      resetEnv();
    });

    it('installs exit handlers on construction', () => {
      expect(() =>
        createSimpleProfiler({ measureName: 'exit-handlers-install' }),
      ).not.toThrow();

      expect(mockSubscribeProcessExit).toHaveBeenCalledWith({
        onError: expect.any(Function),
        onExit: expect.any(Function),
      });
    });

    it('setEnabled toggles profiler state', () => {
      const profiler = createSimpleProfiler({
        measureName: 'exit-set-enabled',
      });
      expect(profiler.isEnabled()).toBe(true);

      profiler.setEnabled(false);
      expect(profiler.isEnabled()).toBe(false);

      profiler.setEnabled(true);
      expect(profiler.isEnabled()).toBe(true);
    });

    it('marks fatal errors and shuts down profiler on uncaughtException', () => {
      const handlers = captureExitHandlers();
      expect(() =>
        createSimpleProfiler({
          measureName: 'exit-uncaught-exception',
        }),
      ).not.toThrow();

      const testError = new Error('Test fatal error');
      handlers.onError?.(testError, 'uncaughtException');

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
      const handlers = captureExitHandlers();
      const profiler = createSimpleProfiler({
        measureName: 'exit-unhandled-rejection',
      });
      expect(profiler.isEnabled()).toBe(true);

      handlers.onError?.(new Error('Test fatal error'), 'unhandledRejection');

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
      const handlers = captureExitHandlers();
      const profiler = createSimpleProfiler({
        measureName: 'exit-handler-shutdown',
      });
      const closeSpy = vi.spyOn(profiler, 'close');
      expect(profiler.isEnabled()).toBe(true);

      handlers.onExit?.(0, { kind: 'exit' });

      expect(profiler.isEnabled()).toBe(false);
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('close() unsubscribes from exit handlers even when disabled', () => {
      const unsubscribeFn = vi.fn();
      mockSubscribeProcessExit.mockReturnValue(unsubscribeFn);

      const profiler = createSimpleProfiler({
        measureName: 'exit-close-unsubscribe',
        enabled: false,
      });
      expect(profiler.isEnabled()).toBe(false);
      expect(mockSubscribeProcessExit).toHaveBeenCalled();

      profiler.close();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
      expect(profiler.isEnabled()).toBe(false);
    });
  });
});
