import {
  hasCodePushUpDependency,
  hasScript,
  listPackages,
  readPnpmWorkspacePatterns,
  readRootPackageJson,
} from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';

export const pnpmHandler: MonorepoToolHandler = {
  tool: 'pnpm',

  async listProjects(options) {
    const patterns = await readPnpmWorkspacePatterns(options.cwd);
    const packages = await listPackages(options.cwd, patterns);
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
