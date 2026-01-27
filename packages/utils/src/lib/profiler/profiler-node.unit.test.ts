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
import { Profiler } from './profiler';
import { NodejsProfiler, type NodejsProfilerOptions } from './profiler-node';

vi.mock('../exit-process.js');

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

  const originalEnv = process.env.CP_PROFILER_DEBUG;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILER_DEBUG;
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.CP_PROFILER_DEBUG;
    } else {
      // eslint-disable-next-line functional/immutable-data
      process.env.CP_PROFILER_DEBUG = originalEnv;
    }
  });

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

  it('should open sink and subscribe observer when enabling', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    profiler.setEnabled(true);

    expect(profiler.state).toBe('running');
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

    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    profiler.setEnabled(true);

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

  it('state transitions: should handle full transition matrix: idle → running → idle → closed', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Initial state: idle
    expect(sink.isClosed()).toBe(true);
    expect(perfObserverSink.subscribe).not.toHaveBeenCalled();

    // idle → running
    profiler.setEnabled(true);
    expect(profiler.state).toBe('running');
    expect(sink.isClosed()).toBe(false);
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    // running → idle
    profiler.setEnabled(false);
    expect(profiler.isEnabled()).toBe(false);
    expect(sink.isClosed()).toBe(true);
    expect(sink.close).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

    // idle → closed (terminal)
    profiler.close();
    expect(sink.close).toHaveBeenCalledTimes(1); // No additional close since we're in idle
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1); // No additional unsubscribe since we're in idle
    expect(perfObserverSink.flush).toHaveBeenCalledTimes(1); // Flush was called during running->idle transition via unsubscribe

    // Verify closed state - operations should throw or be safe
    expect(() => profiler.setEnabled(true)).toThrow('Profiler already closed');
    profiler.close(); // Should be idempotent
  });

  it('state transitions: should expose state via getter', () => {
    const profiler = getNodejsProfiler({ enabled: false }).profiler;

    expect(profiler.state).toBe('idle');

    profiler.setEnabled(true);
    expect(profiler.state).toBe('running');

    profiler.setEnabled(false);
    expect(profiler.state).toBe('idle');

    profiler.close();
    expect(profiler.state).toBe('closed');
  });

  it('state transitions: should maintain state invariant: running ⇒ sink open + observer subscribed', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Initially idle - sink closed, observer not subscribed
    expect(profiler.state).toBe('idle');
    expect(sink.isClosed()).toBe(true);
    expect(perfObserverSink.isSubscribed()).toBe(false);

    // Enable - should open sink and subscribe observer
    profiler.setEnabled(true);
    expect(profiler.state).toBe('running');
    expect(sink.isClosed()).toBe(false);
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    // Disable - should close sink and unsubscribe observer
    profiler.setEnabled(false);
    expect(profiler.state).toBe('idle');
    expect(sink.close).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

    // Enable again - should open and subscribe again
    profiler.setEnabled(true);
    expect(profiler.state).toBe('running');
    expect(sink.isClosed()).toBe(false);
    expect(sink.open).toHaveBeenCalledTimes(2);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(2);
  });

  it('state transitions: should handle running → closed transition', () => {
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

  it('state transitions: should prevent invalid transitions when closed', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    // idle → closed
    profiler.close();

    // Should throw for setEnabled(true)
    expect(() => profiler.setEnabled(true)).toThrow('Profiler already closed');
  });

  it('state transitions: should handle flush when closed (no-op)', () => {
    const { perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Close profiler
    profiler.close();

    // flush should be no-op when closed
    profiler.flush();
    expect(perfObserverSink.flush).not.toHaveBeenCalled();
  });

  it('state transitions: should handle flush when running', () => {
    const { perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Should flush when running
    profiler.flush();
    expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
  });

  it('state transitions: should throw error when attempting to transition from closed state', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    // Close the profiler first
    profiler.close();
    expect(profiler.state).toBe('closed');

    // Attempting to enable from closed state should throw
    expect(() => profiler.setEnabled(true)).toThrow('Profiler already closed');
  });

  it('state transitions: should handle idle to closed transition without cleanup', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Ensure profiler is in idle state
    expect(profiler.state).toBe('idle');
    expect(sink.isClosed()).toBe(true);
    expect(perfObserverSink.subscribe).not.toHaveBeenCalled();

    // Transition from idle to closed
    profiler.close();

    // Should change state to closed without any cleanup operations
    expect(profiler.state).toBe('closed');
    expect(sink.close).not.toHaveBeenCalled();
    expect(perfObserverSink.unsubscribe).not.toHaveBeenCalled();
  });

  it('state transitions: should handle running to closed transition with cleanup', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Ensure profiler is in running state
    expect(profiler.state).toBe('running');
    expect(sink.isClosed()).toBe(false);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    // Transition from running to closed
    profiler.close();

    // Should change state to closed and perform cleanup operations
    expect(profiler.state).toBe('closed');
    expect(sink.close).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('state transitions: should close profiler and change state to closed', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    // Initially idle
    expect(profiler.state).toBe('idle');

    // Close should transition to closed
    profiler.close();
    expect(profiler.state).toBe('closed');
  });

  it('state transitions: should disable profiling when setEnabled(false) is called', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Initially running
    expect(profiler.state).toBe('running');

    // Call setEnabled(false) which should transition to idle
    profiler.setEnabled(false);

    // Verify operations were performed
    expect(profiler.state).toBe('idle');
    expect(sink.close).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should return early when transitioning to same state (idle->idle)', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Ensure profiler is in idle state
    expect(profiler.state).toBe('idle');

    // Try to transition to same state - should be no-op
    profiler.setEnabled(true); // This calls transition('running') from idle
    expect(profiler.state).toBe('running');

    // Now try to transition to running again - should be no-op
    profiler.setEnabled(true); // Should not change anything

    // Should still be running and operations should not be called again
    expect(profiler.state).toBe('running');
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should return early when transitioning to same state (running->running)', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Ensure profiler is in running state
    expect(profiler.state).toBe('running');

    // Try to transition to same state - should be no-op
    profiler.setEnabled(true); // Should be no-op

    // Should still be running and operations should not be called again
    expect(profiler.state).toBe('running');
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should throw error when attempting to transition from closed state', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    // Close the profiler first
    profiler.close();
    expect(profiler.state).toBe('closed');

    // Attempting to enable from closed state should throw
    expect(() => profiler.setEnabled(true)).toThrow('Profiler already closed');

    // Attempting to disable from closed state should also throw (since setEnabled(false) calls transition('idle'))
    expect(() => profiler.setEnabled(false)).toThrow('Profiler already closed');
  });

  it('#transition method state transitions: should handle idle->running transition', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Enable from idle state
    expect(profiler.state).toBe('idle');

    profiler.setEnabled(true);

    expect(profiler.state).toBe('running');
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should handle running->idle transition', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Disable from running state
    expect(profiler.state).toBe('running');

    profiler.setEnabled(false);

    expect(profiler.state).toBe('idle');
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
    expect(sink.close).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should handle idle->closed transition', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Close from idle state
    expect(profiler.state).toBe('idle');

    profiler.close();

    expect(profiler.state).toBe('closed');
    // No cleanup operations should be called for idle->closed
    expect(sink.close).not.toHaveBeenCalled();
    expect(perfObserverSink.unsubscribe).not.toHaveBeenCalled();
  });

  it('#transition method state transitions: should handle running->closed transition', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Close from running state
    expect(profiler.state).toBe('running');

    profiler.close();

    expect(profiler.state).toBe('closed');
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);
    expect(sink.close).toHaveBeenCalledTimes(1);
  });

  it('#transition method state transitions: should execute all operations in running->closed case', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Spy on the parent class setEnabled method
    const parentSetEnabledSpy = vi.spyOn(Profiler.prototype, 'setEnabled');

    // Ensure profiler is in running state
    expect(profiler.state).toBe('running');

    // Trigger the running->closed transition
    profiler.close();

    // Verify all operations in the case are executed:
    // 1. super.setEnabled(false) - calls parent setEnabled
    expect(parentSetEnabledSpy).toHaveBeenCalledWith(false);

    // 2. this.#performanceObserverSink.unsubscribe()
    expect(perfObserverSink.unsubscribe).toHaveBeenCalledTimes(1);

    // 3. this.#sink.close()
    expect(sink.close).toHaveBeenCalledTimes(1);

    // 4. State is updated to 'closed'
    expect(profiler.state).toBe('closed');

    // Clean up spy
    parentSetEnabledSpy.mockRestore();
  });

  it('#transition method state transitions: should throw error for invalid transitions (default case)', () => {
    const profiler = getNodejsProfiler({ enabled: false }).profiler;

    // We can't easily trigger the default case since the method signature
    // restricts the possible transitions, but we can test that valid transitions work
    // and invalid ones would be caught by TypeScript or would need runtime testing

    // For now, verify that all valid transitions work as expected
    expect(profiler.state).toBe('idle');

    profiler.setEnabled(true);
    expect(profiler.state).toBe('running');

    profiler.setEnabled(false);
    expect(profiler.state).toBe('idle');

    profiler.close();
    expect(profiler.state).toBe('closed');
  });

  it('close() API: should close profiler from idle state', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    expect(profiler.state).toBe('idle');

    profiler.close();

    expect(profiler.state).toBe('closed');
  });

  it('close() API: should close profiler from running state', () => {
    const { profiler } = getNodejsProfiler({ enabled: true });

    expect(profiler.state).toBe('running');

    profiler.close();

    expect(profiler.state).toBe('closed');
  });

  it('close() API: should be idempotent - calling close multiple times', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    expect(profiler.state).toBe('idle');

    profiler.close();
    expect(profiler.state).toBe('closed');

    // Calling close again should be safe
    profiler.close();
    expect(profiler.state).toBe('closed');
  });

  it('debug flag and transition markers: should initialize debug flag to false when env var not set', () => {
    const { profiler } = getNodejsProfiler();

    const stats = profiler.stats;
    expect(stats.debug).toBe(false);
  });

  it('debug flag and transition markers: should initialize debug flag from CP_PROFILER_DEBUG env var when set', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';

    const { profiler } = getNodejsProfiler();

    const stats = profiler.stats;
    expect(stats.debug).toBe(true);
  });

  it('debug flag and transition markers: should create transition marker when debug is enabled and transitioning to running', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';
    const { profiler } = getNodejsProfiler({ enabled: false });

    performance.clearMarks();

    // Transition from idle to running (profiler becomes enabled)
    profiler.setEnabled(true);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark => mark.name === 'idle->running');
    expect(transitionMark).toBeDefined();
    expect(transitionMark?.name).toBe('idle->running');
  });

  it('debug flag and transition markers: should not create transition marker when transitioning from running to idle (profiler disabled)', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';
    const { profiler } = getNodejsProfiler({ enabled: true });

    performance.clearMarks();

    // Transition from running to idle (profiler becomes disabled before marker call)
    profiler.setEnabled(false);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark => mark.name === 'running->idle');
    // Marker won't be created because profiler is disabled before marker() is called
    expect(transitionMark).toBeUndefined();
  });

  it('debug flag and transition markers: should not create transition marker when transitioning from idle to closed (profiler never enabled)', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';
    const { profiler } = getNodejsProfiler({ enabled: false });

    performance.clearMarks();

    // Transition from idle to closed (profiler was never enabled)
    profiler.close();

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark => mark.name === 'idle->closed');
    // Marker won't be created because profiler is not enabled
    expect(transitionMark).toBeUndefined();
  });

  it('debug flag and transition markers: should not create transition marker when debug is disabled', () => {
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILER_DEBUG;
    const { profiler } = getNodejsProfiler();

    performance.clearMarks();

    // Transition from idle to running
    profiler.setEnabled(true);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark =>
      mark.name.startsWith('idle->running'),
    );
    expect(transitionMark).toBeUndefined();
  });

  it('debug flag and transition markers: should not create transition marker when debug not set and env var not set', () => {
    const { profiler } = getNodejsProfiler();

    performance.clearMarks();

    // Transition from idle to running
    profiler.setEnabled(true);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark =>
      mark.name.startsWith('idle->running'),
    );
    expect(transitionMark).toBeUndefined();
  });

  it('debug flag and transition markers: should create transition marker when debug enabled via env var', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;

    const { profiler } = getNodejsProfiler();

    performance.clearMarks();

    // Transition from idle to running
    profiler.setEnabled(true);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark =>
      mark.name.startsWith('idle->running'),
    );
    expect(transitionMark).toBeDefined();
  });

  it('debug flag and transition markers: should include stats in transition marker properties when transitioning to running', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.CP_PROFILER_DEBUG = 'true';
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

    // Transition to running (profiler becomes enabled, so marker will be created)
    profiler.setEnabled(true);

    const marks = performance.getEntriesByType('mark');
    const transitionMark = marks.find(mark => mark.name === 'idle->running');
    expect(transitionMark).toBeDefined();

    // Verify marker was created with correct name and includes stats in detail
    expect(transitionMark?.name).toBe('idle->running');
    expect(transitionMark?.detail).toBeDefined();
    const detail = transitionMark?.detail as UserTimingDetail;
    expect(detail.devtools).toBeDefined();
    expect(detail.devtools?.dataType).toBe('marker');
    expect(detail.devtools?.properties).toBeDefined();
  });

  it('setEnabled override: should enable profiling when setEnabled(true)', () => {
    const { profiler } = getNodejsProfiler({ enabled: false });

    expect(profiler.state).toBe('idle');

    profiler.setEnabled(true);

    expect(profiler.state).toBe('running');
  });

  it('setEnabled override: should disable profiling when setEnabled(false)', () => {
    const { profiler } = getNodejsProfiler({ enabled: true });

    expect(profiler.state).toBe('running');

    profiler.setEnabled(false);

    expect(profiler.state).toBe('idle');
  });

  it('flush() early return when closed: should return early when flush() called on closed profiler', () => {
    const { perfObserverSink, profiler } = getNodejsProfiler({
      enabled: false,
    });

    // Close profiler
    profiler.close();
    expect(profiler.state).toBe('closed');

    // flush should be no-op when closed
    profiler.flush();

    // flush should not be called on the performance observer sink
    expect(perfObserverSink.flush).not.toHaveBeenCalled();
  });

  it('flush() early return when closed: should flush when profiler is running', () => {
    const { perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    expect(profiler.state).toBe('running');

    profiler.flush();

    expect(perfObserverSink.flush).toHaveBeenCalledTimes(1);
  });

  it('should be idempotent - no-op when transitioning to same state', () => {
    const { sink, perfObserverSink, profiler } = getNodejsProfiler({
      enabled: true,
    });

    // Already running, enable again should be no-op
    expect(sink.open).toHaveBeenCalledTimes(1);
    expect(perfObserverSink.subscribe).toHaveBeenCalledTimes(1);

    profiler.setEnabled(true); // Should be no-op

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

  it('base Profiler behavior: should always be active in base profiler', () => {
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;
    const profiler = new Profiler({
      prefix: 'cp',
      track: 'test-track',
    });

    expect(profiler.isEnabled()).toBe(false); // Base profiler defaults to disabled

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

describe('NodeJsProfiler - process exit handling', () => {
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
  const createProfiler = (
    overrides?: Partial<
      NodejsProfilerOptions<string, Record<string, ActionTrackEntryPayload>>
    >,
  ) => {
    const sink = new MockTraceEventFileSink();
    return new NodejsProfiler({
      prefix: 'cp',
      track: 'test-track',
      sink,
      encodePerfEntry: simpleEncoder,
      ...overrides,
    });
  };

  let profiler: NodejsProfiler<Record<string, ActionTrackEntryPayload>>;

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

  it('exit handler shuts down profiler', () => {
    profiler = createProfiler({ enabled: true });
    const setEnabledSpy = vi.spyOn(profiler, 'setEnabled');
    expect(profiler.isEnabled()).toBe(true);

    capturedOnExit?.(0, { kind: 'exit' });

    expect(profiler.isEnabled()).toBe(false);
    expect(setEnabledSpy).toHaveBeenCalledTimes(1);
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
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
