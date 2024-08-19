import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { uniquePort } from './utils';

type CreateNodesOptions = {
  port?: string | number;
  config?: string;
  storage?: string;
  preTargets?: string | string[];
  verbose?: boolean;
};

export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const {
      port = uniquePort(),
      config = '.verdaccio/config.yml',
      storage = 'tmp/local-registry/storage',
      verbose = false,
      preTargets = ['e2e'],
    } = (opts ?? {}) as CreateNodesOptions;
    const { workspaceRoot } = context;
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    const isRootProject = root === '.';
    if (!isRootProject) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: verdaccioTargets({
            port,
            config,
            storage,
            preTargets,
          }),
        },
      },
    };
  },
];

function verdaccioTargets({
  port,
  config,
  storage,
  preTargets,
}: Required<Omit<CreateNodesOptions, 'verbose'>>) {
  const targets = Array.isArray(preTargets) ? preTargets : [preTargets];
  return {
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        port,
        config,
        storage,
      },
    },
  };
}
