import { IndentationText, Project, QuoteKind } from 'ts-morph';
import type {
  ImportDeclarationStructure,
  PluginCodegenResult,
} from './types.js';

const CORE_CONFIG_IMPORT: ImportDeclarationStructure = {
  moduleSpecifier: '@code-pushup/models',
  namedImports: ['CoreConfig'],
  isTypeOnly: true,
};

function collectImports(
  plugins: PluginCodegenResult[],
): ImportDeclarationStructure[] {
  return [CORE_CONFIG_IMPORT, ...plugins.flatMap(({ imports }) => imports)];
}

function buildExportStatement(plugins: PluginCodegenResult[]): string {
  const items = plugins.map(({ pluginInit }) => pluginInit).join(', ');
  return `export default { plugins: [${items}] } satisfies CoreConfig;`;
}

export function generateConfigSource(plugins: PluginCodegenResult[]): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
      indentationText: IndentationText.TwoSpaces,
    },
  });
  const sourceFile = project.createSourceFile('code-pushup.config.ts');

  collectImports(plugins).forEach(imp =>
    sourceFile.addImportDeclaration({
      moduleSpecifier: imp.moduleSpecifier,
      defaultImport: imp.defaultImport,
      namedImports: imp.namedImports,
      isTypeOnly: imp.isTypeOnly,
    }),
  );

  sourceFile.addStatements(buildExportStatement(plugins));
  sourceFile.formatText();

  return sourceFile.getFullText();
}
