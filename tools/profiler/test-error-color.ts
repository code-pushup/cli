import fs from 'node:fs';
import { getProfiler } from './src/lib/profiler.js';

const profiler = getProfiler({
  fileName: 'test-error-color.json',
  outDir: 'tmp/test-profiles',
  errorHandler: err => ({
    tooltipText: 'Global error',
    properties: [['global', 'true']],
  }),
});

try {
  profiler.span(
    'test-error-span',
    () => {
      throw new Error('Test error');
    },
    {
      error: err => ({
        tooltipText: 'Local error',
        properties: [['local', 'true']],
      }),
    },
  );
} catch (err) {
  console.log('Error caught:', (err as Error).message);
}

profiler.close();

const traceFilePath = 'tmp/test-profiles/test-error-color.json';
const content = fs.readFileSync(traceFilePath, 'utf-8');
const traceEvents = JSON.parse(content).traceEvents;

const errorEvents = traceEvents.filter(
  (event: any) => event.name.includes('test-error-span') && event.ph === 'b',
);

if (errorEvents.length > 0) {
  const errorEvent = errorEvents[0];
  const detail = JSON.parse(errorEvent.args.detail);
  console.log('Error event color:', detail.devtools.color);
  console.log('Expected: error');
  console.log('✅ Test passed:', detail.devtools.color === 'error');
} else {
  console.log('❌ No error events found');
}

fs.unlinkSync(traceFilePath);
