import Result from 'lighthouse/types/lhr/lhr';
import {
  objectToCliArgs,
  toArray,
  verboseUtils,
} from '../../../../../dist/packages/utils';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  MAX_ISSUE_MESSAGE_LENGTH,
  PluginConfig,
  RunnerConfig,
  PluginReport
} from '../../../../../packages/models/src';
import {
  audits,
  categoryPerfGroup,
  lighthouseReportName,
  pluginSlug,
} from './constants.generated';
import {join} from "node:path";

export type LighthouseOptions = {
  url: string;
  onlyAudits?: string | string[];
  verbose?: boolean;
  headless?: boolean | 'new';
  outputFile?: string;
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
export function create(options: LighthouseOptions): PluginConfig {
  const {onlyAudits = []} = options;
  return {
    slug: pluginSlug,
    title: 'Lighthouse',
    icon: 'lighthouse',
    description: 'Chrome lighthouse CLI as code-pushup plugin',
    runner: runnerConfig(options),
    audits,
    groups: [
      {
        ...categoryPerfGroup,
        // @TODO don't fail collect if the result does not contain all listed audits
        refs:
          onlyAudits.length === 0
            ? categoryPerfGroup.refs
            : categoryPerfGroup.refs.filter(({slug}) =>
              onlyAudits.includes(slug),
            ),
      },
    ],
  };
}

function runnerConfig(options: LighthouseOptions): RunnerConfig {
  const {log} = verboseUtils(options?.verbose);
  const {outputFile = lighthouseReportName} = options;
  log(
    `Run npx ${getLighthouseCliArguments({...options, outputFile}).join(
      ' ',
    )}`,
  );
  return {
    command: 'npx',
    args: getLighthouseCliArguments({...options, outputFile}),
    outputFile,
    outputTransform: (lighthouseOutput: unknown) => {
      return lhrToAuditOutputs(lighthouseOutput as Result);
    },
  } satisfies RunnerConfig;
}

function getLighthouseCliArguments(options: LighthouseOptions): string[] {
  const {
    url,
    outputFile = lighthouseReportName,
    onlyAudits = [],
    verbose = false,
    headless = false,
  } = options;
  const argsObj: Record<string, unknown> = {
    _: ['lighthouse', url],
    verbose,
    output: 'json',
    'output-path': join('.code-pushup', outputFile),
  };

  if (headless) {
    return objectToCliArgs({
      ...argsObj,
      ['chrome-flags']: `--headless=${headless}`,
    });
  }

  if (onlyAudits.length) {
    return objectToCliArgs({
      ...argsObj,
      onlyAudits: toArray(onlyAudits).join(','),
    });
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
  const {type, items} = details as {
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
          file: 'file-name',
        },
      },
    ];
  }

  return null;
}

function codePushupAuditReportToLhrAudit(
  audit = {} as unknown as PluginReport['audits'][number],
): Result['audits'][string] {
  const {slug, score, value, displayValue, description = '', docsUrl = '', title} = audit;
  return {
    id: slug,
    numericValue: value,
    displayValue,
    score,
    scoreDisplayMode: "numeric",
    description: `${description} ${docsUrl}`,
    title,
  } satisfies Result['audits'][string];
}
