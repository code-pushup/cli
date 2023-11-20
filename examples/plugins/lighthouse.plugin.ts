import { Result } from 'lighthouse';
import { AuditOutputs, PluginConfig } from '../../dist/packages/models';
import { CategoryRef, RunnerConfig } from '../../packages/models/src';
import { objectToCliArgs } from '../../packages/utils/src';

export type LighthouseOptions = {
  url: string;
  outputFile: string;
};

export const pluginSlug = 'lighthouse-plugin';
export const lighthousePluginRecommended: CategoryRef[] = [];

/**
 * @example
 * // code-pushup.config.ts
 * import {
 * create as lighthousePlugin,
 * pluginSlug as lighthousePluginSlug,
 * } from 'lighthouse.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *     format: ['json', 'md', 'stdout'],
 *   },
 *   plugins: [
 *     await lighthousePlugin({
 *       url: "angular.dev"
 *     })
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
    title: 'Lighthouse Plugin',
    icon: 'javascript',
    description:
      'A plugin to measure and assert filesize of files in a directory.',
    runner: runnerConfig(options),
    audits: [],
  };
}

function runnerConfig(options: LighthouseOptions): PluginConfig['runner'] {
  const { outputFile, url } = options;
  return {
    command: 'npx',
    args: objectToCliArgs({
      _: url,
      output: 'json',
      'output-path': outputFile,
      'chrome-flags:"--headless"': true,
    }),
    outputFile,
    outputTransform: async (output: string): Promise<AuditOutputs> => {
      const lighthouseOutput: Result = JSON.parse(output);
      console.info(lighthouseOutput);
      return lhrToAuditOutputs(lighthouseOutput) as AuditOutputs;
    },
  } satisfies RunnerConfig;
}

function lhrToAuditOutputs(lhr: Result): AuditOutputs {
  return Object.entries(lhr.audits).map(([slug, result]) => {
    return {
      slug,
      score: result.score,
      value: result.numericValue,
      displayValue: result.displayValue,
      description: result.description,
      // details: result.details as Issue,
    };
  });
}
