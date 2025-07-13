import type { CoreConfig } from '@code-pushup/models';
import bundleStatsPlugin from './src';
import { MinMax } from './src/lib/runner/types';
import { BundleStatsOptions } from './src/lib/types';

/**
 * Execute the code-pushup over Nx:
 * nx code-pushup:minimal plugin-bundle-stats
 */

// ===== Selection Constants =====
const SELECTION_ALL_FILES = {
  includeOutputs: ['**/*'],
};
// ===== Scoring Constants =====

const THRESHOLD_ALWAYS_PASS_MAX = 100_000; // 100KB - much higher than actual bundle size
const THRESHOLD_ALWAYS_FAIL_MAX = 1;
const THRESHOLD_ALWAYS_FAIL_MIN = 1;
const THRESHOLD_ALWAYS_PASS_MIN = 0;
const THRESHOLD_ALWAYS_PASS_RANGE: MinMax = [
  THRESHOLD_ALWAYS_PASS_MIN,
  THRESHOLD_ALWAYS_PASS_MAX,
];

const SCORING_ALWAYS_PASS = {
  totalSize: THRESHOLD_ALWAYS_PASS_MAX,
};

const BASE_AUDIT_ALL_FILES = {
  selection: SELECTION_ALL_FILES,
};

const BASE_AUDIT_ALL_FILES_ALWAYS_PASS = {
  selection: SELECTION_ALL_FILES,
  scoring: SCORING_ALWAYS_PASS,
};

// ===== Audit Groups =====

// ===== Audits =====

const SCORING_AUDIT_ICON = '📏';
const SCORING_AUDIT_PREFIX = 'scoring';

const SCORING_AUDITS: BundleStatsOptions[] = [
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-pass`,
    title: `${SCORING_AUDIT_ICON} - Total Size Pass`,
    description:
      'Demonstrates threshold passing when total size is within max limits.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-pass-minmax`,
    title: `${SCORING_AUDIT_ICON} - Total Size Pass Range`,
    description:
      'Demonstrates threshold passing when total size is within range limits.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: { totalSize: THRESHOLD_ALWAYS_PASS_RANGE },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-too-big`,
    title: `${SCORING_AUDIT_ICON} - Total Size Too Big`,
    description:
      'Demonstrates threshold failure when total size exceeds simple number limit.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: { totalSize: THRESHOLD_ALWAYS_FAIL_MAX },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-too-small-minmax`,
    title: `${SCORING_AUDIT_ICON} - Total Size Too Small Range`,
    description:
      'Demonstrates threshold warning when total size is below minimum in range.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: {
      totalSize: [THRESHOLD_ALWAYS_FAIL_MIN, THRESHOLD_ALWAYS_PASS_MAX],
    },
  },
];

// ===== Scoring with Penalty Audits =====

