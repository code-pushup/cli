import type { PluginConfig, TransformerExtras } from 'ts-patch';
import * as ts from 'typescript';

export function generateJSDocComment(
  typeName: string,
  baseUrl: string,
): string {
  const markdownLink = `${baseUrl}#${typeName.toLowerCase()}`;
  return `*
 * Type Definition: \`${typeName}\`
 *
 * This type is derived from a Zod schema and represents
 * the validated structure of \`${typeName}\` used within the application.
 *
 * @see {@link ${markdownLink}}
 `;
}
export function annotateTypeDefinitions(
  _program: ts.Program,
  pluginConfig: PluginConfig,
  extras?: TransformerExtras,
): ts.TransformerFactory<ts.SourceFile> {
  const baseUrl = pluginConfig.baseUrl as string | undefined;
  if (!baseUrl) {
    throw new Error(
      'zod2md-jsdocs: "baseUrl" option is required. ' +
        'Please configure it in your tsconfig.json plugins section.',
    );
  }
  const tsLib = extras?.ts ?? ts;
  return (context: ts.TransformationContext) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (
        tsLib.isTypeAliasDeclaration(node) ||
        tsLib.isInterfaceDeclaration(node)
      ) {
        const jsDocComment = generateJSDocComment(node.name.text, baseUrl);
        tsLib.addSyntheticLeadingComment(
          node,
          tsLib.SyntaxKind.MultiLineCommentTrivia,
          jsDocComment,
          true,
        );
        return node;
      }
      return tsLib.visitEachChild(node, visitor, context);
    };
    return (sourceFile: ts.SourceFile) =>
      tsLib.visitNode(sourceFile, visitor, tsLib.isSourceFile);
  };
}
