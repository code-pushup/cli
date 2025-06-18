import { Performance, performance } from 'node:perf_hooks';

// Global array to store complete events.
const trace = [];

// Metadata events.
const threadMetadata = {
  name: 'thread_name',
  ph: 'M',
  pid: 0,
  tid: process.pid,
  ts: 0,
  args: { name: 'Child Process' },
};

const processMetadata = {
  name: 'process_name',
  ph: 'M',
  pid: 0,
  tid: process.pid,
  ts: 0,
  args: { name: 'Measure Process' },
};

const originalMark = Performance.prototype.mark;
const originalMeasure = Performance.prototype.measure;

let correlationIdCounter = 0;
function generateCorrelationId() {
  return ++correlationIdCounter;
}

//
// Helper to adjust a single frame's file property.
// If a frame has a file string that starts with repoRoot, remove that prefix.
function adjustFramePath(frame, repoRoot) {
  if (frame.file && typeof frame.file === 'string') {
    // Ensure repoRoot ends with the appropriate separator.
    const base = repoRoot.endsWith('/') ? repoRoot : repoRoot + '/';
    if (frame.file.startsWith(base)) {
      return Object.assign({}, frame, {
        file: frame.file.substring(base.length),
      });
    }
  }
  return frame;
}

/**
 * Parse an error stack into an array of frames.
 */
function parseStack(stack) {
  const frames = [];
  const lines = stack.split('\n').slice(2); // Skip error message & current function.
  for (const line of lines) {
    const trimmed = line.trim();
    const regex1 = /^at\s+(.*?)\s+\((.*):(\d+):(\d+)\)$/;
    const regex2 = /^at\s+(.*):(\d+):(\d+)$/;
    let match = trimmed.match(regex1);
    if (match) {
      frames.push({
        functionName: match[1],
        file: match[2],
        line: Number(match[3]),
        column: Number(match[4]),
      });
    } else {
      match = trimmed.match(regex2);
      if (match) {
        frames.push({
          functionName: null,
          file: match[1],
          line: Number(match[2]),
          column: Number(match[3]),
        });
      } else {
        frames.push({ raw: trimmed });
      }
    }
  }
  return frames;
}

// Override mark to capture call stacks.
Performance.prototype.mark = function (name, options) {
  const err = new Error();
  const callStack = parseStack(err.stack);
  const opt = Object.assign({}, options, {
    detail: Object.assign({}, (options && options.detail) || {}, { callStack }),
  });
  console.log('Mark for', name, performance.now());
  return originalMark.call(this, name, opt);
};

// Override measure to create complete events.
Performance.prototype.measure = function (name, start, end, options) {
  const startEntry = performance.getEntriesByName(start, 'mark')[0];
  const endEntry = performance.getEntriesByName(end, 'mark')[0];
  let event = null;
  if (startEntry && endEntry) {
    const ts = startEntry.startTime * 1000; // Convert ms to microseconds.
    const dur = (endEntry.startTime - startEntry.startTime) * 1000;

    // Enrich event further if needed (here keeping it minimal to match your profile).
    event = {
      name,
      cat: 'measure', // Keeping the same category as in your uploaded trace.
      ph: 'X',
      ts,
      dur,
      pid: 0,
      tid: process.pid,
      args: {
        startDetail: startEntry.detail || {},
        endDetail: endEntry.detail || {},
        // Optionally: add correlation and extra labels.
        correlationId: generateCorrelationId(),
        uiLabel: name, // A simple label for UI display.
      },
    };

    // Push metadata events once.
    if (trace.length < 1) {
      trace.push(threadMetadata);
      console.log(`traceEvent:JSON:${JSON.stringify(threadMetadata)}`);
      trace.push(processMetadata);
      console.log(`traceEvent:JSON:${JSON.stringify(processMetadata)}`);
    }
    trace.push(event);
    console.log(`traceEvent:JSON:${JSON.stringify(event)}`);

    // console.log('Measure Event:', JSON.stringify(event));
  } else {
    console.warn('Missing start or end mark for measure', name);
  }
  return originalMeasure.call(this, name, start, end, options);
};

// Return the complete Chrome Trace profile object.
performance.profile = function () {
  return {
    metadata: {
      source: 'DevTools',
      startTime: '2025-04-08T13:20:54.094Z',
      hardwareConcurrency: 12,
      dataOrigin: 'TraceEvents',
      modifications: {
        entriesModifications: {
          hiddenEntries: [],
          expandableEntries: [],
        },
        initialBreadcrumb: {
          window: {
            min: 269106047711,
            max: 269107913714,
            range: 1866003,
          },
          child: null,
        },
        annotations: {
          entryLabels: [],
          labelledTimeRanges: [],
          linksBetweenEntries: [],
        },
      },
    },
    traceEvents: trace,
  };
};
performance.trace = trace;
