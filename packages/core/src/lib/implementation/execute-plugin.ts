import chalk from 'chalk';
import {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  OnProgress,
  PluginConfig,
  PluginReport,
  auditOutputsSchema,
} from '@code-pushup/models';
import { getProgressBar, logMultipleResults } from '@code-pushup/utils';
import { executeRunnerConfig, executeRunnerFunction } from './runner';

type ExecutePluginResult = PluginReport | string;

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputMissingAuditError extends Error {
  constructor(auditSlug: string) {
    super(`Audit metadata not found for slug ${auditSlug}`);
  }
}

/**
 * Execute a plugin.
 *
 * @public
 * @param pluginConfig - {@link ProcessConfig} object with runner and meta
 * @param onProgress - progress handler {@link OnProgress}
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
 *  console.log(e.message);
 *  }
 */
export async function executePlugin(
  pluginConfig: PluginConfig,
  onProgress?: OnProgress,
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
      ? await executeRunnerConfig(runner, onProgress)
      : await executeRunnerFunction(runner, onProgress);
  const { audits: unvalidatedAuditOutputs, ...executionMeta } = runnerResult;

  // validate auditOutputs
  const auditOutputs = auditOutputsSchema.parse(unvalidatedAuditOutputs);
  auditOutputsCorrelateWithPluginOutput(auditOutputs, pluginConfigAudits);

  // enrich `AuditOutputs` to `AuditReport`
  const auditReports: AuditReport[] = auditOutputs.map(
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
  } satisfies PluginReport;
}

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
 * console.log(e.message); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  plugins: PluginConfig[],
  options?: { progress: boolean },
): Promise<PluginReport[]> {
  const { progress = false } = options || {};

  const progressName = 'Run Plugins';
  const progressBar = progress ? getProgressBar(progressName) : null;

  const pluginsResult = await plugins.reduce(async (acc, pluginCfg) => {
    const outputs = await acc;

    progressBar?.updateTitle(`Executing  ${chalk.bold(pluginCfg.title)}`);

    try {
      const pluginReport = await executePlugin(pluginCfg);
      progressBar?.incrementInSteps(plugins.length);
      return outputs.concat(Promise.resolve(pluginReport));
    } catch (e: unknown) {
      progressBar?.incrementInSteps(plugins.length);
      return outputs.concat(
        Promise.reject(e instanceof Error ? e.message : String(e)),
      );
    }
  }, Promise.resolve([] as Promise<ExecutePluginResult>[]));

  progressBar?.endProgress('Done running plugins');

  const errorsCallback = ({ reason }: PromiseRejectedResult) =>
    console.error(reason);
  const results = await Promise.allSettled(pluginsResult);

  logMultipleResults(results, 'Plugins', undefined, errorsCallback);

  // TODO: add groupBy method for promiseSettledResult by status, #287

  const failedResults = results.filter(
    (
      result: PromiseSettledResult<ExecutePluginResult>,
    ): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (failedResults.length) {
    const errorMessages = failedResults
      .map(({ reason }: PromiseRejectedResult) => reason)
      .join(', ');
    throw new Error(
      `Plugins failed: ${failedResults.length} errors: ${errorMessages}`,
    );
  }

  return results
    .filter(
      (
        result: PromiseSettledResult<ExecutePluginResult>,
      ): result is PromiseFulfilledResult<PluginReport> =>
        result.status === 'fulfilled',
    )
    .map((result: PromiseFulfilledResult<PluginReport>) => result.value);
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
