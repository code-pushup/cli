import { bold } from 'ansis';
import {
  type Audit,
  type AuditOutput,
  type AuditOutputs,
  type AuditReport,
  type PluginConfig,
  type PluginReport,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  type ProgressBar,
  getProgressBar,
  groupByStatus,
  logMultipleResults,
  pluralizeToken,
} from '@code-pushup/utils';
import { normalizeAuditOutputs } from '../normalize.js';
import { executeRunnerConfig, executeRunnerFunction } from './runner.js';

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputMissingAuditError extends Error {
  constructor(auditSlug: string) {
    super(
      `Audit metadata not present in plugin config. Missing slug: ${bold(
        auditSlug,
      )}`,
    );
  }
}

/**
 * Execute a plugin.
 *
 * @public
 * @param pluginConfig - {@link ProcessConfig} object with runner and meta
 * @returns {Promise<AuditOutput[]>} - audit outputs from plugin runner
 * @throws {PluginOutputMissingAuditError} - if plugin runner output is invalid
 *
 * @example
 * // plugin execution
 * const pluginCfg = pluginConfigSchema.parse({...});
 * const output = await executePlugin(pluginCfg);
 *
 *  @example
 *  // error handling
 *  try {
 *  await executePlugin(pluginCfg);
 *  } catch (e) {
 *  console.error(e.message);
 *  }
 */
export async function executePlugin(
  pluginConfig: PluginConfig,
): Promise<PluginReport> {
  const {
    runner,
    audits: pluginConfigAudits,
    description,
    docsUrl,
    groups,
    ...pluginMeta
  } = pluginConfig;

  // execute plugin runner
  const runnerResult =
    typeof runner === 'object'
      ? await executeRunnerConfig(runner)
      : await executeRunnerFunction(runner);
  const { audits: unvalidatedAuditOutputs, ...executionMeta } = runnerResult;

  // validate auditOutputs
  const result = auditOutputsSchema.safeParse(unvalidatedAuditOutputs);
  if (!result.success) {
    throw new Error(`Audit output is invalid: ${result.error.message}`);
  }
  const auditOutputs = result.data;
  auditOutputsCorrelateWithPluginOutput(auditOutputs, pluginConfigAudits);

  const normalizedAuditOutputs = await normalizeAuditOutputs(auditOutputs);

  // enrich `AuditOutputs` to `AuditReport`
  const auditReports: AuditReport[] = normalizedAuditOutputs.map(
    (auditOutput: AuditOutput) => ({
      ...auditOutput,
      ...(pluginConfigAudits.find(
        audit => audit.slug === auditOutput.slug,
      ) as Audit),
    }),
  );

  // create plugin report
  return {
    ...pluginMeta,
    ...executionMeta,
    audits: auditReports,
    ...(description && { description }),
    ...(docsUrl && { docsUrl }),
    ...(groups && { groups }),
  };
}

const wrapProgress = async (
  pluginCfg: PluginConfig,
  steps: number,
  progressBar: ProgressBar | null,
) => {
  progressBar?.updateTitle(`Executing ${bold(pluginCfg.title)}`);
  try {
    const pluginReport = await executePlugin(pluginCfg);
    progressBar?.incrementInSteps(steps);
    return pluginReport;
  } catch (error) {
    progressBar?.incrementInSteps(steps);
    throw new Error(
      error instanceof Error
        ? `- Plugin ${bold(pluginCfg.title)} (${bold(
            pluginCfg.slug,
          )}) produced the following error:\n  - ${error.message}`
        : String(error),
    );
  }
};

/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param plugins array of {@link PluginConfig} objects
 * @param {Object} [options] execution options
 * @param {boolean} options.progress show progress bar
 * @returns {Promise<PluginReport[]>} plugin report
 *
 * @example
 * // plugin execution
 * const plugins = [pluginConfigSchema.parse({...})];
 *
 * @example
 * // error handling
 * try {
 * await executePlugins(plugins);
 * } catch (e) {
 * console.error(e.message); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  plugins: PluginConfig[],
  options?: { progress?: boolean },
): Promise<PluginReport[]> {
  const { progress = false } = options ?? {};

  const progressBar = progress ? getProgressBar('Run plugins') : null;

  const pluginsResult = plugins.map(pluginCfg =>
    wrapProgress(pluginCfg, plugins.length, progressBar),
  );

  const errorsTransform = ({ reason }: PromiseRejectedResult) => String(reason);
  const results = await Promise.allSettled(pluginsResult);

  progressBar?.endProgress('Done running plugins');

  logMultipleResults(results, 'Plugins', undefined, errorsTransform);

  const { fulfilled, rejected } = groupByStatus(results);
  if (rejected.length > 0) {
    const errorMessages = rejected
      .map(({ reason }) => String(reason))
      .join('\n');
    throw new Error(
      `Executing ${pluralizeToken(
        'plugin',
        rejected.length,
      )} failed.\n\n${errorMessages}\n\n`,
    );
  }

  return fulfilled.map(result => result.value);
}

function auditOutputsCorrelateWithPluginOutput(
  auditOutputs: AuditOutputs,
  pluginConfigAudits: PluginConfig['audits'],
) {
  auditOutputs.forEach(auditOutput => {
    const auditMetadata = pluginConfigAudits.find(
      audit => audit.slug === auditOutput.slug,
    );
    if (!auditMetadata) {
      throw new PluginOutputMissingAuditError(auditOutput.slug);
    }
  });
}
