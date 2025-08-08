import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Audit,
  AuditOutput,
  PluginArtifactOptions,
  RunnerConfig,
  RunnerFilesPaths,
} from '@code-pushup/models';
import { pluginArtifactOptionsSchema } from '@code-pushup/models';
import {
  asyncSequential,
  createRunnerFiles,
  ensureDirectoryExists,
  filePathToCliArg,
  objectToCliArgs,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { ESLintPluginRunnerConfig, ESLintTarget } from '../config.js';
import { lint } from './lint.js';
import { lintResultsToAudits, mergeLinterOutputs } from './transform.js';

export async function executeRunner({
  runnerConfigPath,
  runnerOutputPath,
}: RunnerFilesPaths): Promise<void> {
  const { slugs, targets } =
    await readJsonFile<ESLintPluginRunnerConfig>(runnerConfigPath);

  ui().logger.log(`ESLint plugin executing ${targets.length} lint targets`);

  const linterOutputs = await asyncSequential(targets, lint);
  const lintResults = mergeLinterOutputs(linterOutputs);
  const failedAudits = lintResultsToAudits(lintResults);

  const audits = slugs.map(
    (slug): AuditOutput =>
      failedAudits.find(audit => audit.slug === slug) ?? {
        slug,
        score: 1,
        value: 0,
        displayValue: 'passed',
        details: { issues: [] },
      },
  );

  await ensureDirectoryExists(path.dirname(runnerOutputPath));
  await writeFile(runnerOutputPath, JSON.stringify(audits));
}

export async function createRunnerConfig(
  scriptPath: string,
  audits: Audit[],
  targets: ESLintTarget[],
  artifactOptions?: PluginArtifactOptions,
): Promise<RunnerConfig> {
  const parsedOptions = artifactOptions
    ? pluginArtifactOptionsSchema.parse(artifactOptions)
    : undefined;

  const config: ESLintPluginRunnerConfig = {
    targets,
    slugs: audits.map(a => a.slug),
  };

  const { runnerConfigPath, runnerOutputPath } = parsedOptions
    ? await createCustomRunnerPaths(parsedOptions, config)
    : await createRunnerFiles('eslint', JSON.stringify(config));

  const args = [
    filePathToCliArg(scriptPath),
    ...objectToCliArgs({ runnerConfigPath, runnerOutputPath }),
    ...resolveCommandArgs(parsedOptions?.generateArtifactsCommand),
  ];

  return {
    command: 'node',
    args,
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
  };
}

async function createCustomRunnerPaths(
  options: PluginArtifactOptions,
  config: ESLintPluginRunnerConfig,
): Promise<RunnerFilesPaths> {
  const artifactPaths = Array.isArray(options.artifactsPaths)
    ? options.artifactsPaths
    : [options.artifactsPaths];

  const runnerOutputPath = artifactPaths[0] ?? '';
  const runnerConfigPath = path.join(
    path.dirname(runnerOutputPath),
    'plugin-config.json',
  );

  await ensureDirectoryExists(path.dirname(runnerConfigPath));
  await writeFile(runnerConfigPath, JSON.stringify(config));

  return { runnerConfigPath, runnerOutputPath };
}

function resolveCommandArgs(
  command?: string | { command: string; args?: string[] },
): string[] {
  if (!command) return [];
  return typeof command === 'string'
    ? [command]
    : [command.command, ...(command.args ?? [])];
}
