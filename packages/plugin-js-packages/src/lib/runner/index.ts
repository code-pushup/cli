import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { AuditOutput, RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';
import {
  FinalJSPackagesPluginConfig,
  PackageDependency,
  packageDependencies,
} from '../config';
import { auditResultToAuditOutput } from './audit/transform';
import { NpmAuditResultJson } from './audit/types';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';

export async function executeRunner(): Promise<void> {
  const outputPath = join(
    process.cwd(),
    'node_modules',
    '.code-pushup',
    'js-packages',
  );

  const { packageManager, checks, auditLevelMapping } =
    await readJsonFile<FinalJSPackagesPluginConfig>(PLUGIN_CONFIG_PATH);

  const results = await Promise.allSettled(
    checks.flatMap(check =>
      packageDependencies.map<Promise<AuditOutput>>(async dep => {
        await executeProcess({
          command: 'npm',
          args: [
            check,
            ...createAuditFlags(dep),
            '--json',
            '--audit-level=none',
            '>',
            join(outputPath, `${packageManager}-${check}-${dep}.json`),
          ],
        });

        const auditResult = await readJsonFile<NpmAuditResultJson>(
          join(outputPath, `${packageManager}-${check}-${dep}.json`),
        );
        return auditResultToAuditOutput(auditResult, dep, auditLevelMapping);
      }),
    ),
  );
  const auditOutputs = results
    .filter(
      (x): x is PromiseFulfilledResult<AuditOutput> => x.status === 'fulfilled',
    )
    .map(x => x.value);

  await ensureDirectoryExists(dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(auditOutputs));
}

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalJSPackagesPluginConfig,
): Promise<RunnerConfig> {
  await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [scriptPath],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}

function createAuditFlags(currentDep: PackageDependency) {
  if (currentDep === 'optional') {
    return packageDependencies.map(dep => `--include=${dep}`);
  }

  return [
    `--include${currentDep}`,
    ...packageDependencies
      .filter(dep => dep !== currentDep)
      .map(dep => `--omit=${dep}`),
  ];
}
