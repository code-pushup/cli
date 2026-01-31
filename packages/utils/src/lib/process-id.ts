import process from 'node:process';
import { threadId } from 'node:worker_threads';

/**
 * Counter interface for generating sequential instance IDs.
 * Encapsulates increment logic within the counter-implementation.
 */
export type Counter = {
  /**
   * Returns the next counter-value and increments the internal state.
   * @returns The next counter-value
   */
  next: () => number;
};

/**
 * Base regex pattern for time ID format: yyyymmdd-hhmmss-ms
 */
export const TIME_ID_BASE = /\d{8}-\d{6}-\d{3}/;

/**
 * Regex patterns for validating process and instance ID formats.
 * All patterns use strict anchors (^ and $) to ensure complete matches.
 */
export const ID_PATTERNS = Object.freeze({
  /**
   * Time ID / Run ID format: yyyymmdd-hhmmss-ms
   * Example: "20240101-120000-000"
   * Used by: getUniqueTimeId()
   */
  TIME_ID: new RegExp(`^${TIME_ID_BASE.source}$`),
  /**
   * Group ID format: alias by convention, semantically represents a group of instances
   * Example: "20240101-120000-000"
   * Used by: grouping related instances by time
   */
  GROUP_ID: new RegExp(`^${TIME_ID_BASE.source}$`),
  /**
   * Process/Thread ID format: timeId-pid-threadId
   * Example: "20240101-120000-000-12345-1"
   * Used by: getUniqueProcessThreadId()
   */
  PROCESS_THREAD_ID: new RegExp(`^${TIME_ID_BASE.source}-\\d+-\\d+$`),
  /**
   * Instance ID format: timeId.pid.threadId.counter
   * Example: "20240101-120000-000.12345.1.1"
   * Used by: getUniqueInstanceId()
   */
  INSTANCE_ID: new RegExp(`^${TIME_ID_BASE.source}\\.\\d+\\.\\d+\\.\\d+$`),
  /** @deprecated Use INSTANCE_ID instead */
  SHARD_ID: new RegExp(`^${TIME_ID_BASE.source}\\.\\d+\\.\\d+\\.\\d+$`),
  /** @deprecated Use TIME_ID instead */
  READABLE_DATE: new RegExp(`^${TIME_ID_BASE.source}$`),
} as const);

/**
 * Generates a unique run ID.
 * This ID uniquely identifies a run/execution with a globally unique, sortable, human-readable date string.
 * Format: yyyymmdd-hhmmss-ms
 * Example: "20240101-120000-000"
 *
 * @returns A unique run ID string in readable date format
 */
export function getUniqueTimeId(): string {
  return sortableReadableDateString(
    Math.floor(performance.timeOrigin + performance.now()),
  );
}

/**
 * Generates a unique process/thread ID.
 * This ID uniquely identifies a process/thread execution and prevents race conditions when running
 * the same plugin for multiple projects in parallel.
 * Format: timeId-pid-threadId
 * Example: "20240101-120000-000-12345-1"
 *
 * @returns A unique ID string combining timestamp, process ID, and thread ID
 */
export function getUniqueProcessThreadId(): string {
  return `${getUniqueTimeId()}-${process.pid}-${threadId}`;
}

/**
 * Generates a unique instance ID based on performance time origin, process ID, thread ID, and instance count.
 * This ID uniquely identifies an instance across processes and threads.
 * Format: timestamp.pid.threadId.counter
 * Example: "20240101-120000-000.12345.1.1"
 *
 * @param counter - Counter that provides the next instance count value
 * @returns A unique ID string combining timestamp, process ID, thread ID, and counter
 */
export function getUniqueInstanceId(counter: Counter): string {
  return `${getUniqueTimeId()}.${process.pid}.${threadId}.${counter.next()}`;
}

/**
 * Generates a unique instance ID and updates a static class property.
 * Encapsulates the read → increment → write pattern safely within a single execution context.
 *
 * @param getCount - Function that returns the current instance count
 * @param setCount - Function that sets the new instance count
 * @returns A unique ID string combining timestamp, process ID, thread ID, and counter
 */
export function getUniqueInstanceIdAndUpdate(
  getCount: () => number,
  setCount: (value: number) => void,
): string {
  let value = getCount();
  const counter: Counter = {
    next() {
      return ++value;
    },
  };
  const id = getUniqueInstanceId(counter);
  setCount(value);
  return id;
}

/**
 * Converts a timestamp in milliseconds to a sortable, human-readable date string.
 * Format: yyyymmdd-hhmmss-ms
 * Example: "20240101-120000-000"
 *
 * @param timestampMs - Timestamp in milliseconds
 * @returns A sortable date string in yyyymmdd-hhmmss-ms format
 */
export function sortableReadableDateString(timestampMs: number): string {
  const date = new Date(timestampMs);
  const MILLISECONDS_PER_SECOND = 1000;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const ms = String(timestampMs % MILLISECONDS_PER_SECOND).padStart(3, '0');

  return `${yyyy}${mm}${dd}-${hh}${min}${ss}-${ms}`;
}
