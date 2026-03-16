import path from 'node:path';
import type { CategoryRef } from '@code-pushup/models';
import {
  mergeCategoriesBySlug,
  singleQuote,
  toUnixPath,
} from '@code-pushup/utils';
import type {
  ConfigFileFormat,
  ImportDeclarationStructure,
  PluginCodegenResult,
} from './types.js';

const CORE_CONFIG_IMPORT: ImportDeclarationStructure = {
  moduleSpecifier: '@code-pushup/models',
  namedImports: ['CoreConfig'],
  isTypeOnly: true,
};

class CodeBuilder {
  private lines: string[] = [];

  addLine(text: string, depth = 0): void {
    this.lines.push(`${'  '.repeat(depth)}${text}`);
  }

  addLines(texts: string[], depth = 0): void {
    texts.forEach(text => {
      this.addLine(text, depth);
    });
  }

  addEmptyLine(): void {
    this.lines.push('');
  }

  toString(): string {
    return `${this.lines.join('\n')}\n`;
  }
}

export function generateConfigSource(
  plugins: PluginCodegenResult[],
  format: ConfigFileFormat,
): string {
  const builder = new CodeBuilder();
  addImports(builder, collectImports(plugins, format));
  if (format === 'ts') {
    builder.addLine('export default {');
    addPlugins(builder, plugins);
    addCategories(builder, plugins);
    builder.addLine('} satisfies CoreConfig;');
  } else {
    builder.addLine("/** @type {import('@code-pushup/models').CoreConfig} */");
    builder.addLine('export default {');
    addPlugins(builder, plugins);
    addCategories(builder, plugins);
    builder.addLine('};');
  }
  return builder.toString();
}

export function generatePresetSource(
  plugins: PluginCodegenResult[],
  format: ConfigFileFormat,
): string {
  const builder = new CodeBuilder();
  addImports(builder, collectImports(plugins, format));
  addPresetExport(builder, plugins, format);
  return builder.toString();
}

export function generateProjectSource(
  projectName: string,
  presetImportPath: string,
): string {
  const builder = new CodeBuilder();
  builder.addLine(
    formatImport({
      moduleSpecifier: presetImportPath,
      namedImports: ['createConfig'],
    }),
  );
  builder.addEmptyLine();
  builder.addLine(`export default await createConfig('${projectName}');`);
  return builder.toString();
}

export function computeRelativePresetImport(
  projectRelativeDir: string,
  presetFilename: string,
): string {
  const relativePath = path.relative(projectRelativeDir, presetFilename);
  const importPath = toUnixPath(relativePath).replace(/\.ts$/, '.js');
  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

function formatImport({
  moduleSpecifier,
  defaultImport,
  namedImports,
  isTypeOnly,
}: ImportDeclarationStructure): string {
  const named = namedImports?.length ? `{ ${namedImports.join(', ')} }` : '';
  const bindings = [defaultImport, named].filter(Boolean).join(', ');
  const from = bindings ? `${bindings} from ` : '';
  const type = isTypeOnly ? 'type ' : '';
  return `import ${type}${from}'${moduleSpecifier}';`;
}

function sortImports(
  imports: ImportDeclarationStructure[],
): ImportDeclarationStructure[] {
  return imports.toSorted((a, b) =>
    a.moduleSpecifier.localeCompare(b.moduleSpecifier),
  );
}

function collectImports(
  plugins: PluginCodegenResult[],
  format: ConfigFileFormat,
): ImportDeclarationStructure[] {
  const pluginImports = plugins.flatMap(({ imports }) => imports);
  if (format === 'ts') {
    return sortImports([CORE_CONFIG_IMPORT, ...pluginImports]);
  }
  return sortImports(pluginImports.map(({ isTypeOnly: _, ...rest }) => rest));
}

function addImports(
  builder: CodeBuilder,
  imports: ImportDeclarationStructure[],
): void {
  if (imports.length > 0) {
    builder.addLines(imports.map(formatImport));
    builder.addEmptyLine();
  }
}

function addPlugins(
  builder: CodeBuilder,
  plugins: PluginCodegenResult[],
  depth = 1,
): void {
  builder.addLine('plugins: [', depth);
  if (plugins.length === 0) {
    builder.addLine('// TODO: register some plugins', depth + 1);
  } else {
    builder.addLines(
      plugins.map(({ pluginInit }) => `${pluginInit},`),
      depth + 1,
    );
  }
  builder.addLine('],', depth);
}

function addPresetExport(
  builder: CodeBuilder,
  plugins: PluginCodegenResult[],
  format: ConfigFileFormat,
): void {
  if (format === 'ts') {
    builder.addLines([
      '/**',
      ' * Creates a Code PushUp config for a project.',
      ' * @param project Project name',
      ' */',
      'export async function createConfig(project: string): Promise<CoreConfig> {',
    ]);
  } else {
    builder.addLines([
      '/**',
      ' * Creates a Code PushUp config for a project.',
      ' * @param {string} project Project name',
      " * @returns {Promise<import('@code-pushup/models').CoreConfig>}",
      ' */',
      'export async function createConfig(project) {',
    ]);
  }
  builder.addLine('return {', 1);
  addPlugins(builder, plugins, 2);
  addCategories(builder, plugins, 2);
  builder.addLine('};', 1);
  builder.addLine('}');
}

function addCategories(
  builder: CodeBuilder,
  plugins: PluginCodegenResult[],
  depth = 1,
): void {
  const categories = mergeCategoriesBySlug(
    plugins.flatMap(p => p.categories ?? []),
  );
  if (categories.length === 0) {
    return;
  }
  builder.addLine('categories: [', depth);
  categories.forEach(({ slug, title, description, docsUrl, refs }) => {
    builder.addLine('{', depth + 1);
    builder.addLine(`slug: '${slug}',`, depth + 2);
    builder.addLine(`title: ${singleQuote(title)},`, depth + 2);
    if (description) {
      builder.addLine(`description: ${singleQuote(description)},`, depth + 2);
    }
    if (docsUrl) {
      builder.addLine(`docsUrl: ${singleQuote(docsUrl)},`, depth + 2);
    }
    builder.addLine('refs: [', depth + 2);
    builder.addLines(refs.map(formatCategoryRef), depth + 3);
    builder.addLine('],', depth + 2);
    builder.addLine('},', depth + 1);
  });
  builder.addLine('],', depth);
}

function formatCategoryRef(ref: CategoryRef): string {
  return `{ type: '${ref.type}', plugin: '${ref.plugin}', slug: '${ref.slug}', weight: ${ref.weight} },`;
}
