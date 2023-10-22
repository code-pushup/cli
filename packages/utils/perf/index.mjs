import Benchmark from 'benchmark';
import { scoreReport } from './implementations/base.mjs';
import { scoreReportOptimized0 } from './implementations/optimized0.mjs';
import { scoreReportOptimized1 } from './implementations/optimized1.mjs';
import { scoreReportOptimized2 } from './implementations/optimized2.mjs';

const PROCESS_ARGUMENT_NUM_AUDITS_P1 = parseInt(
  process.argv
    .find(arg => arg.startsWith('--numAudits1'))
    ?.split('=')
    .pop() || '0',
);
const PROCESS_ARGUMENT_NUM_AUDITS_P2 = parseInt(
  process.argv
    .find(arg => arg.startsWith('--numAudits2'))
    ?.split('=')
    .pop() || '0',
);
const PROCESS_ARGUMENT_NUM_GROUPS_P2 = parseInt(
  process.argv
    .find(arg => arg.startsWith('--numGroupRefs2'))
    ?.split('=')
    .pop() || '0',
);

const suite = new Benchmark.Suite('report-scoring');

const AUDIT_PREFIX = 'a-';
const GROUP_PREFIX = 'g:';
const PLUGIN_PREFIX = 'p.';
const SLUG_PLUGIN_P1 = PLUGIN_PREFIX + 1;
const AUDIT_P1_PREFIX = AUDIT_PREFIX + SLUG_PLUGIN_P1;
const SLUG_PLUGIN_P2 = PLUGIN_PREFIX + 2;
const AUDIT_P2_PREFIX = AUDIT_PREFIX + SLUG_PLUGIN_P2;
const GROUP_P2_PREFIX = GROUP_PREFIX + SLUG_PLUGIN_P2;
const NUM_AUDITS_P1 = PROCESS_ARGUMENT_NUM_AUDITS_P1 || 27;
const NUM_AUDITS_P2 = PROCESS_ARGUMENT_NUM_AUDITS_P2 || 18;
const NUM_GROUPS_P2 = PROCESS_ARGUMENT_NUM_GROUPS_P2 || NUM_AUDITS_P2 / 2;

// ==================

// Add listener
const listeners = {
  cycle: function (event) {
    console.log(String(event.target));
  },
  complete: function () {
    if (typeof this?.filter === 'function') {
      console.log(' ');
      console.log('Fastest is ' + this?.filter('fastest').map('name'));
    }
  },
};

// ==================

// Add tests
suite.add('scoreReport', _scoreReport);
suite.add('scoreReportOptimized0', _scoreReportOptimized0);
suite.add('scoreReportOptimized1', _scoreReportOptimized1);
suite.add('scoreReportOptimized2', _scoreReportOptimized2);

// ==================

// Add Listener
Object.entries(listeners).forEach(([name, fn]) => {
  suite.on(name, fn);
});

// ==================

console.info('You can adjust the number of runs with the following arguments:');
console.info(
  `numAudits1      Number of audits in plugin 1.       --numAudits1=${NUM_AUDITS_P1}`,
);
console.info(
  `numAudits2      Number of audits in plugin 2.       --numAudits2=${NUM_AUDITS_P2}`,
);
console.info(
  `numGroupRefs2   Number of groups refs in plugin 2.  --numGroupRefs2=${NUM_GROUPS_P2}`,
);
console.log(' ');
console.log('Start benchmark...');
console.log(' ');

let start = performance.now();
const result = suite.run();

console.log(
  'Total Duration: ',
  ((performance.now() - start) / 1000).toFixed(2) + ' sec',
);

// ==============================================================

function _scoreReport() {
  scoreReport(minimalReport());
}

function _scoreReportOptimized0() {
  scoreReportOptimized0(minimalReport());
}

function _scoreReportOptimized1() {
  scoreReportOptimized1(minimalReport());
}

function _scoreReportOptimized2() {
  scoreReportOptimized2(minimalReport());
}

// ==============================================================

function minimalReport(opt) {
  const numAuditsP1 = opt?.numAuditsP1 || NUM_AUDITS_P1;
  const numAuditsP2 = opt?.numAuditsP2 || NUM_AUDITS_P2;
  const numGroupRefs2 = opt?.numGroupRefs2 || NUM_GROUPS_P2;

  return {
    categories: [
      {
        slug: 'c1_',
        refs: new Array(numAuditsP1).map((_, idx) => ({
          type: 'audit',
          plugin: SLUG_PLUGIN_P1,
          slug: `${AUDIT_P1_PREFIX}${idx}`,
          weight: 1,
        })),
        isBinary: false,
      },
      {
        slug: 'c2_',
        refs: new Array(numAuditsP2).map((_, idx) => ({
          type: 'audit',
          plugin: SLUG_PLUGIN_P2,
          slug: `${AUDIT_P2_PREFIX}${idx}`,
          weight: 1,
        })),
        isBinary: false,
      },
    ],
    plugins: [
      {
        slug: SLUG_PLUGIN_P1,
        audits: new Array(numAuditsP1).map((_, idx) => ({
          slug: `${AUDIT_P1_PREFIX}${idx}`,
          score: 0.1,
        })),
      },
      {
        slug: SLUG_PLUGIN_P2,
        audits: new Array(numAuditsP2).map((_, idx) => ({
          slug: `${AUDIT_P2_PREFIX}${idx}`,
          score: 0.1,
        })),
        groups: [
          {
            slug: GROUP_P2_PREFIX + 1,
            refs: new Array(numGroupRefs2).map((_, idx) => ({
              slug: `${AUDIT_P2_PREFIX}${idx}`,
              weight: 1,
            })),
          },
        ],
      },
    ],
  };
}
