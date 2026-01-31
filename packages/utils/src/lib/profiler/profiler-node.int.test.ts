import fs from 'node:fs';
import path from 'node:path';
import {
  awaitObserverCallbackAndFlush,
  omitTraceJson,
} from '@code-pushup/test-utils';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { WAL_ID_PATTERNS } from '../wal.js';
import { NodejsProfiler } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { UserTimingTraceEvent } from './trace-file.type.js';

describe('NodeJS Profiler Integration', () => {
  const traceEventEncoder: PerformanceEntryEncoder<UserTimingTraceEvent> =
    entryToTraceEvents;

  let nodejsProfiler: NodejsProfiler<UserTimingTraceEvent>;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    vi.stubEnv('CP_PROFILING', undefined!);
    vi.stubEnv('CP_PROFILER_DEBUG', undefined!);

    // Clean up trace files from previous test runs
    const traceFilesDir = path.join(process.cwd(), 'tmp', 'int', 'utils');
    // eslint-disable-next-line n/no-sync
    if (fs.existsSync(traceFilesDir)) {
      // eslint-disable-next-line n/no-sync
      const files = fs.readdirSync(traceFilesDir);
      // eslint-disable-next-line functional/no-loop-statements
      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.jsonl')) {
          // eslint-disable-next-line n/no-sync
          fs.unlinkSync(path.join(traceFilesDir, file));
        }
      }
    }

    nodejsProfiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      encodePerfEntry: traceEventEncoder,
      filename: path.join(process.cwd(), 'tmp', 'int', 'utils', 'trace.json'),
      enabled: true,
    });
  });

  afterEach(() => {
    if (nodejsProfiler && nodejsProfiler.state !== 'closed') {
      nodejsProfiler.close();
    }
    vi.stubEnv('CP_PROFILING', undefined!);
    vi.stubEnv('CP_PROFILER_DEBUG', undefined!);
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

  it('should support custom tracks', async () => {
    const traceTracksFile = path.join(
      process.cwd(),
      'tmp',
      'int',
      'utils',
      'trace-tracks.json',
    );
    const profilerWithTracks = new NodejsProfiler({
      prefix: 'api-server',
      track: 'HTTP',
      tracks: {
        db: { track: 'Database', color: 'secondary' },
        cache: { track: 'Cache', color: 'primary' },
      },
      encodePerfEntry: traceEventEncoder,
      filename: traceTracksFile,
      enabled: true,
    });

    expect(profilerWithTracks.filePath).toBe(traceTracksFile);

    expect(
      profilerWithTracks.measure('user-lookup', () => 'user123', {
        track: 'cache',
      }),
    ).toBe('user123');

    await awaitObserverCallbackAndFlush(profilerWithTracks);
    profilerWithTracks.close();

    // eslint-disable-next-line n/no-sync
    const content = fs.readFileSync(traceTracksFile, 'utf8');
    const normalizedContent = omitTraceJson(content);
    await expect(normalizedContent).toMatchFileSnapshot(
      '__snapshots__/custom-tracks-trace-events.jsonl',
    );
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = new NodejsProfiler({
      prefix: 'buffered-test',
      track: 'Test',
      encodePerfEntry: traceEventEncoder,
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
      encodePerfEntry: traceEventEncoder,
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

  it('should provide comprehensive queue statistics via getStats', async () => {
    const traceStatsFile = path.join(
      process.cwd(),
      'tmp',
      'int',
      'utils',
      'trace-stats-comprehensive.json',
    );
    const profiler = new NodejsProfiler({
      prefix: 'stats-profiler',
      track: 'Stats',
      encodePerfEntry: traceEventEncoder,
      maxQueueSize: 3,
      flushThreshold: 2,
      filename: traceStatsFile,
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
    await awaitObserverCallbackAndFlush(profiler);
    // Each measure creates 4 events (start marker, begin span, end span, end marker)
    // 2 measures × 4 events = 8 events written
    expect(profiler.stats.written).toBe(8);

    profiler.setEnabled(false);

    const finalStats = profiler.stats;
    expect(finalStats.state).toBe('idle');
    expect(finalStats.walOpen).toBeFalse();
    expect(finalStats.isSubscribed).toBeFalse();
    expect(finalStats.queued).toBe(0);

    profiler.flush();
    profiler.close();

    // eslint-disable-next-line n/no-sync
    const content = fs.readFileSync(traceStatsFile, 'utf8');
    const normalizedContent = omitTraceJson(content);
    await expect(normalizedContent).toMatchFileSnapshot(
      '__snapshots__/comprehensive-stats-trace-events.jsonl',
    );
  });

  describe('sharded path structure', () => {
    it('should create sharded path structure when filename is not provided', () => {
      const profiler = new NodejsProfiler({
        prefix: 'sharded-test',
        track: 'Test',
        encodePerfEntry: traceEventEncoder,
        enabled: true,
      });

      const filePath = profiler.filePath;
      expect(filePath).toContainPath('tmp/profiles');
      expect(filePath).toMatch(/\.jsonl$/);

      const pathParts = filePath.split(path.sep);
      const groupIdDir = pathParts.at(-2);
      const fileName = pathParts.at(-1);

      expect(groupIdDir).toMatch(WAL_ID_PATTERNS.GROUP_ID);
      expect(fileName).toMatch(/^trace\.\d{8}-\d{6}-\d{3}(?:\.\d+){3}\.jsonl$/);

      const groupIdDirPath = path.dirname(filePath);
      // eslint-disable-next-line n/no-sync
      expect(fs.existsSync(groupIdDirPath)).toBeTrue();

      profiler.close();
    });

    it('should create correct folder structure for sharded paths', () => {
      const profiler = new NodejsProfiler({
        prefix: 'folder-test',
        track: 'Test',
        encodePerfEntry: traceEventEncoder,
        enabled: true,
      });

      const filePath = profiler.filePath;
      const dirPath = path.dirname(filePath);
      const groupId = path.basename(dirPath);

      expect(groupId).toMatch(WAL_ID_PATTERNS.GROUP_ID);
      // eslint-disable-next-line n/no-sync
      expect(fs.existsSync(dirPath)).toBeTrue();
      // eslint-disable-next-line n/no-sync
      expect(fs.statSync(dirPath).isDirectory()).toBeTrue();

      profiler.close();
    });

    it('should write trace events to sharded path file', async () => {
      const profiler = new NodejsProfiler({
        prefix: 'write-test',
        track: 'Test',
        encodePerfEntry: traceEventEncoder,
        enabled: true,
      });

      profiler.measure('test-operation', () => 'result');

      await awaitObserverCallbackAndFlush(profiler);
      profiler.close();

      const filePath = profiler.filePath;
      // eslint-disable-next-line n/no-sync
      const content = fs.readFileSync(filePath, 'utf8');
      const normalizedContent = omitTraceJson(content);
      await expect(normalizedContent).toMatchFileSnapshot(
        '__snapshots__/sharded-path-trace-events.jsonl',
      );
    });
  });
});
