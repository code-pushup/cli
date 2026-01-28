import * as fs from 'node:fs/promises';

/**
 * Trace event structure with pid, tid, ts, and id2.local fields.
 */
type TraceEventRaw = {
  args: {
    data?: { detail?: string };
    detail?: string;
    [key: string]: unknown;
  };
};
type TraceEvent = {
  pid: number | string;
  tid: number | string;
  ts: number;
  id2?: { local: string };
  args: {
    data?: { detail?: object };
    detail?: object;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Normalizes trace JSONL files for deterministic snapshot testing.
 *
 * Replaces variable values (pid, tid, ts) with deterministic incremental values
 * while preserving the original order of events.
 *
 * - Assigns incremental IDs to pid fields starting from 10001, 10002, etc.
 * - Assigns incremental IDs to tid fields starting from 1, 2, etc.
 * - Normalizes timestamps by sorting them first to determine incremental order,
 *   then mapping to incremental values starting from mocked epoch clock base,
 *   while preserving the original order of events in the output.
 *
 * @param filePath - Path to JSONL file to load and normalize
 * @param baseTimestampUs - Base timestamp in microseconds to start incrementing from (default: 1_700_000_005_000_000)
 * @returns Normalized array of trace event objects with deterministic pid, tid, and ts values
 */
export async function loadAndOmitTraceJson(
  filePath: string,
  baseTimestampUs = 1_700_000_005_000_000,
) {
  const stringContent = (await fs.readFile(filePath)).toString();
  // Parse all events from JSONL
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
      } as TraceEvent;
    });

  return normalizeAndFormatEvents(events, baseTimestampUs);
}

/**
 * Normalizes trace events and returns parsed objects.
 */
function normalizeAndFormatEvents(
  events: TraceEvent[],
  baseTimestampUs: number,
): TraceEvent[] {
  if (events.length === 0) {
    return [];
  }

  // Collect unique pid and tid values
  type Accumulator = {
    uniquePids: Set<number>;
    uniqueTids: Set<number>;
    timestamps: number[];
    uniqueLocalIds: Set<string>;
  };

  const { uniquePids, uniqueTids, timestamps, uniqueLocalIds } =
    events.reduce<Accumulator>(
      (acc, event) => {
        const newUniquePids = new Set(acc.uniquePids);
        const newUniqueTids = new Set(acc.uniqueTids);
        const newUniqueLocalIds = new Set(acc.uniqueLocalIds);

        if (typeof event.pid === 'number') {
          newUniquePids.add(event.pid);
        }
        if (typeof event.tid === 'number') {
          newUniqueTids.add(event.tid);
        }

        const newTimestamps =
          typeof event.ts === 'number'
            ? [...acc.timestamps, event.ts]
            : acc.timestamps;

        // Collect id2.local values
        if (
          event.id2 &&
          typeof event.id2 === 'object' &&
          'local' in event.id2 &&
          typeof event.id2.local === 'string'
        ) {
          newUniqueLocalIds.add(event.id2.local);
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
  const normalizedEvents = events.map(event => {
    const pidUpdate =
      typeof event.pid === 'number' && pidMap.has(event.pid)
        ? { pid: pidMap.get(event.pid)! }
        : {};

    const tidUpdate =
      typeof event.tid === 'number' && tidMap.has(event.tid)
        ? { tid: tidMap.get(event.tid)! }
        : {};

    const tsUpdate =
      typeof event.ts === 'number' && tsMap.has(event.ts)
        ? { ts: tsMap.get(event.ts)! }
        : {};

    // Normalize id2.local if present
    const id2Update =
      event.id2 &&
      typeof event.id2 === 'object' &&
      'local' in event.id2 &&
      typeof event.id2.local === 'string' &&
      localIdMap.has(event.id2.local)
        ? {
            id2: {
              ...event.id2,
              local: localIdMap.get(event.id2.local)!,
            },
          }
        : {};

    return {
      ...event,
      ...pidUpdate,
      ...tidUpdate,
      ...tsUpdate,
      ...id2Update,
    };
  });

  return normalizedEvents;
}
