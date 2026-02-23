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
  private depth = 0;

  addLine(text: string): void {
    this.lines.push(`${'  '.repeat(this.depth)}${text}`);
  }

  addEmptyLine(): void {
    this.lines.push('');
  }

  indent(fn: () => void): void {
    this.depth++;
    fn();
    this.depth--;
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

  collectImports(plugins).forEach(declaration => {
    builder.addLine(formatImport(declaration));
  });

  builder.addEmptyLine();
  builder.addLine('export default {');
  builder.indent(() => {
    if (plugins.length === 0) {
      builder.addLine('plugins: [],');
    } else {
      builder.addLine('plugins: [');
      builder.indent(() => {
        plugins.forEach(({ pluginInit }) => {
          builder.addLine(`${pluginInit},`);
        });
      });
      builder.addLine('],');
    }
  });
  builder.addLine('} satisfies CoreConfig;');

  return builder.toString();
}
