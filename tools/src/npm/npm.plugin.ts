import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

type CreateNodesOptions = {
  tsconfig?: string;
  npmCheckScript?: string;
};
export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );
    const {
      tsconfig = 'tools/tsconfig.tools.json',
      npmCheckScript = 'tools/src/npm/scripts/check-package-range.ts',
    } = (opts ?? {}) as CreateNodesOptions;

    const isPublishable = Boolean(projectConfiguration?.targets?.publish);
    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: npmTargets({ root, tsconfig, npmCheckScript }),
        },
      },
    };
  },
];

function npmTargets({
  root,
  tsconfig,
  npmCheckScript,
}: Required<CreateNodesOptions> & { root: string }) {
  const { name: packageName } = readJsonFile(join(root, 'package.json'));
  return {
    'npm-check': {
      command: `tsx --tsconfig={args.tsconfig} {args.script} --pkgRange=${packageName}@{args.pkgVersion} --registry={args.registry}`,
      options: {
        script: npmCheckScript,
        tsconfig,
      },
    },
    'npm-install': {
      command: `npm install -D ${packageName}@{args.pkgVersion} --registry={args.registry}`,
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
