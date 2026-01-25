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

export type PluginDefinition = {
  transform: string;
  afterDeclarations: boolean;
  baseUrl: string;
};
export type TsConfig = {
  compilerOptions: {
    plugins: PluginDefinition[];
  };
};

export function addZod2MdTransformToTsConfig(
  tree: Tree,
  root: string,
  options: {
    projectName: string;
    tsconfigType?: string;
    baseUrl: string;
  },
) {
  const { tsconfigType, projectName, baseUrl } = options;
  const firstExistingTsc = getFirstExistingTsConfig(tree, root, {
    tsconfigType,
  });
  if (!firstExistingTsc) {
    throw new Error(`No config tsconfig.json file exists.`);
  }

  const tscJson = JSON.parse(tree.read(firstExistingTsc)?.toString() ?? `{}`);
  const compilerOptions = tscJson.compilerOptions ?? {};
  const plugins = (compilerOptions.plugins ?? []) as PluginDefinition[];

  const hasTransformPlugin = plugins.some(
    plugin => plugin.transform === './tools/zod2md-jsdocs/dist',
  );

  if (!hasTransformPlugin) {
    tree.write(
      firstExistingTsc,
      JSON.stringify({
        ...tscJson,
        compilerOptions: {
          ...compilerOptions,
          plugins: [
            ...plugins,
            {
              transform: './tools/zod2md-jsdocs/dist',
              afterDeclarations: true,
              baseUrl: `${baseUrl}/docs/${projectName}-reference.md`,
            },
          ],
        },
      }),
    );
  }
}
