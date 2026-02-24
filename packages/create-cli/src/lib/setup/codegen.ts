import type {
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

function collectImports(
  plugins: PluginCodegenResult[],
): ImportDeclarationStructure[] {
  return [
    CORE_CONFIG_IMPORT,
    ...plugins.flatMap(({ imports }) => imports),
  ].toSorted((a, b) => a.moduleSpecifier.localeCompare(b.moduleSpecifier));
}

export function generateConfigSource(plugins: PluginCodegenResult[]): string {
  const builder = new CodeBuilder();

  builder.addLines(collectImports(plugins).map(formatImport));
  builder.addEmptyLine();
  builder.addLine('export default {');
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
  builder.addLine('} satisfies CoreConfig;');

  return builder.toString();
}
