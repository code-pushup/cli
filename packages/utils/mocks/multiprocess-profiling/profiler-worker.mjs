import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodejsProfiler } from '../../src/lib/profiler/profiler-node.js';
import { createBufferedEvents, getProfilerConfig } from './utils.js';

const [numProcesses] = process.argv.slice(2);

if (!numProcesses) {
  console.error('Usage: node profiler-worker.mjs <numProcesses>');
  // eslint-disable-next-line unicorn/no-process-exit,n/no-process-exit
  process.exit(1);
}

const numProcs = Number.parseInt(numProcesses, 10);
if (Number.isNaN(numProcs) || numProcs < 1) {
  console.error('numProcesses must be a positive integer');
  // eslint-disable-next-line unicorn/no-process-exit,n/no-process-exit
  process.exit(1);
}

const workerScriptPath = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  './profiler-worker-child.mjs',
);

let profiler;
try {
  await createBufferedEvents();

  profiler = new NodejsProfiler(getProfilerConfig());

  await profiler.measureAsync('profiler-worker', async () => {
    const processes = Array.from(
      { length: numProcs },
      (_, i) =>
        new Promise((resolve, reject) => {
          const child = spawn('npx', ['tsx', workerScriptPath], {
            stdio: 'pipe',
            env: process.env,
          });

          child.on('close', code => {
            if (code === 0) {
              resolve(code);
            } else {
              reject(new Error(`Process ${i + 1} exited with code ${code}`));
            }
          });

          child.on('error', reject);
        }),
    );
    await Promise.all(processes);
  });

  profiler.close();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(profiler.stats, null, 2));
} catch (error) {
  // Ensure profiler is closed and stats are output even on error
  if (profiler && profiler.stats.profilerState !== 'closed') {
    profiler.close();
  }
  // Output stats if profiler was initialized, otherwise exit with error
  if (profiler) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(profiler.stats, null, 2));
    // Exit successfully since we've output the stats that the test needs
    // eslint-disable-next-line unicorn/no-process-exit,n/no-process-exit
    process.exit(0);
  } else {
    console.error('Failed to initialize profiler:', error);
    // eslint-disable-next-line unicorn/no-process-exit,n/no-process-exit
    process.exit(1);
  }
}
