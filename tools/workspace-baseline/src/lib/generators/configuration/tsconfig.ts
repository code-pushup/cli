import type { Tree } from '@nx/devkit';
import * as path from 'node:path';

export function getFirstExistingTsConfig(
  tree: Tree,
  projectRoot: string,
  options?: {
    tsconfigType?: string | string[];
  },
): string | undefined {
  const { tsconfigType = ['lib'] } = options ?? {};
  const supportedTypeNames = [
    ...new Set([
      ...(Array.isArray(tsconfigType) ? tsconfigType : [tsconfigType]),
      'lib',
      'none',
    ]),
  ];
  const existingType = supportedTypeNames.find(type =>
    tree.exists(
      path.join(
        projectRoot,
        type === 'none' ? `tsconfig.json` : `tsconfig.${type}.json`,
      ),
    ),
  );
  return existingType
    ? path.join(
        projectRoot,
        existingType === 'none'
          ? `tsconfig.json`
          : `tsconfig.${existingType}.json`,
      )
    : undefined;
}
