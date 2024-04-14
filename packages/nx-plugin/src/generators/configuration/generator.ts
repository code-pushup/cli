import {
  Tree,
  formatFiles,
  generateFiles,
  logger,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import { join } from 'node:path';
import { ConfigurationGeneratorSchema } from './schema';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorSchema,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { root, targets } = projectConfiguration;

  const supportedFormats = ['ts', 'mjs', 'js'];
  const firstExistingFormat = supportedFormats
    .map(ext =>
      tree.exists(join(root, `code-pushup.config.${ext}`)) ? ext : false,
    )
    .filter(Boolean)
    .at(0);
  if (firstExistingFormat) {
    logger.warn(
      `NOTE: No config file created as code-pushup.config.${firstExistingFormat} file already exists.`,
    );
    return;
  }

  generateFiles(tree, join(__dirname, 'files'), root, options);

  // @TODO remove when implementing https://github.com/code-pushup/cli/issues/619
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

export default configurationGenerator;
