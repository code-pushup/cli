import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../src/index.ts';
import { createTraceFile } from '../src/lib/trace-file-output.ts';

async function createBrokenJsonl() {
  console.log('Creating broken JSONL file...');

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

  // Add some corrupted lines (incomplete JSON objects)
  corruptedContent +=
    '{"cat":"blink.user_timing","name":"recovery-corrupted","ph":"i","pid":123,"tid":1,"ts":1000,"id2":{"local":"0xabc"}\n'; // Missing closing brace
  corruptedContent +=
    '{"cat":"blink.user_timing","name":"recovery-incomplete","ph":"b","pid":123,"tid":1,"ts":1100,"id2":{"local":"0xdef"}'; // Incomplete object, no closing
  corruptedContent += '\n'; // Just a newline
  corruptedContent +=
    '{"cat":"blink.user_timing","name":"recovery-partial","ph":"e","pid":123,"tid":1,"ts":1200'; // Partial object

  // Write the corrupted content back
  writeFileSync(jsonlFile, corruptedContent, 'utf8');

  return { jsonlFile, tmpDir };
}

async function testRecovery() {
  console.log('Testing recovery process...');

  // Create a broken JSONL file first
  const { jsonlFile, tmpDir } = await createBrokenJsonl();

  console.log('\nStarting profiler to recover the broken file...');

  // Start a profiler with the same file path - it should recover the broken JSONL
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'recovery-test',
    id: 'test-run',
  });

  // The profiler constructor should have recovered the broken file
  console.log('Profiler started and should have recovered the file');

  // Create some new events to verify the profiler is working
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

  console.log('Profiler closed');

  // Verify the final JSON file exists and is complete
  const jsonFile = path.join('tmp', 'profiles', 'recovery-test.test-run.json');
  if (existsSync(jsonFile)) {
    const content = readFileSync(jsonFile, 'utf8');
    console.log(`\nFinal JSON file created at: ${jsonFile}`);
    console.log('File size:', content.length, 'characters');

    try {
      const parsed = JSON.parse(content);
      console.log('JSON is valid');
      console.log('Number of trace events:', parsed.traceEvents?.length || 0);

      // Show some events
      if (parsed.traceEvents && parsed.traceEvents.length > 0) {
        console.log('\nFirst few events:');
        for (let i = 0; i < Math.min(3, parsed.traceEvents.length); i++) {
          const event = parsed.traceEvents[i];
          console.log(`- ${event.name} (${event.ph}) at ts:${event.ts}`);
        }
      }
    } catch (error) {
      console.error('JSON parsing failed:', error);
    }
  } else {
    console.error('Final JSON file was not created');
  }
}

testRecovery().catch(console.error);
