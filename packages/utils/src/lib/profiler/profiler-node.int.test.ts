import fsPromises, { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, expect } from 'vitest';
import {
  awaitObserverCallbackAndFlush,
  loadAndOmitTraceJson,
} from '@code-pushup/test-utils';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import {
  asOptions,
  markerPayload,
  trackEntryPayload,
} from '../user-timing-extensibility-api-utils';
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

  async function create3rdPartyMeasures() {
    const trackDefaults = {
      track: 'Buffered Track',
      trackGroup: 'Buffered Track',
    };

    expect(() =>
      performance.mark(
        'profiler-enable',
        asOptions(
          markerPayload({
            tooltipText: 'set enable to true',
          }),
        ),
      ),
    ).not.toThrow();

    expect(() => performance.mark('sync-measure:start')).not.toThrow();

    expect('sync success').toBe('sync success');
    expect(() => performance.mark('sync-measure:end')).not.toThrow();

    performance.measure('sync-measure', {
      start: 'sync-measure:start',
      end: 'sync-measure:end',
      ...asOptions(
        trackEntryPayload({
          ...trackDefaults,
          tooltipText: 'sync measurement returned :"sync success"',
        }),
      ),
    });

    expect(() => performance.mark('async-measure:start')).not.toThrow();
    await expect(Promise.resolve('async success')).resolves.toBe(
      'async success',
    );
    expect(() => performance.mark('async-measure:end')).not.toThrow();

    performance.measure('async-measure', {
      start: 'async-measure:start',
      end: 'async-measure:end',
      ...asOptions(
        trackEntryPayload({
          ...trackDefaults,
          tooltipText: 'sync measurement returned :"async success"',
        }),
      ),
    });
  }

  async function createBasicMeasures(
    profiler: NodejsProfiler<UserTimingTraceEvent>,
  ) {
    expect(() =>
      profiler.marker('profiler-enable', {
        tooltipText: 'set enable to true',
      }),
    ).not.toThrow();

    expect(profiler.measure('sync-measure', () => 'success')).toBe('success');
    await expect(
      profiler.measureAsync('async-measure', () =>
        Promise.resolve('async success'),
      ),
    ).resolves.toBe('async success');

    expect(() =>
      profiler.marker('profiler-enable', {
        tooltipText: 'set enable to false',
      }),
    ).not.toThrow();
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
    //  rm(testSuitDir, { recursive: true, force: true });
  });

  it('should initialize with shard opened when enabled', () => {
    const profiler = nodejsProfiler('initialize-shard-opened');
    expect(profiler.isEnabled()).toBeTrue();
    expect(profiler.stats.shardOpen).toBeTrue();
  });

  it('should create mark and measure performance entries and write to .jsonl and .json', async () => {
    const measureName = 'entries-write-to-shard';
    const profiler = nodejsProfiler({
      prefix: 'write-j-jl',
      measureName,
    });

    await createBasicMeasures(profiler);

    await awaitObserverCallbackAndFlush(profiler);
    await expect(
      loadAndOmitTraceJson(profiler.stats.shardPath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.jsonl`);
    profiler.close();
    await expect(
      loadAndOmitTraceJson(profiler.stats.finalFilePath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.json`);
  });

  it('should capture buffered entries when buffered option is enabled', async () => {
    const measureName = 'buffered-test';
    await create3rdPartyMeasures();

    const profiler = nodejsProfiler({
      prefix: 'write-buffered-j-jl',
      measureName,
      captureBufferedEntries: true,
    });
    await awaitObserverCallbackAndFlush(profiler);
    profiler.close();
    await expect(
      loadAndOmitTraceJson(profiler.stats.finalFilePath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.json`);
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
  });

  it('should create sharded path structure when filename is not provided', async () => {
    const measureName = 'sharded-test';
    const profiler = nodejsProfiler(measureName);

    const { finalFilePath, shardPath } = profiler.stats;
    expect(finalFilePath).toContainPath('tmp/int/utils');
    expect(finalFilePath).toMatch(/\.json$/);

    const pathParts = finalFilePath.split(path.sep);
    const groupIdDir = pathParts.at(-2);
    const fileName = pathParts.at(-1);

    expect(groupIdDir).toBe(measureName);
    // When measureName is provided, it becomes the groupId, so filename is baseName.groupId.json
    expect(fileName).toMatch(
      new RegExp(`^trace-events\\.${measureName}\\.json$`),
    );

    // Verify shard path has .jsonl extension
    expect(shardPath).toContain(measureName);
    expect(shardPath).toMatch(/\.jsonl$/);

    const groupIdDirPath = path.dirname(finalFilePath);
    await expect(fsPromises.access(groupIdDirPath)).resolves.not.toThrow();

    profiler.close();
  });

  it('should create transition markers if debugMode true', async () => {
    const measureName = 'debugMode-test';
    const profiler = nodejsProfiler({
      measureName,
      debug: true,
    });

    profiler.setEnabled(false);
    profiler.setEnabled(true);
    await awaitObserverCallbackAndFlush(profiler);
    profiler.close();
    await expect(
      loadAndOmitTraceJson(profiler.stats.finalFilePath),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.json`);
  });
});
