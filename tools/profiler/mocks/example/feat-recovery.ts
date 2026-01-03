import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { getProfiler } from '../../src/lib/profiler.js';

// Parse command line flags for profiler control
const args = process.argv.slice(2);
const enableProfiler =
  args.includes('--enable-profiler') || args.includes('-p');
const disableProfiler =
  args.includes('--disable-profiler') || args.includes('-np');

// Environment variable override
const envEnabled = process.env.PROFILER_ENABLED === 'true';
const envDisabled = process.env.PROFILER_ENABLED === 'false';

// Determine if profiler should be enabled
const profilerEnabled =
  envEnabled || (enableProfiler && !disableProfiler && !envDisabled);

if (profilerEnabled) {
  console.log('🚀 Profiler ENABLED via flag or environment variable');
} else {
  console.log(
    '⏸️  Profiler DISABLED (use --enable-profiler or PROFILER_ENABLED=true)',
  );
}

async function testRecovery() {
  const tmpDir = path.resolve('tmp', 'profiles');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const baseName = 'recovery-test';
  const findFile = (ext: string) =>
    readdirSync(tmpDir)
      .filter(f => f.startsWith(baseName) && f.endsWith(ext))
      .sort()
      .reverse()[0]
      ? path.join(
          tmpDir,
          readdirSync(tmpDir)
            .filter(f => f.startsWith(baseName) && f.endsWith(ext))
            .sort()
            .reverse()[0],
        )
      : null;

  // MARKER: Recovery test setup - create initial profiler with test data
  const p1 = getProfiler({
    fileBaseName: baseName,
    outDir: tmpDir,
    enabled: profilerEnabled,
  });
  p1.mark('test-mark-1');
  p1.mark('test-mark-2');
  p1.measure('test-measure', 'test-mark-1', 'test-mark-2');
  p1.close();

  // MARKER: File corruption phase - simulate data corruption
  const jsonlFile = findFile('.jsonl');
  if (!jsonlFile) return;
  const content = readFileSync(jsonlFile, 'utf8');
  writeFileSync(
    jsonlFile,
    content + '{"corrupt": "line", "missing": "brace"\n',
  );

  // MARKER: Recovery phase - create new profiler with recovery enabled
  (globalThis as any)[Symbol.for('codepushup.profiler')] = undefined;
  const p2 = getProfiler({
    fileBaseName: baseName,
    outDir: tmpDir,
    enabled: profilerEnabled,
    recoverJsonl: true,
  });
  p2.mark('recovered-mark');
  p2.close();

  // MARKER: Verification phase - check recovery results
  const jsonFile = findFile('.json');
  if (!jsonFile) return;

  const parsed = JSON.parse(readFileSync(jsonFile, 'utf8'));
  const events = parsed.traceEvents || [];
  const corruptionWarnings = events.filter((e: any) =>
    e.name?.startsWith('corruption-'),
  );

  const hasOriginal = ['test-mark-1', 'test-mark-2', 'test-measure'].every(
    name => events.some((e: any) => e.name === name),
  );
}

testRecovery().catch(console.error);
