import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../../src/index.js';
import { createTraceFile } from '../../src/lib/trace-file-output.js';

async function createBrokenJsonl() {
  // Create tmp/profiles directory if it doesn't exist
  const tmpDir = path.join('tmp', 'profiles');
  const jsonlFile = path.join(tmpDir, 'recovery-test.test-run.jsonl');

  // Remove existing files if they exist
  if (existsSync(jsonlFile)) unlinkSync(jsonlFile);
  if (existsSync(jsonlFile.replace('.jsonl', '.json'))) {
    unlinkSync(jsonlFile.replace('.jsonl', '.json'));
  }

  // Create a trace file to generate valid events
  const traceFile = createTraceFile({
    filename: 'recovery-test.test-run',
    directory: tmpDir,
    flushEveryN: 1, // Flush immediately for testing
  });

  // Write some valid events first
  performance.mark('mark-recovery-valid-start');
  traceFile.write(performance.getEntriesByName('mark-recovery-valid-start')[0]);
  await sleep(10);

  performance.mark('mark-recovery-valid-middle');
  traceFile.write(
    performance.getEntriesByName('mark-recovery-valid-middle')[0],
  );
  // clear pervormance marks to avoid duplication
  performance.clearMarks();

  await sleep(10);

  // Flush to ensure events are written
  traceFile.flush();

  // Now manually corrupt the JSONL file by adding incomplete/truncated data
  let corruptedContent = '';

  // Read the existing content
  if (existsSync(jsonlFile)) {
    corruptedContent = readFileSync(jsonlFile, 'utf8');
  }

  // Close the trace file (but don't recover yet)
  traceFile.close();

  // Read existing content and add corrupted lines at the end
  let fileContent = '';
  if (existsSync(jsonlFile)) {
    fileContent = readFileSync(jsonlFile, 'utf8');
  }

  // Add corrupted content at the very end (this will be detected by recovery)
  fileContent +=
    '{"cat":"blink.user_timing","name":"recovery-corrupted","ph":"i","pid":123,"tid":1,"ts":1000,"id2":{"local":"0xabc"}'; // Missing closing brace

  // Write the corrupted content back
  writeFileSync(jsonlFile, fileContent, 'utf8');

  return { jsonlFile, tmpDir };
}

async function testRecovery() {
  // Create a broken JSONL file first
  const { jsonlFile, tmpDir } = await createBrokenJsonl();

  // Start a profiler with the same file path - it should recover the broken JSONL
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'recovery-test',
    id: 'test-run',
  });

  // The profiler constructor should have recovered the broken file

  // The profiler should have recovered the corrupted file during initialization
  // Create some new events to verify the profiler is working after recovery
  performance.mark('mark-recovery-new-start');
  await sleep(20);
  performance.mark('mark-recovery-new-end');
  performance.measure(
    'measure-recovery-new-measure',
    'mark-recovery-new-start',
    'mark-recovery-new-end',
  );

  // Flush to ensure events are written
  profiler.flush();

  // Close the profiler (this will trigger final recovery)
  profiler.close();

  // Verify the final JSON file exists and is complete
  const jsonFile = path.join('tmp', 'profiles', 'recovery-test.test-run.json');
  if (existsSync(jsonFile)) {
    const content = readFileSync(jsonFile, 'utf8');

    try {
      const parsed = JSON.parse(content);

      // Show some events
      if (parsed.traceEvents && parsed.traceEvents.length > 0) {
        for (let i = 0; i < Math.min(3, parsed.traceEvents.length); i++) {
          const event = parsed.traceEvents[i];
        }
      }
    } catch (error) {
      // JSON parsing failed
    }
  } else {
  }
}

testRecovery();
