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
 * @param jsonlContent - JSONL string content (one JSON object per line)
 * @param baseTimestampUs - Base timestamp in microseconds to start incrementing from (default: 1_700_000_005_000_000)
 * @returns Normalized JSONL string with deterministic pid, tid, and ts values
 */
export function omitTraceJson(
  jsonlContent: string,
  baseTimestampUs = 1_700_000_005_000_000,
): string {
  if (!jsonlContent.trim()) {
    return jsonlContent;
  }

  // Parse all events from JSONL
  const events = jsonlContent
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as TraceEvent);

  if (events.length === 0) {
    return jsonlContent;
  }

  // Collect unique pid and tid values
  const uniquePids = new Set<number>();
  const uniqueTids = new Set<number>();
  const timestamps: number[] = [];
  const uniqueLocalIds = new Set<string>();

  for (const event of events) {
    if (typeof event.pid === 'number') {
      uniquePids.add(event.pid);
    }
    if (typeof event.tid === 'number') {
      uniqueTids.add(event.tid);
    }
    if (typeof event.ts === 'number') {
      timestamps.push(event.ts);
    }
    // Collect id2.local values
    if (
      event.id2 &&
      typeof event.id2 === 'object' &&
      'local' in event.id2 &&
      typeof event.id2.local === 'string'
    ) {
      uniqueLocalIds.add(event.id2.local);
    }
  }

  // Create mappings: original value -> normalized incremental value
  const pidMap = new Map<number, number>();
  const tidMap = new Map<number, number>();
  const localIdMap = new Map<string, string>();

  // Sort unique values to ensure consistent mapping order
  const sortedPids = Array.from(uniquePids).sort((a, b) => a - b);
  const sortedTids = Array.from(uniqueTids).sort((a, b) => a - b);
  const sortedLocalIds = Array.from(uniqueLocalIds).sort();

  // Map pids starting from 10001
  sortedPids.forEach((pid, index) => {
    pidMap.set(pid, 10001 + index);
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
  const tsMap = new Map<number, number>();

  // Map timestamps incrementally starting from baseTimestampUs
  sortedTimestamps.forEach((ts, index) => {
    if (!tsMap.has(ts)) {
      tsMap.set(ts, baseTimestampUs + index);
    }
  });

  // Normalize events while preserving original order
  const normalizedEvents = events.map(event => {
    const normalized: TraceEvent = { ...event };

    if (typeof normalized.pid === 'number' && pidMap.has(normalized.pid)) {
      normalized.pid = pidMap.get(normalized.pid)!;
    }

    if (typeof normalized.tid === 'number' && tidMap.has(normalized.tid)) {
      normalized.tid = tidMap.get(normalized.tid)!;
    }

    if (typeof normalized.ts === 'number' && tsMap.has(normalized.ts)) {
      normalized.ts = tsMap.get(normalized.ts)!;
    }

    // Normalize id2.local if present
    if (
      normalized.id2 &&
      typeof normalized.id2 === 'object' &&
      'local' in normalized.id2 &&
      typeof normalized.id2.local === 'string' &&
      localIdMap.has(normalized.id2.local)
    ) {
      normalized.id2 = {
        ...normalized.id2,
        local: localIdMap.get(normalized.id2.local)!,
      };
    }

    return normalized;
  });

  // Convert back to JSONL format
  return normalizedEvents.map(event => JSON.stringify(event)).join('\n') + '\n';
}

/**
 * Trace event structure with pid, tid, ts, and id2.local fields.
 */
type TraceEvent = {
  pid?: number;
  tid?: number;
  ts?: number;
  id2?: {
    local?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
