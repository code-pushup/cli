import yargs from 'yargs';
import { Audit, AuditReport, GroupRef, Report } from '@code-pushup/models';
import { scoreReport } from '../../src/lib/reports/scoring';
import { scoreReportOptimized0 } from './optimized0';
import { scoreReportOptimized1 } from './optimized1';
import { scoreReportOptimized2 } from './optimized2';
import { scoreReportOptimized3 } from './optimized3';

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
  verbose: {
    type: 'boolean',
    default: false,
  },
});

const { numAudits1, numAudits2, numGroupRefs2, verbose } =
  await cli.parseAsync();

// ==================

// Add tests
const suitConfig = {
  suitName: 'report-scoring',
  cases: [
    ['@code-pushup/utils#scoreReport', scoreReport],
    ['scoreReportv0', scoreMinimalReportOptimized0],
    ['scoreReportv1', scoreMinimalReportOptimized1],
    ['scoreReportv2', scoreMinimalReportOptimized2],
    ['scoreReportv3', scoreMinimalReportOptimized3],
  ],
};

export default suitConfig;

// ==================

// ==================

if (verbose) {
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
function scoreMinimalReportOptimized0() {
  scoreReportOptimized0(minimalReport(options));
}

function scoreMinimalReportOptimized1() {
  scoreReportOptimized1(minimalReport(options));
}

function scoreMinimalReportOptimized2() {
  scoreReportOptimized2(minimalReport(options));
}

function scoreMinimalReportOptimized3() {
  scoreReportOptimized3(minimalReport(options));
}

// ==============================================================

const AUDIT_PREFIX = 'a-';
const GROUP_PREFIX = 'g:';
const PLUGIN_PREFIX = 'p.';
const SLUG_PLUGIN_P1 = PLUGIN_PREFIX + 1;
const AUDIT_P1_PREFIX = AUDIT_PREFIX + SLUG_PLUGIN_P1;
const SLUG_PLUGIN_P2 = PLUGIN_PREFIX + 2;
const AUDIT_P2_PREFIX = AUDIT_PREFIX + SLUG_PLUGIN_P2;
const GROUP_P2_PREFIX = GROUP_PREFIX + SLUG_PLUGIN_P2;

type MinimalReportOptions = {
  numAuditsP1?: number;
  numAuditsP2?: number;
  numGroupRefs2?: number;
};

// eslint-disable-next-line max-lines-per-function
function minimalReport(cfg: MinimalReportOptions = {}): Report {
  return {
    date: '2022-01-01',
    duration: 0,
    packageName: '@code-pushup/cli',
    version: '1.0.0',
    categories: [
      {
        slug: 'c1_',
        title: 'Category 1',
        refs: Array.from({ length: cfg.numAuditsP1 }).map((_, idx) => ({
          type: 'audit',
          plugin: SLUG_PLUGIN_P1,
          slug: `${AUDIT_P1_PREFIX}${idx}`,
          weight: 1,
        })),
        isBinary: false,
      },
      {
        slug: 'c2_',
        title: 'Category 2',
        refs: Array.from({ length: cfg.numAuditsP2 }).map((_, idx) => ({
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
        date: '2022-01-01',
        duration: 0,
        slug: SLUG_PLUGIN_P1,
        title: 'Plugin 1',
        icon: 'slug',
        audits: Array.from({ length: cfg.numAuditsP1 }).map(
          (_, idx) =>
            ({
              value: 0,
              slug: `${AUDIT_P1_PREFIX}${idx}`,
              title: 'Default Title',
              score: 0.1,
            } satisfies Audit),
        ),
        groups: [],
      },
      {
        date: '2022-01-01',
        duration: 0,
        slug: SLUG_PLUGIN_P2,
        title: 'Plugin 2',
        icon: 'slug',
        audits: Array.from({ length: cfg.numAuditsP2 }).map(
          (_, idx) =>
            ({
              value: 0,
              slug: `${AUDIT_P2_PREFIX}${idx}`,
              title: 'Default Title',
              score: 0.1,
            } satisfies AuditReport),
        ),
        groups: [
          {
            title: 'Group 1',
            slug: GROUP_P2_PREFIX + 1,
            refs: Array.from({ length: cfg.numGroupRefs2 }).map(
              (_, idx) =>
                ({
                  slug: `${AUDIT_P2_PREFIX}${idx}`,
                  weight: 1,
                } satisfies GroupRef),
            ),
          },
        ],
      },
    ],
  } satisfies Report;
}
