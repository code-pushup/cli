import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../src/index.ts';

async function runAngularSSR() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'angular-ssr',
    spans: {
      build: { track: 'Build', group: 'Angular SSR', color: 'primary' },
      ssr: { track: 'SSR', group: 'Angular SSR', color: 'secondary' },
      browser: { track: 'Browser', group: 'Angular SSR', color: 'tertiary' },
    },
  });

  // 1. Build Phase
  await profiler.spanAsync(
    'build-angular',
    async () => {
      await sleep(50);
      return { bundles: 12, size: '2.1MB' };
    },
    {
      detail: profiler.spans.build({
        properties: [
          ['Phase', 'Build'],
          ['Bundles', '12'],
          ['Size', '2.1MB'],
        ],
        tooltipText: 'Angular build compilation and bundling',
      }),
    },
  );

  // 2. Node.js SSR
  await profiler.spanAsync(
    'ssr-render',
    async () => {
      await sleep(30);
      return { html: '<html>...</html>', status: 200 };
    },
    {
      detail: profiler.spans.ssr({
        properties: [
          ['Phase', 'SSR'],
          ['Engine', 'Node.js'],
          ['Status', '200'],
        ],
        tooltipText: 'Server-side rendering of Angular components',
      }),
    },
  );

  // 3. Browser Request
  await profiler.spanAsync(
    'browser-hydrate',
    async () => {
      await sleep(20);
      return { hydrated: true, interactive: true };
    },
    {
      detail: profiler.spans.browser({
        properties: [
          ['Phase', 'Browser'],
          ['Action', 'Hydrate'],
          ['Interactive', 'Yes'],
        ],
        tooltipText: 'Browser hydration and interactivity',
      }),
    },
  );

  console.log('Angular SSR flow completed');
}

runAngularSSR();