const SCORING_PENALTY_AUDITS: BundleStatsOptions[] = [
  // ===== Penalty - Artefact Size =====
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-size-pass`,
    title: `${SCORING_AUDIT_ICON} - Penalty Artefact Size Pass`,
    description:
      'Demonstrates penalty passing when all files are within size limits.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: {
      ...SCORING_ALWAYS_PASS,
      penalty: {
        artefactSize: THRESHOLD_ALWAYS_PASS_MAX,
      },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-size-pass-minmax`,
    title: `${SCORING_AUDIT_ICON} - Penalty Artefact Size Pass Range`,
    description: 'Demonstrates penalty passing with min/max range constraints.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: {
        artefactSize: [THRESHOLD_ALWAYS_PASS_MIN, THRESHOLD_ALWAYS_PASS_MAX],
      },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-size-too-big`,
    title: `${SCORING_AUDIT_ICON} - Penalty Artefact Size Too Big`,
    description: 'Demonstrates penalty failure when files exceed maximum size.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: { artefactSize: THRESHOLD_ALWAYS_FAIL_MAX },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-size-too-small-minmax`,
    title: `${SCORING_AUDIT_ICON} - Penalty Artefact Size Too Small Range`,
    description:
      'Demonstrates penalty warning when files are below minimum size.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: {
        artefactSize: [THRESHOLD_ALWAYS_FAIL_MIN, THRESHOLD_ALWAYS_PASS_MAX],
      },
    },
  },

  // ===== Penalty - Blacklist =====
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-blacklist-pass`,
    title: `${SCORING_AUDIT_ICON} - Penalty Blacklist Pass`,
    description:
      'Demonstrates penalty passing when no blacklisted patterns match.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: { blacklist: ['**/non-existent-pattern/**'] },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-blacklist-fail`,
    title: `${SCORING_AUDIT_ICON} - Penalty Blacklist Fail`,
    description:
      'Demonstrates penalty failure when blacklisted patterns are found.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: { blacklist: ['**/*'] },
    },
  },
];

// ===== Issues Audits =====
const ISSUES_AUDIT_PREFIX = 'issues';
const ISSUES_AUDIT_ICON = '🚨';

// ===== Insights Audits =====
const INSIGHT_AUDIT_PREFIX = 'insights';
const INSIGHT_AUDIT_ICON = '📊';

const INSIGHT_AUDITS: BundleStatsOptions[] = [
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-grouping`,
    title: `${INSIGHT_AUDIT_ICON} - Insights Table - Grouping`,
    description: 'Demonstrates how the bundle is grouped.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    insights: [
      {
        title: 'Math Utilities',
        patterns: ['**/math.ts'],
        icon: '🔧',
      },
      {
        title: 'Formatting Utilities',
        patterns: ['**/format.ts'],
        icon: '🔧',
      },
      {
        title: 'Feature 2',
        patterns: ['**/*feature-2*'],
        icon: '🧩',
      },
      {
        title: 'Entrypoints',
        patterns: ['src/index.ts', 'src/bin.ts'],
        icon: '🏁',
      },
      {
        title: 'Shared Chunks',
        patterns: ['dist/chunks/chunk-*.js'],
        icon: '🤝',
      },
      {
        title: 'Node Modules',
        patterns: ['**/node_modules/**'],
        icon: '📦',
      },
      {
        title: 'Distributables',
        patterns: ['dist/index.js', 'dist/bin.js'],
        icon: '📦',
      },
    ],
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-rest-group`,
    title: `${INSIGHT_AUDIT_ICON} - Insights Table - With Rest Group`,
    description:
      'Demonstrates how all non-matching assets are grouped into the "Rest" row.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    insights: [
      {
        title: 'Feature 1',
        patterns: ['**/*feature-1*'],
        icon: '🧩',
      },
    ],
  },
];

// ===== Artefact Tree Audits =====
const TREE_AUDIT_PREFIX = 'tree';
const TREE_AUDIT_ICON = '🌳';

const TREE_AUDITS: BundleStatsOptions[] = [
  {
    slug: `${TREE_AUDIT_PREFIX}-default`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Default`,
    description: 'Demonstrates default tree without any custom options.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: {},
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-max-depth`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Max Depth`,
    description: 'Demonstrates maxDepth pruning option.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: { pruning: { maxDepth: 1 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-max-children`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Max Children`,
    description: 'Demonstrates maxChildren pruning option.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: { pruning: { maxChildren: 2 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-start-depth`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Start Depth`,
    description: 'Demonstrates startDepth pruning option.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: { pruning: { startDepth: 2 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-title-icon`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Groups Title Icon`,
    description: 'Demonstrates groups with title and icon.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: {
      groups: [
        { title: 'Node Modules', patterns: ['**/node_modules/**'], icon: '📦' },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-pattern-only`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Groups Pattern Only`,
    description: 'Demonstrates groups with pattern only.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: { groups: [{ patterns: ['**/utils/**'] }] },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-max-depth`,
    title: `${TREE_AUDIT_ICON} - Artefact Tree - Groups Max Depth`,
    description: 'Demonstrates per-group maxDepth option.',
    ...BASE_AUDIT_ALL_FILES_ALWAYS_PASS,
    artefactTree: {
      groups: [{ patterns: ['**/node_modules/**'], maxDepth: 1 }],
    },
  },
];

const config: CoreConfig = {
  plugins: [
    await bundleStatsPlugin({
      artefactsPath:
        'packages/plugin-bundle-stats/mocks/fixtures/stats/esbuild-minimal.stats.json',
      audits: [
        ...SCORING_AUDITS,
        ...SCORING_PENALTY_AUDITS,
        ...INSIGHT_AUDITS,
        ...TREE_AUDITS,
      ],
    }),
  ],
};

export default (async () => {
  return config;
})();
