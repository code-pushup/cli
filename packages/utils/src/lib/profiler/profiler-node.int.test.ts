import { basename } from 'memfs/lib/node-to-fsa/util';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import {
  awaitObserverCallbackAndFlush,
  loadAndOmitTraceJson,
} from '@code-pushup/test-utils';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { getUniqueInstanceId } from '../process-id.js';
import { ShardedWal } from '../wal-sharded.js';
import { SHARDED_WAL_COORDINATOR_ID_ENV_VAR } from './constants.js';
import { NodejsProfiler } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { UserTimingTraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace';

describe('NodeJS Profiler Integration', () => {
  const traceEventEncoder: PerformanceEntryEncoder<UserTimingTraceEvent> =
    entryToTraceEvents;

  let nodejsProfiler: NodejsProfiler<UserTimingTraceEvent>;

  beforeEach(async () => {
    performance.clearMarks();
    performance.clearMeasures();
    vi.stubEnv('CP_PROFILING', undefined!);
    vi.stubEnv('DEBUG', undefined!);

    // Clean up trace files from previous test runs
    const traceFilesDir = path.join(process.cwd(), 'tmp', 'int', 'utils');
    try {
      await fsPromises.access(traceFilesDir);
      const files = await fsPromises.readdir(traceFilesDir);
      // eslint-disable-next-line functional/no-loop-statements
      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.jsonl')) {
          await fsPromises.unlink(path.join(traceFilesDir, file));
        }
      }
    } catch {
      // Directory doesn't exist, skip cleanup
    }

    nodejsProfiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      format: {
        encodePerfEntry: traceEventEncoder,
      },
      filename: path.join(process.cwd(), 'tmp', 'int', 'utils', 'trace.json'),
      measureName: 'test-profiler',
      enabled: true,
    });
  });

  afterEach(() => {
    if (nodejsProfiler && nodejsProfiler.state !== 'closed') {
      nodejsProfiler.close();
    }
    vi.stubEnv('CP_PROFILING', undefined!);
    vi.stubEnv('DEBUG', undefined!);
  });

  it('should initialize with sink opened when enabled', () => {
    expect(nodejsProfiler.isEnabled()).toBeTrue();
    expect(nodejsProfiler.stats.shardOpen).toBeTrue();
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
    expect(nodejsProfiler.stats.shardOpen).toBeFalse();

    expect(nodejsProfiler.measure('disabled-test', () => 'success')).toBe(
      'success',
    );
  });

  it('should re-enable profiling correctly', () => {
    nodejsProfiler.setEnabled(false);
    expect(nodejsProfiler.stats.shardOpen).toBeFalse();

    nodejsProfiler.setEnabled(true);

    expect(nodejsProfiler.isEnabled()).toBeTrue();
    expect(nodejsProfiler.stats.shardOpen).toBeTrue();

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
      format: {
        encodePerfEntry: traceEventEncoder,
      },
      filename: traceTracksFile,
      measureName: 'custom-tracks',
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

    // When measureName is provided, files are written to tmp/profiles/{measureName}/
    // even when filename is specified. Find the actual file in that directory.
    const profilesDir = path.join(
      process.cwd(),
      'tmp',
      'profiles',
      'custom-tracks',
    );
    const files = await fsPromises.readdir(profilesDir);
    const shardFile = files.find(
      f => f.endsWith('.log') || f.endsWith('.jsonl'),
    );
    expect(shardFile).toBeDefined();
    const actualFilePath = path.join(profilesDir, shardFile!);
    const normalizedContent = await loadAndOmitTraceJson(actualFilePath);
    await expect(normalizedContent).toMatchInlineSnapshot(`
      "{"cat":"blink.user_timing","ph":"i","name":"api-server:user-lookup:start","pid":10001,"tid":1,"ts":1700000005000000,"args":{"detail":{"devtools":{"track":"cache","dataType":"track-entry"}}}}
      {"cat":"blink.user_timing","ph":"b","name":"api-server:user-lookup","id2":{"local":"0x1"},"pid":10001,"tid":1,"ts":1700000005000001,"args":{"data":{"detail":{"devtools":{"track":"cache","dataType":"track-entry"}}}}}
      {"cat":"blink.user_timing","ph":"e","name":"api-server:user-lookup","id2":{"local":"0x1"},"pid":10001,"tid":1,"ts":1700000005000002,"args":{"data":{"detail":{"devtools":{"track":"cache","dataType":"track-entry"}}}}}
      {"cat":"blink.user_timing","ph":"i","name":"api-server:user-lookup:end","pid":10001,"tid":1,"ts":1700000005000003,"args":{"detail":{"devtools":{"track":"cache","dataType":"track-entry"}}}}
      "
    `);
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = new NodejsProfiler({
      prefix: 'buffered-test',
      track: 'Test',
      format: {
        encodePerfEntry: traceEventEncoder,
      },
      captureBufferedEntries: true,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-buffered.json',
      ),
      measureName: 'buffered-test',
      enabled: true,
    });

    const bufferedStats = bufferedProfiler.stats;
    expect(bufferedStats.profilerState).toBe('running');
    expect(bufferedStats.shardOpen).toBeTrue();
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
      format: {
        encodePerfEntry: traceEventEncoder,
      },
      maxQueueSize: 2,
      flushThreshold: 2,
      filename: path.join(
        process.cwd(),
        'tmp',
        'int',
        'utils',
        'trace-stats.json',
      ),
      measureName: 'stats-test',
      enabled: true,
    });

    expect(statsProfiler.measure('test-op', () => 'result')).toBe('result');

    const stats = statsProfiler.stats;
    expect(stats.profilerState).toBe('running');
    expect(stats.shardOpen).toBeTrue();
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
      format: {
        encodePerfEntry: traceEventEncoder,
      },
      maxQueueSize: 3,
      flushThreshold: 2,
      filename: traceStatsFile,
      measureName: 'stats-comprehensive',
      enabled: true,
    });

    const initialStats = profiler.stats;
    expect(initialStats.profilerState).toBe('running');
    expect(initialStats.shardOpen).toBeTrue();
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
    expect(finalStats.profilerState).toBe('idle');
    expect(finalStats.shardOpen).toBeFalse();
    expect(finalStats.isSubscribed).toBeFalse();
    expect(finalStats.queued).toBe(0);

    profiler.flush();
    profiler.close();

    // When measureName is provided, files are written to tmp/profiles/{measureName}/
    // even when filename is specified. Find the actual file in that directory.
    const profilesDir = path.join(
      process.cwd(),
      'tmp',
      'profiles',
      'stats-comprehensive',
    );
    const files = await fsPromises.readdir(profilesDir);
    const shardFile = files.find(
      f => f.endsWith('.log') || f.endsWith('.jsonl'),
    );
    expect(shardFile).toBeDefined();
  });

  describe('sharded path structure', () => {
    it('should create sharded path structure when filename is not provided', async () => {
      const profiler = new NodejsProfiler({
        prefix: 'sharded-test',
        track: 'Test',
        format: {
          encodePerfEntry: traceEventEncoder,
          baseName: 'trace',
          walExtension: '.jsonl',
        },
        measureName: 'sharded-test',
        enabled: true,
      });

      const filePath = profiler.filePath;
      expect(filePath).toContainPath('tmp/profiles');
      expect(filePath).toMatch(/\.jsonl$/);

      const pathParts = filePath.split(path.sep);
      const groupIdDir = pathParts.at(-2);
      const fileName = pathParts.at(-1);

      // When measureName is provided, it's used as the groupId (folder name)
      expect(groupIdDir).toBe('sharded-test');
      // Filename format: baseName.timeId.pid.threadId.counter.extension
      expect(fileName).toMatch(
        /^trace\.\d{8}-\d{6}-\d{3}\.\d+\.\d+\.\d+\.jsonl$/,
      );

      const groupIdDirPath = path.dirname(filePath);
      await expect(fsPromises.access(groupIdDirPath)).resolves.not.toThrow();

      profiler.close();
    });

    it('should create correct folder structure for sharded paths', async () => {
      const profiler = new NodejsProfiler({
        prefix: 'folder-test',
        track: 'Test',
        format: {
          encodePerfEntry: traceEventEncoder,
        },
        measureName: 'folder-test',
        enabled: true,
      });

      const filePath = profiler.filePath;
      const dirPath = path.dirname(filePath);
      const groupId = path.basename(dirPath);

      // When measureName is provided, it's used as the groupId (folder name)
      expect(groupId).toBe('folder-test');
      await expect(fsPromises.access(dirPath)).resolves.not.toThrow();
      const stat = await fsPromises.stat(dirPath);
      expect(stat.isDirectory()).toBeTrue();

      profiler.close();
    });

    it('should write trace events to .jsonl and .json', async () => {
      // Clean up any existing files from previous test runs
      const measureName = 'write-test';
      const profiler = new NodejsProfiler({
        track: 'Test',
        format: {
          encodePerfEntry: traceEventEncoder,
          baseName: 'trace',
          walExtension: '.jsonl',
          finalExtension: '.json',
        },
        measureName,
        enabled: true,
      });

      // Set this instance as the coordinator by setting the env var to match its ID
      // The ShardedWal instance ID is generated during construction, so we need to
      // manually finalize since the coordinator check happens at construction time
      profiler.measure('test-operation', () => 'result');

      await awaitObserverCallbackAndFlush(profiler);
      profiler.flush();

      expect(profiler.stats.shardPath).toBe('1s2');
      /*await expect(loadAndOmitTraceJson(profiler.stats.shardPath)).resolves.toMatchFileSnapshot(
        `__snapshots__/${path.basename(profiler.stats.shardPath)}`,
      );*/

      profiler.close();

      // Verify the final file exists and matches snapshot
      /*const finalFilePath = profiler.stats.finalFilePath;
      await expect(loadAndOmitTraceJson(finalFilePath)).resolves.toMatchFileSnapshot(
        `__snapshots__/${path.basename(finalFilePath)}`,
      );

      // Restore original coordinator ID and instance count
      if (originalCoordinatorId) {
        // eslint-disable-next-line functional/immutable-data
        process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR] = originalCoordinatorId;
      } else {
        // eslint-disable-next-line functional/immutable-data
        delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
      }
      ShardedWal.instanceCount = originalCount;*/
    });
  });
});
