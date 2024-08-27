import { CreateNodes, CreateNodesContext, readJsonFile } from '@nx/devkit';
import { dirname, join } from 'node:path';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { PackageJson } from 'nx/src/utils/package-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts, context: CreateNodesContext) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile),
    );

    const isPublishable =
      projectConfiguration.tags?.includes('publishable') ||
      projectConfiguration?.targets?.['publish'] !== undefined;

    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: publishTargets(projectConfiguration, root),
        },
      },
    };
  },
];

function publishTargets(projectConfig: ProjectConfiguration, root: string) {
  const { name: projectName } = projectConfig;
  try {
    const { name: packageName } = readJsonFile<PackageJson>(
      join(root, 'package.json'),
    );
    return {
      publish: {
        command: `node tools/scripts/publish.mjs --name=${projectName} --ver={args.ver} --tag={args.tag}`,
        dependsOn: ['build'],
      },
      'npm-install': {
        command: `npm install -D ${packageName}@e2e`,
      },
      'npm-uninstall': {
        command: `npm uninstall ${packageName}`,
      },
    };
  } catch (error) {
    console.error(
      'Publishable projects need a package.json located in project root. Either create the file or remove the publishable tag from the project configuration.',
    );
    throw error;
  }
}
