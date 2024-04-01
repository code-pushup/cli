import yargs from 'yargs';
import type { SuiteConfig } from '../../src/js-benchmarking/src/runner/types';
import { factorial } from './factorial';

const cli = yargs(process.argv).options({
  numCases: {
    type: 'number',
    default: 2,
  },
  executionTime: {
    type: 'number',
    default: 0,
  },
  executionTimeDiff: {
    type: 'number',
    default: 0,
  },
  syncIterations: {
    type: 'number',
    default: 500,
  },
  syncIterationsDiff: {
    type: 'number',
    default: 100,
  },
  logs: {
    type: 'boolean',
    default: false,
  },
});

const {
  numCases,
  executionTime,
  executionTimeDiff,
  syncIterations,
  syncIterationsDiff,
  logs, // eslint-disable-next-line n/no-sync
} = cli.parseSync();

if (logs) {
  // eslint-disable-next-line no-console
  console.log('You can adjust the test with the following arguments:');
  // eslint-disable-next-line no-console
  console.log(
    `numCases           number of test cases                    --numCases=${numCases.toString()}`,
    `executionTime      duration of first case in ms            --executionTime=${executionTime.toString()}`,
    `executionTimeDiff  time diff in execution duration in ms   --executionTimeDiff=${executionTimeDiff.toString()}`,
    `syncIterations     executions of dummy fn factorial        --syncIterations=${syncIterations.toString()}`,
    `syncIterationsDiff diff in number of executions            --syncIterationsDiff=${syncIterationsDiff.toString()}`,
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
        setTimeout(() => {
          resolve(factorial((syncIterations + syncIterationsDiff) * idx));
        }, executionTime + executionTimeDiff * idx),
      ),
  ]),
  time: executionTime + executionTimeDiff * 2,
};

export default suiteConfig;
