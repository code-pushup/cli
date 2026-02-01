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
  trackEntryPayload,
} from '../user-timing-extensibility-api-utils.js';
import type { ActionTrackEntryPayload, TrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_ENABLED_ENV_VAR,
  PROFILER_MEASURE_NAME_ENV_VAR,
  PROFILER_OUT_BASENAME,
  PROFILER_OUT_DIR_ENV_VAR,
  PROFILER_SHARDER_ID_ENV_VAR,
} from './constants.js';
import { NodejsProfiler, type NodejsProfilerOptions } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { TraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace.js';
import process from 'node:process';

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
        baseName: options.format?.baseName ?? PROFILER_OUT_BASENAME,
      },
      outDir: testSuitDir,
      enabled: options.enabled ?? true,
      debug: options.debug ?? false,
      measureName: options.measureName,
    });
    // eslint-disable-next-line functional/immutable-data
    activeProfilers.push(profiler);
    return profiler;
  }

  async function create3rdPartyMeasures(prefix: string) {
    const defaultPayload: TrackEntryPayload = {
      track: 'Buffered Track',
      trackGroup: 'Buffered Track',
      color: 'tertiary',
    };

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(() =>
      performance.mark(`${prefix}${prefix ? ':' : ''}measure:start`, asOptions(trackEntryPayload(defaultPayload))),
    ).not.toThrow();

    const largeArray = Array.from({ length: 100_000 }, (_, i) => i);
    const result = largeArray
      .map(x => x * x)
      .filter(x => x % 2 === 0)
      .reduce((sum, x) => sum + x, 0);
    expect(result).toBeGreaterThan(0);
    expect('sync success').toBe('sync success');
    expect(() => performance.mark(`${prefix}${prefix ? ':' : ''}measure:end`, asOptions(trackEntryPayload(defaultPayload)))).not.toThrow();

    performance.measure(`${prefix}${prefix ? ':' : ''}measure`, {
      start: `${prefix}${prefix ? ':' : ''}measure:start`,
      end: `${prefix}${prefix ? ':' : ''}measure:end`,
      ...asOptions(
        trackEntryPayload({
          ...defaultPayload,
          tooltipText: 'Buffered sync measurement returned :"sync success"',
        }),
      ),
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(() =>
      performance.mark(`${prefix}:async-measure:start`,asOptions(trackEntryPayload(defaultPayload))),
    ).not.toThrow();
    // Heavy work: More CPU-intensive operations
    const matrix = Array.from({ length: 1000 }, () =>
      Array.from({ length: 1000 }, (_, i) => i),
    );
    const flattened = matrix.flat();
    const sum = flattened.reduce((acc, val) => acc + val, 0);
    expect(sum).toBeGreaterThan(0);
    await expect(Promise.resolve('async success')).resolves.toBe(
      'async success',
    );
    expect(() => performance.mark(`${prefix}:async-measure:end`, asOptions(trackEntryPayload(defaultPayload)))).not.toThrow();

    performance.measure(`${prefix}:async-measure`, {
      start: `${prefix}:async-measure:start`,
      end: `${prefix}:async-measure:end`,
      ...asOptions(
        trackEntryPayload({
          ...defaultPayload,
          tooltipText: 'sync measurement returned :"async success"',
        }),
      ),
    });
  }

  async function createBasicMeasures(
    profiler: NodejsProfiler<TraceEvent>,
  ) {
    expect(() =>
      profiler.marker(`PID:${process.pid}: Enable profiler`, {
        tooltipText: 'set enable to true',
      }),
    ).not.toThrow();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(profiler.measure(`PID:${process.pid} sync-measure`, () => 'success')).toBe('success');

    await new Promise(resolve => setTimeout(resolve, 50));

    await expect(
      profiler.measureAsync(`PID:${process.pid} async-measure`, () =>
        Promise.resolve('async success'),
      ),
    ).resolves.toBe('async success');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(() =>
      profiler.marker(`PID:${process.pid}: Disable profiler`, {
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
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-dynamic-delete
    delete process.env[PROFILER_SHARDER_ID_ENV_VAR];
  });

  afterEach(() => {
    // eslint-disable-next-line functional/no-loop-statements
    for (const profiler of activeProfilers) {
      if (profiler.stats.profilerState !== 'closed') {
        profiler.close();
      }
    }
    // eslint-disable-next-line functional/immutable-data
    activeProfilers.length = 0;

    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-dynamic-delete
    delete process.env[PROFILER_SHARDER_ID_ENV_VAR];
  });

  afterAll(async () => {
    // Final cleanup of test directory
    if (fs.existsSync(testSuitDir)) {
      //   await fsPromises.rm(testSuitDir, { recursive: true, force: true });
    }
  });

  it('should initialize with shard opened when enabled', () => {
    const profiler = nodejsProfiler('initialize-shard-opened');
    expect(profiler.isEnabled()).toBe(true);
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

    await createBasicMeasures(profiler);

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

    expect(statsProfiler.measure('test-op', () => 'result')).toBe('result');

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
    expect(profiler.stats.written).toBe(8);

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
      new RegExp(`^${PROFILER_OUT_BASENAME}\\.${measureName}\\.json$`),
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

    createBasicMeasures(profiler);
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
    const numProcesses = 3;
    const startTime = performance.now();

    const { [PROFILER_MEASURE_NAME_ENV_VAR]: _measureName, ...cleanEnv } =
      process.env;

    const processStartTime = performance.now();
    const { stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'tsx',
        '--tsconfig',
        'tsconfig.base.json',
        path.relative(process.cwd(), workerScriptPath),
        String(numProcesses),
      ],
      cwd: process.cwd(),
      env: {
        ...cleanEnv,
        [PROFILER_ENABLED_ENV_VAR]: 'true',
        [PROFILER_DEBUG_ENV_VAR]: 'true',
        [PROFILER_OUT_DIR_ENV_VAR]: testSuitDir,
      },
    });
    const processDuration = performance.now() - processStartTime;

    if (!stdout.trim()) {
      const stderrMessage = stderr ? ` stderr: ${stderr}` : '';
      throw new Error(
        `Worker process produced no stdout output.${stderrMessage}`,
      );
    }

    let coordinatorStats;
    try {
      coordinatorStats = JSON.parse(stdout.trim());
    } catch (error) {
      throw new Error(
        `Failed to parse worker output as JSON. stdout: "${stdout}", stderr: "${stderr}"`,
        { cause: error },
      );
    }

    const validationStartTime = performance.now();
    expect(coordinatorStats).toMatchObject({
      isCoordinator: true,
      shardFileCount: numProcesses + 1, // numProcesses child processes + 1 coordinator shard
      groupId: expect.stringMatching(/^\d{8}-\d{6}-\d{3}$/), // Auto-generated groupId format
    });

    // Verify all processes share the same groupId
    const groupId = coordinatorStats.groupId;
    expect(coordinatorStats.finalFilePath).toContainPath(groupId);

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
    const validationDuration = performance.now() - validationStartTime;
    const totalDuration = performance.now() - startTime;

    // Log timing information for debugging
    // eslint-disable-next-line no-console
    console.log(
      `[Timing] Process execution: ${processDuration.toFixed(2)}ms, Validation: ${validationDuration.toFixed(2)}ms, Total: ${totalDuration.toFixed(2)}ms`,
    );
  }, 10_000); // Timeout: 10 seconds for multi-process coordination
});
