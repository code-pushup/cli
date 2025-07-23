import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Audit,
  AuditOutput,
  RunnerConfig,
  RunnerFilesPaths,
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

export async function executeRunner(
  { runnerConfigPath, runnerOutputPath }: RunnerFilesPaths,
  opt?: { cwd?: string },
): Promise<void> {
  const { cwd = process.cwd() } = opt || {};
  const { slugs, targets } =
    await readJsonFile<ESLintPluginRunnerConfig>(runnerConfigPath);

  ui().logger.log(
    `ESLint plugin executing ${targets.length} lint targets with cwd: ${cwd}`,
  );

  const linterOutputs = await asyncSequential(targets, cfg => lint(cfg, opt));
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
  opt?: { cwd?: string },
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
      ...objectToCliArgs({
        runnerConfigPath,
        runnerOutputPath,
        ...(opt?.cwd ? { cwd: opt.cwd } : {}),
      }),
    ],
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
  };
}
