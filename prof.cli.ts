#!/usr/bin/env node
// Super slim profiler auto-start for CLI wrapping
// Usage:
//   - Import: node --import ./prof.cli.ts your-command.js
//   - Direct: ./prof.cli.ts your-command args...
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PerformanceObserver, performance } from 'node:perf_hooks';

// Simple trace file writer
function writeTraceFile(entries: any[]) {
  if (entries.length === 0) return;

  const timestamp = Date.now();
  const filename = `cli-profile-${timestamp}.json`;
  const filepath = join(tmpdir(), filename);

  const trace = {
    traceEvents: entries.map((entry, i) => ({
      name: entry.name,
      cat: 'cli',
      ph: entry.entryType === 'mark' ? 'I' : 'B',
      ts: Math.round(entry.startTime * 1000),
      pid: process.pid,
      tid: 1,
      args: {
        detail: entry.detail || {},
      },
    })),
  };

  writeFileSync(filepath, JSON.stringify(trace, null, 2));
  console.log(`Profile written to: ${filepath}`);
}

// Set up performance observer
const observer = new PerformanceObserver(list => {
  const entries = list.getEntries();
  writeTraceFile(entries);
});

// Observe marks and measures
observer.observe({ entryTypes: ['mark', 'measure'] });

// Mark profiler start
performance.mark('profiler:start');

// Check if this file is being run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Running as executable - wrap and execute command
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: prof.cli.ts <command> [args...]');
    process.exit(1);
  }

  performance.mark('command:start');

  const { spawn } = await import('child_process');

  const [command, ...commandArgs] = args;
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    shell: true,
  });

  child.on('close', code => {
    performance.mark('command:end');
    performance.measure('command-duration', 'command:start', 'command:end');
    observer.disconnect();
    process.exit(code ?? 0);
  });

  child.on('error', err => {
    console.error('Failed to start command:', err);
    observer.disconnect();
    process.exit(1);
  });
}
