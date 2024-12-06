import { join } from 'node:path';
import { fileExists } from '@code-pushup/utils';
import {
  hasCodePushUpDependency,
  hasScript,
  hasWorkspacesEnabled,
  listWorkspaces,
} from '../packages.js';
import type { MonorepoToolHandler } from '../tools.js';

export const npmHandler: MonorepoToolHandler = {
  tool: 'npm',

  async isConfigured(options) {
    return (
      (await fileExists(join(options.cwd, 'package-lock.json'))) &&
      (await hasWorkspacesEnabled(options.cwd))
    );
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
