import Result from 'lighthouse/types/lhr/lhr';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  MAX_ISSUE_MESSAGE_LENGTH,
  PluginConfig,
  RunnerConfig,
} from '@code-pushup/models';
import { objectToCliArgs, toArray, verboseUtils } from '@code-pushup/utils';
import { LIGHTHOUSE_OUTPUT_FILE_DEFAULT } from './constants';
import {
  audits,
  categoryPerfGroup,
  lighthouseReportName,
  pluginSlug,
} from './constants.generated';

export type PluginOptions = {
  url: string;
  outputPath?: string;
  onlyAudits?: string | string[];
  verbose?: boolean;
  headless?: boolean;
};

export type LighthouseCliOptions = Omit<
  PluginOptions,
  'headless' | 'onlyAudits'
> & {
  headless?: false | 'new';
  onlyAudits?: string[];
};

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
  const { onlyAudits: onlyAuditsOption = [], headless: headlessOption = true } =
    options;
  const onlyAudits = toArray(onlyAuditsOption);
  const headless = headlessOption ? ('new' as const) : false;

  // @TODO don't fail collect if the result does not contain all listed audits => debug DX for plugin authors
  const groupsRefs =
    onlyAudits.length === 0
      ? categoryPerfGroup.refs
      : categoryPerfGroup.refs.filter(({ slug }) => onlyAudits.includes(slug));

  if (groupsRefs.length === 0) {
    throw new Error(`audits ${onlyAudits.join(', ')} unknown`);
  }

  return {
    slug: pluginSlug,
    title: 'Lighthouse',
    icon: 'lighthouse',
    description: 'Chrome lighthouse CLI as code-pushup plugin',
    runner: runnerConfig({
      ...options,
      onlyAudits,
      headless,
    }),
    audits,
    groups: [
      {
        ...categoryPerfGroup,
        refs: groupsRefs,
      },
    ],
  };
}

export function runnerConfig(options: LighthouseCliOptions): RunnerConfig {
  const { log } = verboseUtils(options.verbose);
  const outputPath = options.outputPath ?? LIGHTHOUSE_OUTPUT_FILE_DEFAULT;
  const args = getLighthouseCliArguments({ ...options, outputPath });
  log(`Run npx ${args.join(' ')}`);

  return {
    command: 'npx',
    args,
    outputFile: outputPath,
    outputTransform: (lighthouseOutput: unknown) =>
      lhrToAuditOutputs(lighthouseOutput as Result),
  } satisfies RunnerConfig;
}

function getLighthouseCliArguments(options: LighthouseCliOptions): string[] {
  const {
    url,
    outputPath = lighthouseReportName,
    onlyAudits = [],
    verbose = false,
    headless = false,
  } = options;
  // eslint-disable-next-line functional/no-let
  let argsObj: Record<string, unknown> = {
    _: ['lighthouse', url],
    verbose,
    output: 'json',
    'output-path': outputPath,
  };

  if (headless) {
    argsObj = {
      ...argsObj,
      ['chrome-flags']: `--headless=${headless}`,
    };
  }

  if (onlyAudits.length > 0) {
    argsObj = {
      ...argsObj,
      onlyAudits: toArray(onlyAudits),
    };
  }

  return objectToCliArgs(argsObj);
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

function lhrDetailsToIssueDetails(
  details = {} as unknown as Result['audits'][string]['details'],
): Issue[] | null {
  const { type, items } = details as {
    type: string;
    items: Record<string, string>[];
    /**
     * @TODO implement cases
     * - undefined,
     * - 'table',
     * - 'filmstrip',
     * - 'screenshot',
     * - 'debugdata',
     * - 'opportunity',
     * - 'criticalrequestchain',
     * - 'list',
     * - 'treemap-data'
     */
  };
  if (type === 'table') {
    return [
      {
        message: items
          .map((item: Record<string, string>) =>
            Object.entries(item).map(([key, value]) => `${key}-${value}`),
          )
          .join(',')
          .slice(0, MAX_ISSUE_MESSAGE_LENGTH),
        severity: 'info',
        source: {
          file: 'required-in-portal-api',
        },
      },
    ];
  }

  return null;
}
