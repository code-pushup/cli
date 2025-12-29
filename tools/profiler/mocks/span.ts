import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'span-test',
    spans: {
      main: {
        track: 'Main Track',
        group: 'Main Group',
        color: 'primary-dark',
      },
    } as const,
  });

  profiler.span(
    'process-user-avatar',
    () => {
      for (const i of Array(1e6).keys()) {
        Math.sqrt(i);
      }
      return { success: true, dimensions: '500x300' };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Operation', 'Image Processing'],
          ['Input Format', 'JPEG'],
          ['Output Format', 'WebP'],
          ['Original Size', '2.1 MB'],
          ['Processed Size', '245 KB'],
          ['Compression Ratio', '85%'],
          ['Quality Setting', '80%'],
          ['Resize Algorithm', 'Lanczos'],
          ['Processing Pipeline', 'Resize → Compress → Optimize'],
        ],
        tooltipText:
          'User avatar image processing - significant size reduction achieved',
      }),
    },
  );

  await sleep(100);

  profiler.span(
    'analyze-sales-data',
    () => {
      for (const i of Array(1e6).keys()) {
        Math.sqrt(i);
      }
      return { success: true, load: '300' };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Data Source', 'PostgreSQL'],
          ['Table', 'sales_transactions'],
          ['Time Range', '2024-01-01 to 2024-01-31'],
          ['Records Processed', '1,247,891'],
          ['Memory Usage', '89 MB'],
          ['CPU Cores Used', '4'],
          ['Parallel Workers', '8'],
          ['Aggregation Type', 'Daily revenue by region'],
          ['Cache Hit Rate', '94%'],
        ],
        tooltipText:
          'Monthly sales data analysis - processed 1.2M records efficiently',
      }),
    },
  );

  // Explicitly close to finalize the output file
  profiler.close();
}

runTest();
