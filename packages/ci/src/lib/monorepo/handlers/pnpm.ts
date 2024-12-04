import { join } from 'node:path';
import * as YAML from 'yaml';
import { fileExists, readTextFile } from '@code-pushup/utils';
import {
  hasCodePushUpDependency,
  hasScript,
  listPackages,
  readRootPackageJson,
} from '../packages.js';
import type { MonorepoToolHandler } from '../tools.js';

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

// https://pnpm.io/cli/recursive#--workspace-concurrency
const DEFAULT_WORKSPACE_CONCURRENCY = 4;

export const pnpmHandler: MonorepoToolHandler = {
  tool: 'pnpm',

  async isConfigured(options) {
    return (
      (await fileExists(join(options.cwd, WORKSPACE_FILE))) &&
      (await fileExists(join(options.cwd, 'package.json')))
    );
  },

  async listProjects(options) {
    const yaml = await readTextFile(join(options.cwd, WORKSPACE_FILE));
    const workspace = YAML.parse(yaml) as { packages?: string[] };
    const packages = await listPackages(options.cwd, workspace.packages);
    const rootPackageJson = await readRootPackageJson(options.cwd);
    return packages
      .filter(
        ({ packageJson }) =>
          hasScript(packageJson, options.task) ||
          hasCodePushUpDependency(packageJson) ||
          hasCodePushUpDependency(rootPackageJson),
      )
      .map(({ name, packageJson }) => ({
        name,
        bin: hasScript(packageJson, options.task)
          ? `pnpm --filter=${name} run ${options.task}`
          : `pnpm --filter=${name} exec ${options.task}`,
      }));
  },

  createRunManyCommand(options, onlyProjects) {
    const workspaceConcurrency: number =
      options.parallel === true
        ? DEFAULT_WORKSPACE_CONCURRENCY
        : options.parallel === false
          ? 1
          : options.parallel;
    return [
      'pnpm',
      '--recursive',
      `--workspace-concurrency=${workspaceConcurrency}`,
      ...(onlyProjects?.map(project => `--filter=${project}`) ?? []),
      'run',
      options.task,
    ].join(' ');
  },
};
