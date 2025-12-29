import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

function nestedFunction(depth: number): void {
  if (depth > 0) {
    Function(depth - 1);
  } else {
    // This is where the actual mark/instant event will be created
    // The stack trace should show the call chain
  }
}

function runTestWithStackTraces() {
  console.log('=== Running profiler with stack traces ENABLED (default) ===');

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'stack-traces-enabled',
    // includeStackTraces: true, // This is the default
  });

  // Create a mark with stack trace
  profiler.mark('mark-with-stack-trace');

  // Create an instant event with stack trace
  profiler.instant('instant-with-stack-trace');

  // Create a span with stack trace
  profiler.span('span-with-stack-trace', () => {
    nestedFunction(3);
    return 'completed';
  });

  profiler.close();
  console.log('Stack traces enabled test completed');
}

function runTestWithoutStackTraces() {
  console.log('=== Running profiler with stack traces DISABLED ===');

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'stack-traces-disabled',
    includeStackTraces: false,
  });

  // Create events without stack traces
  profiler.mark('mark-without-stack-trace');

  profiler.instant('instant-without-stack-trace');

  // Create a span without stack trace
  profiler.span('span-without-stack-trace', () => {
    nestedFunction(3);
    return 'completed';
  });

  profiler.close();
  console.log('Stack traces disabled test completed');
}

async function main() {
  // Run test with stack traces
  runTestWithStackTraces();
  await sleep(100);

  console.log('Test with stack traces completed!');

  // Clear the global profiler instance for the second test
  delete (globalThis as any)[Symbol.for('codepushup.profiler')];

  // Run test without stack traces
  runTestWithoutStackTraces();
  await sleep(100);

  console.log('All stack trace tests completed!');
  console.log(
    'Check the generated .json files to see the difference in stack trace inclusion.',
  );
}

main();
