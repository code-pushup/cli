import type { CoreConfig } from '../models/src/index.js';
import bundleStatsPlugin from './src';
import { MinMax } from './src/lib/runner/types';
import { BundleStatsAuditOptions } from './src/lib/types';

/**
 * Execute code-pushup over Nx:
 * nx code-pushup:minimal plugin-bundle-stats
 */

// ===== Selection Constants =====
const SELECTION_ALL_OUTPUTS = {
  includeOutputs: ['**/*'],
};
const SELECTION_ONE_FILE = {
  mode: 'bundle' as const,
  includeOutputs: ['**/feature-2-JRMQOICX.js'],
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

const DISABLED = {
  enabled: false,
  totalSize: THRESHOLD_ALWAYS_PASS_MAX,
};

const BASE_AUDIT_ALL_FILES = {
  selection: {
    mode: 'bundle' as const,
    includeOutputs: ['**/*.js'],
  },
};

const BASE_AUDIT_ALL_FILES_SCORING_DISABLED = {
  selection: {
    mode: 'bundle' as const,
    includeOutputs: ['**/*.js'],
  },
  scoring: DISABLED,
};

// ===== Audit Groups =====

// ===== Audits =====

// ===== Selection Audits =====
const SELECTION_AUDIT_ICON = '🎯';
const SELECTION_AUDIT_PREFIX = 'selection';

/**
 * Stats Data
 *
 * esbuild-minimal.stats.json
 * └── outputs
 *     ├── dist/index.js                                    // entryPoint: ../shared-source/src/index.ts
 *     │   ├── inputs
 *     │   │   └── ../shared-source/src/index.ts
 *     │   └── imports
 *     │       ├── dist/chunks/chunk-PKX4VJZC.js           // import-statement
 *     │       ├── dist/chunks/chunk-SK6HMZ5B.js           // import-statement
 *     │       └── dist/chunks/feature-2-SERQNJVR.js       // dynamic-import
 *     ├── dist/bin.js                                      // entryPoint: ../shared-source/src/bin.ts
 *     │   ├── inputs
 *     │   │   └── ../shared-source/src/bin.ts
 *     │   └── imports
 *     │       ├── dist/chunks/chunk-PKX4VJZC.js           // import-statement
 *     │       └── dist/chunks/chunk-SK6HMZ5B.js           // import-statement
 *     ├── dist/chunks/chunk-PKX4VJZC.js                   // Main shared chunk
 *     │   ├── inputs (13 files: node_modules + source)
 *     │   │   ├── ../../../../../node_modules/balanced-match/index.js
 *     │   │   ├── ../../../../../node_modules/brace-expansion/index.js
 *     │   │   ├── ../../../../../node_modules/minimatch/dist/esm/*.js (6 files)
 *     │   │   ├── ../shared-source/src/lib/utils/format.ts
 *     │   │   ├── ../shared-source/src/lib/feature-1.ts
 *     │   │   ├── ../shared-source/src/lib/utils/math.ts
 *     │   │   └── ../shared-source/src/lib/utils/string.ts
 *     │   └── imports
 *     │       └── dist/chunks/chunk-SK6HMZ5B.js           // import-statement
 *     ├── dist/chunks/feature-2-SERQNJVR.js               // entryPoint: ../shared-source/src/lib/feature-2.ts
 *     │   ├── inputs
 *     │   │   └── ../shared-source/src/lib/feature-2.ts
 *     │   └── imports
 *     │       └── dist/chunks/chunk-SK6HMZ5B.js           // import-statement
 *     └── dist/chunks/chunk-SK6HMZ5B.js                   // ESM runtime helpers
 *         ├── inputs: (empty - runtime code)
 *         └── imports: (none)
 */

const SELECTION_AUDITS: BundleStatsAuditOptions[] = [
  // ===== Selection - Mode Audits =====
  {
    slug: `${SELECTION_AUDIT_PREFIX}-mode-bundle`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Mode - Bundle`,
    description:
      'Demonstrates bundle mode - standard selection with static imports.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/index.js'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-mode-feature`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Mode - Feature`,
    description:
      'Demonstrates feature mode - input filtering with size recalculation.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'matchingOnly',
      includeInputs: ['**/src/**'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-mode-startup`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Mode - Startup`,
    description:
      'Demonstrates startup mode - includes static import dependencies.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-mode-dependencies`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Mode - Dependencies`,
    description:
      'Demonstrates dependencies mode - comprehensive tracking (static + dynamic).',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
  },

  // ===== Selection - Pattern Audits =====
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-output-include`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - Output Include`,
    description: 'Demonstrates including only entry point outputs.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle', // Only include files to reduce noise. Irrelevant for include/exclude patterns
      includeOutputs: ['**/bin.js'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-output-exclude`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - Output Exclude`,
    description: 'Demonstrates excluding chunk files to focus on entry points.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/*.js'],
      excludeOutputs: ['**/chunks/**'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-input-include`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - Input Include`,
    description: 'Demonstrates including only source code files.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle', // Only include files to reduce noise. Irrelevant for include/exclude patterns
      includeInputs: ['**/node_modules/**'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-input-exclude`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - Input Exclude`,
    description: 'Demonstrates excluding node_modules dependencies.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle',
      includeInputs: ['**/src/lib/**'],
      excludeInputs: ['**/node_modules/**'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-combined`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - Combined`,
    description: 'Demonstrates combining entry points with source-only inputs.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/chunks/feature-*'],
      excludeInputs: ['**/src/lib/utils/math.ts'],
    },
  },
  {
    slug: `${SELECTION_AUDIT_PREFIX}-pattern-feature-specific`,
    title: `${SELECTION_AUDIT_ICON} - Selection - Pattern - includeInputs`,
    description:
      'Demonstrates feature mode filtering for utility functions only.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    selection: {
      mode: 'matchingOnly',
      includeInputs: ['**/utils/**'],
    },
  },
];

const SCORING_AUDIT_ICON = '📏';
const SCORING_AUDIT_PREFIX = 'scoring';

const SCORING_AUDITS: BundleStatsAuditOptions[] = [
  // ===== Scoring - General Audits =====
  {
    title: `${SCORING_AUDIT_ICON} - Scoring - General - Disabled`,
    description: 'Demonstrates disabled scoring.',
    slug: `${SCORING_AUDIT_PREFIX}-general-disabled`,
    ...BASE_AUDIT_ALL_FILES,
    scoring: {
      enabled: false,
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
    },
  },

  // ===== Scoring - Total Size Audits =====
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-pass`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Total Size - Pass`,
    description:
      'Demonstrates threshold passing when total size is within range limits.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: { totalSize: THRESHOLD_ALWAYS_PASS_RANGE },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-too-big`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Total Size - Too Big`,
    description:
      'Demonstrates threshold failure when total size exceeds simple number limit.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: { totalSize: THRESHOLD_ALWAYS_FAIL_MAX },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-total-size-too-small`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Total Size - Too Small`,
    description:
      'Demonstrates threshold warning when total size is below minimum in range.',
    ...BASE_AUDIT_ALL_FILES,
    scoring: {
      totalSize: [THRESHOLD_ALWAYS_FAIL_MIN, THRESHOLD_ALWAYS_PASS_MAX],
    },
  },
];

// ===== Scoring with Penalty Audits =====

const SCORING_PENALTY_AUDITS: BundleStatsAuditOptions[] = [
  // ===== Scoring - Penalty - Artefact Size =====
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-pass`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Artefact Pass`,
    description:
      'Demonstrates penalty passing when all files are within size limits.',
    selection: SELECTION_ONE_FILE,
    scoring: {
      ...DISABLED,
      penalty: {
        artefactSize: THRESHOLD_ALWAYS_PASS_MAX,
      },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-pass-range`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Artefact Pass Range`,
    description: 'Demonstrates penalty passing with min/max range constraints.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: {
        artefactSize: [THRESHOLD_ALWAYS_PASS_MIN, THRESHOLD_ALWAYS_PASS_MAX],
      },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-too-big`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Artefact Too Big`,
    description: 'Demonstrates penalty failure when files exceed maximum size.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: { artefactSize: THRESHOLD_ALWAYS_FAIL_MAX },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-artefact-too-small`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Artefact Too Small`,
    description:
      'Demonstrates penalty warning when files are below minimum size.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: {
        artefactSize: [THRESHOLD_ALWAYS_FAIL_MIN, THRESHOLD_ALWAYS_PASS_MAX],
      },
    },
  },

  // ===== Scoring - Penalty - Blacklist =====
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-blacklist-pass`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Blacklist Pass`,
    description:
      'Demonstrates penalty passing when no blacklisted patterns match.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    scoring: {
      totalSize: THRESHOLD_ALWAYS_PASS_MAX,
      penalty: { blacklist: ['**/non-existent-pattern/**'] },
    },
  },
  {
    slug: `${SCORING_AUDIT_PREFIX}-penalty-blacklist-fail`,
    title: `${SCORING_AUDIT_ICON} - Scoring - Penalty - Blacklist Fail`,
    description:
      'Demonstrates penalty failure when blacklisted patterns are found.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
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

const INSIGHT_AUDITS: BundleStatsAuditOptions[] = [
  // ===== Insights - General Audits =====
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-general-disabled`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - General - Disabled`,
    description: 'Demonstrates disabled insights table.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: false,
  },

  // ===== Insights - View Mode Audits =====
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-view-mode-only-matching`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - View Mode - Only Matching`,
    description:
      'Demonstrates onlyMatching mode - shows only files matching selection.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      mode: 'onlyMatching',
      groups: [
        {
          title: 'Source Files',
          includeInputs: ['**/src/**'],
          icon: '📄',
        },
      ],
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-view-mode-all`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - View Mode - All`,
    description:
      'Demonstrates all mode - shows all files regardless of selection.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      mode: 'all',
      groups: [
        {
          title: 'Source Files',
          includeInputs: ['**/src/**'],
          icon: '📄',
        },
      ],
    },
  },

  // ===== Insights - Pruning Audits =====
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-pruning-max-children`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Pruning - Max Children`,
    description:
      'Demonstrates maxChildren pruning - limits table entries shown.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          title: 'All Files',
          includeInputs: ['**/*'],
          icon: '📄',
        },
      ],
      pruning: { maxChildren: 3 },
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-pruning-min-size`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Pruning - Min Size`,
    description: 'Demonstrates minSize pruning - filters out small files.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          title: 'Large Files Only',
          includeInputs: ['**/*'],
          icon: '📄',
        },
      ],
      pruning: { minSize: 1000 },
    },
  },

  // ===== Insights - Table Audits =====
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-table-grouping`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Table - Grouping`,
    description: 'Demonstrates how the bundle is grouped.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          title: 'Math Utilities',
          includeInputs: ['**/math.ts'],
          icon: '🔧',
        },
        {
          title: 'Formatting Utilities',
          includeInputs: ['**/format.ts'],
          icon: '🔧',
        },
        {
          title: 'Feature 2',
          includeInputs: ['**/*feature-2*'],
          icon: '🧩',
        },
        {
          title: 'Entrypoints',
          includeInputs: ['src/index.ts', 'src/bin.ts'],
          icon: '🏁',
        },
        {
          title: 'Shared Chunks',
          includeInputs: ['dist/chunks/chunk-*.js'],
          icon: '🤝',
        },
        {
          title: 'Node Modules',
          includeInputs: ['**/node_modules/**'],
          icon: '📦',
        },
        {
          title: 'Distributables',
          includeInputs: ['dist/index.js', 'dist/bin.js'],
          icon: '📦',
        },
      ],
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-table-rest-group`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Table - Rest Group`,
    description:
      'Demonstrates how all non-matching assets are grouped into the "Rest" row.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          title: 'Feature 1',
          includeInputs: ['**/*feature-1*'],
          icon: '🧩',
        },
      ],
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-groups-pattern-only`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Groups - Pattern Only`,
    description:
      'Demonstrates groups with include patterns only (no title or icon).',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        { includeInputs: ['**/src/**'] },
        { includeInputs: ['**/dist/**'] },
      ],
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-groups-title-icon`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Groups - Title Icon`,
    description: 'Demonstrates groups with title and icon.',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          title: 'Source Files',
          includeInputs: ['**/src/**'],
          icon: '📄',
        },
        {
          title: 'Node Modules',
          includeInputs: ['**/node_modules/**'],
          icon: '📦',
        },
      ],
    },
  },
  {
    slug: `${INSIGHT_AUDIT_PREFIX}-groups-path-segments`,
    title: `${INSIGHT_AUDIT_ICON} - Insights - Groups - Path Segments`,
    description:
      'Demonstrates grouping by number of path segments (numSegments).',
    ...BASE_AUDIT_ALL_FILES_SCORING_DISABLED,
    insightsTable: {
      groups: [
        {
          includeInputs: ['**/node_modules/**', '**/node_modules/@*/**'],
          numSegments: 1,
        },
      ],
    },
  },
];

// ===== Tree Audits =====
const TREE_AUDIT_PREFIX = 'tree';
const TREE_AUDIT_ICON = '🌳';

const TREE_AUDITS: BundleStatsAuditOptions[] = [
  // ===== Tree - Disables =====
  {
    slug: `${TREE_AUDIT_PREFIX}-disables`,
    title: `${TREE_AUDIT_ICON} - Tree - Disables`,
    description:
      'Shows how to explicitly disable dependency trees using enabled: false. You should see audit results but no ASCII tree structure, even when global dependencyTree config exists.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { enabled: false },
  },

  // ===== Tree - Mode =====
  {
    slug: `${TREE_AUDIT_PREFIX}-mode-all`,
    title: `${TREE_AUDIT_ICON} - Tree - Mode - All`,
    description:
      'Demonstrates mode: "all" - shows complete file tree regardless of selection filters. Compare with onlyMatching to see the difference in which files appear in the tree.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { mode: 'all' },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-mode-onlymatching`,
    title: `${TREE_AUDIT_ICON} - Tree - Mode - OnlyMatching`,
    description:
      'Demonstrates mode: "onlyMatching" (default) - tree only shows files that match the selection criteria. Files outside selection are hidden from tree display.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { mode: 'onlyMatching' },
  },

  // ===== Tree - Groups =====
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-include`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - Include`,
    description:
      'Demonstrates groups.include patterns organizing files by type. Shows how dependencies (📦) are grouped with clear visual separation. Uses selection filtering to focus only on node_modules files for a clean demonstration.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      mode: 'onlyMatching',
      pruning: {
        maxDepth: 3,
      },
      groups: [
        {
          includeInputs: ['**/node_modules/**'],
          title: 'Dependencies',
          icon: '📦',
        },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-exclude`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - Exclude`,
    description:
      'Demonstrates the recommended approach: using selection excludeInputs to filter out node_modules files, combined with mode: "onlyMatching". While grouping can organize remaining files, selection filtering is the primary and most reliable way to exclude unwanted files from both table and tree displays.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      mode: 'onlyMatching',
      groups: [
        {
          includeInputs: ['**/index.js'],
          excludeInputs: ['**/node_modules/**'],
        },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-include-exclude`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - Include & Exclude`,
    description:
      'Shows combining include and exclude patterns for precise filtering. First group shows src files but excludes test files, second shows lib files but excludes test directories.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      groups: [
        {
          includeInputs: ['**/src/**'],
          excludeInputs: ['**/node_modules/**'],
        },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-title`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - Title`,
    description:
      'Demonstrates groups.title property for custom section headers. Look for "Source Files" and "Dependencies" labels that replace default path-based grouping names.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      groups: [
        {
          title: 'Source Files',
          includeInputs: ['**/src/**'],
        },
        {
          title: 'Dependencies',
          includeInputs: ['**/node_modules/**'],
        },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-icon`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - Icon`,
    description:
      'Shows groups.icon property adding visual indicators to grouped sections. Look for 📄 icon next to source files and 📦 icon next to dependencies in the tree display.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      groups: [
        {
          includeInputs: ['**/src/**'],
          icon: '📄',
        },
        {
          includeInputs: ['**/node_modules/**'],
          icon: '📦',
        },
      ],
    },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-groups-numsegments`,
    title: `${TREE_AUDIT_ICON} - Tree - Groups - NumSegments`,
    description:
      'Demonstrates groups.numSegments for path-based grouping. Node modules are grouped by their top-level package name (1 segment), flattening deep nested structures like @scope/package.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: {
      groups: [
        {
          includeInputs: ['**/node_modules/**', '**/node_modules/@*/**'],
          numSegments: 1,
        },
      ],
    },
  },

  // ===== Tree - Pruning =====
  {
    slug: `${TREE_AUDIT_PREFIX}-pruning-maxchildren`,
    title: `${TREE_AUDIT_ICON} - Tree - Pruning - MaxChildren`,
    description:
      'Shows pruning.maxChildren: 2 limiting displayed children per node. Large directories will show only first 2 entries plus "...X more items" to prevent overwhelming output.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { pruning: { maxChildren: 2 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-pruning-maxdepth`,
    title: `${TREE_AUDIT_ICON} - Tree - Pruning - MaxDepth`,
    description:
      'Demonstrates pruning.maxDepth: 1 limiting tree depth to prevent deep nesting. Only shows immediate children, deeper levels are truncated with continuation indicators.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { pruning: { maxDepth: 1 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-pruning-minsize`,
    title: `${TREE_AUDIT_ICON} - Tree - Pruning - MinSize`,
    description:
      'Shows pruning.minSize: 1000 filtering out files smaller than 1KB. Small utility files and helpers are hidden, displaying only substantial files that impact bundle size.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { pruning: { minSize: 1000 } },
  },
  {
    slug: `${TREE_AUDIT_PREFIX}-pruning-pathlength`,
    title: `${TREE_AUDIT_ICON} - Tree - Pruning - PathLength`,
    description:
      'Demonstrates pruning.pathLength: 30 truncating long file paths for readability. Paths longer than 30 characters show as "...filename.js" to keep tree display compact.',
    selection: {
      mode: 'bundle',
      includeOutputs: ['**/feature-2*.js'],
    },
    scoring: DISABLED,
    dependencyTree: { pruning: { pathLength: 30 } },
  },
];

