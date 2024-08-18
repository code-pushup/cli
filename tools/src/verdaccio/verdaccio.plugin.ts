import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { uniquePort } from './utils';

type CreateNodesOptions = {
  // @TODO move into target options
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

    // @TODO in the future the root project has no verdaccio target anymore. only e2e projects have.
    const isRootProject = root === '.';
    if (!isRootProject) {
      return {};
    }

    /*
    // @TODO we want to move verdaccio targets into every project that has a e2e target
    const hasPreVerdaccioTargets = someTargetsPresent(projectConfiguration?.targets ?? {}, preTargets);
    if (!hasPreVerdaccioTargets) {
      return {};
    }
    */

    return {
      projects: {
        [root]: {
          targets: verdaccioTargets({
            port,
            config,
            storage,
            verbose,
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
}: Required<CreateNodesOptions>) {
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
    'post-registry': {
      dependsOn: [
        ...targets.map(target => ({
          projects: 'self',
          target,
        })),
      ],
      command: `echo POST E2E - stop verdaccio on port ${port}`,
    },
  };
}
