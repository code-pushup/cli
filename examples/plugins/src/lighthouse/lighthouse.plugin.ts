import { Result } from 'lighthouse';
import { objectToCliArgs } from '../../../../dist/packages/utils';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  PluginConfig,
  RunnerConfig,
} from '../../../../packages/models/src';
import {
  audits,
  categoryPerfGroup,
  lighthouseReportName,
  pluginSlug,
} from './constants';

export type LighthouseOptions = {
  url: string;
  onlyAudits?: string;
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
export async function create(
  options: LighthouseOptions,
): Promise<PluginConfig> {
  return {
    slug: pluginSlug,
    title: 'Lighthouse',
    icon: 'lighthouse',
    description: 'Chrome lighthouse CLI as code-pushup plugin',
    runner: runnerConfig(options),
    audits,
    groups: [categoryPerfGroup],
  };
}

function runnerConfig(options: LighthouseOptions): RunnerConfig {
  const { outputFile = lighthouseReportName } = options;
  return {
    command: 'npx',
    args: getLighthouseCliArguments({ ...options, outputFile }),
    outputFile,
    outputTransform: (output: unknown) => {
      throw new Error(JSON.stringify(output));
      const lighthouseOutput: Result = JSON.parse(
        (output as string).toString(),
      );
      return lhrToAuditOutputs(lighthouseOutput);
    },
  } satisfies RunnerConfig;
}

function getLighthouseCliArguments(options: LighthouseOptions): string[] {
  const {
    url,
    outputFile = lighthouseReportName,
    onlyAudits,
    verbose = false,
    headless = false,
  } = options;
  let argsObj: Record<string, unknown> = {
    _: ['lighthouse', url],
    verbose,
    output: 'json',
    'output-path': outputFile,
  };

  if (headless) {
    argsObj = {
      ...argsObj,
      ['chrome-flags']: `--headless=${headless}`,
    };
  }

  if (onlyAudits) {
    argsObj = {
      ...argsObj,
      onlyAudits,
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
      let auditOutput: AuditOutput = {
        slug,
        score: score || 0, // score can be null
        value: parseInt(value.toString()),
        displayValue: displayValue,
      };

      const issues = lhrDetailsToIssueDetails(details);
      if (issues) {
        auditOutput = {
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
  details = {} as Result['audits'][string]['details'],
): Issue[] | null {
  const { type, items } = details as {
    type: string;
    items: Record<string, string>[];
  };
  /**
   * @TODO implement cases
   * - 'table',
   * - undefined,
   * - 'filmstrip',
   * - 'screenshot',
   * - 'debugdata',
   * - 'opportunity',
   * - 'criticalrequestchain',
   * - 'list',
   * - 'treemap-data'
   */
  if (type === 'table') {
    return [
      {
        message: items
          .map((item: Record<string, string>) =>
            Object.entries(item).map(([key, value]) => `${key}-${value}`),
          )
          .join(',')
          .slice(0, 505),
        severity: 'info',
        source: {
          file: 'file-name',
        },
      },
    ];
  }

  return null;
}
