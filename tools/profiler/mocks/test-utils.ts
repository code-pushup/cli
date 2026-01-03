import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ITERATIONS = 1e5 * 100;
export function work(willThrow = false): number {
  const iterations = DEFAULT_ITERATIONS + Math.floor(Math.random() * 1000);
  // Simulate some CPU work
  for (let i = 0; i < iterations; i++) {
    Math.sqrt(i);
  }
  if (willThrow) {
    throw new Error(`Simulated work error at iteration ${iterations}`);
  }
  return iterations;
}

export async function asyncWork(willThrow?: boolean): Promise<number> {
  const iterations = DEFAULT_ITERATIONS + Math.floor(Math.random() * 1000);
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate some CPU work
  for (let i = 0; i < iterations; i++) {
    Math.sqrt(i);
  }
  if (willThrow) {
    throw new Error(`Simulated work error at iteration ${iterations}`);
  }
  return iterations;
}

/**
 * Executes an array of synchronous work functions sequentially and returns the sum of their results.
 * Each work function should return a number (typically iterations performed).
 * Works well with profiler.span() calls since span returns the function result.
 *
 * @param works Array of functions that perform work and return numbers
 * @returns Sum of all work function results
 *
 * @example
 * ```typescript
 * const totalIterations = sequentialWork([
 *   () => profiler.span('task1', work),
 *   () => profiler.span('task2', work),
 * ]);
 * ```
 */
export function sequentialWork(works: (() => number)[]): number {
  return works.reduce((sum, workFn) => sum + workFn(), 0);
}

/**
 * Executes an array of asynchronous work functions sequentially and returns the sum of their results.
 * Each work function should return a Promise<number> (typically iterations performed).
 * Works well with profiler.spanAsync() calls since spanAsync returns the function result.
 *
 * @param works Array of async functions that perform work and return Promise<number>
 * @returns Promise that resolves to sum of all work function results
 *
 * @example
 * ```typescript
 * const totalIterations = await sequentialAsyncWork([
 *   () => profiler.spanAsync('task1', workAsync),
 *   () => profiler.spanAsync('task2', workAsync),
 * ]);
 * ```
 */
export async function sequentialAsyncWork(
  works: (() => Promise<number>)[],
): Promise<number> {
  let sum = 0;
  for (const workFn of works) {
    sum += await workFn();
  }
  return sum;
}

/**
 * Validates the complete trace structure including margins and natural events.
 * Checks for proper trace start/end structure and validates all expected events.
 * Always verifies TracingStartedInBrowser at start and RunTask margins.
 *
 * @param filePattern The base name pattern to match (e.g., 'api-mark')
 * @param naturalEvents Array of expected natural events (marks, measures, etc.)
 * @returns true if all validations pass, false otherwise
 *
 * @example
 * ```bash
 * node -e "
 * const { validateTraceStructure } = require('./test-utils.js');
 * const passed = validateTraceStructure('api-mark', [
 *   {\"cat\":\"blink.user_timing\", \"ph\":\"I\", \"name\":\"mark\"}
 * ]);
 * "
 * # Output: Comprehensive validation report
 * ```
 */
