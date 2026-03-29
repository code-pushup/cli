import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { awaitObserverCallbackAndFlush } from '@code-pushup/test-utils';
import { normalizeAndFormatEvents } from '../../../mocks/omit-trace-json.js';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { ID_PATTERNS } from '../process-id.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_ENABLED_ENV_VAR,
  PROFILER_PERSIST_OUTDIR,
} from './constants.js';
import { NodejsProfiler } from './profiler-node.js';
import { entryToTraceEvents } from './trace-file-utils.js';
import type { TraceEvent } from './trace-file.type.js';
import { traceEventWalFormat } from './wal-json-trace.js';

describe('NodeJS Profiler Integration', () => {
  const traceEventEncoder: PerformanceEntryEncoder<TraceEvent> =
    entryToTraceEvents;

  let nodejsProfiler: NodejsProfiler<TraceEvent>;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);

    // Clean up trace files from previous test runs
    const traceFilesDir = path.join(process.cwd(), 'tmp', 'int', 'utils');

    if (fs.existsSync(traceFilesDir)) {
      const files = fs.readdirSync(traceFilesDir);
      // eslint-disable-next-line functional/no-loop-statements
      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.jsonl')) {
          fs.unlinkSync(path.join(traceFilesDir, file));
        }
      }
    }

    nodejsProfiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      format: {
        ...traceEventWalFormat,
        encodePerfEntry: traceEventEncoder,
      },
      enabled: true,
    });
  });

  afterEach(() => {
    if (nodejsProfiler && nodejsProfiler.state !== 'closed') {
      nodejsProfiler.close();
    }
    vi.stubEnv(PROFILER_ENABLED_ENV_VAR, undefined!);
    vi.stubEnv(PROFILER_DEBUG_ENV_VAR, undefined!);
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
    const groupId = 'trace-tracks';
    const profilerWithTracks = new NodejsProfiler({
      prefix: 'api-server',
      track: 'HTTP',
      tracks: {
        db: { track: 'Database', color: 'secondary' },
        cache: { track: 'Cache', color: 'primary' },
      },
      groupId,
      format: {
        ...traceEventWalFormat,
        encodePerfEntry: traceEventEncoder,
      },
      enabled: true,
    });

    expect(profilerWithTracks.filePath).toContainPath(
      path.join(PROFILER_PERSIST_OUTDIR, groupId),
    );
    expect(profilerWithTracks.filePath).toMatch(/\.jsonl$/);

    expect(
      profilerWithTracks.measure('user-lookup', () => 'user123', {
        track: 'cache',
      }),
    ).toBe('user123');

    await awaitObserverCallbackAndFlush(profilerWithTracks);
    profilerWithTracks.close();

    const shardText = (
      await fsPromises.readFile(profilerWithTracks.filePath, 'utf8')
    ).trim();
    const normalizedContent = normalizeAndFormatEvents(shardText);
    await expect(normalizedContent).toMatchFileSnapshot(
      '__snapshots__/custom-tracks-trace-events.jsonl',
    );
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = new NodejsProfiler({
      prefix: 'buffered-test',
      track: 'Test',
      captureBufferedEntries: true,
      format: {
        ...traceEventWalFormat,
        encodePerfEntry: traceEventEncoder,
      },
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
      maxQueueSize: 2,
      flushThreshold: 2,
      format: {
        ...traceEventWalFormat,
        encodePerfEntry: traceEventEncoder,
      },
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
    const groupId = 'trace-stats-comprehensive';
    const profiler = new NodejsProfiler({
      prefix: 'stats-profiler',
      track: 'Stats',
      maxQueueSize: 3,
      flushThreshold: 2,
      groupId,
      format: {
        ...traceEventWalFormat,
        encodePerfEntry: traceEventEncoder,
      },
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

    const shardText = (
      await fsPromises.readFile(profiler.filePath, 'utf8')
    ).trim();
    const normalizedContent = normalizeAndFormatEvents(shardText);
    await expect(normalizedContent).toMatchFileSnapshot(
      '__snapshots__/comprehensive-stats-trace-events.jsonl',
    );
  });

  describe('sharded path structure', () => {
    it('should create sharded path structure when filename is not provided', () => {
      const profiler = new NodejsProfiler({
        prefix: 'sharded-test',
        track: 'Test',
        format: {
          ...traceEventWalFormat,
          encodePerfEntry: traceEventEncoder,
        },
        enabled: true,
      });

      const filePath = profiler.filePath;
      expect(filePath).toContainPath('tmp/profiles');
      expect(filePath).toMatch(/\.jsonl$/);

      const pathParts = filePath.split(path.sep);
      const groupIdDir = pathParts.at(-2);
      const fileName = pathParts.at(-1);

      expect(groupIdDir).toMatch(ID_PATTERNS.TIME_ID);
      expect(fileName).toMatch(/^trace\.\d{8}-\d{6}-\d{3}(?:\.\d+){3}\.jsonl$/);

      const groupIdDirPath = path.dirname(filePath);

      expect(fs.existsSync(groupIdDirPath)).toBeTrue();

      profiler.close();
    });

    it('should create correct folder structure for sharded paths', () => {
      const profiler = new NodejsProfiler({
        prefix: 'folder-test',
        track: 'Test',
        format: {
          ...traceEventWalFormat,
          encodePerfEntry: traceEventEncoder,
        },
        enabled: true,
      });

      const filePath = profiler.filePath;
      const dirPath = path.dirname(filePath);
      const groupId = path.basename(dirPath);

      expect(groupId).toMatch(ID_PATTERNS.TIME_ID);

      expect(fs.existsSync(dirPath)).toBeTrue();

      expect(fs.statSync(dirPath).isDirectory()).toBeTrue();

      profiler.close();
    });

    it('should write trace events to sharded path file', async () => {
      const profiler = new NodejsProfiler({
        prefix: 'write-test',
        track: 'Test',
        format: {
          ...traceEventWalFormat,
          encodePerfEntry: traceEventEncoder,
        },
        enabled: true,
      });

      profiler.measure('test-operation', () => 'result');

      await awaitObserverCallbackAndFlush(profiler);
      profiler.close();

      const shardText = (
        await fsPromises.readFile(profiler.filePath, 'utf8')
      ).trim();
      const normalizedContent = normalizeAndFormatEvents(shardText);
      await expect(normalizedContent).toMatchFileSnapshot(
        '__snapshots__/sharded-path-trace-events.jsonl',
      );
    });
  });
});
