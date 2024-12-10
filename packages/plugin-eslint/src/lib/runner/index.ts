import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Audit, AuditOutput, RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  filePathToCliArg,
  pluginWorkDir,
  readJsonFile,
} from '@code-pushup/utils';
import type { ESLintPluginRunnerConfig, ESLintTarget } from '../config.js';
import { lint } from './lint.js';
import { lintResultsToAudits, mergeLinterOutputs } from './transform.js';
import type { LinterOutput } from './types.js';

export const WORKDIR = pluginWorkDir('eslint');
export const RUNNER_OUTPUT_PATH = join(WORKDIR, 'runner-output.json');
export const PLUGIN_CONFIG_PATH = join(
  process.cwd(),
  WORKDIR,
  'plugin-config.json',
);

export async function executeRunner(): Promise<void> {
  const { slugs, targets } =
    await readJsonFile<ESLintPluginRunnerConfig>(PLUGIN_CONFIG_PATH);

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

  await ensureDirectoryExists(dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(audits));
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
  await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [filePathToCliArg(scriptPath)],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}
