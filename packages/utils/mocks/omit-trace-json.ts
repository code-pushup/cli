import * as fs from 'node:fs/promises';
import type {
  SpanEvent,
  TraceEventRaw,
} from '../src/lib/profiler/trace-file.type';

/**
 * Trace container structure for complete JSON trace files.
 */
type TraceContainer = {
  metadata?: {
    generatedAt?: string;
    startTime?: string;
    [key: string]: unknown;
  };
  traceEvents?: TraceEventRaw[];
  [key: string]: unknown;
};

export async function loadAndOmitTraceJsonl(
  filePath: `${string}.jsonl`,
  baseTimestampUs = 1_700_000_005_000_000,
) {
  const stringContent = (await fs.readFile(filePath)).toString().trim();

  // Parse as JSONL (line-by-line)
  const events = stringContent
    .split('\n')
    .filter(Boolean)
    .map((line: string) => JSON.parse(line))
    .map((row: TraceEventRaw) => {
      const args = row.args || {};
      const processedArgs: {
        data?: { detail?: object; [key: string]: unknown };
        detail?: object;
        [key: string]: unknown;
      } = {};

      // Copy all properties except detail and data
      Object.keys(args).forEach(key => {
        if (key !== 'detail' && key !== 'data') {
          processedArgs[key] = args[key];
        }
      });

      // Parse detail if it exists
      if (args.detail != null && typeof args.detail === 'string') {
        processedArgs.detail = JSON.parse(args.detail);
      }

      // Parse data.detail if data exists and has detail
      if (args.data != null && typeof args.data === 'object') {
        const processedData: { detail?: object; [key: string]: unknown } = {};
        const dataObj = args.data as Record<string, unknown>;

        // Copy all properties from data except detail
        Object.keys(dataObj).forEach(key => {
          if (key !== 'detail') {
            processedData[key] = dataObj[key];
          }
        });

        // Parse detail if it exists
        if (args.data.detail != null && typeof args.data.detail === 'string') {
          processedData.detail = JSON.parse(args.data.detail);
        }

        processedArgs.data = processedData;
      }

      return {
        ...row,
        args: processedArgs,
      } as TraceEventRaw;
    });

  return normalizeAndFormatEvents(events, { baseTimestampUs });
}

export async function loadAndOmitTraceJson(
  filePath: `${string}.json`,
  baseTimestampUs = 1_700_000_005_000_000,
) {
  const stringContent = (await fs.readFile(filePath)).toString().trim();

  const parsed = JSON.parse(stringContent);

  if (parsed.metadata) {
    parsed.metadata = {
      ...parsed.metadata,
      generatedAt: '2026-01-28T14:29:27.995Z',
      startTime: '2026-01-28T14:29:27.995Z',
    };
  }

  // Check if it's a trace container structure (array of containers or single container)
  if (Array.isArray(parsed)) {
    // Array of trace containers
    return parsed.map(container =>
      normalizeAndFormatEvents(container, baseTimestampUs),
    );
  } else if (
    typeof parsed === 'object' &&
    ('traceEvents' in parsed || 'metadata' in parsed)
  ) {
    // Single trace container
    return normalizeAndFormatEvents(parsed, baseTimestampUs);
  }
}

/**
 * Normalizes trace events for deterministic snapshot testing.
 *
 * Replaces variable values (pid, tid, ts) with deterministic incremental values
 * while preserving the original order of events.
 *
 * - Assigns incremental IDs to pid fields starting from 10001, 10002, etc.
 * - Assigns incremental IDs to tid fields starting from 1, 2, etc.
 * - Normalizes timestamps by sorting them first to determine incremental order,
 *   then mapping to incremental values starting from mocked epoch clock base,
 *   while preserving the original order of events in the output.
 * - Normalizes metadata timestamps (generatedAt, startTime) to fixed values
 * - Normalizes nested process IDs in args.data (frameTreeNodeId, frames[].processId, frames[].frame)
 *
 * @param traceEvents - The events to nurmalize
 * @param options
 * @returns Normalized trace container object (for single JSON file), array of trace containers (for array JSON), or array of trace events (for JSONL)
 */ export function normalizeAndFormatEvents<
  I extends object,
  O extends object,
