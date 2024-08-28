import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { getAllDependencies, someTargetsPresent } from '../utils';
import {
  START_VERDACCIO_ENV_TARGET_NAME,
  START_VERDACCIO_SERVER_TARGET_NAME,
} from './constants';
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
  async (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const {
      port = uniquePort(),
      config = '.verdaccio/config.yml',
      storage = 'tmp/local-registry/storage',
      preTargets = ['e2e'],
    } = (opts ?? {}) as CreateNodesOptions;
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

    return {
      projects: {
        [root]: {
          targets: await verdaccioTargets({
            port,
            config,
            storage,
            preTargets,
            packageName: projectConfiguration.name,
          }),
        },
      },
    };
  },
];

async function verdaccioTargets({
  port,
  config,
  storage,
  packageName,
}: Required<Omit<CreateNodesOptions, 'verbose'>> & { packageName: string }) {
  const dependencies: string[] = []; //await getAllDependencies(packageName);

  return {
    [START_VERDACCIO_SERVER_TARGET_NAME]: {
      executor: '@nx/js:verdaccio',
      options: {
        port,
        config,
        storage,
      },
    },
    [START_VERDACCIO_ENV_TARGET_NAME]: {
      command: 'tsx -tsconfig=tools/tsconfig.json tools/src/verdaccio/bin/',
      options: {
        port,
        config,
        storage,
      },
    },
    'publish-deps': {
      executor: 'nx:run-commands',
      options: {
        commands: [
          `npx nx run-many --t publish -p ${dependencies.join(
            ',',
          )} --exclude type:testing --parallel={args.parallel} --registry={args.registry} --userconfig={args.prefix}/.npmrc`,
        ],
      },
    },
    'install-deps': {
      executor: 'nx:run-commands',
      options: {
        commands: [
          `npx nx run-many --t npm-install -p ${dependencies.join(
            ',',
          )} --exclude type:testing --parallel={args.parallel} --prefix={args.prefix} --userconfig={args.prefix}/.npmrc`,
        ],
      },
    },
  };
}
