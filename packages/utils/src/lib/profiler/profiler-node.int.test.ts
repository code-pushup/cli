import fsPromises, { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, expect } from 'vitest';
import {
  awaitObserverCallbackAndFlush,
  loadAndOmitTraceJson,
} from '@code-pushup/test-utils';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_ENABLED_ENV_VAR,
  SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
} from './constants.js';
import { NodejsProfiler, type NodejsProfilerOptions } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { UserTimingTraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace';

describe('NodeJS Profiler Integration', () => {
  const traceEventEncoder: PerformanceEntryEncoder<UserTimingTraceEvent> =
    entryToTraceEvents;
  const testSuitDir = path.join(process.cwd(), 'tmp', 'int', 'utils');
  function nodejsProfiler(
    optionsOrMeasureName:
      | string
      | (Partial<
          NodejsProfilerOptions<
            UserTimingTraceEvent,
            Record<string, ActionTrackEntryPayload>
          >
        > & { measureName: string }),
  ): NodejsProfiler<UserTimingTraceEvent> {
    const options =
      typeof optionsOrMeasureName === 'string'
        ? { measureName: optionsOrMeasureName }
        : optionsOrMeasureName;
    return new NodejsProfiler({
      ...options,
      track: options.track ?? 'int-test-track',
      format: {
        ...traceEventWalFormat(),
        encodePerfEntry: traceEventEncoder,
      },
      outDir: testSuitDir,
      baseName: options.baseName ?? 'trace-events',
      enabled: options.enabled ?? true,
      debug: options.debug ?? false,
      measureName: options.measureName,
    });
  }

  beforeEach(async () => {
    performance.clearMarks();
    performance.clearMeasures();
    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
    // eslint-disable-next-line functional/immutable-data
    delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
  });

  afterEach(() => {
    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
    // eslint-disable-next-line functional/immutable-data
    delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
  });
  afterAll(() => {
    rm(testSuitDir, { recursive: true, force: true });
  });

  it('should initialize with sink opened when enabled', () => {
    const profiler = nodejsProfiler('initialize-sink-opened');
    expect(profiler.isEnabled()).toBeTrue();
    expect(profiler.stats.shardOpen).toBeTrue();
  });

  it('should create performance entries and write to sink', async () => {
    const measureName = 'create-entries-write-sink';
    const profiler = nodejsProfiler(measureName);
    expect(profiler.measure('test-operation', () => 'success')).toBe('success');
    await awaitObserverCallbackAndFlush(profiler);
    await expect(
      loadAndOmitTraceJson(profiler.stats.shardPath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.jsonl`);
    profiler.close();
    await expect(
      loadAndOmitTraceJson(profiler.stats.finalFilePath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.json`);
  });

  it('should handle async operations', async () => {
    const profiler = nodejsProfiler('handle-async-operations');
    await expect(
      profiler.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'async-result';
      }),
    ).resolves.toBe('async-result');
  });

  it('should disable profiling and close sink', () => {
    const profiler = nodejsProfiler('disable-profiling-close-sink');
    profiler.setEnabled(false);
    expect(profiler.isEnabled()).toBeFalse();
    expect(profiler.stats.shardOpen).toBeFalse();

    expect(profiler.measure('disabled-test', () => 'success')).toBe('success');
  });

  it('should re-enable profiling correctly', () => {
    const profiler = nodejsProfiler('re-enable-profiling');
    profiler.setEnabled(false);
    expect(profiler.stats.shardOpen).toBeFalse();

    profiler.setEnabled(true);

    expect(profiler.isEnabled()).toBeTrue();
    expect(profiler.stats.shardOpen).toBeTrue();

    expect(profiler.measure('re-enabled-test', () => 42)).toBe(42);
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = nodejsProfiler({
      measureName: 'buffered-test',
      prefix: 'buffered-test',
      track: 'Test',
      captureBufferedEntries: true,
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
    const statsProfiler = nodejsProfiler('stats-test');

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
    const profiler = nodejsProfiler({
      measureName: 'stats-comprehensive',
      track: 'Stats',
      flushThreshold: 2,
      maxQueueSize: 3,
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

    awaitObserverCallbackAndFlush(profiler);
    const traceEvents = await loadAndOmitTraceJson(profiler.stats.shardPath);
    expect(traceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cat: 'blink.user_timing' }),
      ]),
    );
  });

  describe('sharded path structure', () => {
    it('should create sharded path structure when filename is not provided', async () => {
      const profiler = nodejsProfiler('sharded-test');

      const { finalFilePath, shardPath } = profiler.stats;
      expect(finalFilePath).toContainPath('tmp/int/utils');
      expect(finalFilePath).toMatch(/\.json$/);

      const pathParts = finalFilePath.split(path.sep);
      const groupIdDir = pathParts.at(-2);
      const fileName = pathParts.at(-1);

      expect(groupIdDir).toBe('sharded-test');
      // When measureName is provided, it becomes the groupId, so filename is baseName.groupId.json
      expect(fileName).toMatch(/^trace-events\.sharded-test\.json$/);

      // Verify shard path has .jsonl extension
      expect(shardPath).toMatch(/\.jsonl$/);

      const groupIdDirPath = path.dirname(finalFilePath);
      await expect(fsPromises.access(groupIdDirPath)).resolves.not.toThrow();

      profiler.close();
    });

    it('should create correct folder structure for sharded paths', async () => {
      const profiler = nodejsProfiler('folder-test');

      const filePath = profiler.stats.finalFilePath;
      const dirPath = path.dirname(filePath);
      const groupId = path.basename(dirPath);

      expect(groupId).toBe('folder-test');
      await expect(fsPromises.access(dirPath)).resolves.not.toThrow();
      const stat = await fsPromises.stat(dirPath);
      expect(stat.isDirectory()).toBeTrue();

      profiler.close();
    });

    it('should write trace events to .jsonl and .json', async () => {
      const measureName = 'write-test';
      const profiler = nodejsProfiler(measureName);

      profiler.measure('test-operation', () => 'result');
      await awaitObserverCallbackAndFlush(profiler);
      expect(profiler.stats.shardFileCount).toBe(1);
      expect(profiler.stats.shardPath).toBeTruthy();
      await expect(
        loadAndOmitTraceJson(profiler.stats.shardPath),
      ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.jsonl`);

      profiler.close();
      expect(profiler.stats.isCoordinator).toBeTrue();
      await expect(
        loadAndOmitTraceJson(profiler.stats.finalFilePath),
      ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.json`);
    });
  });
});
