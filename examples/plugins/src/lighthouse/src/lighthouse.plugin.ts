import Result from 'lighthouse/types/lhr/lhr';
import {
  AuditOutput,
  AuditOutputs,
  PluginConfig,
  RunnerConfig,
} from '@code-pushup/models';
import { toArray, verboseUtils } from '@code-pushup/utils';
import {
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  PLUGIN_SLUG,
  audits,
  categoryCorePerfGroup,
} from './constants';
import { LighthouseCliOptions, PluginOptions } from './types';
import {
  filterBySlug,
  filterRefsBySlug,
  getLighthouseCliArguments,
  lhrDetailsToIssueDetails,
} from './utils';

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
export function create(options: PluginOptions): PluginConfig {
  const {
    // @NOTICE
    // Not all audits are implemented, so we always rely on the `onlyAudits` argument
    onlyAudits: onlyAuditsOption = audits.map(({ slug }) => slug),
    headless: headlessOption = true,
    userDataDir,
  } = options;
  const onlyAudits = toArray(onlyAuditsOption);
  const headless = headlessOption ? ('new' as const) : false;

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
      userDataDir,
    }),
    audits: filterBySlug(audits, onlyAudits),
    groups: [filterRefsBySlug(categoryCorePerfGroup, onlyAudits)],
  };
}

export function runnerConfig(options: LighthouseCliOptions): RunnerConfig {
  const { log } = verboseUtils(options.verbose);
  const outputPath = options.outputPath ?? LIGHTHOUSE_OUTPUT_FILE_DEFAULT;
  const args = getLighthouseCliArguments({
    ...options,
    outputPath,
    userDataDir: options.userDataDir ?? process.cwd(),
  });

  log(`Run npx ${args.join(' ')}`);

  return {
    command: 'npx',
    args,
    outputFile: outputPath,
    outputTransform: (lighthouseOutput: unknown) =>
      lhrToAuditOutputs(lighthouseOutput as Result),
  } satisfies RunnerConfig;
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
        displayValue: displayValue,
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
