import { CreateNodes, CreateNodesContext, readJsonFile } from '@nx/devkit';
import { dirname, join } from 'node:path';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts, context: CreateNodesContext) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    const isPublishable = Boolean(projectConfiguration?.targets?.publish);

    return {
      projects: {
        [root]: {
          ...projectConfiguration,
          targets: {
            ...projectConfiguration.targets,
            ...(isPublishable
              ? publishTargets(projectConfiguration, root)
              : {}),
          },
        },
      },
    };
  },
];

function publishTargets(projectConfig: ProjectConfiguration, root: string) {
  const { name: projectName } = projectConfig;
  const { name: packageName } = readJsonFile(join(root, 'package.json'));
  return {
    publish: {
      dependsOn: ['build'],
      command: `node tools/scripts/publish.mjs --name=${projectName} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag}`,
    },
    'npm-check': {
      command: `node ./tools/scripts/check-package-range.mjs --pkgVersion={args.pkgVersion} --registry={args.registry}`,
    },
    'npm-install': {
      command: `npm install -D ${packageName}@{args.pkgVersion}`,
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
