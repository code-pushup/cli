import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Audit,
  AuditOutput,
  RunnerConfig,
  RunnerFilesPaths,
} from '@code-pushup/models';
import {
  createRunnerFiles,
  ensureDirectoryExists,
  filePathToCliArg,
  objectToCliArgs,
  readJsonFile,
} from '@code-pushup/utils';
import type { ESLintPluginRunnerConfig, ESLintTarget } from '../config.js';
import { lint } from './lint.js';
import { lintResultsToAudits, mergeLinterOutputs } from './transform.js';
import type { LinterOutput } from './types.js';

export async function executeRunner({
  runnerConfigPath,
  runnerOutputPath,
}: RunnerFilesPaths): Promise<void> {
  const { slugs, targets } =
    await readJsonFile<ESLintPluginRunnerConfig>(runnerConfigPath);

  const linterOutputs = await targets.reduce(
    async (acc, target) => [...(await acc), await lint(target)],
    Promise.resolve<LinterOutput[]>([]),
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
