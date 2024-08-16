import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

type CreateNodesOptions = {
  port?: string | number;
  config?: string;
  storage?: string;
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
      port = 4873,
      config = '.verdaccio/config.yml',
      storage = 'tmp/local-registry/storage',
    } = (opts ?? {}) as CreateNodesOptions;
    const isE2eTarget = Boolean(projectConfiguration?.targets?.e2e);
    if (!isE2eTarget) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: verdaccioTargets({ port, config, storage }),
        },
      },
    };
  },
];

function verdaccioTargets({
  port,
  config,
  storage,
}: Required<CreateNodesOptions>) {
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
