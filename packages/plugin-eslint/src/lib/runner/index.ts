import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Audit, AuditOutput, RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  pluginWorkDir,
  readJsonFile,
  toArray,
} from '@code-pushup/utils';
import { ESLintPluginRunnerConfig } from '../config';
import { lint } from './lint';
import { lintResultsToAudits } from './transform';

export const WORKDIR = pluginWorkDir('eslint');
export const RUNNER_OUTPUT_PATH = join(WORKDIR, 'runner-output.json');
export const ESLINTRC_PATH = join(process.cwd(), WORKDIR, '.eslintrc.json');
export const PLUGIN_CONFIG_PATH = join(
  process.cwd(),
  WORKDIR,
  'plugin-config.json',
);

export async function executeRunner(): Promise<void> {
  const { slugs, eslintrc, patterns } =
    await readJsonFile<ESLintPluginRunnerConfig>(PLUGIN_CONFIG_PATH);

  const lintResults = await lint({
    // if file created from inline object, provide inline to preserve relative links
    eslintrc:
      eslintrc === ESLINTRC_PATH ? await readJsonFile(eslintrc) : eslintrc,
    patterns,
  });
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
  eslintrc: string,
  patterns: string | string[],
): Promise<RunnerConfig> {
  const config: ESLintPluginRunnerConfig = {
    eslintrc,
    slugs: audits.map(audit => audit.slug),
    patterns: toArray(patterns),
  };
  await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [scriptPath],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}
