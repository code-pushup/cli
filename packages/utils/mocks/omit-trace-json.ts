import * as fs from 'node:fs/promises';
import {
  createTraceFile,
  decodeEvent,
  encodeEvent,
  frameName,
  frameTreeNodeId,
} from '../src/lib/profiler/trace-file-utils.js';
import type {
  TraceEvent,
  TraceEventContainer,
  TraceMetadata,
} from '../src/lib/profiler/trace-file.type';

/**
 * Parses JSONL string and decodes all events.
 */
const parseAndDecodeJsonl = (input: string): TraceEvent[] =>
  input
    .split('\n')
    .filter(Boolean)
    .map(line => decodeEvent(JSON.parse(line)));

/**
 * Parses JSONL string without decoding (preserves encoded format).
 */
const parseJsonl = (input: string): TraceEvent[] =>
  input
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as TraceEvent);

/**
 * Normalizes encoded events and preserves encoded format.
 * Similar to normalizeEncoded but works directly on encoded events from JSONL.
 */
const normalizeEncodedJsonl = (
  events: TraceEvent[],
  options?: { baseTimestampUs: number },
): TraceEvent[] => {
  // Decode temporarily to normalize (normalizeAndFormatEvents needs decoded format)
  const decodedEvents = events.map(decodeEvent);
  const normalizedDecoded = normalizeAndFormatEvents(decodedEvents, options);
  // Re-encode to preserve serialized format
  return normalizedDecoded.map(encodeEvent);
};

export async function loadAndOmitTraceJsonl(
  filePath: `${string}.jsonl`,
  options?: {
    baseTimestampUs: number;
  },
): Promise<TraceEvent[]> {
  const baseTimestampUs = options?.baseTimestampUs ?? 1_700_000_005_000_000;
  const stringContent = (await fs.readFile(filePath)).toString().trim();

  // Parse and decode events
  const events = parseAndDecodeJsonl(stringContent);
  // Normalize decoded events
  const normalizedEvents = normalizeAndFormatEvents(events, {
    baseTimestampUs,
  });
  return normalizedEvents;
}

/**
 * Validates that a value can be serialized to and parsed from valid JSON.
 * Throws an error if the value cannot be round-tripped through JSON.
 */
