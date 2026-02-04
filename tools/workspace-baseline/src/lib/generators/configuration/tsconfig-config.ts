import { type Tree, generateFiles, logger } from '@nx/devkit';
import * as path from 'node:path';

export type GenerateTsConfigOptions = {
  targetName: string;
  projectRoot?: string;
};

export function generateTsConfig(
  tree: Tree,
  root: string,
  options: GenerateTsConfigOptions,
) {
  const { targetName, projectRoot = root } = options;
  const tsconfigFileName = `tsconfig.${targetName}.json`;
  const tsconfigPath = path.join(projectRoot, tsconfigFileName);

  if (tree.exists(tsconfigPath)) {
    logger.warn(
      `No config file created as ${tsconfigFileName} already exists.`,
    );
    return;
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    targetName,
  });
}
