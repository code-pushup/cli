// profiler-perf-hooks-patch.mjs
// Monkey-patch performance.mark / performance.measure in Node without changing semantics.
// It preserves Node’s existing queue/buffer/PerformanceObserver behavior by calling the
// original functions (which internally do createEntry + queuePerformanceEntry).
//

/* Usage examples:
   NODE_OPTIONS="--import /Users/michael_hladky/WebstormProjects/cli/tools/scripts/profiler/profiler-perf-hooks-patch.mjs" node -e '
import { performance } from "node:perf_hooks";

performance.mark("a");
performance.mark("b");
performance.measure("a->b", "a", "b");
'
*/
// Customize the hook by setting globalThis.__perfHooksEntryHook (function(entry, kind, ctx) {})
// BEFORE marks/measures happen.
import { type EntryType, performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';

const PATCH_FLAG = Symbol.for('node.perf_hooks.patch.mark_measure.v1');
declare const globalThis: {
  [PATCH_FLAG]: boolean;
  __perfHooksEntryHook: Function;
};

if (!globalThis[PATCH_FLAG]) {
  globalThis[PATCH_FLAG] = true;
  console.log('Patch active!');

  const originalMark = performance.mark.bind(performance);
  const originalMeasure = performance.measure.bind(performance);

  // ---- Hook plumbing (NO emitTraceEvent logic here) ----
  // User can attach: globalThis.__perfHooksEntryHook = (entry, kind, ctx) => { ... }
  function callHookSafe(
    entry: PerformanceEntry | undefined,
    kind: string,
    ctx: unknown,
  ) {
    const hook = globalThis.__perfHooksEntryHook;
    if (typeof hook !== 'function') return;
    try {
      entry &&
        console.log(
          `[hook] ${kind}`,
          entry.name,
          `start=${entry.startTime.toFixed(2)}ms`,
          kind === 'measure' ? `dur=${entry.duration.toFixed(2)}ms` : '',
        );
      hook(entry, kind, ctx);
    } catch {
      // Never let the hook affect application behavior
    }
  }

  // ---- Helpers to retrieve the entry Node just queued ----
  // We cannot call Node's internal queuePerformanceEntry directly from userland.
  // The correct way to preserve semantics is: call the original method (which queues),
  // then lookup the newest entry that was just created.
  function getNewestEntryByNameAndType(name: string, entryType: EntryType) {
    // getEntriesByName(name, type) returns all matching entries (oldest->newest)
    const list = performance.getEntriesByName(String(name), entryType);
    if (!list || list.length === 0) return undefined;

    // Usually the newest is last; keep it robust by selecting the max startTime.
    // (If multiple entries have identical startTime, pick last.)
    let best = list[list.length - 1] as PerformanceEntry;
    let bestStart = best.startTime;

    for (let i = list.length - 2; i >= 0; i--) {
      const e = list[i] as PerformanceEntry;
      if (e.startTime > bestStart) {
        best = e;
        bestStart = e.startTime;
      } else if (e.startTime === bestStart) {
        // keep the later one in list order
        best = list[i + 1] ?? best;
        break;
      }
    }
    return best;
  }

  function getNewestMeasureByName(name: string) {
    const list = performance.getEntriesByName(String(name), 'measure');
    if (!list || list.length === 0) return undefined;

    // Measures can share names; pick the newest by startTime, then duration.
    let best = list[list.length - 1] as PerformanceEntry;
    for (let i = list.length - 2; i >= 0; i--) {
      const e = list[i] as PerformanceEntry;
      if (e.startTime > best.startTime) best = e;
      else if (e.startTime === best.startTime && e.duration >= best.duration)
        best = e;
    }
    return best;
  }

  // ---- Patched mark ----
  performance.mark = function patchedMark(name, options) {
    // Preserve all original behavior: validation, exceptions, queueing, observers, return value.
    const rv = originalMark(name, options);

    // After queueing, read the entry that was created (best-effort).
    const entry = getNewestEntryByNameAndType(name, 'mark');

    // Hook gets a stable context; you can attach pid/tid for correlation.
    callHookSafe(entry, 'mark', {
      pid: process.pid,
      tid: threadId,
      name: String(name),
      options,
    });

    return rv; // original mark returns undefined
  };

  // ---- Patched measure ----
  (performance as any).measure = function patchedMeasure(
    name: string,
    startOrOptions: string,
    endOrOptions: string,
  ) {
    // measure may throw (unknown marks, invalid args). Preserve that behavior exactly.
    const rv = originalMeasure(name, startOrOptions, endOrOptions);

    // Only runs if originalMeasure succeeded (i.e., entry was created+queued).
    const entry = getNewestMeasureByName(name);

    callHookSafe(entry, 'measure', {
      pid: process.pid,
      tid: threadId,
      name: String(name),
      startOrOptions,
      endOrOptions,
    });

    // original measure returns undefined
    return rv;
  };

  // Optional: expose originals for debugging/rollback
  Object.defineProperty(performance, '__originalMark', {
    value: originalMark,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  Object.defineProperty(performance, '__originalMeasure', {
    value: originalMeasure,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}
