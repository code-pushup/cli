import yargs from 'yargs';
import { scoreReport } from '../../src/lib/reports/scoring';
import { scoreReportOptimized0 } from './optimized0';
import { scoreReportOptimized1 } from './optimized1';
import { scoreReportOptimized2 } from './optimized2';
import { scoreReportOptimized3 } from './optimized3';
import { minimalReport } from './utils';

const cli = yargs(process.argv).options({
  numAudits1: {
    type: 'number',
    default: 27,
  },
  numAudits2: {
    type: 'number',
    default: 18,
  },
  numGroupRefs2: {
    type: 'number',
    default: 6,
  },
  logs: {
    type: 'boolean',
    default: false,
  },
});

const { numAudits1, numAudits2, numGroupRefs2, logs } = await cli.parseAsync();

// ==================

if (logs) {
  // eslint-disable-next-line no-console
  console.log(
    'You can adjust the number of runs with the following arguments:' +
      `numAudits1      Number of audits in plugin 1.       --numAudits1=${numAudits1}` +
      `numAudits2      Number of audits in plugin 2.       --numAudits2=${numAudits2}` +
      `numGroupRefs2   Number of groups refs in plugin 2.  --numGroupRefs2=${numGroupRefs2}`,
  );
}
// ==============================================================
const options = { numAudits1, numAudits2, numGroupRefs2 };

// Add tests
const suitConfig = {
  suitName: 'report-scoring',
  targetImplementation: '@code-pushup/utils#scoreReport',
  cases: [
    [
      '@code-pushup/utils#scoreReport',
      () => scoreReport(minimalReport(options)),
    ],
    ['scoreReportv0', () => scoreReportOptimized0(minimalReport(options))],
    ['scoreReportv1', () => scoreReportOptimized1(minimalReport(options))],
    ['scoreReportv2', () => scoreReportOptimized2(minimalReport(options))],
    ['scoreReportv3', () => scoreReportOptimized3(minimalReport(options))],
  ],
};

export default suitConfig;
