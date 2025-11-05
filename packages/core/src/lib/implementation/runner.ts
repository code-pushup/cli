import { bold } from 'ansis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type AuditOutputs,
  type PluginConfig,
  type RunnerArgs,
  type RunnerConfig,
  type RunnerFunction,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  calcDuration,
  ensureDirectoryExists,
  executeProcess,
  fileExists,
  readJsonFile,
  removeDirectoryIfExists,
  runnerArgsToEnv,
} from '@code-pushup/utils';
import { normalizeAuditOutputs } from '../normalize.js';

export type RunnerResult = {
  date: string;
  duration: number;
  audits: AuditOutputs;
};

export async function executeRunnerConfig(
  config: RunnerConfig,
  args: RunnerArgs,
): Promise<unknown> {
  const { outputFile, outputTransform } = config;

  await executeProcess({
    command: config.command,
    args: config.args,
    env: { ...process.env, ...runnerArgsToEnv(args) },
  });

  // read process output from the file system and parse it
  const outputs = await readJsonFile(outputFile);
  // clean up plugin individual runner output directory
  await removeDirectoryIfExists(path.dirname(outputFile));

  // transform unknownAuditOutputs to auditOutputs
  const audits = outputTransform ? await outputTransform(outputs) : outputs;

  return audits;
}

export async function executeRunnerFunction(
  runner: RunnerFunction,
  args: RunnerArgs,
): Promise<unknown> {
  // execute plugin runner
  const audits = await runner(args);
  return audits;
}

/**
 * Error thrown when plugin output is invalid.
 */
export class AuditOutputsMissingAuditError extends Error {
  constructor(auditSlug: string) {
    super(
      `Audit metadata not present in plugin config. Missing slug: ${bold(
        auditSlug,
      )}`,
    );
  }
}

export async function executePluginRunner(
  pluginConfig: Pick<PluginConfig, 'audits' | 'runner'>,
  args: RunnerArgs,
): Promise<RunnerResult> {
  const { audits: pluginConfigAudits, runner } = pluginConfig;

  const date = new Date().toISOString();
  const start = performance.now();

  const unvalidatedAuditOutputs =
    typeof runner === 'object'
      ? await executeRunnerConfig(runner, args)
      : await executeRunnerFunction(runner, args);

  const duration = calcDuration(start);

  const result = auditOutputsSchema.safeParse(unvalidatedAuditOutputs);
  if (!result.success) {
    throw new Error(`Audit output is invalid: ${result.error.message}`);
  }
  const auditOutputs = result.data;
  auditOutputsCorrelateWithPluginOutput(auditOutputs, pluginConfigAudits);

  return {
    date,
    duration,
    audits: await normalizeAuditOutputs(auditOutputs),
  };
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
      throw new AuditOutputsMissingAuditError(auditOutput.slug);
    }
  });
}

export function getRunnerOutputsPath(pluginSlug: string, outputDir: string) {
  return path.join(outputDir, pluginSlug, 'runner-output.json');
}

/**
 * Save audit outputs to a file to be able to cache the results
 * @param auditOutputs
 * @param pluginSlug
 * @param outputDir
 */
export async function writeRunnerResults(
  pluginSlug: string,
  outputDir: string,
  runnerResult: RunnerResult,
): Promise<void> {
  const cacheFilePath = getRunnerOutputsPath(pluginSlug, outputDir);
  await ensureDirectoryExists(path.dirname(cacheFilePath));
  await writeFile(cacheFilePath, JSON.stringify(runnerResult.audits, null, 2));
}

export async function readRunnerResults(
  pluginSlug: string,
  outputDir: string,
): Promise<RunnerResult | null> {
  const auditOutputsPath = getRunnerOutputsPath(pluginSlug, outputDir);
  if (await fileExists(auditOutputsPath)) {
    const cachedResult = await readJsonFile<AuditOutputs>(auditOutputsPath);

    return {
      audits: cachedResult,
      duration: 0,
      date: new Date().toISOString(),
    };
  }
  return null;
}
