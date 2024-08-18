import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { PUBLISH_SCRIPT } from './constants';

type CreateNodesOptions = {
  tsconfig?: string;
  publishableTargets?: string;
  publishScript?: string;
  sourceDir?: string;
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
      publishableTargets = 'publishable',
      tsconfig = 'tools/tsconfig.tools.json',
      publishScript = PUBLISH_SCRIPT,
      sourceDir = projectConfiguration?.targets?.build?.options?.outputPath ??
        process.cwd(),
      verbose = false,
    } = (opts ?? {}) as CreateNodesOptions;
    const isPublishable = Boolean(
      projectConfiguration?.targets[publishableTargets],
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
            sourceDir,
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
  sourceDir,
  projectName,
  verbose,
}: Required<Omit<CreateNodesOptions, 'publishableTargets'>> & {
  projectName: string;
}) {
  return {
    publish: {
      dependsOn: ['build'],
      // @TODO use objToCliArgs
      command: `tsx --tsconfig={args.tsconfig} {args.script} --name=${projectName} --sourceDir=${sourceDir} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag} --verbose=${verbose}`,
      options: {
        script: publishScript,
        tsconfig,
      },
    },
  };
}
