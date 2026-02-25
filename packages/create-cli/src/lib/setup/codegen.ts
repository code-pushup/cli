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

function collectTsImports(
  plugins: PluginCodegenResult[],
): ImportDeclarationStructure[] {
  return [
    CORE_CONFIG_IMPORT,
    ...plugins.flatMap(({ imports }) => imports),
  ].toSorted((a, b) => a.moduleSpecifier.localeCompare(b.moduleSpecifier));
}

function collectJsImports(
  plugins: PluginCodegenResult[],
): ImportDeclarationStructure[] {
  return plugins
    .flatMap(({ imports }) => imports)
    .map(({ isTypeOnly: _, ...rest }) => rest)
    .toSorted((a, b) => a.moduleSpecifier.localeCompare(b.moduleSpecifier));
}

function addPlugins(
  builder: CodeBuilder,
  plugins: PluginCodegenResult[],
): void {
  if (plugins.length === 0) {
    builder.addLine('plugins: [],', 1);
  } else {
    builder.addLine('plugins: [', 1);
    builder.addLines(
      plugins.map(({ pluginInit }) => `${pluginInit},`),
      2,
    );
    builder.addLine('],', 1);
  }
}

export function generateConfigSource(
  plugins: PluginCodegenResult[],
  format: ConfigFileFormat,
): string {
  return format === 'ts'
    ? generateTsConfig(plugins)
    : generateJsConfig(plugins);
}

function generateTsConfig(plugins: PluginCodegenResult[]): string {
  const builder = new CodeBuilder();

  builder.addLines(collectTsImports(plugins).map(formatImport));
  builder.addEmptyLine();
  builder.addLine('export default {');
  addPlugins(builder, plugins);
  builder.addLine('} satisfies CoreConfig;');

  return builder.toString();
}

function generateJsConfig(plugins: PluginCodegenResult[]): string {
  const builder = new CodeBuilder();

  const pluginImports = collectJsImports(plugins);
  if (pluginImports.length > 0) {
    builder.addLines(pluginImports.map(formatImport));
    builder.addEmptyLine();
  }

  builder.addLine("/** @type {import('@code-pushup/models').CoreConfig} */");
  builder.addLine('export default {');
  addPlugins(builder, plugins);
  builder.addLine('};');

  return builder.toString();
}
