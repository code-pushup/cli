import {
  Tree,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ui } from '@code-pushup/utils';
import { AddToProjectGeneratorSchema } from './schema';

export async function addToProjectGenerator(
  tree: Tree,
  options: AddToProjectGeneratorSchema,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { root, targets } = projectConfiguration;

  const supportedFormats = ['ts', 'mjs', 'js'];
  const firstExistingFormat = supportedFormats.find(ext =>
    tree.exists(join(root, `code-pushup.config.${ext}`)),
  );
  if (firstExistingFormat) {
    logger.warn(
      `NOTE: No config file created as code-pushup.config.${firstExistingFormat} file already exists.`,
    );
    return;
  }

  generateFiles(
    tree,
    join(fileURLToPath(dirname(import.meta.url)), 'files'),
    root,
    options,
  );

  updateProjectConfiguration(tree, options.project, {
    ...projectConfiguration,
    targets: {
      ...targets,
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
