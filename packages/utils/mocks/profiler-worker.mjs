import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodejsProfiler } from '../src/lib/profiler/profiler-node.js';
import { entryToTraceEvents } from '../src/lib/profiler/trace-file-utils.js';
import { traceEventWalFormat } from '../src/lib/profiler/wal-json-trace.js';

const [numProcesses] = process.argv.slice(2);

if (!numProcesses) {
  console.error('Usage: node profiler-worker.mjs <numProcesses>');
  process.exit(1);
}

const numProcs = parseInt(numProcesses, 10);
if (isNaN(numProcs) || numProcs < 1) {
  console.error('numProcesses must be a positive integer');
  process.exit(1);
}

const workerScriptPath = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  './profiler-worker-child.mjs',
);

// Create a profiler to get coordinator stats
const traceEventEncoder = entryToTraceEvents;
const profiler = new NodejsProfiler({
  format: {
    ...traceEventWalFormat(),
    encodePerfEntry: traceEventEncoder,
  },
});

(async () => {
  // Spawn multiple child processes
  const processes = Array.from({ length: numProcs }, (_, i) => {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['tsx', workerScriptPath], {
        stdio: 'pipe', // Pipe to avoid interfering with JSON output
        env: {
          ...process.env,
        },
      });

      child.on('close', code => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Process ${i + 1} exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  });

  await Promise.all(processes);

  await new Promise(resolve => setTimeout(resolve, 200));

  console.log(JSON.stringify(profiler.stats, null, 2));

  profiler.close();
})();
