import {
  executeProcess,
  hasCodePushUpDependency,
  hasScript,
  listWorkspaces,
} from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';

export const yarnHandler: MonorepoToolHandler = {
  tool: 'yarn',

  async listProjects(options) {
    const { workspaces, rootPackageJson } = await listWorkspaces(options.cwd);
    return workspaces
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
          ? `yarn run ${options.task}`
          : `yarn exec ${options.task}`,
      }));
  },

  async createRunManyCommand(options, projects) {
    const { stdout } = await executeProcess({ command: 'yarn', args: ['-v'] });
    const isV1 = stdout.startsWith('1.');

    if (isV1) {
      // neither parallel execution nor projects filter are supported in Yarn v1
      return `yarn workspaces run ${options.task}`;
    }

    return [
      'yarn',
      'workspaces',
      'foreach',
      ...(options.parallel ? ['--parallel'] : []),
      ...(typeof options.parallel === 'number'
        ? [`--jobs=${options.parallel}`]
        : []),
      ...(projects.only?.map(project => `--include=${project}`) ?? ['--all']),
      options.task,
    ].join(' ');
  },
};