const config: CoreConfig = {
  plugins: [
    await bundleStatsPlugin({
      artifactsPaths:
        'packages/plugin-bundle-stats/mocks/fixtures/node-minimal/dist/esbuild/stats.json',
      bundler: 'esbuild',
      audits: [
        ...SCORING_AUDITS,
        ...SCORING_PENALTY_AUDITS,
        ...SELECTION_AUDITS,
        ...INSIGHT_AUDITS,
        ...TREE_AUDITS,
      ],
      groups: [
        {
          slug: 'selection-group',
          title: '🎯 Selection',
          description:
            'Demonstrates different selection modes and pattern matching for bundle analysis.',
          refs: SELECTION_AUDITS.filter(audit => audit.slug).map(audit => ({
            slug: audit.slug!,
            weight: 1,
          })),
        },
        {
          slug: 'scoring-group',
          title: '📏 Scoring',
          description:
            'Shows scoring mechanisms including thresholds, penalties, and size constraints.',
          refs: [...SCORING_AUDITS, ...SCORING_PENALTY_AUDITS]
            .filter(audit => audit.slug)
            .map(audit => ({
              slug: audit.slug!,
              weight: 1,
            })),
        },
        {
          slug: 'insights-group',
          title: '📊 Insights Table',
          description:
            'Configures insights tables with grouping, pruning, and visualization options.',
          refs: INSIGHT_AUDITS.filter(audit => audit.slug).map(audit => ({
            slug: audit.slug!,
            weight: 1,
          })),
        },
        {
          slug: 'tree-group',
          title: '🌳 Dependency Tree',
          description:
            'Demonstrates dependency tree configurations with grouping and pruning strategies.',
          refs: TREE_AUDITS.filter(audit => audit.slug).map(audit => ({
            slug: audit.slug!,
            weight: 1,
          })),
        },
      ],
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: '⚡ Performance',
      description:
        'Comprehensive bundle performance analysis including selection, scoring, insights, and dependency trees.',
      refs: [
        {
          type: 'group' as const,
          plugin: 'bundle-stats',
          slug: 'selection-group',
          weight: 1,
        },
        {
          type: 'group' as const,
          plugin: 'bundle-stats',
          slug: 'scoring-group',
          weight: 2,
        },
        {
          type: 'group' as const,
          plugin: 'bundle-stats',
          slug: 'insights-group',
          weight: 1,
        },
        {
          type: 'group' as const,
          plugin: 'bundle-stats',
          slug: 'tree-group',
          weight: 1,
        },
      ],
    },
  ],
};

export default (async () => {
  return config;
})();
