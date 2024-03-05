import yargs from 'yargs';
import { loadSuits, runSuite } from './utils.mjs';

const cli = yargs(process.argv).options({
  targets: {
    type: 'array',
    default: [],
  },
  tsconfig: {
    type: 'string',
  },
  verbose: {
    type: 'boolean',
    default: true,
  },
});

(async () => {
  const { targets = [], verbose, tsconfig } = await cli.parseAsync();

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
    const result = await runSuite(suite);
    allSuiteResults.push(result);
  }

  allSuiteResults.forEach(results => {
    const {
      suiteName,
      name,
      hz: maxHz,
    } = results.find(({ isFastest }) => isFastest);
    const target = results.find(({ isTarget }) => isTarget);
    console.log(
      `In suite ${suiteName} fastest is: ${name} target is ${target?.name}`,
    );
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