>(
  traceEvents: TraceEventRaw[],
  options: {
    baseTimestampUs: number;
  },
): TraceEventRaw[] {
  if (traceEvents.length === 0) {
    return [];
  }
  const { baseTimestampUs } = options;

  // Collect unique pid and tid values
  type Accumulator = {
    uniquePids: Set<number>;
    uniqueTids: Set<number>;
    timestamps: number[];
    uniqueLocalIds: Set<string>;
  };

  const { uniquePids, uniqueTids, timestamps, uniqueLocalIds } =
    traceEvents.reduce<Accumulator>(
      (acc, event) => {
        const newUniquePids = new Set(acc.uniquePids);
        const newUniqueTids = new Set(acc.uniqueTids);
        const newUniqueLocalIds = new Set(acc.uniqueLocalIds);

        if (event.tid != null) {
          newUniquePids.add(event.pid);
        }
        if (event.tid != null) {
          newUniqueTids.add(event.tid);
        }

        const newTimestamps = [...acc.timestamps, event.ts];

        // Collect id2.local values
        if (
          'id2' in event &&
          (event as SpanEvent).id2 &&
          typeof (event as SpanEvent).id2 === 'object' &&
          'local' in (event as SpanEvent).id2 &&
          typeof (event as SpanEvent).id2.local === 'string'
        ) {
          newUniqueLocalIds.add((event as SpanEvent).id2.local);
        }

        return {
          uniquePids: newUniquePids,
          uniqueTids: newUniqueTids,
          timestamps: newTimestamps,
          uniqueLocalIds: newUniqueLocalIds,
        };
      },
      {
        uniquePids: new Set<number>(),
        uniqueTids: new Set<number>(),
        timestamps: [] as number[],
        uniqueLocalIds: new Set<string>(),
      },
    );

  // Create mappings: original value -> normalized incremental value
  const pidMap = new Map<number, number>();
  const tidMap = new Map<number, number>();
  const localIdMap = new Map<string, string>();

  // Sort unique values to ensure consistent mapping order
  const sortedPids = [...uniquePids].sort((a, b) => a - b);
  const sortedTids = [...uniqueTids].sort((a, b) => a - b);
  const sortedLocalIds = [...uniqueLocalIds].sort();

  // Map pids starting from 10001
  sortedPids.forEach((pid, index) => {
    pidMap.set(pid, 10_001 + index);
  });

  // Map tids starting from 1
  sortedTids.forEach((tid, index) => {
    tidMap.set(tid, 1 + index);
  });

  // Map local IDs starting from "0x1"
  sortedLocalIds.forEach((localId, index) => {
    localIdMap.set(localId, `0x${(index + 1).toString(16)}`);
  });

  // Sort timestamps to determine incremental order
  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);

  // Map timestamps incrementally starting from baseTimestampUs
  const tsMap = sortedTimestamps.reduce((map, ts, index) => {
    if (!map.has(ts)) {
      return new Map(map).set(ts, baseTimestampUs + index);
    }
    return map;
  }, new Map<number, number>());

  // Normalize events while preserving original order
  return traceEvents.map(event => {
    const normalizedPid =
      typeof event.pid === 'number' && pidMap.has(event.pid)
        ? pidMap.get(event.pid)!
        : event.pid;

    const normalizedTid =
      typeof event.tid === 'number' && tidMap.has(event.tid)
        ? tidMap.get(event.tid)!
        : event.tid;

    const pidUpdate =
      typeof event.pid === 'number' && pidMap.has(event.pid)
        ? { pid: normalizedPid }
        : {};

    const tidUpdate =
      typeof event.tid === 'number' && tidMap.has(event.tid)
        ? { tid: normalizedTid }
        : {};

    const tsUpdate =
      typeof event.ts === 'number' && tsMap.has(event.ts)
        ? { ts: tsMap.get(event.ts)! }
        : {};

    // Normalize id2.local if present
    const id2Update =
      'id2' in event &&
      (event as SpanEvent).id2 &&
      typeof (event as SpanEvent).id2 === 'object' &&
      'local' in (event as SpanEvent).id2 &&
      typeof (event as SpanEvent).id2.local === 'string' &&
      localIdMap.has((event as SpanEvent).id2.local)
        ? {
            id2: {
              ...(event as SpanEvent).id2,
              local: localIdMap.get((event as SpanEvent).id2.local)!,
            },
          }
        : {};

    // Parse detail strings to objects and normalize nested args.data fields
    let argsUpdate = {};
    if (event.args && typeof event.args === 'object') {
      const processedArgs: {
        data?: { detail?: object; [key: string]: unknown };
        detail?: object;
        [key: string]: unknown;
      } = { ...event.args };

      // Parse detail if it exists and is a string
      if (
        'detail' in event.args &&
        event.args.detail != null &&
        typeof event.args.detail === 'string'
      ) {
        try {
          processedArgs.detail = JSON.parse(event.args.detail);
        } catch {
          // If parsing fails, keep as string
        }
      }

      // Parse data.detail if data exists and has detail
      if (
        'data' in event.args &&
        event.args.data &&
        typeof event.args.data === 'object'
      ) {
        const data = event.args.data as Record<string, unknown>;
        const normalizedData: Record<string, unknown> = { ...data };

        // Parse detail if it exists and is a string
        if (
          'detail' in data &&
          data['detail'] != null &&
          typeof data['detail'] === 'string'
        ) {
          try {
            normalizedData['detail'] = JSON.parse(data['detail'] as string);
          } catch {
            // If parsing fails, keep as string
          }
        }

        // Normalize frameTreeNodeId if present
        if (
          'frameTreeNodeId' in data &&
          typeof normalizedPid === 'number' &&
          typeof normalizedTid === 'number'
        ) {
          normalizedData['frameTreeNodeId'] = Number.parseInt(
            `${normalizedPid}0${normalizedTid}`,
            10,
          );
        }

        // Normalize frames array if present
        if ('frames' in data && Array.isArray(data['frames'])) {
          normalizedData['frames'] = data['frames'].map((frame: unknown) => {
            if (
              frame &&
              typeof frame === 'object' &&
              typeof normalizedPid === 'number' &&
              typeof normalizedTid === 'number'
            ) {
              const frameObj = frame as Record<string, unknown>;
              const normalizedFrame: Record<string, unknown> = { ...frameObj };

              // Normalize processId
              if ('processId' in frameObj) {
                normalizedFrame['processId'] = normalizedPid;
              }

              // Normalize frame name (format: FRAME0P{pid}T{tid})
              if ('frame' in frameObj) {
                normalizedFrame['frame'] =
                  `FRAME0P${normalizedPid}T${normalizedTid}`;
              }

              return normalizedFrame;
            }
            return frame;
          });
        }

        processedArgs.data = normalizedData;
      }

      argsUpdate = {
        args: processedArgs,
      };
    }

    return {
      ...event,
      ...pidUpdate,
      ...tidUpdate,
      ...tsUpdate,
      ...id2Update,
      ...argsUpdate,
    };
  });
}
