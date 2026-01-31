import { type Tree, generateFiles, logger } from '@nx/devkit';
import * as path from 'node:path';
import * as ts from 'typescript';
import type { Config } from 'zod2md';

export type GenerateZod2MdConfigOptions = Config;
export function getFirstExistingConfig(tree: Tree, projectRoot: string) {
  const supportedFormats = ['ts', 'mjs', 'js'];
  return supportedFormats.find(ext =>
    tree.exists(path.join(projectRoot, `zod2md.config.${ext}`)),
  );
}
export function generateZod2MdConfig(
  tree: Tree,
  root: string,
  options?: GenerateZod2MdConfigOptions,
) {
  const firstExistingFormat = getFirstExistingConfig(tree, root);
  if (firstExistingFormat) {
    logger.warn(
      `No config file created as zod2md.config.${firstExistingFormat} file already exists.`,
    );
  } else {
    const {
      entry = path.join(root, 'src/index.ts'),
      format = 'esm',
      title = `${path.basename(root)} reference`,
      output = path.join(root, `docs/${path.basename(root)}-reference.md`),
      tsconfig = path.join(root, 'tsconfig.lib.json'),
      transformName,
    } = options ?? {};
    generateFiles(tree, path.join(__dirname, 'files'), root, {
      entry,
      format,
      title,
      output,
      tsconfig,
      transformName,
    });
  }
}
export function readDefaultExportObject<
  T extends Record<string, unknown> = Record<string, unknown>,
>(tree: Tree, filePath: string): T | null {
  const content = tree.read(filePath)?.toString();
  if (!content) {
    return null;
  }
  const source = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const matchingNode = source.getChildren().find(node => {
    if (!ts.isExportAssignment(node)) {
      return false;
    }
    const expr = ts.isSatisfiesExpression?.(node.expression)
      ? node.expression.expression
      : node.expression;
    return ts.isObjectLiteralExpression(expr);
  });
  const result =
    matchingNode && ts.isExportAssignment(matchingNode)
      ? (() => {
          const expr = ts.isSatisfiesExpression?.(matchingNode.expression)
            ? matchingNode.expression.expression
            : matchingNode.expression;
          if (!ts.isObjectLiteralExpression(expr)) {
            return null;
          }
          return expr.properties.reduce<Record<string, string>>((acc, prop) => {
            if (
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              ts.isStringLiteral(prop.initializer)
            ) {
              return {
                ...acc,
                [prop.name.text]: prop.initializer.text,
              };
            }
            return acc;
          }, {});
        })()
      : null;
  return result as T | null;
}
