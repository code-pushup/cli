import type { PluginConfig, TransformerExtras } from 'ts-patch';
import type * as ts from 'typescript';

const tsInstance: typeof ts = require('typescript');

const BASE_URL =
  'https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md';

function generateJSDocComment(typeName: string): string {
  const markdownLink = `${BASE_URL}#${typeName.toLowerCase()}`;
  return `*
 * Type Definition: \`${typeName}\`
 * 
 * This type is derived from a Zod schema and represents 
 * the validated structure of \`${typeName}\` used within the application.
 * 
 * @see {@link ${markdownLink}}
 `;
}

function annotateTypeDefinitions(
  _program: ts.Program,
  _pluginConfig: PluginConfig,
  extras?: TransformerExtras,
): ts.TransformerFactory<ts.SourceFile> {
  const tsLib = extras?.ts ?? tsInstance;
  return (context: ts.TransformationContext) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (
        tsLib.isTypeAliasDeclaration(node) ||
        tsLib.isInterfaceDeclaration(node)
      ) {
        const jsDocComment = generateJSDocComment(node.name.text);
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

module.exports = annotateTypeDefinitions;
