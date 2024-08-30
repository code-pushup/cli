import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { bold } from 'ansis';
import { dirname } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { someTargetsPresent } from '../utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './constants';
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

    const hasPreVerdaccioTargets = someTargetsPresent(
      projectConfiguration.targets ?? {},
      preTargets,
    );
    const isRootProject = root === '.';
    if (!hasPreVerdaccioTargets && !isRootProject) {
      return {};
    }

    if (!projectConfiguration.implicitDependencies && !isRootProject) {
      throw new Error(
        `You have to specify the needed projects as implicitDependencies in ${bold(
          projectConfiguration.name,
        )} to have them set up.`,
      );
    }

    return {
      projects: {
        [root]: {
          targets: verdaccioTargets({
            port,
            config,
            storage,
            preTargets,
            deps: projectConfiguration.implicitDependencies,
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
  deps,
}: Required<Omit<CreateNodesOptions, 'verbose'>> & { deps: string[] }) {
  return {
    [START_VERDACCIO_SERVER_TARGET_NAME]: {
      executor: '@nx/js:verdaccio',
      options: {
        port,
        config,
        storage,
      },
    },
    ['setup-deps']: {
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx run-many -t publish -p ${deps?.join(',')}`,
          `nx run-many -t npm-install -p ${deps?.join(',')} --parallel=1`,
        ],
        parallel: false,
      },
    },
  };
}
