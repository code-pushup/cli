import yargs from 'yargs';
import { loadSuits, runSuit } from './utils.mjs';

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
  const allSuitResults = await Promise.all(
    allSuits.map(suite => runSuit(suite, { verbose })),
  );

  allSuitResults.forEach(results => {
    const { suiteName, name } = results.find(({ isFastest }) => isFastest);
    const target = results.find(({ isTarget }) => isTarget);
    console.log(
      `In suite ${suiteName} fastest is: ${name} target is ${target?.name}`,
    );
  });
})();
