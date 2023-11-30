import {
  Tree,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { join } from 'path';
import { AddToProjectGeneratorSchema } from './schema';

export async function addToProjectGenerator(
  tree: Tree,
  options: AddToProjectGeneratorSchema,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { root } = projectConfiguration;

  if (tree.exists(path.join(root, 'code-pushup.config.ts'))) {
    console.info('Code PushUp already configured for this project');
    return;
  }

  generateFiles(tree, path.join(__dirname, 'files'), root, options);

  updateProjectConfiguration(tree, options.project, {
    ...projectConfiguration,
    targets: {
      ...projectConfiguration.targets,
      'code-pushup': {
        executor: 'nx:run-commands',
        options: {
          command: `code-pushup autorun --no-progress --config=${join(
            './',
            root,
            'code-pushup.config.ts',
          )}`,
        },
      },
    },
  });

  await formatFiles(tree);
}

export default addToProjectGenerator;
