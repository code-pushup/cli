import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

type CreateNodesOptions = {
  port?: string | number;
  config?: string;
  storage?: string;
  verbose?: boolean;
};

export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const { workspaceRoot } = context;
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    // @TODO in the future the root project has no verdaccio target anymore. only e2e projects have.
    const isRootProject = root === '.';
    if (!isRootProject) {
      return {};
    }

    /*
    // @TODO we want to move verdaccio targets into every project that has a e2e target
    const isE2eTarget = Boolean(projectConfiguration?.targets?.e2e);
    if (!isE2eTarget) {
      return {};
    }
     */

    const {
      port = 4873,
      config = '.verdaccio/config.yml',
      storage = 'tmp/local-registry/storage',
    } = (opts ?? {}) as CreateNodesOptions;

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
    'post-e2e': {
      dependsOn: [{ projects: 'self', target: 'e2e' }],
    },
  };
}
