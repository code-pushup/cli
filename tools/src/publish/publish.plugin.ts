import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { someTargetsPresent } from '../utils';
import { BUMP_SCRIPT, LOGIN_CHECK_SCRIPT, PUBLISH_SCRIPT } from './constants';

type CreateNodesOptions = {
  tsconfig?: string;
  publishableTargets?: string | string[];
  publishScript?: string;
  bumpScript?: string;
  directory?: string;
  verbose?: boolean;
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
      publishableTargets = ['publishable'],
      tsconfig = 'tools/tsconfig.tools.json',
      publishScript = PUBLISH_SCRIPT,
      bumpScript = BUMP_SCRIPT,
      directory = projectConfiguration?.targets?.build?.options?.outputPath ??
        process.cwd(),
      verbose = false,
    } = (opts ?? {}) as CreateNodesOptions;
    const isPublishable = someTargetsPresent(
      projectConfiguration?.targets ?? {},
      publishableTargets,
    );
    if (!isPublishable) {
      return {};
    }

    const { name: projectName } = projectConfiguration;
    return {
      projects: {
        [root]: {
          targets: publishTargets({
            tsconfig,
            publishScript,
            bumpScript,
            directory,
            projectName,
            verbose,
          }),
        },
      },
    };
  },
];

function publishTargets({
  tsconfig,
  publishScript,
  bumpScript,
  directory,
  projectName,
  verbose,
}: Required<Omit<CreateNodesOptions, 'publishableTargets'>> & {
  projectName: string;
}) {
  return {
    publish: {
      dependsOn: ['build'],
      // @TODO use objToCliArgs
      command: `tsx --tsconfig={args.tsconfig} {args.script} --name=${projectName} --directory=${directory} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag} --verbose=${verbose}`,
      options: {
        script: publishScript,
        tsconfig,
      },
    },
    'bump-version': {
      dependsOn: ['build'],
      command: `tsx --tsconfig={args.tsconfig} {args.script} --directory=${directory} --nextVersion={args.nextVersion} --verbose=${verbose}`,
      options: {
        script: bumpScript,
        tsconfig,
      },
    },
  };
}
