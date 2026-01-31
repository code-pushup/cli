import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeEach, expect } from 'vitest';
import { awaitObserverCallbackAndFlush } from '@code-pushup/test-utils';
import {
  loadAndOmitTraceJsonl,
  loadNormalizedTraceJson,
} from '../../../mocks/omit-trace-json.js';
import { executeProcess } from '../execute-process.js';
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
  PROFILER_OUT_DIR_ENV_VAR,
  SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
} from './constants.js';
import { NodejsProfiler, type NodejsProfilerOptions } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { TraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace.js';

describe('NodeJS Profiler Integration', () => {
  const traceEventEncoder: PerformanceEntryEncoder<TraceEvent> =
    entryToTraceEvents;
  const testSuitDir = path.join(process.cwd(), 'tmp', 'int', 'utils');
  const activeProfilers: NodejsProfiler<TraceEvent>[] = [];

  const workerScriptPath = path.resolve(
    fileURLToPath(path.dirname(import.meta.url)),
    '../../../mocks/multiprocess-profiling/profiler-worker.mjs',
  );

  function nodejsProfiler(
    optionsOrMeasureName:
      | string
      | (Partial<
          NodejsProfilerOptions<
            TraceEvent,
            Record<string, ActionTrackEntryPayload>
          >
        > & { measureName: string }),
  ): NodejsProfiler<TraceEvent> {
    const options =
      typeof optionsOrMeasureName === 'string'
        ? { measureName: optionsOrMeasureName }
        : optionsOrMeasureName;
    const profiler = new NodejsProfiler({
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
    activeProfilers.push(profiler);
    return profiler;
  }

  async function create3rdPartyMeasures(prefix: string) {
    const trackDefaults = {
      track: 'Buffered Track',
      trackGroup: 'Buffered Track',
    };

    expect(() =>
      performance.mark(
        `${prefix}:profiler-enable`,
        asOptions(
          markerPayload({
            tooltipText: 'set enable to true',
          }),
        ),
      ),
    ).not.toThrow();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(() =>
      performance.mark(`${prefix}:sync-measure:start`),
    ).not.toThrow();

    // Heavy work: CPU-intensive operations
    const largeArray = Array.from({ length: 100_000 }, (_, i) => i);
    const result = largeArray
      .map(x => x * x)
      .filter(x => x % 2 === 0)
      .reduce((sum, x) => sum + x, 0);
    expect(result).toBeGreaterThan(0);
    expect('sync success').toStrictEqual('sync success');
    expect(() => performance.mark(`${prefix}:sync-measure:end`)).not.toThrow();

    performance.measure(`${prefix}:sync-measure`, {
      start: `${prefix}:sync-measure:start`,
      end: `${prefix}:sync-measure:end`,
      ...asOptions(
        trackEntryPayload({
          ...trackDefaults,
          tooltipText: 'sync measurement returned :"sync success"',
        }),
      ),
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(() =>
      performance.mark(`${prefix}:async-measure:start`),
    ).not.toThrow();
    // Heavy work: More CPU-intensive operations
    const matrix = Array.from({ length: 1000 }, () =>
      Array.from({ length: 1000 }, (_, i) => i),
    );
    const flattened = matrix.flat();
    const sum = flattened.reduce((acc, val) => acc + val, 0);
    expect(sum).toBeGreaterThan(0);
    await expect(Promise.resolve('async success')).resolves.toStrictEqual(
      'async success',
    );
    expect(() => performance.mark(`${prefix}:async-measure:end`)).not.toThrow();

    performance.measure(`${prefix}:async-measure`, {
      start: `${prefix}:async-measure:start`,
      end: `${prefix}:async-measure:end`,
      ...asOptions(
        trackEntryPayload({
          ...trackDefaults,
          tooltipText: 'sync measurement returned :"async success"',
        }),
      ),
    });
  }

  async function createBasicMeasures(
    profiler: NodejsProfiler<TraceEvent>,
    prefix: string,
  ) {
    expect(() =>
      profiler.marker(`${prefix}:profiler-enable`, {
        tooltipText: 'set enable to true',
      }),
    ).not.toThrow();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(profiler.measure('sync-measure', () => 'success')).toStrictEqual(
      'success',
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    await expect(
      profiler.measureAsync('async-measure', () =>
        Promise.resolve('async success'),
      ),
    ).resolves.toStrictEqual('async success');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(() =>
      profiler.marker(`${prefix}:profiler-enable`, {
        tooltipText: 'set enable to false',
      }),
    ).not.toThrow();
  }

  beforeEach(async () => {
    if (fs.existsSync(testSuitDir)) {
      fs.rmSync(testSuitDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testSuitDir, { recursive: true });

    performance.clearMarks();
    performance.clearMeasures();
    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
    // eslint-disable-next-line functional/immutable-data
    delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
  });

  afterEach(() => {
    for (const profiler of activeProfilers) {
      if (profiler.stats.profilerState !== 'closed') {
        profiler.close();
      }
    }
    activeProfilers.length = 0;

    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
    // eslint-disable-next-line functional/immutable-data
    delete process.env[SHARDED_WAL_COORDINATOR_ID_ENV_VAR];
  });

  afterAll(async () => {
    // Final cleanup of test directory
    if (fs.existsSync(testSuitDir)) {
      //   await fsPromises.rm(testSuitDir, { recursive: true, force: true });
    }
  });

  it('should initialize with shard opened when enabled', () => {
    const profiler = nodejsProfiler('initialize-shard-opened');
    expect(profiler.isEnabled()).toStrictEqual(true);
    expect(profiler.stats).toEqual(
      expect.objectContaining({
        profilerState: 'running',
        shardOpen: true,
        isSubscribed: true,
      }),
    );
  });

  it('should create mark and measure performance entries and write to .jsonl and .json', async () => {
    const measureName = 'entries-write-to-shard';
    const prefix = 'write-j-jl';
    const profiler = nodejsProfiler({
      prefix,
      measureName,
    });

    await createBasicMeasures(profiler, prefix);

    await awaitObserverCallbackAndFlush(profiler);
    await expect(
      loadAndOmitTraceJsonl(profiler.stats.shardPath as `${string}.jsonl`),
    ).resolves.toMatchFileSnapshot(`__snapshots__/${measureName}.jsonl`);
    profiler.close();

    const snapshotData = await loadNormalizedTraceJson(
      profiler.stats.finalFilePath as `${string}.json`,
    );
    expect(JSON.stringify(snapshotData)).toMatchFileSnapshot(
      `__snapshots__/${measureName}.json`,
    );
  });

  it('should capture buffered entries when buffered option is enabled', async () => {
    const measureName = 'buffered-test';
    const prefix = 'write-buffered-j-jl';
    await create3rdPartyMeasures(prefix);

    const profiler = nodejsProfiler({
      prefix,
      measureName,
      captureBufferedEntries: true,
    });
    await awaitObserverCallbackAndFlush(profiler);
    profiler.close();

    const snapshotData = await loadNormalizedTraceJson(
      profiler.stats.finalFilePath as `${string}.json`,
    );

    expect(JSON.stringify(snapshotData)).toMatchFileSnapshot(
      `__snapshots__/${measureName}.json`,
    );
  });

  it('should return correct getStats with dropped and written counts', () => {
    const prefix = 'stats-test';
    const statsProfiler = nodejsProfiler(prefix);

    expect(statsProfiler.measure('test-op', () => 'result')).toStrictEqual(
      'result',
    );

    const stats = statsProfiler.stats;
    expect(stats).toEqual(
      expect.objectContaining({
        profilerState: 'running',
        shardOpen: true,
        isSubscribed: true,
        groupId: prefix,
        maxQueueSize: 10_000,
        flushThreshold: 20,
        buffered: true,
        isCoordinator: true,
      }),
    );

    statsProfiler.close();
  });

  it('should provide comprehensive queue statistics via getStats', async () => {
    const prefix = 'stats-comprehensive';
    const profiler = nodejsProfiler({
      measureName: prefix,
      track: 'Stats',
      flushThreshold: 2,
      maxQueueSize: 3,
    });

    const initialStats = profiler.stats;
    expect(initialStats).toEqual(
      expect.objectContaining({
        profilerState: 'running',
        shardOpen: true,
        isSubscribed: true,
        groupId: prefix,
        queued: 0,
        dropped: 0,
        written: 0,
        maxQueueSize: 3,
        flushThreshold: 2,
        buffered: true,
        isCoordinator: true,
      }),
    );

    profiler.measure('operation-1', () => 'result1');
    profiler.measure('operation-2', () => 'result2');
    await awaitObserverCallbackAndFlush(profiler);
    expect(profiler.stats.written).toStrictEqual(8);

    profiler.setEnabled(false);

    const finalStats = profiler.stats;
    expect(finalStats).toEqual(
      expect.objectContaining({
        profilerState: 'idle',
        shardOpen: false,
        isSubscribed: false,
        groupId: prefix,
        queued: 0,
        written: 8,
        maxQueueSize: 3,
        flushThreshold: 2,
        buffered: true,
        isCoordinator: true,
      }),
    );
  });

  it('should create sharded path structure when filename is not provided', async () => {
    const prefix = 'sharded-test';
    const measureName = prefix;
    const profiler = nodejsProfiler(measureName);

    const { finalFilePath, shardPath } = profiler.stats;
    expect(finalFilePath).toContainPath('tmp/int/utils');
    expect(finalFilePath).toMatch(/\.json$/);

    const pathParts = finalFilePath.split(path.sep);
    const groupIdDir = pathParts.at(-2);
    const fileName = pathParts.at(-1);

    expect(groupIdDir).toStrictEqual(measureName);
    expect(fileName).toMatch(
      new RegExp(`^trace-events\\.${measureName}\\.json$`),
    );

    expect(shardPath).toContain(measureName);
    expect(shardPath).toMatch(/\.jsonl$/);

    const groupIdDirPath = path.dirname(finalFilePath);
    await expect(fsPromises.access(groupIdDirPath)).resolves.not.toThrow();

    profiler.close();
  });

  it('should create transition markers if debugMode true', async () => {
    const prefix = 'debugMode-test';
    const measureName = prefix;
    const profiler = nodejsProfiler({
      measureName,
      debug: true,
    });

    profiler.setEnabled(false);
    profiler.setEnabled(true);
    await awaitObserverCallbackAndFlush(profiler);
    profiler.close();

    const snapshotData = await loadNormalizedTraceJson(
      profiler.stats.finalFilePath as `${string}.json`,
    );
    expect(JSON.stringify(snapshotData)).toMatchFileSnapshot(
      `__snapshots__/${measureName}.json`,
    );
  });

  it('should handle sharding across multiple processes', async () => {
    const measureName = 'multi-process-sharding';
    const numProcesses = 3;

    const {
      [SHARDED_WAL_COORDINATOR_ID_ENV_VAR]: _coordinatorId,
      ...cleanEnv
    } = process.env;

    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['tsx', workerScriptPath, testSuitDir, String(numProcesses)],
      cwd: path.join(process.cwd(), 'packages', 'utils'),
      env: {
        ...cleanEnv,
        [PROFILER_ENABLED_ENV_VAR]: 'true',
        [PROFILER_DEBUG_ENV_VAR]: 'true',
        [PROFILER_OUT_DIR_ENV_VAR]: testSuitDir,
      },
      silent: true,
    });

    const coordinatorStats = JSON.parse(stdout.trim());

    expect(coordinatorStats).toStrictEqual(
      expect.objectContaining({
        isCoordinator: true,
        shardFileCount: numProcesses,
        groupId: measureName,
        finalFilePath: expect.stringMatching(
          new RegExp(
            `^${testSuitDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${measureName}/trace-events\\.${measureName}\\.json$`,
          ),
        ),
      }),
    );

    const snapshotData = await loadNormalizedTraceJson(
      coordinatorStats.finalFilePath as `${string}.json`,
    );

    const processIds = new Set<string>();
    snapshotData.traceEvents?.forEach((e: TraceEvent) => {
      if (e.name?.includes('process-')) {
        const match = e.name.match(/process-(\d+)/);
        if (match && match[1]) {
          processIds.add(match[1]);
        }
      }
    });

    expect(processIds.size).toStrictEqual(numProcesses);
  });
});
