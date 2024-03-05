import yargs from 'yargs';
import { SuiteConfig } from '../../src/benchmark-js/src/suite-helper';

const cli = yargs(process.argv).options({
  numCases: {
    type: 'number',
    default: 5,
  },
  executionTime: {
    type: 'number',
    default: 50,
  },
  executionTimeDiff: {
    type: 'number',
    default: 50,
  },
  logs: {
    type: 'boolean',
    default: false,
  },
});

// eslint-disable-next-line n/no-sync
const { numCases, executionTime, executionTimeDiff, logs } = cli.parseSync();

if (logs) {
  // eslint-disable-next-line no-console
  console.log('You can adjust the test with the following arguments:');
  // eslint-disable-next-line no-console
  console.log(
    `numCases           number of test cases                   --numCases=${numCases.toString()}`,
    `executionTime      duration of first case in ms           --executionTime=${executionTime.toString()}`,
    `executionTimeDiff  time diff in execution duration in ms  --executionTimeDiff=${executionTimeDiff.toString()}`,
  );
}

// ==================

const suiteConfig: SuiteConfig = {
  suiteName: 'dummy-suite',
  targetImplementation: 'case-1',
  cases: Array.from({ length: numCases }).map((_, idx) => [
    `case-${idx + 1}`,
    () =>
      new Promise(resolve =>
        setTimeout(resolve, executionTime + executionTimeDiff * idx),
      ),
  ]),
};

export default suiteConfig;