function validateJsonSerializable(value: unknown): void {
  try {
    const serialized = JSON.stringify(value);
    JSON.parse(serialized);
  } catch (error) {
    throw new Error(
      `Value is not valid JSON serializable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function loadAndOmitTraceJson(
  filePath: string,
  options?: {
    baseTimestampUs: number;
  },
): Promise<TraceEventContainer> {
  const baseTimestampUs = options?.baseTimestampUs ?? 1_700_000_005_000_000;
  const stringContent = (await fs.readFile(filePath)).toString().trim();

  const parsed = JSON.parse(stringContent);

  // Normalize metadata timestamps if present
  function normalizeMetadata(
    metadata?: TraceMetadata | Record<string, unknown>,
  ): TraceMetadata | undefined {
    if (!metadata) {
      return undefined;
    }
    return {
      ...metadata,
      generatedAt: '2026-01-28T14:29:27.995Z',
      startTime: '2026-01-28T14:29:27.995Z',
    } as TraceMetadata;
  }

  // Check if it's a trace container structure
  if (
    typeof parsed === 'object' &&
    ('traceEvents' in parsed || 'metadata' in parsed)
  ) {
    // Single trace container
    const container = parsed as {
      traceEvents?: TraceEvent[];
      metadata?: TraceMetadata;
      displayTimeUnit?: 'ms' | 'ns';
    };
    // Normalize events and return decoded format
    const decodedEvents = (container.traceEvents ?? []).map(decodeEvent);
    const normalizedEvents = normalizeAndFormatEvents(decodedEvents, {
      baseTimestampUs,
    });
    const result: TraceEventContainer = {
      traceEvents: normalizedEvents,
    };
    if (container.displayTimeUnit) {
      result.displayTimeUnit = container.displayTimeUnit;
    }
    if (container.metadata) {
      result.metadata = normalizeMetadata(container.metadata);
    }
    // Validate that the result can be serialized to valid JSON
    validateJsonSerializable(result);
    return result;
  }

  // Fallback: if structure is unexpected, wrap events in container
  const fallbackResult = {
    traceEvents: [],
  };
  validateJsonSerializable(fallbackResult);
  return fallbackResult;
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
 * @param traceEvents - Array of trace events to normalize, or JSONL string
 * @param options - Optional configuration with baseTimestampUs
 * @returns Array of normalized events, or JSONL string if input was string
 */
export function normalizeAndFormatEvents(
  traceEvents: TraceEvent[],
  options?: { baseTimestampUs: number },
): TraceEvent[];
export function normalizeAndFormatEvents(
  traceEvents: string,
  options?: { baseTimestampUs: number },
): string;
export function normalizeAndFormatEvents(
  traceEvents: TraceEvent[] | string,
  options?: { baseTimestampUs: number },
): TraceEvent[] | string {
  if (typeof traceEvents === 'string') {
    if (!traceEvents.trim()) {
      return traceEvents;
    }
    const events = parseJsonl(traceEvents);
    const decodedEvents = events.map(decodeEvent);
    const normalized = normalizeAndFormatEventsArray(decodedEvents, options);
    const encoded = normalized.map(encodeEvent);
    const result = encoded.map(event => JSON.stringify(event)).join('\n');
    const hasTrailingNewline = traceEvents.endsWith('\n');
    return hasTrailingNewline ? result + '\n' : result;
  }
  return normalizeAndFormatEventsArray(traceEvents, options);
}

/**
 * Maps a value if it exists in the map, otherwise returns empty object.
 */
const mapIf = <T, R>(
  value: T | undefined,
  map: Map<T, R>,
  key: string,
): Record<string, R> =>
  value != null && map.has(value) ? { [key]: map.get(value)! } : {};

/**
 * Normalizes frame objects with process ID and frame name.
 */
const normalizeFrames = (
  frames: unknown[],
  pid: number,
  tid: number,
): unknown[] =>
  frames.map(frame =>
    frame && typeof frame === 'object'
      ? {
          ...(frame as Record<string, unknown>),
          processId: pid,
          frame: frameName(pid, tid),
        }
      : frame,
  );

/**
 * Internal function that normalizes an array of trace events.
 */
function normalizeAndFormatEventsArray(
  traceEvents: TraceEvent[],
  options?: {
    baseTimestampUs: number;
  },
): TraceEvent[] {
  if (traceEvents.length === 0) {
    return [];
  }
  const { baseTimestampUs = 1_700_000_005_000_000 } = options ?? {};

  // Decode events first if they have string-encoded details
  const decodedEvents = traceEvents.map(event => {
    // Check if details are strings and decode them
    if (event.args?.detail && typeof event.args.detail === 'string') {
      return decodeEvent(event);
    }
    if (
      event.args?.data?.detail &&
      typeof event.args.data.detail === 'string'
    ) {
      return decodeEvent(event);
    }
    return event;
  });

  const uniquePids = new Set<number>();
  const uniqueTids = new Set<number>();
  const uniqueLocalIds = new Set<string>();
  const timestamps: number[] = [];

  for (const event of decodedEvents) {
    if (event.pid != null) uniquePids.add(event.pid);
    if (event.tid != null) uniqueTids.add(event.tid);
    timestamps.push(event.ts);
    if (event.id2?.local && typeof event.id2.local === 'string') {
      uniqueLocalIds.add(event.id2.local);
    }
  }

  const pidMap = new Map(
    [...uniquePids].sort((a, b) => a - b).map((pid, i) => [pid, 10_001 + i]),
  );
  const tidMap = new Map(
    [...uniqueTids].sort((a, b) => a - b).map((tid, i) => [tid, 1 + i]),
  );
  const localIdMap = new Map(
    [...uniqueLocalIds]
      .sort()
      .map((localId, i) => [localId, `0x${(i + 1).toString(16)}`]),
  );
  const tsMap = new Map(
    [...new Set(timestamps)]
      .sort((a, b) => a - b)
      .map((ts, i) => [ts, baseTimestampUs + i * 100]),
  );

  // Normalize events while preserving original order
  return decodedEvents.map(event => {
    const pid = pidMap.get(event.pid) ?? event.pid;
    const tid = tidMap.get(event.tid) ?? event.tid;

    const normalized: TraceEvent = {
      ...event,
      ...mapIf(event.pid, pidMap, 'pid'),
      ...mapIf(event.tid, tidMap, 'tid'),
      ...mapIf(event.ts, tsMap, 'ts'),
      ...(event.id2?.local && localIdMap.has(event.id2.local)
        ? { id2: { ...event.id2, local: localIdMap.get(event.id2.local)! } }
        : {}),
    };

    // Handle args normalization
    if (event.args?.data && typeof event.args.data === 'object') {
      normalized.args = {
        ...event.args,
        data: {
          ...event.args.data,
          ...(typeof pid === 'number' &&
            typeof tid === 'number' &&
            'frameTreeNodeId' in event.args.data && {
              frameTreeNodeId: frameTreeNodeId(pid, tid),
            }),
          ...(Array.isArray(
            (event.args.data as Record<string, unknown>).frames,
          ) && {
            frames: normalizeFrames(
              (event.args.data as Record<string, unknown>).frames as unknown[],
              pid,
              tid,
            ),
          }),
        },
      };
    } else if (event.args) {
      // Preserve args if it exists and has other properties
      normalized.args = event.args;
    }
    // If args is undefined or doesn't exist, don't include it

    return normalized;
  });
}

/**
 * Loads a normalized trace from a JSON file.
 * @param filePath - The path to the JSON trace file.
 * @returns The normalized trace.
 */
export async function loadNormalizedTraceJson(
  filePath: `${string}.json`,
): Promise<TraceEventContainer> {
  const baseTimestampUs = 1_700_000_005_000_000;
  const stringContent = (await fs.readFile(filePath)).toString().trim();
  const parsed = JSON.parse(stringContent);

  function normalizeMetadata(
    metadata?: TraceMetadata | Record<string, unknown>,
  ): TraceMetadata | undefined {
    if (!metadata) {
      return undefined;
    }
    // Remove generatedAt to match valid-trace.json shape
    const { generatedAt, ...restMetadata } = metadata as Record<
      string,
      unknown
    >;
    return {
      ...restMetadata,
      startTime: '2026-01-28T14:29:27.995Z',
    } as TraceMetadata;
  }

  const container = parsed as {
    traceEvents?: TraceEvent[];
    metadata?: TraceMetadata;
    displayTimeUnit?: 'ms' | 'ns';
  };
  const decodedEvents = (container.traceEvents ?? []).map(decodeEvent);
  const normalizedEvents = normalizeAndFormatEvents(decodedEvents, {
    baseTimestampUs,
  });
  const result = createTraceFile({
    traceEvents: normalizedEvents,
    startTime: container.metadata?.startTime,
    metadata: normalizeMetadata(container.metadata),
  });
  // Remove displayTimeUnit to match valid-trace.json shape
  const { displayTimeUnit, ...rest } = result;
  return rest;
}

/**
 * Loads a normalized trace from a JSONL file.
 * @param filePath - The path to the JSONL trace file.
 * @returns The normalized trace.
 */
export async function loadNormalizedTraceJsonl(
  filePath: `${string}.jsonl`,
): Promise<TraceEventContainer> {
  const baseTimestampUs = 1_700_000_005_000_000;
  const stringContent = (await fs.readFile(filePath)).toString().trim();
  const events = parseAndDecodeJsonl(stringContent);
  const normalizedEvents = normalizeAndFormatEvents(events, {
    baseTimestampUs,
  });
  return createTraceFile({
    traceEvents: normalizedEvents,
  });
}

export function expectTraceDecodable(container: TraceEventContainer): void {
  for (const event of container.traceEvents) {
    if (event.cat === 'blink.user_timing') {
      expect(() => decodeEvent(event)).not.toThrow();
    }
  }
}
