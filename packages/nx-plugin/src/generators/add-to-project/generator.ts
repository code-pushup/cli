import {
  Tree,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { AddToProjectGeneratorSchema } from './schema';

export async function addToProjectGenerator(
  tree: Tree,
  options: AddToProjectGeneratorSchema,
) {
  const { root } = readProjectConfiguration(tree, options.project);

  if (tree.exists(path.join(root, 'code-pushup.config.json'))) {
    console.log('Code PushUp already configured for this project');
    return;
  }

  generateFiles(tree, path.join(__dirname, 'files'), root, options);

  // @TODO add target for executing code-pushup with the right config

  await formatFiles(tree);
}

export default addToProjectGenerator;
