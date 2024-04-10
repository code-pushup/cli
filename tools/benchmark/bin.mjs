import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yargs from 'yargs';
import benchmarkRunner from './benchmark.runner.mjs';
import bennyRunner from './benny.runner.mjs';
import tinybenchRunner from './tinybench.runner.mjs';
import { loadSuits } from './utils.mjs';

const supportedRunner = new Set(['tinybench', 'benchmark', 'benny']);
const cli = yargs(process.argv).options({
  targets: {
    type: 'array',
    default: [],
  },
  tsconfig: {
    type: 'string',
  },
  runner: {
    type: 'string',
    default: 'tinybench',
  },
  outputDir: {
    type: 'string',
    default: 'tmp',
  },
  verbose: {
    type: 'boolean',
    default: true,
  },
});

(async () => {
  let {
    targets = [],
    verbose,
    tsconfig,
    outputDir,
    runner,
  } = await cli.parseAsync();

  if (!supportedRunner.has(runner)) {
    runner = 'tinybench';
  }

  if (targets.length === 0) {
    throw Error('No targets given. Use `--targets=suite1.ts` to set targets.');
  }

  // execute benchmark
  const allSuits = await loadSuits(targets, { tsconfig });
  if (verbose) {
    console.log(
      `Loaded targets: ${allSuits
        .map(({ suiteName }) => suiteName)
        .join(', ')}`,
    );
  }
  // create audit output
  const allSuiteResults = [];
  // Execute each suite sequentially
  for (const suite of allSuits) {
    let runnerFn;
    switch (runner) {
      case 'tinybench':
        runnerFn = tinybenchRunner;
        break;
      case 'benchmark':
        runnerFn = benchmarkRunner;
        break;
      case 'benny':
        runnerFn = bennyRunner;
        break;
      default:
        runnerFn = tinybenchRunner;
    }
    const result = await runnerFn.run(suite);
    allSuiteResults.push(result);
  }
  console.log(`Use ${runner} for benchmarking`);

  allSuiteResults.forEach(async results => {
    const {
      suiteName,
      name,
      hz: maxHz,
    } = results.find(({ isFastest }) => isFastest);
    const target = results.find(({ isTarget }) => isTarget);
    console.log(
      `In suite ${suiteName} fastest is: ${name} target is ${target?.name}`,
    );
    if (outputDir) {
      await writeFile(
        join(outputDir, `${suiteName}-${runner}-${Date.now()}.json`),
        JSON.stringify(
          results.map(({ name, hz, rme, samples }) => ({
            name,
            hz,
            rme,
            samples,
          })),
          null,
          2,
        ),
      );
    }
    console.table(
      results.map(({ name, hz, rme, samples, isTarget, isFastest }) => {
        const targetIcon = isTarget ? '🎯' : '';
        const postfix = isFastest
          ? '(fastest 🔥)'
          : `(${((1 - hz / maxHz) * 100).toFixed(1)}% slower)`;
        return {
          // fast-glob x 40,824 ops/sec ±4.44% (85 runs sampled)
          message: `${targetIcon}${name} x ${hz.toFixed(
            2,
          )} ops/sec ±${rme.toFixed(2)}; ${samples} samples ${postfix}`,
          severity: hz < maxHz && isTarget ? 'error' : 'info',
        };
      }),
    );
  });
})();
