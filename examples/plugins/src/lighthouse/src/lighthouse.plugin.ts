import type Result from 'lighthouse/types/lhr/lhr';
import { dirname } from 'node:path';
import type {
  AuditOutput,
  AuditOutputs,
  PluginConfig,
  RunnerConfig,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  filterItemRefsBy,
  toArray,
} from '@code-pushup/utils';
import {
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  PLUGIN_SLUG,
  audits,
  categoryCorePerfGroup,
} from './constants.js';
import type { LighthouseCliOptions, PluginOptions } from './types.js';
import {
  getLighthouseCliArguments,
  lhrDetailsToIssueDetails,
} from './utils.js';

/**
 * @example
 * // code-pushup.config.ts
 * import { create as lighthousePlugin } from 'lighthouse.plugin.ts';
 *
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await lighthousePlugin({ url: "angular.dev" })
 *   ],
 *   categories: [
 *     {
 *       slug: 'performance',
 *       title: 'Performance',
 *       refs: [
 *         ...lighthousePluginRecommended
 *       ]
 *     }
 *   ]
 * }
 *
 */
export async function create(options: PluginOptions) {
  const {
    // @NOTICE
    // Not all audits are implemented, so we always rely on the `onlyAudits` argument
    onlyAudits: onlyAuditsOption = audits.map(({ slug }) => slug),
    headless: headlessOption = true,
    outputPath,
  } = options;
  const onlyAudits = toArray(onlyAuditsOption);
  const headless = headlessOption ? ('new' as const) : false;

  // ensure output dir
  if (outputPath !== undefined) {
    await ensureDirectoryExists(dirname(outputPath));
  }

  return {
    slug: PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    description: 'Chrome lighthouse CLI as code-pushup plugin',
    runner: runnerConfig({
      ...options,
      onlyAudits,
      // @NOTICE
      // Examples have a reduced scope, so we only execute the performance category here
      onlyCategories: ['performance'],
      headless,
    }),
    audits: audits.filter(({ slug }) => onlyAudits.includes(slug)),
    groups: filterItemRefsBy([categoryCorePerfGroup], ({ slug }) =>
      onlyAudits.includes(slug),
    ),
  } satisfies PluginConfig;
}

export function runnerConfig(options: LighthouseCliOptions): RunnerConfig {
  const {
    outputPath = LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
    userDataDir,
    ...remnainingOptions
  } = options;

  // eslint-disable-next-line functional/no-let
  let lhCliOpts: LighthouseCliOptions = {
    ...remnainingOptions,
    outputPath,
  };
  if (userDataDir !== undefined) {
    lhCliOpts = { ...lhCliOpts, userDataDir };
  }

  return {
    command: 'npx',
    args: getLighthouseCliArguments(lhCliOpts),
    outputFile: outputPath,
    outputTransform: (lighthouseOutput: unknown) =>
      lhrToAuditOutputs(lighthouseOutput as Result),
  };
}

function lhrToAuditOutputs(lhr: Result): AuditOutputs {
  return Object.values(lhr.audits).map(
    ({
      id: slug,
      score,
      numericValue: value = 0, // not every audit has a numericValue
      displayValue,
      details,
    }) => {
      const auditOutput: AuditOutput = {
        slug,
        score: score ?? 0, // score can be null
        value: Number.parseInt(value.toString(), 10),
        displayValue,
      };

      const issues = lhrDetailsToIssueDetails(details);
      if (issues) {
        return {
          ...auditOutput,
          details: {
            issues,
          },
        };
      }

      return auditOutput;
    },
  );
}