export function validateTraceStructure(
  filePattern: string,
  naturalEvents: Array<Record<string, any>>,
): boolean {
  const profilesDir = './tmp/profiles';
  const files = fs
    .readdirSync(profilesDir)
    .filter(f => f.startsWith(`${filePattern}.`) && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log(`❌ No files found matching pattern: ${filePattern}`);
    return false;
  }

  const latestFile = files[files.length - 1];
  const filePath = path.join(profilesDir, latestFile);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const output = require(path.resolve(filePath));

  const traceEvents = output.traceEvents || [];
  const expectedTotalEvents = 1 + 2 + naturalEvents.length; // 1 TracingStartedInBrowser + 2 RunTask + natural events

  console.log(`📊 Trace validation for ${filePattern}:`);
  console.log(
    `   Total events in trace: ${traceEvents.length} (expected: ${expectedTotalEvents})`,
  );

  let allPassed = true;

  // 1. Check trace starts with TracingStartedInBrowser
  const firstEvent = traceEvents[0];
  const startsWithTracing =
    firstEvent &&
    firstEvent.cat === 'devtools.timeline' &&
    firstEvent.name === 'TracingStartedInBrowser';

  console.log(
    `   ${startsWithTracing ? '✅' : '❌'} Starts with TracingStartedInBrowser`,
  );
  allPassed = allPassed && startsWithTracing;

  // 2. Check has exactly 2 RunTask events (start and end)
  const runTaskEvents = traceEvents.filter(
    e => e.cat === 'devtools.timeline' && e.name === 'RunTask',
  );
  const hasCorrectRunTaskCount = runTaskEvents.length === 2;

  console.log(
    `   ${hasCorrectRunTaskCount ? '✅' : '❌'} Has exactly 2 RunTask events (${runTaskEvents.length} found)`,
  );
  allPassed = allPassed && hasCorrectRunTaskCount;

  // 3. Check natural events appear exactly once each (no duplicates allowed)
  const naturalEventsExact = naturalEvents.every(expected => {
    const matchingEvents = traceEvents.filter((event: any) =>
      Object.keys(expected).every(key => event[key] === expected[key]),
    );
    return matchingEvents.length === 1; // Expect exactly 1 occurrence for each natural event
  });

  console.log(
    `   ${naturalEventsExact ? '✅' : '❌'} All ${naturalEvents.length} natural events appear exactly once each`,
  );
  if (!naturalEventsExact) {
    naturalEvents.forEach(expected => {
      const matchingEvents = traceEvents.filter((event: any) =>
        Object.keys(expected).every(key => event[key] === expected[key]),
      );
      console.log(
        `      ${expected.name}: ${matchingEvents.length} (expected 1)`,
      );
    });
  }
  allPassed = allPassed && naturalEventsExact;

  // 4. Check total event count is exactly correct (no extras, no missing)
  const hasCorrectTotal = traceEvents.length === expectedTotalEvents;
  console.log(
    `   ${hasCorrectTotal ? '✅' : '❌'} Total event count is correct (${traceEvents.length} === ${expectedTotalEvents})`,
  );
  if (!hasCorrectTotal) {
    console.log(
      `      Expected: 1 TracingStartedInBrowser + 2 RunTask + ${naturalEvents.length} natural events = ${expectedTotalEvents}`,
    );
  }
  allPassed = allPassed && hasCorrectTotal;

  console.log(`\n🎯 Overall result: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

  return allPassed;
}

/**
 * Validates trace events in a profiler output file against expected events.
 * Finds the latest file matching the pattern and checks if all expected events are present.
 * Automatically logs the validation results to console.
 *
 * @param filePattern The base name pattern to match (e.g., 'api-mark')
 * @param expectedEvents Array of expected trace events with their properties
 * @returns Array of validation results ('✓' for found, '✗' for not found)
 *
 * @example
 * ```typescript
 * validateTraceEvents('api-mark', [
 *   {"cat":"blink.user_timing", "ph":"I", "name":"mark"}
 * ]);
 * // Automatically logs: "Results: ['✓', '✓']" and "All passed: true"
 * ```
 *
 * @example
 * ```bash
 * # In evaluation comments of example files:
 * node -e "
 * const { validateTraceEvents } = require('../test-utils.js');
 * validateTraceEvents('example-name', expectedEvents);
 * "
 * # Automatically outputs: "Results: ['✓', '✓', ...]" and "All passed: true"
 * ```
 */
export function validateTraceEvents(
  filePattern: string,
  expectedEvents: Array<Record<string, any>>,
): string[] {
  const profilesDir = './tmp/profiles';
  const files = fs
    .readdirSync(profilesDir)
    .filter(f => f.startsWith(`${filePattern}.`) && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${filePattern}`);
  }

  const latestFile = files[files.length - 1];
  const filePath = path.join(profilesDir, latestFile);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const output = require(path.resolve(filePath));

  const results = expectedEvents.map(expected => {
    const found = output.traceEvents?.find((event: any) =>
      Object.keys(expected).every(key => event[key] === expected[key]),
    );
    return found ? '✓' : '✗';
  });

  console.log('Results:', results);
  console.log(
    'All passed:',
    results.every(r => r === '✓'),
  );

  return results;
}
