import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  PersistConfig,
  PluginArtifactOptions,
  RunnerConfig,
  RunnerFilesPaths,
  RunnerFunction,
} from '@code-pushup/models';
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
import { loadArtifacts } from './utils';

export async function executeRunner({
  runnerConfigPath,
  runnerOutputPath,
  persistOutputDir,
}: RunnerFilesPaths & { persistOutputDir: string }): Promise<void> {
  const { slugs, targets } =
    await readJsonFile<ESLintPluginRunnerConfig>(runnerConfigPath);

  ui().logger.log(`ESLint plugin executing ${targets.length} lint targets`);

  const linterOutputs = await asyncSequential(
    targets.map(target => ({
      ...target,
      outputDir: persistOutputDir,
    })),
    lint,
  );
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
): Promise<RunnerConfig> {
  const config: ESLintPluginRunnerConfig = {
    targets,
    slugs: audits.map(audit => audit.slug),
  };
  const { runnerConfigPath, runnerOutputPath } = await createRunnerFiles(
    'eslint',
    JSON.stringify(config),
  );

  return {
    command: 'node',
    args: [
      filePathToCliArg(scriptPath),
      ...objectToCliArgs({ runnerConfigPath, runnerOutputPath }),
    ],
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
  };
}

export async function createRunnerFunction(options: {
  audits: Audit[];
  targets: ESLintTarget[];
  artifacts?: PluginArtifactOptions;
}): Promise<RunnerFunction> {
  const { audits, targets, artifacts } = options;
  const config: ESLintPluginRunnerConfig = {
    targets,
    slugs: audits.map(audit => audit.slug),
  };

  return async ({ outputDir }: PersistConfig): Promise<AuditOutputs> => {
    ui().logger.log(`ESLint plugin executing ${targets.length} lint targets`);

    const linterOutputs = artifacts
      ? await loadArtifacts(artifacts)
      : await asyncSequential(
          targets.map(target => ({
            ...target,
            outputDir,
          })),
          lint,
        );
    const lintResults = mergeLinterOutputs(linterOutputs);
    const failedAudits = lintResultsToAudits(lintResults);

    return config.slugs.map(
      (slug): AuditOutput =>
        failedAudits.find(audit => audit.slug === slug) ?? {
          slug,
          score: 1,
          value: 0,
          displayValue: 'passed',
          details: { issues: [] },
        },
    );
  };
}
