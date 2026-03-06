import {
  MONOREPO_TOOL_DETECTORS,
  hasCodePushUpDependency,
  hasScript,
  listWorkspaces,
} from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';

export const npmHandler: MonorepoToolHandler = {
  tool: 'npm',

  async isConfigured(options) {
    return MONOREPO_TOOL_DETECTORS.npm(options.cwd);
  },

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
          ? `npm run ${options.task} --`
          : `npm exec ${options.task} --`,
      }));
  },

  createRunManyCommand(options) {
    // neither parallel execution nor projects filter are supported in NPM workspaces
    return `npm run ${options.task} --workspaces --if-present --`;
  },
};
