import path from 'node:path';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { NodejsProfiler } from './profiler-node.js';

describe('NodeJS Profiler Integration', () => {
  const simpleEncoder: PerformanceEntryEncoder<string> = entry => {
    if (entry.entryType === 'measure') {
      return [`${entry.name}:${entry.duration.toFixed(2)}ms`];
    }
    return [];
  };

  let nodejsProfiler: NodejsProfiler<string>;
  const originalProfilingEnv = process.env.CP_PROFILING;
  const originalDebugEnv = process.env.CP_PROFILER_DEBUG;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILING;
    // eslint-disable-next-line functional/immutable-data
    delete process.env.CP_PROFILER_DEBUG;

    nodejsProfiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      encodePerfEntry: simpleEncoder,
      filename: path.join(process.cwd(), 'tmp', 'int', 'utils', 'trace.json'),
      enabled: true,
    });
  });

  afterEach(() => {
    if (nodejsProfiler && nodejsProfiler.state !== 'closed') {
      nodejsProfiler.close();
    }
    if (originalProfilingEnv === undefined) {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.CP_PROFILING;
    } else {
      // eslint-disable-next-line functional/immutable-data
      process.env.CP_PROFILING = originalProfilingEnv;
    }
    if (originalDebugEnv === undefined) {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.CP_PROFILER_DEBUG;
    } else {
      // eslint-disable-next-line functional/immutable-data
      process.env.CP_PROFILER_DEBUG = originalDebugEnv;
    }
  });

  it('should initialize with sink opened when enabled', () => {
    expect(nodejsProfiler.isEnabled()).toBeTrue();
    expect(nodejsProfiler.stats.walOpen).toBeTrue();
  });

  it('should create performance entries and write to sink', () => {
    expect(nodejsProfiler.measure('test-operation', () => 'success')).toBe(
      'success',
    );
  });

  it('should handle async operations', async () => {
    await expect(
      nodejsProfiler.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'async-result';
      }),
    ).resolves.toBe('async-result');
  });

  it('should disable profiling and close sink', () => {
    nodejsProfiler.setEnabled(false);
    expect(nodejsProfiler.isEnabled()).toBeFalse();
    expect(nodejsProfiler.stats.walOpen).toBeFalse();

    expect(nodejsProfiler.measure('disabled-test', () => 'success')).toBe(
      'success',
    );
  });

  it('should re-enable profiling correctly', () => {
    nodejsProfiler.setEnabled(false);
    expect(nodejsProfiler.stats.walOpen).toBeFalse();

    nodejsProfiler.setEnabled(true);

    expect(nodejsProfiler.isEnabled()).toBeTrue();
    expect(nodejsProfiler.stats.walOpen).toBeTrue();

    expect(nodejsProfiler.measure('re-enabled-test', () => 42)).toBe(42);
  });

  it('should support custom tracks', () => {
    const profilerWithTracks = new NodejsProfiler({
      prefix: 'api-server',
      track: 'HTTP',
      tracks: {
        db: { track: 'Database', color: 'secondary' },
        cache: { track: 'Cache', color: 'primary' },
      },
      encodePerfEntry: simpleEncoder,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-tracks.json',
      ),
    });

    expect(
      profilerWithTracks.measure('user-lookup', () => 'user123', {
        track: 'cache',
      }),
    ).toBe('user123');

    profilerWithTracks.close();
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = new NodejsProfiler({
      prefix: 'buffered-test',
      track: 'Test',
      encodePerfEntry: simpleEncoder,
      captureBufferedEntries: true,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-buffered.json',
      ),
      enabled: true,
    });

    const bufferedStats = bufferedProfiler.stats;
    expect(bufferedStats.state).toBe('running');
    expect(bufferedStats.walOpen).toBeTrue();
    expect(bufferedStats.isSubscribed).toBeTrue();
    expect(bufferedStats.queued).toBe(0);
    expect(bufferedStats.dropped).toBe(0);
    expect(bufferedStats.written).toBe(0);

    bufferedProfiler.close();
  });

  it('should return correct getStats with dropped and written counts', () => {
    const statsProfiler = new NodejsProfiler({
      prefix: 'stats-test',
      track: 'Stats',
      encodePerfEntry: simpleEncoder,
      maxQueueSize: 2,
      flushThreshold: 2,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-stats.json',
      ),
      enabled: true,
    });

    expect(statsProfiler.measure('test-op', () => 'result')).toBe('result');

    const stats = statsProfiler.stats;
    expect(stats.state).toBe('running');
    expect(stats.walOpen).toBeTrue();
    expect(stats.isSubscribed).toBeTrue();
    expect(typeof stats.queued).toBe('number');
    expect(typeof stats.dropped).toBe('number');
    expect(typeof stats.written).toBe('number');

    statsProfiler.close();
  });

  it('should provide comprehensive queue statistics via getStats', () => {
    const profiler = new NodejsProfiler({
      prefix: 'stats-profiler',
      track: 'Stats',
      encodePerfEntry: simpleEncoder,
      maxQueueSize: 3,
      flushThreshold: 2,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-stats-comprehensive.json',
      ),
      enabled: true,
    });

    const initialStats = profiler.stats;
    expect(initialStats.state).toBe('running');
    expect(initialStats.walOpen).toBeTrue();
    expect(initialStats.isSubscribed).toBeTrue();
    expect(initialStats.queued).toBe(0);
    expect(initialStats.dropped).toBe(0);
    expect(initialStats.written).toBe(0);

    profiler.measure('operation-1', () => 'result1');
    profiler.measure('operation-2', () => 'result2');
    profiler.flush();
    expect(profiler.stats.written).toBe(0);

    profiler.setEnabled(false);

    const finalStats = profiler.stats;
    expect(finalStats.state).toBe('idle');
    expect(finalStats.walOpen).toBeFalse();
    expect(finalStats.isSubscribed).toBeFalse();
    expect(finalStats.queued).toBe(0);

    profiler.close();
  });
});
