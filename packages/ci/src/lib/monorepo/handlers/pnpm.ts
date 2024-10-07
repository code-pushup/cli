import { join } from 'node:path';
import * as YAML from 'yaml';
import { fileExists, readTextFile } from '@code-pushup/utils';
import {
  hasCodePushUpDependency,
  hasScript,
  listPackages,
  readRootPackageJson,
} from '../packages';
import type { MonorepoToolHandler } from '../tools';

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
      .map(({ name, packageJson }) => ({
        name,
        bin: hasScript(packageJson, options.task)
          ? `pnpm -F ${name} run ${options.task}`
          : `pnpm -F ${name} exec ${options.task}`,
      }));
  },
};
