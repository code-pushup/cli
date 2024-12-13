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
      .map(({ name, directory, packageJson }) => ({
        name,
        directory,
        bin: hasScript(packageJson, options.task)
          ? `pnpm run ${options.task}`
          : `pnpm exec ${options.task}`,
      }));
  },

  createRunManyCommand(options, projects) {
    // https://pnpm.io/cli/recursive#--workspace-concurrency
    const workspaceConcurrency: number | null =
      options.parallel === true
        ? null
        : options.parallel === false
          ? 1
          : options.parallel;
    return [
      'pnpm',
      '--recursive',
      ...(workspaceConcurrency == null
        ? []
        : [`--workspace-concurrency=${workspaceConcurrency}`]),
      ...(projects.only?.map(project => `--filter=${project}`) ?? []),
      options.task,
    ].join(' ');
  },
};
