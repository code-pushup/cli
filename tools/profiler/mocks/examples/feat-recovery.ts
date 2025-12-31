import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createTraceFile } from '../../src/lib/trace-file-output.js';

function testSimplifiedRecovery() {
  // Create tmp/profiles directory if it doesn't exist
  const tmpDir = path.join('tmp', 'profiles');
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  const jsonlFile = path.join(tmpDir, 'recovery-test.test-run.jsonl');
  const jsonFile = path.join(tmpDir, 'recovery-test.test-run.json');

  // Remove existing files if they exist
  if (existsSync(jsonlFile)) unlinkSync(jsonlFile);
  if (existsSync(jsonFile)) unlinkSync(jsonFile);

  // Create a trace file to generate valid events
  const traceFile = createTraceFile({
    filename: 'recovery-test.test-run',
    directory: tmpDir,
    flushEveryN: 1, // Flush immediately for testing
  });

  // Write some valid events first
  performance.mark('mark-recovery-valid-start');
  traceFile.write(performance.getEntriesByName('mark-recovery-valid-start')[0]);

  performance.mark('mark-recovery-valid-middle');
  traceFile.write(
    performance.getEntriesByName('mark-recovery-valid-middle')[0],
  );

  // Close the trace file (this will trigger recovery)
  traceFile.close();

  // Verify the final JSON file exists and is complete
  if (existsSync(jsonFile)) {
    const content = readFileSync(jsonFile, 'utf8');

    try {
      const parsed = JSON.parse(content);
      console.log('✓ Recovery successful - JSON is valid');
      console.log(`✓ Trace events count: ${parsed.traceEvents?.length || 0}`);

      // Show some events
      if (parsed.traceEvents && parsed.traceEvents.length > 0) {
        console.log(
          '✓ First event:',
          JSON.stringify(parsed.traceEvents[0], null, 2),
        );
      }
    } catch (error) {
      console.log('✗ Recovery failed - JSON is invalid:', error.message);
    }
  } else {
    console.log('✗ Recovery failed - no JSON file created');
  }
}

testSimplifiedRecovery();
